import React, { useState, useEffect } from "react";
import { X, Upload, Check, Image as ImageIcon, Mobile as Smartphone, Monitor, Loader as Loader2, CloudUpload } from "reicon-react";
import { heroImageService, HeroSectionImageData } from "../../services/heroImageService";

interface HeroImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function HeroImageUploadModal({
  isOpen,
  onClose,
  onSuccess
}: HeroImageUploadModalProps) {
  const [heroData, setHeroData] = useState<HeroSectionImageData>(heroImageService.getHeroImagesSync());
  
  // Desktop single file
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>("");

  // Mobile 2 files
  const [mobileFile1, setMobileFile1] = useState<File | null>(null);
  const [mobilePreview1, setMobilePreview1] = useState<string>("");
  const [mobileFile2, setMobileFile2] = useState<File | null>(null);
  const [mobilePreview2, setMobilePreview2] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const current = heroImageService.getHeroImagesSync();
      setHeroData(current);
      setDesktopPreview(current.desktopImage || "");
      setMobilePreview1(current.mobileImages?.[0] || "");
      setMobilePreview2(current.mobileImages?.[1] || "");
      setDesktopFile(null);
      setMobileFile1(null);
      setMobileFile2(null);
      setStatusMsg("");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDesktopFile(file);
      setDesktopPreview(URL.createObjectURL(file));
    }
  };

  const handleMobile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMobileFile1(file);
      setMobilePreview1(URL.createObjectURL(file));
    }
  };

  const handleMobile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMobileFile2(file);
      setMobilePreview2(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desktopFile && !mobileFile1 && !mobileFile2) {
      setErrorMsg("Please select at least one image file to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    setStatusMsg("Uploading images to Cloudinary (folder: product designing/hero section)...");

    try {
      const updated = await heroImageService.uploadAndSaveHeroImages({
        desktopFile: desktopFile,
        mobileFiles: [mobileFile1, mobileFile2]
      });

      setStatusMsg("Successfully uploaded to Cloudinary and saved links into Firebase collection 'hero section image'!");
      setTimeout(() => {
        setIsUploading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Hero image upload failed:", err);
      setErrorMsg(err.message || "Upload failed. Please check your network and try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" data-lenis-prevent="true">
      <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" data-lenis-prevent="true">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg)]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CloudUpload size={20} />
            </div>
            <div>
              <h3 className="text-lg font-hero font-bold text-[var(--ink)]">
                Upload Hero Section Images
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Cloudinary Folder: <span className="font-mono text-blue-600 dark:text-blue-400">product designing/hero section</span> &bull; Firebase: <span className="font-mono text-blue-600 dark:text-blue-400">hero section image</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 min-h-0 overflow-y-auto space-y-6 overscroll-contain" data-lenis-prevent="true">
          
          {errorMsg && (
            <div className="p-3.5 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="p-3.5 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* 1. Desktop Screen Section: Single Image */}
          <div className="space-y-3 p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-[var(--ink)]">
                  Desktop Screen Image <span className="text-xs font-normal text-[var(--muted)]">(Single Image)</span>
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                Desktop Layout
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-48 h-28 rounded-lg overflow-hidden border border-[var(--line)] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                {desktopPreview ? (
                  <img
                    src={desktopPreview}
                    alt="Desktop preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[var(--muted)] text-xs">
                    <ImageIcon size={20} />
                    <span>No image selected</span>
                  </div>
                )}
              </div>

              <label className="w-full flex flex-col items-center justify-center px-4 py-4 rounded-xl border-2 border-dashed border-[var(--line)] hover:border-blue-500/50 bg-[var(--card)] hover:bg-blue-500/5 transition-colors cursor-pointer text-center">
                <Upload size={18} className="text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-xs font-medium text-[var(--ink)]">
                  {desktopFile ? desktopFile.name : "Choose Desktop Image"}
                </span>
                <span className="text-[10px] text-[var(--muted)] mt-0.5">
                  PNG, JPG or WebP (Desktop Hero Banner)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDesktopChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 2. Mobile Screen Section: 2 Images */}
          <div className="space-y-3 p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-[var(--ink)]">
                  Mobile Screen Images <span className="text-xs font-normal text-[var(--muted)]">(2 Images required for mobile view)</span>
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                Mobile Layout (2 Cards)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mobile Image 1 */}
              <div className="space-y-2 p-3 rounded-lg border border-[var(--line)] bg-[var(--card)]">
                <span className="text-xs font-medium text-[var(--ink)] block">
                  Mobile Image 1 (Front / Back mockup)
                </span>
                <div className="relative w-full h-28 rounded border border-[var(--line)] bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                  {mobilePreview1 ? (
                    <img src={mobilePreview1} alt="Mobile preview 1" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-[var(--muted)]">No Image 1</span>
                  )}
                </div>
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--line)] hover:bg-[var(--line)]/50 transition-colors text-xs font-medium text-[var(--ink)] cursor-pointer">
                  <Upload size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="truncate">{mobileFile1 ? mobileFile1.name : "Select Mobile Image 1"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobile1Change}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Mobile Image 2 */}
              <div className="space-y-2 p-3 rounded-lg border border-[var(--line)] bg-[var(--card)]">
                <span className="text-xs font-medium text-[var(--ink)] block">
                  Mobile Image 2 (Front / Overlay mockup)
                </span>
                <div className="relative w-full h-28 rounded border border-[var(--line)] bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                  {mobilePreview2 ? (
                    <img src={mobilePreview2} alt="Mobile preview 2" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-[var(--muted)]">No Image 2</span>
                  )}
                </div>
                <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--line)] hover:bg-[var(--line)]/50 transition-colors text-xs font-medium text-[var(--ink)] cursor-pointer">
                  <Upload size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="truncate">{mobileFile2 ? mobileFile2.name : "Select Mobile Image 2"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobile2Change}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-[var(--line)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl border border-[var(--line)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Uploading & Syncing...</span>
                </>
              ) : (
                <>
                  <CloudUpload size={14} />
                  <span>Upload & Save to Firebase</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
