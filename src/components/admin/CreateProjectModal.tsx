import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Loader2, Image as ImageIcon, AlertCircle, ArrowLeft, ArrowRight, Check, Star, Trash2, Plus, ChevronDown, Sun, Moon, Film, Video, Layers, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { createProject, slugify } from "../../services/projectService";
import { getLenis } from "../../hooks/useLenis";
import { isSupportedMediaFile, isVideoFile, isMediaVideo } from "../../utils/mediaUtils";
import KeyContributionsInput from "./KeyContributionsInput";
import CustomDropdown from "../ui/CustomDropdown";
import ProjectThumbnailViewer from "../projects/ProjectThumbnailViewer";
import MediaThumbnailManager, { ThumbnailMediaItem } from "./MediaThumbnailManager";
import ProjectTileColorPicker from "./ProjectTileColorPicker";

export const PROJECT_KIND_OPTIONS = [
  "Case Study",
  "UI Design",
  "Product Design",
  "Design System",
  "Visual Design",
  "Mobile App",
  "Web Platform",
  "Side Project",
];

export const BUTTON_LABEL_OPTIONS = [
  "View Project",
  "Read Case Study",
  "View Case Study",
  "View UI Design",
  "See Case Study",
];

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
  direction?: "up" | "down" | "auto";
}

function CustomDropdownSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  direction = "auto",
}: CustomDropdownSelectProps) {
  return (
    <CustomDropdown
      label={label}
      value={value}
      options={options}
      placeholder={placeholder}
      onChange={onChange}
      direction={direction}
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
  const [projectKind, setProjectKind] = useState("Case Study");
  const [productType, setProductType] = useState("");
  const [isFeaturedOnHome, setIsFeaturedOnHome] = useState(true);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [keyContributions, setKeyContributions] = useState<string[]>([]);
  const [ctaLabel, setCtaLabel] = useState<string>("View Project");
  const [isNew, setIsNew] = useState(true);
  const [isLive, setIsLive] = useState<"Yes" | "No">("No");
  const [showInHomeGrid, setShowInHomeGrid] = useState(true);
  const [projectTheme, setProjectTheme] = useState<"light" | "dark">("light");
  const [tileColor, setTileColor] = useState<string>("");

  // Image Files & Previews State
  const [thumbnailMode, setThumbnailMode] = useState<"single" | "carousel">("single");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isThumbnailFromOutside, setIsThumbnailFromOutside] = useState<boolean>(false);

  // Unified Media Slots (1 to 5 photos / videos mixed)
  const [thumbnailItems, setThumbnailItems] = useState<ThumbnailMediaItem[]>([]);

  // Carousel Thumbnail Files & Previews (Multi-Image)
  const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
  const [carouselPreviews, setCarouselPreviews] = useState<string[]>([]);

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
  const videoThumbnailInputRef = useRef<HTMLInputElement>(null);
  const carouselImagesInputRef = useRef<HTMLInputElement>(null);

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

  const availableGalleryMedia = React.useMemo(() => {
    const list: { url: string; file?: File; isVideo: boolean; title?: string }[] = [];
    if (thumbnailFile && thumbnailPreview && !thumbnailItems.some((i) => i.url === thumbnailPreview)) {
      list.push({
        url: thumbnailPreview,
        file: thumbnailFile,
        isVideo: isVideoFile(thumbnailFile),
        title: thumbnailFile.name,
      });
    }
    galleryFiles.forEach((file, idx) => {
      const prev = galleryPreviews[idx];
      if (prev && !thumbnailItems.some((i) => i.url === prev)) {
        list.push({
          url: prev,
          file,
          isVideo: isVideoFile(file),
          title: file.name,
        });
      }
    });
    return list;
  }, [thumbnailFile, thumbnailPreview, galleryFiles, galleryPreviews, thumbnailItems]);

  // Add multiple images & videos from main dropzone or multi-file picker
  const handleBulkAddImages = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    Array.from(filesList).forEach((file) => {
      if (isSupportedMediaFile(file)) {
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
    const wasCoverOutside = isThumbnailFromOutside;

    const newCoverFile = galleryFiles[index];
    const newCoverPreview = galleryPreviews[index];

    // Swap thumbnail
    setThumbnailFile(newCoverFile);
    setThumbnailPreview(newCoverPreview);
    setIsThumbnailFromOutside(false);

    // Update gallery array: remove the item promoted to cover
    const updatedFiles = galleryFiles.filter((_, i) => i !== index);
    const updatedPreviews = galleryPreviews.filter((_, i) => i !== index);

    // Only put old cover back into gallery if it was originally a project image, NOT if it was an outside thumbnail
    if (oldCoverFile && oldCoverPreview && !wasCoverOutside) {
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

  // Move gallery image position (also allows moving up to position 1 by swapping with thumbnail)
  const moveGalleryImage = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0 && thumbnailFile && thumbnailPreview) {
      // Swap with position 1 (thumbnail)
      const curThumbFile = thumbnailFile;
      const curThumbPrev = thumbnailPreview;
      const curGalFile = galleryFiles[0];
      const curGalPrev = galleryPreviews[0];

      setThumbnailFile(curGalFile);
      setThumbnailPreview(curGalPrev);
      setGalleryFiles([curThumbFile, ...galleryFiles.slice(1)]);
      setGalleryPreviews([curThumbPrev, ...galleryPreviews.slice(1)]);
      return;
    }

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

  // Move position 1 down into gallery
  const moveThumbnailDown = () => {
    if (galleryFiles.length === 0 || !thumbnailFile || !thumbnailPreview) return;
    const curThumbFile = thumbnailFile;
    const curThumbPrev = thumbnailPreview;
    const [firstGalFile, ...restFiles] = galleryFiles;
    const [firstGalPrev, ...restPreviews] = galleryPreviews;

    setThumbnailFile(firstGalFile);
    setThumbnailPreview(firstGalPrev);
    setGalleryFiles([curThumbFile, ...restFiles]);
    setGalleryPreviews([curThumbPrev, ...restPreviews]);
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

      // Auto-populate thumbnail items if empty (1 to 5 items)
      if (thumbnailItems.length === 0) {
        const candidateItems: ThumbnailMediaItem[] = [];
        if (thumbnailFile && thumbnailPreview) {
          candidateItems.push({
            id: `thumb-init-0`,
            url: thumbnailPreview,
            file: thumbnailFile,
            isVideo: isVideoFile(thumbnailFile),
            name: thumbnailFile.name,
          });
        }
        galleryFiles.forEach((f, idx) => {
          if (candidateItems.length < 5 && galleryPreviews[idx]) {
            candidateItems.push({
              id: `thumb-gal-${idx}`,
              url: galleryPreviews[idx],
              file: f,
              isVideo: isVideoFile(f),
              name: f.name,
            });
          }
        });
        if (candidateItems.length > 0) {
          setThumbnailItems(candidateItems.slice(0, 1));
        }
      }
    } else {
      setErrorMessage("Please fill out required fields before continuing.");
    }
  };

  const handleAddFilesToThumbnail = (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    const newItems = [...thumbnailItems];
    const newGalF: File[] = [];
    const newGalP: string[] = [];

    files.forEach((file) => {
      if (newItems.length >= 5) return;
      if (!isSupportedMediaFile(file)) return;
      const isVideo = isVideoFile(file);
      const url = URL.createObjectURL(file);
      newItems.push({
        id: `thumb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url,
        file,
        isVideo,
        name: file.name,
      });
      newGalF.push(file);
      newGalP.push(url);
    });

    setThumbnailItems(newItems);
    if (newGalF.length > 0) {
      setGalleryFiles((prev) => [...prev, ...newGalF]);
      setGalleryPreviews((prev) => [...prev, ...newGalP]);
    }
  };

  const handleSwitchToCarousel = () => {
    setThumbnailMode("carousel");
    if (carouselFiles.length === 0) {
      const candidateFiles: File[] = [];
      const candidatePreviews: string[] = [];
      if (thumbnailFile && thumbnailPreview && !isVideoFile(thumbnailFile)) {
        candidateFiles.push(thumbnailFile);
        candidatePreviews.push(thumbnailPreview);
      }
      galleryFiles.forEach((f, idx) => {
        if (!isVideoFile(f) && galleryPreviews[idx]) {
          candidateFiles.push(f);
          candidatePreviews.push(galleryPreviews[idx]);
        }
      });
      if (candidateFiles.length > 0) {
        setCarouselFiles(candidateFiles.slice(0, 3));
        setCarouselPreviews(candidatePreviews.slice(0, 3));
      }
    }
  };

  const handleSwitchToSingle = () => {
    setThumbnailMode("single");
  };

  const handleToggleCarouselMedia = (file: File, preview: string) => {
    const idx = carouselFiles.indexOf(file);
    if (idx >= 0) {
      if (carouselFiles.length <= 1) {
        setErrorMessage("A carousel thumbnail requires at least 1 image.");
        return;
      }
      setErrorMessage(null);
      setCarouselFiles((prev) => prev.filter((_, i) => i !== idx));
      setCarouselPreviews((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setErrorMessage(null);
      setCarouselFiles((prev) => [...prev, file]);
      setCarouselPreviews((prev) => [...prev, preview]);
    }
  };

  const handleMoveCarouselItem = (index: number, direction: "left" | "right") => {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= carouselFiles.length) return;

    const newFiles = [...carouselFiles];
    const newPrev = [...carouselPreviews];

    const f = newFiles[index];
    newFiles[index] = newFiles[target];
    newFiles[target] = f;

    const p = newPrev[index];
    newPrev[index] = newPrev[target];
    newPrev[target] = p;

    setCarouselFiles(newFiles);
    setCarouselPreviews(newPrev);
  };

  const handleRemoveCarouselItem = (index: number) => {
    if (carouselFiles.length <= 1) {
      setErrorMessage("At least 1 image is required for the carousel thumbnail.");
      return;
    }
    setErrorMessage(null);
    setCarouselFiles((prev) => prev.filter((_, i) => i !== index));
    setCarouselPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Direct video upload handler for thumbnail
  const handleDirectVideoUpload = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const file = filesList[0];
    if (!isVideoFile(file) && !file.type.startsWith("video/")) {
      setErrorMessage("Please select a valid video file (MP4, WebM, MOV, etc.).");
      return;
    }
    setErrorMessage(null);
    const preview = URL.createObjectURL(file);
    setThumbnailFile(file);
    setThumbnailPreview(preview);
    setThumbnailMode("single");
    setIsThumbnailFromOutside(true);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.thumbnailFile;
      return copy;
    });
  };

  // Direct carousel images upload handler
  const handleDirectCarouselUpload = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(filesList).forEach((file) => {
      if (isSupportedMediaFile(file) && !isVideoFile(file)) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    if (newFiles.length > 0) {
      setErrorMessage(null);
      setCarouselFiles((prev) => [...prev, ...newFiles]);
      setCarouselPreviews((prev) => [...prev, ...newPreviews]);
      setGalleryFiles((prev) => [...prev, ...newFiles]);
      setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // Direct custom thumbnail upload handler for Step 3
  const handleDirectThumbnailUpload = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const file = filesList[0];
    if (!isSupportedMediaFile(file)) return;

    const preview = URL.createObjectURL(file);

    // If current thumbnail was from project gallery (not outside), restore it back to gallery list so project images are preserved
    if (thumbnailFile && thumbnailPreview && !isThumbnailFromOutside) {
      setGalleryFiles((prev) => [thumbnailFile, ...prev]);
      setGalleryPreviews((prev) => [thumbnailPreview, ...prev]);
    }

    setThumbnailFile(file);
    setThumbnailPreview(preview);
    setThumbnailMode("single");
    setIsThumbnailFromOutside(true);

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

    if (thumbnailItems.length === 0 && !thumbnailFile) {
      errors.thumbnailFile = "At least one project thumbnail (photo or video) is required.";
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
      const isCarousel = thumbnailItems.length > 1;
      const thumbFilesToSubmit = thumbnailItems.map((i) => i.file).filter(Boolean) as File[];
      const primaryThumbFile = thumbFilesToSubmit[0] || thumbnailFile || null;
      const determinedThumbType: "single" | "video" | "carousel" = isCarousel
        ? "carousel"
        : (thumbnailItems[0]?.isVideo || (primaryThumbFile && isVideoFile(primaryThumbFile)) ? "video" : "single");

      const createdProject = await createProject({
        title,
        projectKind,
        productType,
        isFeaturedOnHome,
        category,
        description,
        keyContributions,
        ctaLabel,
        isNew,
        isLive: isLive === "Yes",
        showInHomeGrid: isFeaturedOnHome || showInHomeGrid,
        thumbnailFile: primaryThumbFile,
        thumbnailFiles: thumbFilesToSubmit,
        thumbnailType: determinedThumbType,
        galleryFiles,
        thumbnailFromOutside: isThumbnailFromOutside,
        theme: projectTheme,
        tileColor: tileColor || undefined,
      });

      // Reset form state
      setTitle("");
      setProjectKind("Case Study");
      setProductType("");
      setIsFeaturedOnHome(true);
      setCategory("");
      setDescription("");
      setKeyContributions([]);
      setCtaLabel("View Project");
      setIsNew(true);
      setIsLive("No");
      setShowInHomeGrid(true);
      setProjectTheme("light");
      setTileColor("");
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setIsThumbnailFromOutside(false);
      setCarouselFiles([]);
      setCarouselPreviews([]);
      setThumbnailMode("single");
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
              accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg,image/gif"
              multiple
              onChange={(e) => handleBulkAddImages(e.target.files)}
              className="hidden"
            />

            {/* Hidden Input for Thumbnail explicit picker */}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg,image/gif"
              onChange={(e) => {
                if (e.target.files?.[0]) handleBulkAddImages(e.target.files);
              }}
              className="hidden"
            />

            {/* Hidden Input for Video Thumbnail explicit picker */}
            <input
              ref={videoThumbnailInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg"
              onChange={(e) => handleDirectVideoUpload(e.target.files)}
              className="hidden"
            />

            {/* Hidden Input for Carousel Images explicit picker */}
            <input
              ref={carouselImagesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleDirectCarouselUpload(e.target.files)}
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
                    className="px-4 py-2 rounded-full border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span className="font-medium">Back</span>
                  </button>
                )}
                {step === 3 && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-full border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span className="font-medium">Back</span>
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
            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 pb-20 sm:pb-24 space-y-6 overscroll-contain" data-lenis-prevent="true">
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
                        {thumbnailPreview && (() => {
                          const isThumbVideo = (thumbnailFile && isVideoFile(thumbnailFile)) || (thumbnailPreview && isMediaVideo(thumbnailPreview));
                          return (
                            <div className="rounded-xl border border-[var(--line)] overflow-hidden flex flex-col">
                              {/* Card Header Bar */}
                              <div className="px-4 py-2.5 border-b border-[var(--line)] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-full bg-[var(--line)] text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center">
                                    1
                                  </span>
                                  {isThumbVideo && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                                      <Film size={11} />
                                      <span>Video / GIF</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {galleryPreviews.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={moveThumbnailDown}
                                      className="w-8 h-8 rounded-full border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)] flex items-center justify-center transition-colors cursor-pointer"
                                      title="Move down"
                                    >
                                      <ArrowRight size={14} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={removeThumbnail}
                                    className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Full-size Media Display Container */}
                              <div className="flex items-center justify-center min-h-[220px] bg-black/[0.02] dark:bg-black/20">
                                {isThumbVideo ? (
                                  <video
                                    src={thumbnailPreview}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    className="w-full h-auto max-h-[700px] object-contain"
                                  />
                                ) : (
                                  <img
                                    src={thumbnailPreview}
                                    alt="Project Media 1"
                                    className="w-full h-auto max-h-[700px] object-contain"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. Gallery Images & Videos Full Size */}
                        {galleryPreviews.map((preview, index) => {
                          const isGalVideo = (galleryFiles[index] && isVideoFile(galleryFiles[index])) || (preview && isMediaVideo(preview));
                          return (
                            <div
                              key={index}
                              className="rounded-xl border border-[var(--line)] overflow-hidden flex flex-col"
                            >
                              {/* Card Header Bar */}
                              <div className="px-4 py-2.5 border-b border-[var(--line)] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-full bg-[var(--line)] text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center">
                                    {thumbnailPreview ? index + 2 : index + 1}
                                  </span>
                                  {isGalVideo && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                                      <Film size={11} />
                                      <span>Video / GIF</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => moveGalleryImage(index, "left")}
                                    className="w-8 h-8 rounded-full border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)] flex items-center justify-center transition-colors cursor-pointer"
                                    title="Move up"
                                  >
                                    <ArrowLeft size={14} />
                                  </button>
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
                                    title="Remove item"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Full-size Media Display Container */}
                              <div className="flex items-center justify-center min-h-[220px] bg-black/[0.02] dark:bg-black/20">
                                {isGalVideo ? (
                                  <video
                                    src={preview}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                    className="w-full h-auto max-h-[700px] object-contain"
                                  />
                                ) : (
                                  <img
                                    src={preview}
                                    alt={`Gallery Media ${index + 1}`}
                                    className="w-full h-auto max-h-[700px] object-contain"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Prominent "Add Another Image or Video" Button Below Uploaded Media */}
                      <button
                        type="button"
                        onClick={() => allImagesInputRef.current?.click()}
                        className="w-full py-4 sm:py-5 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)] hover:bg-[var(--blue)]/5 text-[var(--ink)] font-sans font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer group mt-4"
                      >
                        <div className="p-1.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] group-hover:scale-110 transition-transform">
                          <Plus size={18} />
                        </div>
                        <span>Add Another Image or Video</span>
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
                        (() => {
                          const activeMedia = thumbnailPreview || galleryPreviews[0];
                          const isVideo = (thumbnailFile && isVideoFile(thumbnailFile)) || isMediaVideo(activeMedia);
                          return isVideo ? (
                            <video
                              src={activeMedia}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-14 h-10 rounded-lg object-cover border border-[var(--line)] shrink-0 bg-[var(--line)]"
                            />
                          ) : (
                            <img
                              src={activeMedia}
                              alt="Cover preview"
                              className="w-14 h-10 rounded-lg object-cover border border-[var(--line)] shrink-0 bg-[var(--line)]"
                            />
                          );
                        })()
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-[var(--line)] flex items-center justify-center shrink-0">
                          <ImageIcon size={18} className="text-[var(--muted)]" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-hero font-bold text-[var(--ink)] block">
                          {totalImagesCount} Media File{totalImagesCount !== 1 ? "s" : ""} Attached
                        </span>
                        <span className="text-[11px] font-sans text-[var(--ink-soft)]">
                          Cover &amp; {galleryFiles.length} gallery item{galleryFiles.length !== 1 ? "s" : ""} ready
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

                  {/* 2. Project Type (Format / Nature: Case Study, UI Design, etc.) */}
                  <CustomDropdownSelect
                    label="Project Type (What project is this?)"
                    value={projectKind}
                    options={PROJECT_KIND_OPTIONS}
                    placeholder="Select Project Type (e.g. Case Study, UI Design)"
                    onChange={(val) => {
                      setProjectKind(val);
                      if (val === "UI Design" && (ctaLabel === "View Case Study" || ctaLabel === "View Project")) {
                        setCtaLabel("View UI Design");
                      } else if (val === "Case Study" && (ctaLabel === "View UI Design" || ctaLabel === "View Project")) {
                        setCtaLabel("View Case Study");
                      }
                    }}
                  />

                  {/* 3. Product Platform / Type */}
                  <CustomDropdownSelect
                    label="Product Platform / Type"
                    value={productType}
                    options={PRODUCT_TYPE_OPTIONS}
                    placeholder="Select Product Type"
                    onChange={setProductType}
                  />

                  {/* 4. Category */}
                  <CustomDropdownSelect
                    label="Industry / Category"
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
                      options={BUTTON_LABEL_OPTIONS}
                      onChange={(val) => setCtaLabel(val)}
                      direction="up"
                    />

                    {/* 8. Is it Live */}
                    <CustomDropdown
                      label="Is it Live"
                      value={isLive}
                      options={["No", "Yes"]}
                      onChange={(val) => setIsLive(val as "Yes" | "No")}
                      direction="up"
                    />
                  </div>

                  {/* 9. Preserve Theme Option (Light vs Dark) */}
                  <div className="pt-2 border-t border-[var(--line)]/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                      <div>
                        <span className="font-mono text-xs tracking-wider uppercase text-[var(--ink)] font-bold flex items-center gap-1.5">
                          <span>Preserve Project Theme</span>
                        </span>
                        <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                          {projectTheme === "dark" 
                            ? "Project is forced to display in Dark theme only." 
                            : "Project is forced to display in Light theme only (default)."}
                        </p>
                      </div>

                      <div className="flex items-center p-1 bg-[var(--line)]/30 rounded-lg border border-[var(--line)] shrink-0">
                        <button
                          type="button"
                          onClick={() => setProjectTheme("light")}
                          className={`px-3.5 py-1.5 text-xs font-sans rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            projectTheme === "light"
                              ? "bg-[var(--blue)] text-white shadow-sm font-semibold"
                              : "text-[var(--ink-soft)] hover:text-[var(--ink)] font-medium"
                          }`}
                        >
                          <Sun size={13} />
                          <span>Light Theme</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectTheme("dark")}
                          className={`px-3.5 py-1.5 text-xs font-sans rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                            projectTheme === "dark"
                              ? "bg-[var(--blue)] text-white shadow-sm font-semibold"
                              : "text-[var(--ink-soft)] hover:text-[var(--ink)] font-medium"
                          }`}
                        >
                          <Moon size={13} />
                          <span>Dark Theme</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </form>
              )}

              {/* STEP 3: SET UP THUMBNAIL PAGE */}
              {step === 3 && (
                <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6 w-full max-w-4xl mx-auto">
                  {/* Submission or Field Error Banner */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-sans flex items-start gap-3">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold mb-0.5">Thumbnail Notice</p>
                        <p className="leading-relaxed opacity-90">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <MediaThumbnailManager
                    items={thumbnailItems}
                    onChange={(newItems) => {
                      setThumbnailItems(newItems);
                      if (newItems.length > 0) {
                        setFieldErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.thumbnailFile;
                          return copy;
                        });
                      }
                    }}
                    onAddFiles={handleAddFilesToThumbnail}
                    availableGalleryMedia={availableGalleryMedia}
                    maxItems={5}
                    isUploading={isSubmitting}
                    tileColor={tileColor}
                  />

                  {/* Tile Color Theme Palette for the Thumbnail Box */}
                  <div className="pt-2">
                    <ProjectTileColorPicker
                      value={tileColor}
                      onChange={setTileColor}
                    />
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
