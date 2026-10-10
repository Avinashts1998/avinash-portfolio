import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  FileText,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import { resumeService, ResumeDocument } from "../../services/resumeService";
import { getLenis } from "../../hooks/useLenis";

interface AdminResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: ResumeDocument[];
  primaryResume: ResumeDocument;
  onUpload: (file: File, setAsPrimary: boolean) => Promise<void>;
  onSetPrimary: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (resume: ResumeDocument) => Promise<void>;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export const AdminResumeModal: React.FC<AdminResumeModalProps> = ({
  isOpen,
  onClose,
  resumes,
  primaryResume,
  onUpload,
  onSetPrimary,
  onDelete,
  onDownload,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [setAsPrimaryOnUpload, setSetAsPrimaryOnUpload] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background page scroll when modal is open
  useEffect(() => {
    const lenis = getLenis();
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis) {
        lenis.stop();
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis) {
        lenis.start();
      }
      setErrorMessage(null);
      setSuccessMessage(null);
      setSearchQuery("");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis) {
        lenis.start();
      }
    };
  }, [isOpen]);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setErrorMessage("Please upload a valid PDF file (.pdf).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("PDF file size exceeds 20MB limit.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      await onUpload(file, setAsPrimaryOnUpload);
      setSuccessMessage(`"${file.name}" uploaded successfully to Cloudinary ("resume" collection)!`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to upload resume to Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSelectPrimary = async (id: string, name: string) => {
    setActionLoadingId(`primary_${id}`);
    setErrorMessage(null);
    try {
      await onSetPrimary(id);
      setSuccessMessage(`Set "${name}" as the active primary resume for all visitors!`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to change primary resume.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (resume: ResumeDocument) => {
    if (resume.id === "default-local-resume") {
      setErrorMessage("The default system resume cannot be deleted.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${resume.name}"? This removes it from Cloudinary and the resume list.`)) {
      return;
    }

    setActionLoadingId(`delete_${resume.id}`);
    setErrorMessage(null);
    try {
      await onDelete(resume.id);
      setSuccessMessage(`Deleted "${resume.name}" successfully.`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete resume.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredResumes = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="admin-resume-modal-portal"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onWheel={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Dialog Card */}
          <motion.div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-3xl bg-[var(--card)] border border-[var(--line)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--line)] bg-[var(--bg)]/50">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)]">
                  <FileText size={18} />
                </span>
                <h3 id="resume-modal-title" className="text-lg sm:text-xl font-hero font-bold text-[var(--ink)]">
                  Resume Manager &amp; Cloudinary Collection
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer shrink-0"
                aria-label="Close resume manager modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain"
            >
              {/* Alert Feedback */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-sans flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="cursor-pointer hover:opacity-75"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-sans flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">{successMessage}</div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="cursor-pointer hover:opacity-75"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Active Primary Resume Card */}
              <div className="p-4 rounded-xl border-2 border-[var(--blue)]/30 bg-[var(--blue)]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--blue)] text-white shadow-xs">
                    <FileText size={22} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[var(--blue)] bg-[var(--blue)]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={11} />
                        Active Primary Resume
                      </span>
                    </div>
                    <h4 className="text-sm font-hero font-bold text-[var(--ink)] break-all">
                      {primaryResume.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-soft)] font-mono">
                      <span>{formatBytes(primaryResume.size)}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(primaryResume.uploadedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => onDownload(primaryResume)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Test download of current primary resume"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                  <a
                    href={resumeService.getResumePreviewUrl(primaryResume)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] text-xs font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    title="View PDF directly in browser"
                  >
                    <ExternalLink size={13} />
                    <span>Preview</span>
                  </a>
                </div>
              </div>

              {/* Upload Zone */}
              <div className="space-y-3">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-[var(--blue)] bg-[var(--blue)]/10 scale-[1.01]"
                      : "border-[var(--line)] hover:border-[var(--blue)]/60 bg-[var(--bg)]/40 hover:bg-[var(--bg)]"
                  } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <Loader2 size={32} className="animate-spin text-[var(--blue)]" />
                      <p className="text-xs font-sans font-semibold text-[var(--ink)]">
                        Uploading PDF to Cloudinary &quot;resume&quot; collection...
                      </p>
                      <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                        Connecting to cloudName: p66qxgqe / folder: resume
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center">
                        <Upload size={22} />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <p className="text-sm font-sans font-semibold text-[var(--ink)]">
                          Click to browse or drop your resume PDF here
                        </p>
                        <p className="text-xs text-[var(--ink-soft)] font-sans">
                          Accepts PDF files up to 20MB. Your file is directly saved into the Cloudinary collection.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Upload Options */}
                <div className="flex items-center gap-2 px-1">
                  <label className="flex items-center gap-2 text-xs font-sans text-[var(--ink-soft)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={setAsPrimaryOnUpload}
                      onChange={(e) => setSetAsPrimaryOnUpload(e.target.checked)}
                      className="rounded border-[var(--line)] text-[var(--blue)] focus:ring-[var(--blue)] cursor-pointer"
                    />
                    <span>Automatically set newly uploaded resume as primary</span>
                  </label>
                </div>
              </div>

              {/* Previously Uploaded Resumes */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-[var(--ink-soft)]" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-semibold">
                      Previously Uploaded Resumes ({resumes.length})
                    </h4>
                  </div>

                  {resumes.length > 3 && (
                    <div className="relative w-full sm:w-56">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter resumes..."
                        className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-hidden focus:border-[var(--blue)]"
                      />
                    </div>
                  )}
                </div>

                {/* List */}
                <div
                  data-lenis-prevent="true"
                  onWheel={(e) => e.stopPropagation()}
                  className="space-y-2.5 max-h-72 overflow-y-auto pr-1 overscroll-contain"
                >
                  {filteredResumes.length === 0 ? (
                    <div className="text-center py-8 text-[var(--ink-soft)] text-xs font-sans">
                      No resumes match your filter.
                    </div>
                  ) : (
                    filteredResumes.map((item) => {
                      const isItemPrimary = item.isPrimary || item.id === primaryResume.id;
                      const isLoadingThis =
                        actionLoadingId === `primary_${item.id}` ||
                        actionLoadingId === `delete_${item.id}`;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isItemPrimary
                              ? "bg-[var(--blue)]/5 border-[var(--blue)]/40 shadow-xs"
                              : "bg-[var(--bg)]/40 hover:bg-[var(--bg)] border-[var(--line)]"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-10 h-12 rounded-md overflow-hidden shrink-0 mt-0.5 border flex items-center justify-center ${
                                isItemPrimary
                                  ? "border-[var(--blue)]/40 bg-[var(--blue)]/10"
                                  : "border-[var(--line)] bg-[var(--bg)]"
                              }`}
                            >
                              {resumeService.getResumeThumbnailUrl(item) ? (
                                <img
                                  src={resumeService.getResumeThumbnailUrl(item)!}
                                  alt={item.name}
                                  className="w-full h-full object-cover object-top"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <FileText
                                  size={18}
                                  className={isItemPrimary ? "text-[var(--blue)]" : "text-[var(--ink-soft)]"}
                                />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs sm:text-sm font-hero font-bold text-[var(--ink)] truncate max-w-[280px] sm:max-w-md">
                                  {item.name}
                                </h5>
                                {isItemPrimary && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                                    <Check size={10} strokeWidth={3} />
                                    Active Primary
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[var(--ink-soft)] font-mono">
                                <span>{formatBytes(item.size)}</span>
                                <span>•</span>
                                <span>{formatDate(item.uploadedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--line)]">
                            {!isItemPrimary ? (
                              <button
                                type="button"
                                onClick={() => handleSelectPrimary(item.id, item.name)}
                                disabled={isLoadingThis}
                                className="px-3 py-1.5 rounded-lg bg-[var(--blue)]/10 hover:bg-[var(--blue)] text-[var(--blue)] hover:text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                title="Set as the active primary resume"
                              >
                                {actionLoadingId === `primary_${item.id}` ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                <span>Choose as Primary</span>
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-sans font-semibold flex items-center gap-1">
                                <Check size={13} strokeWidth={3} />
                                <span>Selected</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onDownload(item)}
                              className="p-2 rounded-lg border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] transition-colors cursor-pointer"
                              title="Download this resume"
                              aria-label={`Download ${item.name}`}
                            >
                              <Download size={13} />
                            </button>

                            {item.id !== "default-local-resume" && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                disabled={isLoadingThis}
                                className="p-2 rounded-lg border border-red-500/20 text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                title="Delete from Cloudinary and list"
                                aria-label={`Delete ${item.name}`}
                              >
                                {actionLoadingId === `delete_${item.id}` ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[var(--line)] bg-[var(--bg)]/50 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[var(--line)] hover:bg-[var(--ink)] hover:text-[var(--bg)] text-[var(--ink)] text-xs font-sans font-semibold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
