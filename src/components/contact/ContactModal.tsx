import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { social_icon_feeder } from "../../feeders/feeder";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Lock background scroll when open
  useScrollLock(isOpen);

  // Handle ESC key and reset states when closing
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setErrorMessage(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanPhone = formData.phone.trim();
    const cleanMessage = formData.message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setErrorMessage("Please fill in your name, email address, and message.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: cleanMessage,
        }),
      });

      let resData: any = null;
      try {
        resData = await response.json();
      } catch {
        resData = null;
      }

      if (!response.ok || (resData && resData.success === false)) {
        throw new Error(
          resData?.error ||
            "Unable to deliver your message right now. Please try again or reach out directly on WhatsApp or Email."
        );
      }

      // Safe local backup
      try {
        const existing = JSON.parse(localStorage.getItem("portfolio_contact_messages") || "[]");
        const newEntry = {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: cleanMessage,
          id: resData?.id || `msg_${Date.now()}`,
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem("portfolio_contact_messages", JSON.stringify([newEntry, ...existing]));
      } catch (storageErr) {
        console.warn("Storage backup notice:", storageErr);
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to send your message. Please reach out directly on WhatsApp or Email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="get-in-touch-modal-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/70 dark:bg-black/85 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container: div 2 (Selected element target) */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative w-full max-w-[980px] h-auto max-h-[92vh] sm:max-h-[88vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-[var(--bg)] text-[var(--ink)] rounded-3xl shadow-[0_32px_96px_-12px_rgba(0,0,0,0.32),0_0_0_1px_rgba(255,255,255,0.06)] border border-[var(--line)] z-10 flex flex-col my-auto transition-colors"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
              aria-label="Close contact modal"
            >
              <X size={14} strokeWidth={2.2} />
            </button>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-0">
              
              {/* LEFT COLUMN: Colorful Animated Backdrop, Headline & Bottom-Left Round Channels */}
              <div className="lg:col-span-5 min-h-[250px] lg:min-h-full p-6 sm:p-8 md:p-9 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/15 contact-colorful-bg text-white relative overflow-hidden">
                
                {/* Animated Colorful Ambient Mesh Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                  <div className="contact-blob-a absolute -top-20 -left-16 w-72 h-72 rounded-full bg-rose-500/55 blur-3xl mix-blend-screen" />
                  <div className="contact-blob-b absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-cyan-400/45 blur-3xl mix-blend-screen" />
                  <div className="contact-blob-c absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-amber-400/40 blur-3xl mix-blend-screen" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" />
                </div>

                {/* Top Headline */}
                <div className="relative z-10">
                  <h2
                    id="contact-modal-title"
                    className="text-2xl sm:text-3xl font-hero font-bold text-white tracking-tight leading-[1.18] drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)] max-w-[16ch]"
                  >
                    Let's build something thoughtful.
                  </h2>
                </div>

                {/* Bottom-Left Aligned Round Social Channels */}
                <div className="relative z-10 mt-10 flex flex-col items-start gap-3">
                  <span className="text-xs font-sans font-medium text-white/85 block">
                    Direct Messaging & Profiles
                  </span>

                  <div className="flex items-center justify-start gap-3">
                    {/* WhatsApp Direct */}
                    <a
                      href="https://wa.me/917559082108"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
                      aria-label="WhatsApp"
                      className="w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-white/60 shadow-[0_6px_18px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 shrink-0"
                    >
                      <img
                        src={social_icon_feeder.whatsApp}
                        alt="WhatsApp"
                        className="w-5 h-5 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>

                    {/* LinkedIn Direct */}
                    <a
                      href="https://www.linkedin.com/in/avinash-shajan-169b631aa/"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn"
                      aria-label="LinkedIn"
                      className="w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-white/60 shadow-[0_6px_18px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 shrink-0"
                    >
                      <img
                        src={social_icon_feeder.linkedIn}
                        alt="LinkedIn"
                        className="w-5 h-5 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>

                    {/* X (Twitter) Direct */}
                    <a
                      href="https://x.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="X / Twitter"
                      aria-label="X / Twitter"
                      className="w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-white/60 shadow-[0_6px_18px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 shrink-0"
                    >
                      <img
                        src={social_icon_feeder.x}
                        alt="X"
                        className="w-5 h-5 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>

                    {/* Gmail Direct */}
                    <a
                      href="mailto:avinashts1122@gmail.com"
                      title="Mail App"
                      aria-label="Mail App"
                      className="w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-white/60 shadow-[0_6px_18px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 shrink-0"
                    >
                      <img
                        src={social_icon_feeder.gmail}
                        alt="Gmail"
                        className="w-5 h-5 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Architectural Correspondence Form */}
              <div className="lg:col-span-7 p-6 sm:p-9 md:p-10 flex flex-col justify-between relative bg-[var(--bg)]">
                {isSubmitted ? (
                  /* Bespoke Editorial Dispatch Confirmation */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-start justify-center text-left py-8 sm:py-12 my-auto space-y-6 max-w-md"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-violet-600 to-teal-500 p-[1.5px] shadow-[0_10px_28px_-6px_rgba(37,99,235,0.45)]">
                      <div className="w-full h-full rounded-full bg-[var(--bg)] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Check size={24} strokeWidth={2.5} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-[26px] font-sans font-semibold text-[var(--ink)] tracking-tight leading-tight">
                        Note dispatched.
                      </h3>
                      <p className="text-sm font-sans text-[var(--ink-soft)] leading-relaxed">
                        Thank you for reaching out — your message landed directly in Avinash's inbox.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="px-5 py-2.5 rounded-full border border-[var(--line)] hover:bg-neutral-100 dark:hover:bg-zinc-800/80 text-xs sm:text-[13px] font-sans font-medium text-[var(--ink)] transition-colors cursor-pointer active:scale-95"
                      >
                        Write another note
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-xs sm:text-[13px] font-sans font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Architectural Indexed Form */
                  <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full space-y-6">
                    
                    {/* Editorial Title */}
                    <div className="pr-10">
                      <h3 className="text-xl sm:text-[22px] font-sans font-semibold text-[var(--ink)] tracking-tight">
                        Write a note
                      </h3>
                    </div>

                    {/* Error Banner if any */}
                    {errorMessage && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-sans">
                        {errorMessage}
                      </div>
                    )}

                    {/* Indexed Correspondence Fields */}
                    <div className="space-y-5">
                      {/* 01 — Name Field */}
                      <div className="group relative">
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="contact-name"
                            className="flex items-center gap-2 text-xs font-sans font-medium text-[var(--ink-soft)] group-focus-within:text-[var(--ink)] transition-colors"
                          >
                            <span className="font-mono text-[10px] tabular-nums text-[var(--muted)] group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors">
                              01
                            </span>
                            <span>
                              Your Name <span className="text-rose-500">*</span>
                            </span>
                          </label>
                          {formData.name.trim().length > 0 && (
                            <Check size={12} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="relative border-b border-[var(--line)]">
                          <input
                            id="contact-name"
                            type="text"
                            name="name"
                            required
                            placeholder="Alex Morgan"
                            value={formData.name}
                            onChange={handleChange}
                            className="no-focus-outline w-full py-2 text-[15px] font-sans bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/60"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-0 right-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-blue-600 via-violet-500 to-teal-500 origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          />
                        </div>
                      </div>

                      {/* 02 Email & 03 Phone Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        {/* 02 — Email Field */}
                        <div className="group relative">
                          <div className="flex items-center justify-between mb-1">
                            <label
                              htmlFor="contact-email"
                              className="flex items-center gap-2 text-xs font-sans font-medium text-[var(--ink-soft)] group-focus-within:text-[var(--ink)] transition-colors"
                            >
                              <span className="font-mono text-[10px] tabular-nums text-[var(--muted)] group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors">
                                02
                              </span>
                              <span>
                                Email Address <span className="text-rose-500">*</span>
                              </span>
                            </label>
                            {formData.email.trim().includes("@") && (
                              <Check size={12} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <div className="relative border-b border-[var(--line)]">
                            <input
                              id="contact-email"
                              type="email"
                              name="email"
                              required
                              placeholder="name@company.com"
                              value={formData.email}
                              onChange={handleChange}
                              className="no-focus-outline w-full py-2 text-[15px] font-sans bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/60"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-0 right-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-blue-600 via-violet-500 to-teal-500 origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            />
                          </div>
                        </div>

                        {/* 03 — Phone Field (Optional) */}
                        <div className="group relative">
                          <div className="flex items-center justify-between mb-1">
                            <label
                              htmlFor="contact-phone"
                              className="flex items-center gap-2 text-xs font-sans font-medium text-[var(--ink-soft)] group-focus-within:text-[var(--ink)] transition-colors"
                            >
                              <span className="font-mono text-[10px] tabular-nums text-[var(--muted)] group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors">
                                03
                              </span>
                              <span>
                                Phone <span className="text-[11px] text-[var(--muted)] font-normal">(Optional)</span>
                              </span>
                            </label>
                            {formData.phone.trim().length > 0 && (
                              <Check size={12} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <div className="relative border-b border-[var(--line)]">
                            <input
                              id="contact-phone"
                              type="tel"
                              name="phone"
                              placeholder="+1 (555) 000-0000"
                              value={formData.phone}
                              onChange={handleChange}
                              className="no-focus-outline w-full py-2 text-[15px] font-sans bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/60"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-0 right-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-blue-600 via-violet-500 to-teal-500 origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 04 — Message Canvas */}
                      <div className="group relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor="contact-message"
                            className="flex items-center gap-2 text-xs font-sans font-medium text-[var(--ink-soft)] group-focus-within:text-[var(--ink)] transition-colors"
                          >
                            <span className="font-mono text-[10px] tabular-nums text-[var(--muted)] group-focus-within:text-blue-600 dark:group-focus-within:text-sky-400 transition-colors">
                              04
                            </span>
                            <span>
                              Message <span className="text-rose-500">*</span>
                            </span>
                          </label>
                          <span className="text-[10px] font-mono tabular-nums text-[var(--muted)]">
                            {formData.message.length} chars
                          </span>
                        </div>
                        <div className="relative rounded-2xl bg-neutral-50/85 dark:bg-zinc-900/55 border border-[var(--line)] group-focus-within:border-blue-500/40 dark:group-focus-within:border-sky-400/40 transition-colors overflow-hidden">
                          <textarea
                            id="contact-message"
                            name="message"
                            required
                            rows={3}
                            placeholder="Share what you're building, a role, or an idea..."
                            value={formData.message}
                            onChange={handleChange}
                            className="no-focus-outline w-full px-4 py-3 text-[14.5px] leading-relaxed font-sans bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/60 resize-none"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] bg-gradient-to-r from-blue-600 via-violet-500 to-teal-500 origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative overflow-hidden w-full sm:w-auto sm:self-end pl-[20px] pr-[24px] py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-[13.5px] font-sans font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.07)] active:scale-98"
                    >
                      {/* Expanding Circle Layer originating from the left dot position */}
                      <span
                        aria-hidden="true"
                        className="absolute left-[24px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white pointer-events-none transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[65] group-hover:duration-[800ms] group-hover:ease-[cubic-bezier(0.35,0.05,0.2,1)] will-change-transform"
                      />

                      {/* Content layer */}
                      <div className="relative z-10 flex items-center gap-2 text-white transition-colors duration-400 group-hover:text-[var(--blue)] group-hover:delay-100">
                        <span className="w-3 h-3 rounded-full opacity-0 shrink-0 pointer-events-none" aria-hidden="true" />
                        <span className="whitespace-nowrap transition-transform duration-400 ease-[cubic-bezier(0.35,0.05,0.2,1)] group-hover:-translate-x-3.5 flex items-center gap-1.5">
                          {isSubmitting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Sending note...</span>
                            </>
                          ) : (
                            <span>Send Message</span>
                          )}
                        </span>
                      </div>

                      {/* Bolder Arrow positioned absolutely on the right */}
                      {!isSubmitting && (
                        <span
                          aria-hidden="true"
                          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-[var(--blue)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:delay-250"
                        >
                          <ArrowRight size={14} strokeWidth={2.8} className="shrink-0" />
                        </span>
                      )}
                    </button>

                  </form>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
