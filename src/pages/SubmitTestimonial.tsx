import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Check, Copy, ArrowLeft, ArrowRight, Upload, Loader2, Sparkles, 
  MessageSquare, User, Building, Briefcase, Linkedin, ExternalLink, CheckCircle2,
  Image as ImageIcon, RefreshCw, Heart, Send, Eye, Shield, Crop
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ScrollReveal from "../components/layout/ScrollReveal";
import { testimonialService } from "../services/testimonialService";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "../utils/cloudinary";
import { utils_icons } from "../feeders/feeder";
import TestimonialCard from "../components/ui/TestimonialCard";
import { getLenis } from "../hooks/useLenis";
import { isAdminAuthenticated } from "../utils/auth";
import ImageCropModal from "../components/admin/ImageCropModal";

export default function SubmitTestimonial() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    company: "",
    quote: "",
    linkedInUrl: "",
    ImgUrl: "",
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isAdmin = isAdminAuthenticated();

  // Photo Crop Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");

  const publicUrl = testimonialService.getPublicSubmitUrl();

  const handleCopyLink = async () => {
    const success = await testimonialService.copyPublicSubmitUrl();
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 1. When user selects a file, open the interactive crop modal
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 12MB)
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage("Photo size must be under 12MB");
      return;
    }

    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = "";
  };

  // 2. Upload cropped file result
  const handleCropComplete = async (croppedFile: File) => {
    setIsUploadingPhoto(true);
    setErrorMessage("");

    try {
      const rawName = formData.name || "peer";
      const username = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "peer";
      const folder = `home/testimonial/${username}`;
      const uploadedUrl = await uploadImageToCloudinary(croppedFile, folder, `avatar_${Date.now()}`);

      setFormData((prev) => ({ ...prev, ImgUrl: uploadedUrl }));
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      setErrorMessage(err?.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    setIsSubmitting(true);
    try {
      const saved = await testimonialService.submitPublicTestimonial({
        name: formData.name.trim(),
        position: formData.position.trim(),
        company: formData.company.trim(),
        quote: formData.quote.trim(),
        ImgUrl: formData.ImgUrl.trim(),
        linkedInUrl: formData.linkedInUrl.trim(),
      });

      setSubmittedItem(saved);
      setIsSubmitted(true);
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorMessage(err?.message || "Failed to submit testimonial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      company: "",
      quote: "",
      linkedInUrl: "",
      ImgUrl: "",
    });
    setIsSubmitted(false);
    setSubmittedItem(null);
    setErrorMessage("");
  };

  return (
    <div id="page-submit-testimonial" className="min-h-screen pt-8 sm:pt-12 md:pt-14 pb-16 space-y-8 sm:space-y-10">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none whitespace-nowrap shadow-none active:scale-95 shrink-0"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span className="font-medium">Back to Portfolio</span>
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
          /* --- SUCCESS STATE --- */
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full space-y-10 text-center pt-2 sm:pt-4"
          >
            {/* Celebration Icon & Header */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-none animate-bounce-short">
                <CheckCircle2 size={38} strokeWidth={2.2} className="sm:w-10 sm:h-10" />
              </div>

              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-hero font-bold tracking-tight text-[var(--ink)] leading-tight">
                  Thank you, {submittedItem?.name || "Friend"}!
                </h1>
                <p className="text-sm sm:text-base text-[var(--ink-soft)] max-w-lg mx-auto leading-relaxed">
                  Your recommendation has been submitted and added to Avinash's portfolio. Your feedback and endorsement are deeply appreciated!
                </p>
              </div>
            </div>

            {/* Submitted Card Preview - Full Width matching Home Page */}
            <div className="w-full text-left space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                  Live Preview of Your Testimonial
                </p>
                <span className="text-[11px] font-sans text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Active on portfolio
                </span>
              </div>
              <div className="w-full">
                <TestimonialCard
                  photo={submittedItem?.ImgUrl || ""}
                  name={submittedItem?.name || formData.name}
                  role={submittedItem?.position || formData.position}
                  company={submittedItem?.company || formData.company}
                  linkedinUrl={submittedItem?.linkedInUrl || formData.linkedInUrl}
                  quote={submittedItem?.quote || formData.quote}
                />
              </div>
            </div>

            {/* Next Action Button */}
            <div className="flex items-center justify-center pt-2">
              <Link
                to="/#testimonials"
                className="px-6 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all shadow-none flex items-center gap-2 group cursor-pointer active:scale-95"
              >
                <span>View on Portfolio</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* --- SUBMISSION FORM --- */
          <motion.div
            key="form-screen"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 sm:space-y-10"
          >
            {/* Header Section */}
            <div className="text-left space-y-3 sm:space-y-4 max-w-5xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-hero font-bold tracking-tight text-[var(--ink)] leading-[1.12]">
                I&apos;d love to hear <span className="text-[var(--blue)]">your thoughts</span>
              </h1>
              <p className="text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed font-sans max-w-4xl">
                Your feedback and perspective are truly valuable to me. Whether we&apos;ve worked together, connected professionally, or simply had a conversation about design, I&apos;d love to hear your thoughts on my work, skills, and approach to problem-solving. Your words, suggestions, and recommendations will help me learn, grow, and become a better designer.
              </p>
            </div>

            {/* Redesigned Form Container - Minimal Writing Canvas like Blog Creation */}
            <div className="w-full bg-[var(--card)] rounded-3xl border border-[var(--line)] shadow-none p-6 sm:p-10 lg:p-12 space-y-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-8">
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-sans leading-relaxed animate-shake">
                    {errorMessage}
                  </div>
                )}

                {/* Minimal Writing Canvas: Recommendation Quote */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium text-[var(--ink-soft)]">
                      Your Recommendation / Story
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    placeholder="Write your recommendation here... What was it like collaborating with Avinash? Feel free to mention key projects, design impact, problem-solving, or craft..."
                    className="w-full p-4 sm:p-5 bg-neutral-50/70 dark:bg-zinc-900/60 border border-neutral-200/90 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 rounded-2xl text-base sm:text-lg font-sans text-[var(--ink)] placeholder:text-[var(--muted)]/50 outline-none! focus:bg-[var(--card)] dark:focus:bg-zinc-900 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all resize-none leading-relaxed min-h-[160px]"
                  />
                </div>

                {/* Subtle Divider */}
                <div className="border-t border-[var(--line)]/60 pt-6" />

                {/* Author Metadata Strip */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium text-[var(--ink-soft)]">
                      About You
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your Full Name"
                        className="w-full px-4 py-3 bg-neutral-50/70 dark:bg-zinc-900/60 border border-neutral-200/90 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/55 outline-none! focus:bg-[var(--card)] dark:focus:bg-zinc-900 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="Role / Position"
                        className="w-full px-4 py-3 bg-neutral-50/70 dark:bg-zinc-900/60 border border-neutral-200/90 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/55 outline-none! focus:bg-[var(--card)] dark:focus:bg-zinc-900 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Company or Organization"
                        className="w-full px-4 py-3 bg-neutral-50/70 dark:bg-zinc-900/60 border border-neutral-200/90 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/55 outline-none! focus:bg-[var(--card)] dark:focus:bg-zinc-900 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={formData.linkedInUrl}
                        onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                        placeholder="LinkedIn Profile URL"
                        className="w-full px-4 py-3 bg-neutral-50/70 dark:bg-zinc-900/60 border border-neutral-200/90 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/55 outline-none! focus:bg-[var(--card)] dark:focus:bg-zinc-900 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Profile Photo Minimal Strip */}
                  <div className="pt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--bg)] border border-[var(--line)] shrink-0 flex items-center justify-center shadow-none">
                        {formData.ImgUrl ? (
                          <img
                            src={formData.ImgUrl}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-sm font-mono font-bold text-[var(--blue)]">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : "A"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-none disabled:opacity-50 active:scale-95"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-[var(--blue)]" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} className="text-[var(--blue)]" />
                              <span>{formData.ImgUrl ? "Change Photo" : "Upload Photo"}</span>
                            </>
                          )}
                        </button>

                        {formData.ImgUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setTempImageSrc(formData.ImgUrl);
                              setCropModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-none active:scale-95"
                            title="Crop & Adjust current photo"
                          >
                            <Crop size={12} className="text-[var(--blue)]" />
                            <span>Crop Photo</span>
                          </button>
                        )}

                        {formData.ImgUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, ImgUrl: "" })}
                            className="px-2 py-1 text-xs font-sans text-red-500 hover:text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}

                        {formData.ImgUrl && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-1">
                            ✓ Photo Attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="border-t border-[var(--line)]/60 pt-4 flex items-center justify-end gap-4">
                  <div className="w-full sm:w-auto flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploadingPhoto}
                      className="w-full sm:w-auto py-3 sm:py-2.5 px-6 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all cursor-pointer shadow-none flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Sharing...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Share Testimonial</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Crop Modal */}
      {cropModalOpen && tempImageSrc && (
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={tempImageSrc}
          onClose={() => {
            setCropModalOpen(false);
            setTempImageSrc("");
          }}
          onCropComplete={handleCropComplete}
          cropShape="round"
          aspect={1}
          title="Crop & Center Profile Photo"
        />
      )}
    </div>
  );
}
