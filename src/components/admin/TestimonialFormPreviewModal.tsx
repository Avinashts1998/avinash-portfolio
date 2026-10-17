import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, Sparkles, Send, Upload, Loader2, Check, User } from "lucide-react";
import { testimonialService } from "../../services/testimonialService";
import { uploadImageToCloudinary } from "../../utils/cloudinary";
import { Testimonial } from "../../utils/dataStore";

interface TestimonialFormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonial?: Partial<Testimonial> | null;
  onSaved?: (saved: Testimonial) => void;
}

export default function TestimonialFormPreviewModal({
  isOpen,
  onClose,
  testimonial,
  onSaved,
}: TestimonialFormPreviewModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    position: "",
    company: "",
    linkedInUrl: "",
    ImgUrl: "",
    quote: "",
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = Boolean(testimonial?.id && (testimonial.name || testimonial.quote));

  // Sync form data when modal opens or testimonial changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      if (testimonial) {
        setFormData({
          name: testimonial.name || "",
          position: testimonial.position || "",
          company: testimonial.company || "",
          linkedInUrl: testimonial.linkedInUrl || "",
          ImgUrl: testimonial.ImgUrl || "",
          quote: testimonial.quote || "",
        });
      } else {
        setFormData({
          name: "",
          position: "",
          company: "",
          linkedInUrl: "",
          ImgUrl: "",
          quote: "",
        });
      }
    }
  }, [isOpen, testimonial]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Photo size must be under 10MB");
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage("");

    try {
      const rawName = formData.name || "peer";
      const username = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "peer";
      const folder = `home/testimonial/${username}`;
      const uploadedUrl = await uploadImageToCloudinary(file, folder);

      setFormData((prev) => ({ ...prev, ImgUrl: uploadedUrl }));
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      setErrorMessage(err?.message || "Failed to upload photo. You can enter an image URL directly instead.");
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Please enter the author's full name.");
      return;
    }
    if (!formData.position.trim()) {
      setErrorMessage("Please enter their role / position.");
      return;
    }
    if (!formData.company.trim()) {
      setErrorMessage("Please enter their company or organization.");
      return;
    }
    if (!formData.quote.trim() || formData.quote.trim().length < 15) {
      setErrorMessage("Please write a testimonial recommendation (at least 15 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemToSave: Testimonial = {
        id: testimonial?.id || `test_${Date.now()}`,
        name: formData.name.trim(),
        position: formData.position.trim(),
        company: formData.company.trim(),
        quote: formData.quote.trim(),
        ImgUrl: formData.ImgUrl.trim(),
        linkedInUrl: formData.linkedInUrl.trim(),
        status: "approved",
        createdAt: testimonial?.createdAt || new Date().toISOString(),
      };

      await testimonialService.saveTestimonial(itemToSave);
      setSuccessMessage(isEditing ? "Testimonial updated successfully!" : "Testimonial added successfully!");

      if (onSaved) {
        onSaved(itemToSave);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to save testimonial:", err);
      setErrorMessage(err?.message || "Failed to save testimonial. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      id="testimonial-form-modal-overlay"
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div 
        id="testimonial-form-modal"
        className="w-full max-w-3xl max-h-[92vh] bg-[var(--bg)] border border-[var(--line)] rounded-[28px] shadow-modal flex flex-col overflow-hidden animate-scale-up"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-[var(--card)] border-b border-[var(--line)] flex items-center justify-between gap-4 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--blue-tint)] text-[var(--blue)] flex items-center justify-center shrink-0 border border-[var(--blue)]/20">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-hero font-bold tracking-tight text-[var(--ink)] truncate">
                {isEditing ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <p className="text-[11px] text-[var(--ink-soft)] font-sans hidden sm:block">
                Add recommendations, client endorsements, and feedback to your portfolio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/submit-testimonial"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open the public submission page in a new browser tab"
            >
              <span>Public Page</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close window"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: The Primary Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 bg-[var(--bg)]">
          <form id="testimonial-add-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header / Intro banner */}
            <div className="text-center space-y-1 max-w-lg mx-auto pb-1">
              <h1 className="text-xl sm:text-2xl font-hero font-bold tracking-tight text-[var(--ink)]">
                Share your experience working with <span className="text-[var(--blue)]">Avinash</span>
              </h1>
              <p className="text-xs text-[var(--ink-soft)] font-sans leading-relaxed">
                Add real collaboration stories, reflections, or recommendations that showcase on your live website.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-sans flex items-center gap-2">
                <span className="font-semibold">Error:</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-sans flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Container: Minimal Writing Canvas */}
            <div className="bg-[var(--card)] rounded-3xl border border-[var(--line)] shadow-none p-5 sm:p-7 space-y-7">
              
              {/* Section 1: The Recommendation Quote */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-[var(--ink-soft)]">
                    Recommendation / Quote <span className="text-[var(--blue)]">*</span>
                  </span>
                  <span className="text-[11px] font-mono text-[var(--muted)]">
                    {formData.quote.length} characters
                  </span>
                </div>

                <textarea
                  rows={5}
                  required
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="Write the testimonial recommendation here... Mention key collaborations, design impact, systems thinking, or craft..."
                  className="w-full p-4 sm:p-5 bg-[var(--bg)]/50 border border-[var(--line)] rounded-2xl text-base sm:text-lg font-sans text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none no-focus-outline focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/25 transition-all resize-none leading-relaxed min-h-[140px] shadow-none"
                />

                {/* Helpful Quick Prompt Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold mr-1">
                    Inspirations:
                  </span>
                  {[
                    "Product Empathy",
                    "Frontend Craft",
                    "Design Systems",
                    "Speed & Execution",
                    "Leadership",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!formData.quote.includes(tag)) {
                          const separator = formData.quote.trim().length > 0 ? " " : "";
                          setFormData({
                            ...formData,
                            quote: `${formData.quote.trim()}${separator}He brought tremendous strength in ${tag.toLowerCase()} to the team.`,
                          });
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-[var(--bg)] hover:bg-[var(--blue-tint)] hover:text-[var(--blue)] border border-[var(--line)] hover:border-[var(--blue)]/30 text-[var(--ink-soft)] transition-all cursor-pointer shadow-none"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Divider */}
              <div className="border-t border-[var(--line)]/60" />

              {/* Section 2: Personal Details */}
              <div className="space-y-4">
                <span className="text-xs font-sans font-medium text-[var(--ink-soft)] block">
                  Author Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full Name *"
                      className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] transition-all shadow-none"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Role / Position *"
                      className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] transition-all shadow-none"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company or Organization *"
                      className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] transition-all shadow-none"
                    />
                  </div>

                  <div>
                    <input
                      type="url"
                      value={formData.linkedInUrl}
                      onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                      placeholder="LinkedIn Profile URL (optional)"
                      className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] transition-all shadow-none"
                    />
                  </div>
                </div>

                {/* Avatar / Photo Input with Live circular avatar thumbnail */}
                <div className="pt-2">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Live Avatar Preview */}
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
                          {formData.name ? formData.name.charAt(0).toUpperCase() : <User size={18} />}
                        </span>
                      )}
                    </div>

                    {/* Upload File Button + URL Input */}
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="px-3.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-none disabled:opacity-50 shrink-0 active:scale-95"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-[var(--blue)]" />
                            <span>Uploading Photo...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={13} className="text-[var(--blue)]" />
                            <span>{formData.ImgUrl ? "Change Photo" : "Upload Photo"}</span>
                          </>
                        )}
                      </button>

                      <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
                        <input
                          type="url"
                          value={formData.ImgUrl}
                          onChange={(e) => setFormData({ ...formData, ImgUrl: e.target.value })}
                          placeholder="Or paste photo URL..."
                          className="w-full px-3 py-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none focus:border-[var(--blue)] transition-all shadow-none"
                        />
                        {formData.ImgUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, ImgUrl: "" })}
                            className="px-2 py-1 text-xs font-sans text-red-500 hover:text-red-600 shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhoto}
                  className="w-full py-3 px-6 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-sm font-sans font-semibold flex items-center justify-center gap-2 shadow-none transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Testimonial...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>{isEditing ? "Update Testimonial" : "Save Testimonial"}</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[var(--ink-soft)] font-sans text-center">
                  This testimonial will be saved directly to your database and published on your portfolio.
                </p>
              </div>

            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[var(--card)] border-t border-[var(--line)] flex items-center justify-between gap-3 shrink-0 z-20">
          <div className="text-xs text-[var(--ink-soft)] font-sans">
            Ready to publish directly to your live portfolio.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="testimonial-add-form"
              disabled={isSubmitting || isUploadingPhoto}
              className="px-5 py-1.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Save")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
