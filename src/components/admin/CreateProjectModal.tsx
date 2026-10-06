import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Loader as Loader2, Image as ImageIcon, AlertCircle, ArrowLeft, ArrowRight, Check, Star, Trash2, Plus, ChevronDown } from "reicon-react";
import { createProject, slugify } from "../../services/projectService";
import { getLenis } from "../../hooks/useLenis";
import KeyContributionsInput from "./KeyContributionsInput";
import CustomDropdown from "../ui/CustomDropdown";

export const PRODUCT_TYPE_OPTIONS = [
  "Mobile App",
  "Web Application",
  "Website",
  "Dashboard",
  "SaaS Platform",
  "Enterprise Software",
  "Marketplace",
  "Design System",
  "Admin Panel",
  "Landing Page",
];

export const CATEGORY_OPTIONS = [
  "FinTech",
  "Health & Fitness",
  "E-commerce",
  "Event Management",
  "Education",
  "Travel & Tourism",
  "Food & Restaurant",
  "Real Estate",
  "Business",
  "AI & Machine Learning",
];

interface CustomDropdownSelectProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (val: string) => void;
}

function CustomDropdownSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: CustomDropdownSelectProps) {
  return (
    <CustomDropdown
      label={label}
      value={value}
      options={options}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: any) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  // Step State: 1 = Upload Images, 2 = Project Details, 3 = Set up Thumbnail
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Metadata State
  const [title, setTitle] = useState("");
  const [productType, setProductType] = useState("");
  const [isFeaturedOnHome, setIsFeaturedOnHome] = useState(true);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [keyContributions, setKeyContributions] = useState<string[]>([]);
  const [ctaLabel, setCtaLabel] = useState<"View Case Study" | "View Project" | "View UI Design">("View Project");
  const [isNew, setIsNew] = useState(true);
  const [isLive, setIsLive] = useState<"Yes" | "No">("No");
  const [showInHomeGrid, setShowInHomeGrid] = useState(true);

  // Image Files & Previews State
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const allImagesInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const customThumbnailInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage(null);
      setFieldErrors({});
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const lenis = getLenis();
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";

    return () => {
      const lenisAfter = getLenis();
      if (lenisAfter) lenisAfter.start();
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      // Cleanup runs on unmount
    };
  }, []);

  if (!isOpen) return null;

  // Add multiple images from main dropzone or multi-file picker
  const handleBulkAddImages = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    Array.from(filesList).forEach((file) => {
      if (file.type.startsWith("image/")) {
        validFiles.push(file);
        validPreviews.push(URL.createObjectURL(file));
      }
    });

    if (validFiles.length === 0) return;

    // If no thumbnail file currently set, designate the 1st valid file as thumbnail
    let nextThumbnailFile = thumbnailFile;
    let nextThumbnailPreview = thumbnailPreview;
    let newGalleryFiles: File[] = [];
    let newGalleryPreviews: string[] = [];

    let startIndex = 0;
    if (!nextThumbnailFile && validFiles.length > 0) {
      nextThumbnailFile = validFiles[0];
      nextThumbnailPreview = validPreviews[0];
      startIndex = 1;
    }

    for (let i = startIndex; i < validFiles.length; i++) {
      newGalleryFiles.push(validFiles[i]);
      newGalleryPreviews.push(validPreviews[i]);
    }

    setThumbnailFile(nextThumbnailFile);
    setThumbnailPreview(nextThumbnailPreview);

    if (newGalleryFiles.length > 0) {
      setGalleryFiles((prev) => [...prev, ...newGalleryFiles]);
      setGalleryPreviews((prev) => [...prev, ...newGalleryPreviews]);
    }

    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.thumbnailFile;
      return copy;
    });
  };

  // Set a specific gallery image as cover thumbnail
  const setAsCoverImage = (index: number) => {
    if (index < 0 || index >= galleryFiles.length) return;

    const oldCoverFile = thumbnailFile;
    const oldCoverPreview = thumbnailPreview;

    const newCoverFile = galleryFiles[index];
    const newCoverPreview = galleryPreviews[index];

    // Swap thumbnail
    setThumbnailFile(newCoverFile);
    setThumbnailPreview(newCoverPreview);

    // Update gallery array: remove the item promoted to cover, insert old cover if existed
    const updatedFiles = galleryFiles.filter((_, i) => i !== index);
    const updatedPreviews = galleryPreviews.filter((_, i) => i !== index);

    if (oldCoverFile && oldCoverPreview) {
      updatedFiles.unshift(oldCoverFile);
      updatedPreviews.unshift(oldCoverPreview);
    }

    setGalleryFiles(updatedFiles);
    setGalleryPreviews(updatedPreviews);
  };

  // Remove thumbnail image
  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);

    // If gallery images exist, promote the first gallery image to thumbnail
    if (galleryFiles.length > 0) {
      const [firstFile, ...restFiles] = galleryFiles;
      const [firstPreview, ...restPreviews] = galleryPreviews;
      setThumbnailFile(firstFile);
      setThumbnailPreview(firstPreview);
      setGalleryFiles(restFiles);
      setGalleryPreviews(restPreviews);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  // Remove gallery image by index
  const removeGalleryImage = (index: number) => {
    if (galleryPreviews[index]) {
      URL.revokeObjectURL(galleryPreviews[index]);
    }
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Move gallery image position
  const moveGalleryImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryFiles.length) return;

    const updatedFiles = [...galleryFiles];
    const tempFile = updatedFiles[index];
    updatedFiles[index] = updatedFiles[targetIndex];
    updatedFiles[targetIndex] = tempFile;

    const updatedPreviews = [...galleryPreviews];
    const tempPreview = updatedPreviews[index];
    updatedPreviews[index] = updatedPreviews[targetIndex];
    updatedPreviews[targetIndex] = tempPreview;

    setGalleryFiles(updatedFiles);
    setGalleryPreviews(updatedPreviews);
  };

  // Check if any images are added
  const hasImages = thumbnailFile !== null || galleryFiles.length > 0;
  const totalImagesCount = (thumbnailFile ? 1 : 0) + galleryFiles.length;

  // Description handler with 250 character limit
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 250);
    setDescription(val);
    if (fieldErrors.description && val.length <= 250) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.description;
        return copy;
      });
    }
  };

  // Title change handler
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (fieldErrors.title && val.trim()) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.title;
        return copy;
      });
    }
  };

  // Step 2 validation & continue handler
  const handleStep2Continue = () => {
    const errors: { [key: string]: string } = {};

    if (!title.trim()) {
      errors.title = "Project title is required.";
    }

    if (description.length > 250) {
      errors.description = "Description must not exceed 250 characters.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length === 0) {
      setErrorMessage(null);
      setStep(3);
    } else {
      setErrorMessage("Please fill out required fields before continuing.");
    }
  };

  // Direct custom thumbnail upload handler for Step 3
  const handleDirectThumbnailUpload = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const file = filesList[0];
    if (!file.type.startsWith("image/")) return;

    const preview = URL.createObjectURL(file);

    // If there was an existing thumbnail, push it into gallery list so it's not lost
    if (thumbnailFile && thumbnailPreview) {
      setGalleryFiles((prev) => [thumbnailFile, ...prev]);
      setGalleryPreviews((prev) => [thumbnailPreview, ...prev]);
    }

    setThumbnailFile(file);
    setThumbnailPreview(preview);

    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.thumbnailFile;
      return copy;
    });
  };

  // Validation
  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (!title.trim()) {
      errors.title = "Project title is required.";
    }

    if (!thumbnailFile) {
      errors.thumbnailFile = "At least one project thumbnail image is required.";
    }

    if (description.length > 250) {
      errors.description = "Description must not exceed 250 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      setErrorMessage("Please fill out the required fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdProject = await createProject({
        title,
        productType,
        isFeaturedOnHome,
        category,
        description,
        keyContributions,
        ctaLabel,
        isNew,
        isLive: isLive === "Yes",
        showInHomeGrid: isFeaturedOnHome || showInHomeGrid,
        thumbnailFile,
        galleryFiles,
      });

      // Reset form state
      setTitle("");
      setProductType("");
      setIsFeaturedOnHome(true);
      setCategory("");
      setDescription("");
      setKeyContributions([]);
      setCtaLabel("View Project");
      setIsNew(true);
      setIsLive("No");
      setShowInHomeGrid(true);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setStep(1);

      onSuccess(createdProject);
      onClose();
    } catch (err: any) {
      console.error("Error creating project:", err);
      const msg = err?.message || (typeof err === "string" ? err : (err ? JSON.stringify(err) : "An unexpected error occurred while creating the project."));
      setErrorMessage(typeof msg === "object" ? JSON.stringify(msg) : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedSlug = slugify(title);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 backdrop-blur-md overflow-y-auto" data-lenis-prevent="true">
          {/* Backdrop click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0"
          />

          {/* Modal Window Container - Big, wide, rounded canvas like requested mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent="true"
            className="relative w-full max-w-7xl sm:max-w-[1360px] h-[88vh] max-h-[860px] rounded-xl bg-[var(--bg)] border border-[var(--line)] shadow-none overflow-hidden z-10 flex flex-col my-auto"
          >
            {/* Hidden Input for Multi-Image Picker */}
            <input
              ref={allImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleBulkAddImages(e.target.files)}
              className="hidden"
            />

            {/* Hidden Input for Thumbnail explicit picker */}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) handleBulkAddImages(e.target.files);
              }}
              className="hidden"
            />

            {/* TOP HEADER BAR */}
            <div className="px-6 py-4 sm:py-5 border-b border-[var(--line)] flex items-center justify-between shrink-0 bg-[var(--card)] z-20">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-full border border-[var(--line)] text-xs font-sans font-semibold text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                )}
                {step === 3 && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-full border border-[var(--line)] text-xs font-sans font-semibold text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                )}
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasImages) setStep(2);
                    }}
                    disabled={!hasImages}
                    className={`px-5 py-2.5 rounded-full text-xs font-sans font-semibold flex items-center gap-2 transition-all ${
                      hasImages
                        ? "bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white cursor-pointer active:scale-95"
                        : "bg-neutral-200 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 cursor-not-allowed border border-[var(--line)]"
                    }`}
                    title={!hasImages ? "Please add at least 1 image to continue" : "Continue to Project Details"}
                  >
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleStep2Continue}
                    className="px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="submit"
                    form="create-project-form"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Project...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Project</span>
                        <Check size={14} />
                      </>
                    )}
                  </button>
                )}

                {/* Close X Button */}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 ml-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* MODAL BODY CONTENT */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 space-y-6 overscroll-contain" data-lenis-prevent="true">
              {/* STEP 1: UPLOAD ALL PROJECT IMAGES */}
              {step === 1 && (
                <div className="space-y-6 w-full max-w-6xl mx-auto">
                  {/* Main Drag & Drop Image Upload Box - Shown when no images are added */}
                  {!hasImages && (
                    <div
                      onClick={() => allImagesInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleBulkAddImages(e.dataTransfer.files);
                      }}
                      className="rounded-3xl p-12 sm:p-20 flex flex-col items-center justify-center text-center my-auto w-full h-full min-h-[460px] bg-transparent transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={28} className="stroke-[1.75]" />
                      </div>
                    </div>
                  )}

                  {/* Uploaded Images Full Size Display */}
                  {hasImages && (
                    <div className="space-y-6">
                      {/* List of full size images */}
                      <div className="space-y-6">
                        {/* 1. Main Cover / Thumbnail Image */}
                        {thumbnailPreview && (
                          <div className="rounded-xl border border-[var(--line)] overflow-hidden flex flex-col">
                            {/* Card Header Bar */}
                            <div className="px-4 py-2.5 border-b border-[var(--line)] flex items-center justify-between gap-3">
                              <span className="w-8 h-8 rounded-full bg-[var(--line)] text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center">
                                1
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={removeThumbnail}
                                  className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                                  title="Remove image"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Full-size Image Display Container */}
                            <div className="flex items-center justify-center min-h-[220px]">
                              <img
                                src={thumbnailPreview}
                                alt="Project Image 1"
                                className="w-full h-auto max-h-[700px] object-contain"
                              />
                            </div>
                          </div>
                        )}

                        {/* 2. Gallery Images Full Size */}
                        {galleryPreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-[var(--line)] overflow-hidden flex flex-col"
                          >
                            {/* Card Header Bar */}
                            <div className="px-4 py-2.5 border-b border-[var(--line)] flex items-center justify-between gap-3">
                              <span className="w-8 h-8 rounded-full bg-[var(--line)] text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center">
                                {thumbnailPreview ? index + 2 : index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => moveGalleryImage(index, "left")}
                                    className="w-8 h-8 rounded-full border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)] flex items-center justify-center transition-colors cursor-pointer"
                                    title="Move up"
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
                                )}
                                {index < galleryPreviews.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => moveGalleryImage(index, "right")}
                                    className="w-8 h-8 rounded-full border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)] flex items-center justify-center transition-colors cursor-pointer"
                                    title="Move down"
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(index)}
                                  className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                                  title="Remove image"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Full-size Image Display Container */}
                            <div className="flex items-center justify-center min-h-[220px]">
                              <img
                                src={preview}
                                alt={`Gallery Image ${index + 1}`}
                                className="w-full h-auto max-h-[700px] object-contain"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prominent "Add Another Image" Button Below Uploaded Images */}
                      <button
                        type="button"
                        onClick={() => allImagesInputRef.current?.click()}
                        className="w-full py-4 sm:py-5 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)] hover:bg-[var(--blue)]/5 text-[var(--ink)] font-sans font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer group mt-4"
                      >
                        <div className="p-1.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] group-hover:scale-110 transition-transform">
                          <Plus size={18} />
                        </div>
                        <span>Add Another Image</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: PROJECT DETAILS FORM */}
              {step === 2 && (
                <form onSubmit={(e) => { e.preventDefault(); handleStep2Continue(); }} className="space-y-6 w-full max-w-4xl mx-auto">
                  {/* Summary Banner of Uploaded Images */}
                  <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--line)] flex items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      {thumbnailPreview || galleryPreviews.length > 0 ? (
                        <img
                          src={thumbnailPreview || galleryPreviews[0]}
                          alt="Cover preview"
                          className="w-14 h-10 rounded-lg object-cover border border-[var(--line)] shrink-0 bg-[var(--line)]"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-[var(--line)] flex items-center justify-center shrink-0">
                          <ImageIcon size={18} className="text-[var(--muted)]" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-hero font-bold text-[var(--ink)] block">
                          {totalImagesCount} Image{totalImagesCount !== 1 ? "s" : ""} Attached
                        </span>
                        <span className="text-[11px] font-sans text-[var(--ink-soft)]">
                          Cover image &amp; {galleryFiles.length} gallery preview{galleryFiles.length !== 1 ? "s" : ""} ready
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] text-xs font-sans font-semibold text-[var(--ink)] hover:bg-[var(--line)] transition-all cursor-pointer"
                    >
                      Edit Images
                    </button>
                  </div>

                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-sans flex items-start gap-3">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold mb-0.5">Submission Error</p>
                        <p className="leading-relaxed opacity-90">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* 1. Project Title */}
                  <div>
                    <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium mb-1.5 block">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="e.g. Fitznow Workout Companion"
                      className={`w-full px-4 py-3 rounded-lg bg-[var(--card)] border text-sm font-sans text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)] transition-all no-focus-outline ${
                        fieldErrors.title ? "border-red-500" : "border-[var(--line)] hover:border-[var(--ink-soft)]/40"
                      }`}
                    />
                    {fieldErrors.title && (
                      <p className="text-xs text-red-500 mt-1 font-sans">{fieldErrors.title}</p>
                    )}

                  </div>

                  {/* 2. Product Type */}
                  <CustomDropdownSelect
                    label="Product Type"
                    value={productType}
                    options={PRODUCT_TYPE_OPTIONS}
                    placeholder="Select Product Type"
                    onChange={setProductType}
                  />

                  {/* 3. Category */}
                  <CustomDropdownSelect
                    label="Category"
                    value={category}
                    options={CATEGORY_OPTIONS}
                    placeholder="Select Category"
                    onChange={setCategory}
                  />

                  {/* 4. Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium block">
                        Description
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          description.length === 250
                            ? "text-red-500"
                            : description.length > 200
                            ? "text-[var(--blue)]"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {description.length}/250
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={handleDescriptionChange}
                      maxLength={250}
                      rows={3}
                      placeholder="Brief overview of the project (max 250 characters)..."
                      className={`w-full px-4 py-3 rounded-lg bg-[var(--card)] border text-sm font-sans text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)] transition-all resize-none no-focus-outline ${
                        fieldErrors.description ? "border-red-500" : "border-[var(--line)] hover:border-[var(--ink-soft)]/40"
                      }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-xs text-red-500 mt-1 font-sans">{fieldErrors.description}</p>
                    )}
                  </div>

                  {/* 5. Key Contributions */}
                  <KeyContributionsInput
                    keyContributions={keyContributions}
                    onChange={setKeyContributions}
                    maxKeys={10}
                    label="Key Contributions"
                  />

                  {/* Row: Feature on Home | Mark as Latest | Button Label | Is it Live */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
                    {/* 5. Display on Homepage */}
                    <div>
                      <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium mb-2 block">
                        Display on Homepage
                      </label>
                      <div className="flex items-center p-1 bg-[var(--line)]/30 rounded-lg w-fit border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFeaturedOnHome(false);
                            setShowInHomeGrid(false);
                          }}
                          className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            !isFeaturedOnHome && !showInHomeGrid
                              ? "bg-[var(--card)] text-[var(--ink)] shadow-sm font-bold"
                              : "text-[var(--muted)] hover:text-[var(--ink)]"
                          }`}
                        >
                          OFF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFeaturedOnHome(true);
                            setShowInHomeGrid(true);
                          }}
                          className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            isFeaturedOnHome || showInHomeGrid
                              ? "bg-[var(--blue)] text-white shadow-sm font-bold"
                              : "text-[var(--muted)] hover:text-[var(--ink)]"
                          }`}
                        >
                          ON
                        </button>
                      </div>
                    </div>

                    {/* 6. Mark as Latest */}
                    <div>
                      <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium mb-2 block">
                        Mark as Latest
                      </label>
                      <div className="flex items-center p-1 bg-[var(--line)]/30 rounded-lg w-fit border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => setIsNew(false)}
                          className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            !isNew
                              ? "bg-[var(--card)] text-[var(--ink)] shadow-sm font-bold"
                              : "text-[var(--muted)] hover:text-[var(--ink)]"
                          }`}
                        >
                          OFF
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNew(true)}
                          className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                            isNew
                              ? "bg-[var(--blue)] text-white shadow-sm font-bold"
                              : "text-[var(--muted)] hover:text-[var(--ink)]"
                          }`}
                        >
                          ON
                        </button>
                      </div>
                    </div>

                    {/* 7. Button Label */}
                    <CustomDropdown
                      label="Button Label"
                      value={ctaLabel}
                      options={["View Case Study", "View Project", "View UI Design"]}
                      onChange={(val) => setCtaLabel(val as "View Case Study" | "View Project" | "View UI Design")}
                    />

                    {/* 8. Is it Live */}
                    <CustomDropdown
                      label="Is it Live"
                      value={isLive}
                      options={["No", "Yes"]}
                      onChange={(val) => setIsLive(val as "Yes" | "No")}
                    />
                  </div>


                </form>
              )}

              {/* STEP 3: SET UP THUMBNAIL PAGE */}
              {step === 3 && (
                <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6 w-full max-w-4xl mx-auto">
                  {/* Page Heading */}
                  <div className="text-center sm:text-left space-y-1 pb-2 border-b border-[var(--line)]">
                    <h2 className="text-xl font-hero font-bold text-[var(--ink)] tracking-tight">
                      Set Up Project Thumbnail
                    </h2>
                    <p className="text-xs font-sans text-[var(--ink-soft)]">
                      Select a cover thumbnail from your uploaded project images, or upload a new custom file from your computer.
                    </p>
                  </div>

                  {/* Submission or Field Error Banner */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-sans flex items-start gap-3">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold mb-0.5">
                          {errorMessage.toLowerCase().includes("thumbnail") ? "Thumbnail Required" : "Submission Error"}
                        </p>
                        <p className="leading-relaxed opacity-90">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Current Selected Thumbnail Preview */}
                  <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium block">
                        Selected Cover Thumbnail
                      </label>
                      {thumbnailPreview && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-mono font-semibold">
                          <Check size={12} />
                          Active Cover
                        </span>
                      )}
                    </div>

                    {thumbnailPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center p-2 max-h-80">
                        <img
                          src={thumbnailPreview}
                          alt="Selected cover thumbnail preview"
                          className="w-full h-auto max-h-80 object-contain rounded-lg shadow-2xs"
                        />
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--bg)] text-center text-[var(--ink-soft)] space-y-2">
                        <ImageIcon size={32} className="mx-auto text-[var(--muted)]" />
                        <p className="text-xs font-sans font-medium">No cover thumbnail selected yet</p>
                        <p className="text-[11px] font-sans text-[var(--muted)]">Please select an image below or upload a custom file from local.</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION A: Choose from Selected Images */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium block">
                        Option 1: Choose from Selected Images ({totalImagesCount})
                      </label>
                      <span className="text-[11px] font-sans text-[var(--muted)]">
                        Click any image to make it cover
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {/* Active Thumbnail Option Card */}
                      {thumbnailPreview && (
                        <div
                          className="relative rounded-xl overflow-hidden border-2 border-[var(--blue)] bg-[var(--card)] shadow-md p-1 cursor-pointer transition-all"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                            <img
                              src={thumbnailPreview}
                              alt="Active thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1.5 right-1.5 bg-[var(--blue)] text-white p-1 rounded-full shadow">
                              <Check size={12} />
                            </div>
                            <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                              Active Cover
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gallery Images Option Cards */}
                      {galleryPreviews.map((preview, index) => (
                        <div
                          key={index}
                          onClick={() => setAsCoverImage(index)}
                          className="relative rounded-xl overflow-hidden border border-[var(--line)] hover:border-[var(--blue)] bg-[var(--card)] p-1 cursor-pointer transition-all hover:shadow-md group"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                            <img
                              src={preview}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white text-black font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
                                Set as Thumbnail
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION B: Upload Custom Thumbnail from Local */}
                  <div className="space-y-3 pt-2">
                    <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium block">
                      Option 2: Upload New Custom Thumbnail from Local
                    </label>

                    {/* Hidden input for standalone custom thumbnail upload */}
                    <input
                      ref={customThumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDirectThumbnailUpload(e.target.files)}
                      className="hidden"
                    />

                    <div
                      onClick={() => customThumbnailInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDirectThumbnailUpload(e.dataTransfer.files);
                      }}
                      className="p-6 rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)] hover:bg-[var(--blue)]/5 transition-all text-center cursor-pointer group space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-semibold text-[var(--ink)]">
                          Click or drag to upload a custom thumbnail file from your computer
                        </p>
                        <p className="text-[11px] font-sans text-[var(--ink-soft)] mt-0.5">
                          PNG, JPG, WEBP, or GIF (auto sets as cover thumbnail)
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
