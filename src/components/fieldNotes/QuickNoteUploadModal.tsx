import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ArrowLeft,
  X,
  UploadCloud,
} from "lucide-react";
import { createPortal } from "react-dom";
import { fieldNotesService } from "../../services/fieldNotesService";
import { uploadImageToCloudinary } from "../../utils/cloudinary";
import { FieldNote } from "../../types/fieldNotes";
import { useScrollLock } from "../../hooks/useScrollLock";

interface QuickNoteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = "select" | "preview" | "posting";

/**
 * Client-side high-fidelity image compressor fallback.
 * Scales down large device photos to a responsive WebP/JPEG data URI (~70KB).
 */
function compressImageToDataUri(file: File, maxDimension = 960, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl || !dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const QuickNoteUploadModal: React.FC<QuickNoteUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Workflow steps: select -> preview -> posting
  const [step, setStep] = useState<ModalStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedRatio, setDetectedRatio] = useState<"16/9" | "3/4" | "1/1">("3/4");
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep("select");
        setSelectedFile(null);
        setPreviewUrl(null);
        setDetectedRatio("3/4");
        setCaption("");
        setIsPosting(false);
        setErrorMsg(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Unified scroll locking via useScrollLock with layout shift prevention
  useScrollLock(isOpen);

  /**
   * Handle image selection (Camera Capture or Device Pick).
   * Immediately transitions into the Preview Window so the user can review before posting.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn("[QuickNoteUpload] No file in change event");
      return;
    }

    console.log("[QuickNoteUpload] Selected file:", file.name, file.size, file.type);
    setSelectedFile(file);
    setErrorMsg(null);
    setStep("preview");

    // 1. Immediate blob preview
    try {
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);

      // Measure image orientation to honor portrait or landscape
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w && h) {
          const ratio = w / h;
          if (ratio >= 1.15) {
            setDetectedRatio("16/9");
          } else if (ratio <= 0.85) {
            setDetectedRatio("3/4");
          } else {
            setDetectedRatio("1/1");
          }
        }
      };
      img.src = blobUrl;
    } catch (err) {
      console.warn("[QuickNoteUpload] createObjectURL fallback:", err);
    }

    // 2. Also read into permanent Data URL via FileReader (guaranteed in mobile iframes)
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);

        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (w && h) {
            const ratio = w / h;
            if (ratio >= 1.15) {
              setDetectedRatio("16/9");
            } else if (ratio <= 0.85) {
              setDetectedRatio("3/4");
            } else {
              setDetectedRatio("1/1");
            }
          }
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Post to Firebase collection.
   * Triggered when user clicks the "Post" button in the preview window.
   */
  const handlePost = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMsg("Please select or capture a photo first.");
      return;
    }

    setIsPosting(true);
    setErrorMsg(null);

    try {
      const todayDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // 1. Determine image URL for storage
      let finalImageUrl = "";

      if (selectedFile) {
        // Try Cloudinary CDN upload first
        try {
          finalImageUrl = await uploadImageToCloudinary(selectedFile, "field_notes");
        } catch (cloudErr: any) {
          console.warn("[QuickNoteUpload] Cloudinary upload fallback:", cloudErr?.message);
        }

        // If Cloudinary didn't return, compress to compact WebP/JPEG data URI
        if (!finalImageUrl) {
          try {
            finalImageUrl = await compressImageToDataUri(selectedFile, 960, 0.82);
          } catch (compErr) {
            console.warn("[QuickNoteUpload] Compression fallback:", compErr);
          }
        }
      }

      // If still empty, use the loaded data URL from preview
      if (!finalImageUrl && previewUrl) {
        finalImageUrl = previewUrl;
      }

      if (!finalImageUrl) {
        throw new Error("Unable to read image. Please select the photo again.");
      }

      // 2. Post directly to Firebase Firestore collection field_notes (no signing required)
      const noteTitle = caption.trim()
        ? caption.trim().slice(0, 48)
        : "Field Photo";
      const noteContent = caption.trim() || `Field photo captured on ${todayDate}`;

      const newNote = await fieldNotesService.addNote({
        type: "photo",
        imageUrl: finalImageUrl,
        title: noteTitle,
        content: noteContent,
        date: todayDate,
        tags: ["Snapshot", "Mobile", "Field Note"],
        aspectRatio: detectedRatio,
      });

      console.log("[QuickNoteUpload] Successfully posted note:", newNote.id);

      console.log("[QuickNoteUpload] Successfully posted note:", newNote.id);

      // 3. Immediately close the upload modal
      onClose();

      // 4. Show sleek popup message: "The note uploaded"
      setToastMessage("The note uploaded");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 3500);

      // 5. Ensure it displays under the notes section immediately without jarring jumps
      sessionStorage.setItem("portfolio_active_blog_tab", "My Notes");
      window.dispatchEvent(
        new CustomEvent("switch_to_my_notes", { detail: { noteId: newNote.id } })
      );

      if (location.pathname !== "/blog") {
        navigate("/blog?tab=my-notes");
      }
    } catch (err: any) {
      console.error("[QuickNoteUpload] Post to Firebase failed:", err);
      setErrorMsg(
        err?.message || "Failed to post to Firebase collection. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleRetake = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setStep("select");
  };

  // Only close if user clicked directly on the outer backdrop mask
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
          >
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-[var(--bg)] border-t sm:border border-[var(--line)] rounded-t-[28px] sm:rounded-3xl p-5 pb-7 sm:pb-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        >
          {/* Hidden native input for Camera Capture */}
          <input
            id="quick-camera-input"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Hidden native input for Device File/Gallery Selection */}
          <input
            id="quick-device-input"
            ref={deviceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Subtle Pull Indicator Bar */}
          <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-zinc-700 mx-auto mb-3" />

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span className="flex-1">{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 dark:text-rose-400 hover:opacity-80 p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ========================================================
              STAGE 1: SELECTION (OPEN CAMERA / SELECT FROM DEVICE)
              ======================================================== */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink)]">Add Field Note</h3>
                  <p className="text-[11px] text-[var(--ink-soft)]">
                    Take or select a photo to post to My Notes (no signing needed)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Option 1: Open Camera & Click a Photo */}
                <label
                  htmlFor="quick-camera-input"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cameraInputRef.current) {
                      cameraInputRef.current.value = "";
                    }
                  }}
                  className="w-full p-4 rounded-2xl bg-neutral-100/90 dark:bg-zinc-800/90 hover:bg-neutral-200/90 dark:hover:bg-zinc-700/90 border border-[var(--line)] flex items-center gap-3.5 transition-all active:scale-[0.98] cursor-pointer text-left group select-none"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Camera size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5">
                      <span>Open Camera</span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] mt-0.5 truncate">
                      Click a photo and preview before posting
                    </p>
                  </div>
                </label>

                {/* Option 2: Select from Device */}
                <label
                  htmlFor="quick-device-input"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (deviceInputRef.current) {
                      deviceInputRef.current.value = "";
                    }
                  }}
                  className="w-full p-4 rounded-2xl bg-neutral-100/90 dark:bg-zinc-800/90 hover:bg-neutral-200/90 dark:hover:bg-zinc-700/90 border border-[var(--line)] flex items-center gap-3.5 transition-all active:scale-[0.98] cursor-pointer text-left group select-none"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <ImageIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5">
                      <span>Select from Device</span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] mt-0.5 truncate">
                      Choose from your device gallery or files
                    </p>
                  </div>
                </label>
              </div>


              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2.5 rounded-2xl bg-transparent hover:bg-neutral-100 dark:hover:bg-zinc-800/60 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          )}

          {/* ========================================================
              STAGE 2: PREVIEW WINDOW (WITH "POST" BUTTON)
              User requested: "after clicking or attatching from the device
              a preview window should shown, in that window a button named as Post,
              once click this button it shold post to the firebase collection and
              displayed under the notes section."
              ======================================================== */}
          {(step === "preview" || step === "posting") && (
            <div className="space-y-3.5">
              {/* Header with Back and Title */}
              <div className="flex items-center justify-between pb-0.5">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isPosting}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <span className="text-xs font-semibold text-[var(--ink)]">Preview Photo</span>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPosting}
                  className="p-1 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-50"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Photo Preview Container (Adapts to portrait, landscape, or square) */}
              <div className={`relative ${
                detectedRatio === "16/9"
                  ? "aspect-[16/10]"
                  : detectedRatio === "1/1"
                  ? "aspect-square"
                  : "aspect-[3/4] max-h-[380px]"
              } rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--line)] shadow-lg flex items-center justify-center mx-auto w-full transition-[aspect-ratio] duration-200`}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected Preview"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full skeleton-box" />
                )}
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono backdrop-blur-md border border-white/10 shadow-xs">
                  Ready to post
                </span>
              </div>

              {/* Optional Caption Field */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={isPosting}
                  placeholder="Add a note or caption (optional)..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-sans bg-neutral-100 dark:bg-zinc-800/80 border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
                />
              </div>

              {/* Action Buttons: "Post" (Exact name required) */}
              <div className="space-y-2 pt-1">
                <button
                  id="post-field-note-btn"
                  type="button"
                  onClick={handlePost}
                  disabled={isPosting}
                  className="w-full py-3.5 rounded-2xl bg-[var(--blue)] hover:opacity-95 text-white font-sans font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPosting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Posting to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={17} />
                      <span>Post</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="quick-device-input"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deviceInputRef.current) {
                        deviceInputRef.current.value = "";
                      }
                    }}
                    className={`w-1/2 py-2 rounded-xl text-xs font-medium border border-[var(--line)] text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center select-none ${
                      isPosting ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <RotateCcw size={12} />
                    <span>Change Photo</span>
                  </label>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPosting}
                    className="w-1/2 py-2 rounded-xl text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors text-center cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Popup Message ("The note uploaded") */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] max-w-[92vw] px-4 py-2.5 rounded-full bg-neutral-900/95 dark:bg-zinc-800/95 text-white text-xs font-sans font-medium flex items-center gap-2.5 shadow-2xl border border-white/10 backdrop-blur-md pointer-events-auto select-none"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 size={13} strokeWidth={2.5} />
            </div>
            <span className="font-sans">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};
