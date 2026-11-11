import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Check,
  Trash2,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MapPin,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import {
  aboutBackgroundService,
  BackgroundItem,
  AboutBackgroundMultiConfig,
} from "../../services/aboutBackgroundService";
import { getLenis } from "../../hooks/useLenis";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import { useProfilePicture } from "../../hooks/useProfilePicture";

interface CreateInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: BackgroundItem) => void;
  initialData?: BackgroundItem | null;
}

export default function CreateInsightModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CreateInsightModalProps) {
  // Step 1: Upload Image | Step 2: Upload Audio | Step 3: Scene Details | Step 4: Live Preview & Save
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const profilePicture = useProfilePicture();

  // Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>("");
  const [existingAudioUrl, setExistingAudioUrl] = useState<string>("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [authorName, setAuthorName] = useState("Avinash Shajan");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [audioLabel, setAudioLabel] = useState("Audio recorded from the location");
  const [isActiveDefault, setIsActiveDefault] = useState(false);

  // Audio Playback in Preview State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Upload & Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const isEditMode = Boolean(initialData);

  // Initialize or reset form state on open / initialData change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setImagePreview(initialData.imageUrl || "");
        setExistingImageUrl(initialData.imageUrl || "");
        setImageFile(null);

        setAudioPreview(initialData.audioUrl || "");
        setExistingAudioUrl(initialData.audioUrl || "");
        setAudioFile(null);

        setTitle(initialData.title || "");
        setLocation(initialData.location || "");
        setAuthorName(initialData.authorName || "Avinash Shajan");
        setAuthorAvatar(initialData.authorAvatar || "");
        setAudioLabel(initialData.audioLabel || "Audio recorded from the location");
        setIsActiveDefault(Boolean(initialData.isActive));
        setStep(1);
      } else {
        setImageFile(null);
        setImagePreview("");
        setExistingImageUrl("");

        setAudioFile(null);
        setAudioPreview("");
        setExistingAudioUrl("");

        setTitle("");
        setLocation("");
        setAuthorName("Avinash Shajan");
        setAuthorAvatar("");
        setAudioLabel("Audio recorded from the location");
        setIsActiveDefault(false);
        setStep(1);
      }
      setErrorMessage(null);
      setFieldErrors({});
      setIsPlayingAudio(false);
    }
  }, [isOpen, initialData]);

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

  // Audio Playback Handlers for Preview
  const togglePreviewAudio = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingAudio) {
      previewAudioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn("Audio play failed:", err);
        setIsPlayingAudio(false);
      });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (previewAudioRef.current) {
      const current = previewAudioRef.current.currentTime;
      const total = previewAudioRef.current.duration || 1;
      setAudioProgress((current / total) * 100);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (previewAudioRef.current) {
      setAudioDuration(previewAudioRef.current.duration || 0);
    }
  };

  // Image Selection Handler
  const handleImageSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, image: "Please select a valid image file (JPG, PNG, WEBP)" }));
      return;
    }
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setExistingImageUrl("");
  };

  // Audio Selection Handler
  const handleAudioSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !file.name.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i)) {
      setFieldErrors((prev) => ({ ...prev, audio: "Please select a valid audio file (MP3, WAV, M4A)" }));
      return;
    }
    setAudioFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAudioPreview(objectUrl);
    setIsPlayingAudio(false);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.audio;
      return copy;
    });
  };

  const removeAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPlayingAudio(false);
    setAudioFile(null);
    setAudioPreview("");
    setExistingAudioUrl("");
  };

  // Step 3 Validation -> Proceed to Step 4 Preview
  const handleStep3Continue = () => {
    const errors: { [key: string]: string } = {};
    if (!title.trim()) {
      errors.title = "Scene title is required";
    }
    if (!location.trim()) {
      errors.location = "Location viewpoint is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStep(4);
  };

  // Final Save to Cloudinary & Firestore
  const handleSaveScene = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let finalImageUrl = existingImageUrl;
      let finalAudioUrl = existingAudioUrl;

      // 1. Upload Image to Cloudinary if a new file was chosen
      if (imageFile) {
        finalImageUrl = await aboutBackgroundService.uploadBackgroundImage(imageFile);
      }

      // 2. Upload Audio to Cloudinary if a new audio file was chosen
      if (audioFile) {
        finalAudioUrl = await aboutBackgroundService.uploadAudioFile(audioFile);
      }

      if (isEditMode && initialData) {
        // Update Existing Scene
        const updates: Partial<BackgroundItem> = {
          title: title.trim(),
          location: location.trim(),
          authorName: authorName.trim() || "Avinash Shajan",
          authorAvatar: authorAvatar.trim(),
          imageUrl: finalImageUrl,
          audioUrl: finalAudioUrl,
          audioLabel: audioLabel.trim() || "Audio recorded from the location",
          isActive: isActiveDefault,
        };

        await aboutBackgroundService.updateBackgroundItem(initialData.id, updates);

        if (isActiveDefault) {
          await aboutBackgroundService.setActiveBackground(initialData.id);
        }

        const updatedConfig = aboutBackgroundService.getMultiConfig();
        const updatedItem = updatedConfig.items.find((i) => i.id === initialData.id) || {
          ...initialData,
          ...updates,
        };

        onSuccess(updatedItem);
      } else {
        // Create New Scene
        const newItemPayload: Partial<BackgroundItem> = {
          title: title.trim(),
          location: location.trim(),
          authorName: authorName.trim() || "Avinash Shajan",
          authorAvatar: authorAvatar.trim(),
          imageUrl: finalImageUrl,
          audioUrl: finalAudioUrl,
          audioLabel: audioLabel.trim() || "Audio recorded from the location",
          blurAmount: 28,
          isActive: isActiveDefault,
        };

        const createdItem = await aboutBackgroundService.addBackgroundItem(newItemPayload);

        if (isActiveDefault) {
          await aboutBackgroundService.setActiveBackground(createdItem.id);
        }

        onSuccess(createdItem);
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving background scene:", err);
      const msg = err?.message || (typeof err === "string" ? err : (err ? JSON.stringify(err) : "An unexpected error occurred while saving the scene."));
      setErrorMessage(typeof msg === "object" ? JSON.stringify(msg) : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasImage = Boolean(imagePreview || existingImageUrl);
  const hasAudio = Boolean(audioPreview || existingAudioUrl);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/65 backdrop-blur-md overflow-y-auto"
          data-lenis-prevent="true"
        >
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent="true"
            className="relative w-full max-w-6xl h-[88vh] max-h-[860px] rounded-3xl bg-[var(--card)] border border-[var(--line)] shadow-2xl overflow-hidden z-10 flex flex-col my-auto"
          >
            {/* Hidden Input for Image File Picker */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
              }}
              className="hidden"
            />

            {/* Hidden Input for Audio File Picker */}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
              onChange={(e) => {
                if (e.target.files?.[0]) handleAudioSelect(e.target.files[0]);
              }}
              className="hidden"
            />

            {/* Hidden Audio Element for Testing */}
            {hasAudio && (
              <audio
                ref={previewAudioRef}
                src={audioPreview}
                onTimeUpdate={handleAudioTimeUpdate}
                onLoadedMetadata={handleAudioLoadedMetadata}
                onError={() => setIsPlayingAudio(false)}
                onEnded={() => {
                  setIsPlayingAudio(false);
                  setAudioProgress(0);
                }}
                className="hidden"
                preload="auto"
              />
            )}

            {/* TOP HEADER BAR */}
            <div className="px-6 sm:px-10 py-5 sm:py-6 flex items-center justify-between shrink-0 bg-transparent z-20">
              {/* Left: Back Navigation if beyond step 1 */}
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 4) setIsPlayingAudio(false);
                      setStep((prev) => (prev - 1) as any);
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-full border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                    <span className="font-medium">Back</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Right: Action Button & Close */}
              <div className="flex items-center gap-3.5">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasImage) setStep(2);
                    }}
                    disabled={!hasImage}
                    className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-sans font-medium flex items-center gap-1.5 transition-all ${
                      hasImage
                        ? "bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white cursor-pointer active:scale-95 shadow-sm"
                        : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <span>Continue</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-sans font-medium bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>{hasAudio ? "Continue" : "Skip / Continue"}</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="button"
                    onClick={handleStep3Continue}
                    className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-sans font-medium bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <span>Preview</span>
                  </button>
                )}

                {step === 4 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlayingAudio(false);
                        setStep(3);
                      }}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--card)] hover:bg-[var(--line)]/50 text-[var(--ink)] border border-[var(--line)] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Edit3 size={13} />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveScene}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{isEditMode ? "Save Changes" : "Save Scene"}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 ml-1"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mx-6 sm:mx-10 mb-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-sans flex items-center justify-between gap-3">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:bg-red-500/20 rounded-md cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* MODAL BODY CONTENT */}
            <div
              className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 pb-6 sm:pb-10 flex flex-col justify-center overscroll-contain"
              data-lenis-prevent="true"
            >
              {/* ========================================================================= */}
              {/* STEP 1: CHOOSE PHOTO / IMAGE */}
              {/* ========================================================================= */}
              {step === 1 && (
                <div className="w-full h-full flex flex-col justify-center">
                  {!hasImage ? (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleImageSelect(e.dataTransfer.files[0]);
                      }}
                      className="rounded-3xl p-12 sm:p-20 flex flex-col items-center justify-center text-center my-auto w-full h-full min-h-[460px] bg-transparent transition-all cursor-pointer group"
                    >
                      {/* Minimal Clean Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={28} className="stroke-[1.75]" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
                      {/* Full-Fill Image */}
                      <img
                        src={imagePreview}
                        alt="Scene Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />

                      {/* Top & Bottom Edge Soft Blur */}
                      <div
                        className="absolute inset-0 pointer-events-none backdrop-blur-md"
                        style={{
                          maskImage:
                            "linear-gradient(to bottom, black 0%, transparent 16%), linear-gradient(to top, black 0%, transparent 20%)",
                          WebkitMaskImage:
                            "linear-gradient(to bottom, black 0%, transparent 16%), linear-gradient(to top, black 0%, transparent 20%)",
                        }}
                      />

                      {/* Top & Bottom Rich Black Vintage Shade (Left & Right Sides Clear) */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 15%, transparent 30%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 18%, transparent 35%)",
                        }}
                      />

                      {/* Floating Minimal Replace / Remove Pill at bottom right */}
                      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 flex items-center gap-2 z-30">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-lg"
                        >
                          <Upload size={13} />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="p-2 rounded-full bg-black/60 hover:bg-red-500/80 text-white/90 hover:text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95 shadow-lg"
                          title="Remove photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {fieldErrors.image && (
                    <p className="text-xs text-red-500 font-sans text-center mt-3 relative z-30">{fieldErrors.image}</p>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: CHOOSE AMBIENT AUDIO FILE */}
              {/* ========================================================================= */}
              {step === 2 && (
                <div className="w-full flex flex-col items-center justify-center my-auto">
                  {!hasAudio ? (
                    <div
                      onClick={() => audioInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleAudioSelect(e.dataTransfer.files[0]);
                      }}
                      className="w-full max-w-xl p-10 sm:p-14 flex flex-col items-center justify-center gap-6 cursor-pointer text-center group"
                    >
                      {/* Music Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Music size={28} className="stroke-[1.75]" />
                      </div>

                      {/* Browse Audio File Button */}
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audioInputRef.current?.click();
                          }}
                          className="px-6 py-2.5 rounded-full bg-[var(--line)]/70 hover:bg-[var(--line)] text-[var(--ink)] text-xs font-sans font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Music size={14} />
                          <span>Browse Audio File</span>
                        </button>
                      </div>

                      {/* Supported Files Info */}
                      <p className="text-[11px] text-[var(--ink-soft)] font-sans -mt-2">
                        Supported audio formats: MP3, WAV, M4A, OGG or AAC audio tracks.
                      </p>

                      {/* Skip Audio Button at the Last Row */}
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStep(3);
                          }}
                          className="px-4 py-1.5 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40 transition-all cursor-pointer"
                        >
                          Skip Audio
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-xl sm:max-w-2xl mx-auto my-auto">
                      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-7 sm:p-9 space-y-6 shadow-sm">
                        {/* Audio File Header */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Music size={22} className="stroke-[1.75]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-sans font-semibold text-[var(--ink)] truncate">
                                {audioFile ? audioFile.name : (existingAudioUrl ? "Ambient Sound Track" : "Audio Track")}
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                                Audio track ready
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => audioInputRef.current?.click()}
                              className="px-3.5 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)]/50 text-[var(--ink)] text-xs font-sans font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <Upload size={13} />
                              <span>Replace</span>
                            </button>
                            <button
                              type="button"
                              onClick={removeAudio}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 border border-[var(--line)] transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Remove audio"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Audio Player Preview */}
                        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center gap-4">
                          <button
                            type="button"
                            onClick={togglePreviewAudio}
                            className="w-11 h-11 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer shrink-0 shadow-sm"
                            title={isPlayingAudio ? "Pause preview" : "Play preview"}
                          >
                            {isPlayingAudio ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
                          </button>

                          <div className="flex-1 space-y-2">
                            <div className="h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--blue)] transition-all duration-150 rounded-full"
                                style={{ width: `${audioProgress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-soft)]">
                              <span>{isPlayingAudio ? "Playing ambient preview" : "Click play to test audio"}</span>
                              <span>{hasAudio ? "Ready" : ""}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {fieldErrors.audio && (
                    <p className="text-xs text-red-500 font-sans text-center">{fieldErrors.audio}</p>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: ENTER SCENE DETAILS */}
              {/* ========================================================================= */}
              {step === 3 && (
                <div className="w-full max-w-xl sm:max-w-2xl mx-auto my-auto">
                  <div className="space-y-6 bg-[var(--card)] border border-[var(--line)] p-7 sm:p-9 rounded-2xl shadow-sm">
                    {/* Scene Title */}
                    <div className="space-y-2">
                      <label className="block text-xs font-sans font-semibold text-[var(--ink)] tracking-wide">
                        Scene Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (fieldErrors.title) {
                            setFieldErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.title;
                              return copy;
                            });
                          }
                        }}
                        placeholder="e.g. Kasol, Kashmir"
                        className={`w-full px-4 py-3 text-sm font-sans rounded-xl bg-[var(--bg)] border ${
                          fieldErrors.title ? "border-red-500" : "border-[var(--line)]"
                        } text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all`}
                      />
                      {fieldErrors.title && (
                        <p className="text-[11px] text-red-500 font-sans">{fieldErrors.title}</p>
                      )}
                    </div>

                    {/* Location / Viewpoint */}
                    <div className="space-y-2">
                      <label className="block text-xs font-sans font-semibold text-[var(--ink)] tracking-wide">
                        Location / Viewpoint <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            if (fieldErrors.location) {
                              setFieldErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.location;
                                return copy;
                              });
                            }
                          }}
                          placeholder="e.g. East West Zone, Kashmir"
                          className={`w-full pl-11 pr-4 py-3 text-sm font-sans rounded-xl bg-[var(--bg)] border ${
                            fieldErrors.location ? "border-red-500" : "border-[var(--line)]"
                          } text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all`}
                        />
                        <MapPin size={16} className="absolute left-3.5 top-3.5 text-[var(--ink-soft)]" />
                      </div>
                      {fieldErrors.location && (
                        <p className="text-[11px] text-red-500 font-sans">{fieldErrors.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: LIVE PREVIEW & SAVE WINDOW */}
              {/* ========================================================================= */}
              {step === 4 && (
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-0 py-2">
                  {/* Widescreen Live Canvas Preview */}
                  <div className="relative w-full h-[54vh] min-h-[320px] max-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-950 select-none flex flex-col justify-between p-4 sm:p-6">
                    {/* Fullscreen Backdrop Image */}
                    {hasImage && (
                      <img
                        src={imagePreview}
                        alt={title || "Scene"}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Ambient Gradients for Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30 pointer-events-none" />

                    {/* Top Status Bar: Audio Control Pill */}
                    <div className="relative z-10 flex items-center justify-between w-full pointer-events-auto">
                      {hasAudio ? (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-sans shadow-lg">
                          <button
                            type="button"
                            onClick={togglePreviewAudio}
                            className="w-6 h-6 rounded-full bg-white text-neutral-950 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs"
                            title={isPlayingAudio ? "Pause soundscape" : "Play soundscape"}
                          >
                            {isPlayingAudio ? <Pause size={11} /> : <Play size={11} className="ml-0.5" />}
                          </button>
                          <span className="text-[11px] font-medium font-sans">
                            {isPlayingAudio ? "Playing Soundscape" : "Test Soundscape"}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Bottom Metadata Card / Photographer Credit */}
                    <div className="relative z-10 pointer-events-auto">
                      <div className="bg-black/65 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white shadow-xl max-w-lg">
                        <div className="flex items-center gap-3.5">
                          {authorAvatar || profilePicture?.imageUrl ? (
                            <img
                              src={authorAvatar || profilePicture!.imageUrl}
                              alt={authorName}
                              className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-serif font-bold text-sm shrink-0 border border-white/20">
                              {(authorName || "A").charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="text-base sm:text-lg font-serif font-bold leading-snug truncate">
                              {title || "Untitled Scene"}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-white/80 font-sans">
                              <MapPin size={12} className="shrink-0 text-white/90" />
                              <span className="truncate">
                                {location
                                  ? `Clicked from ${location.replace(/^Clicked from\s*:?\s*/i, "")}`
                                  : "Clicked from Location Viewpoint"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pt-0.5 text-[11px] text-white/60 font-sans">
                              <span>Photo by {authorName || "Avinash Shajan"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
