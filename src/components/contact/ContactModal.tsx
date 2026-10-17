import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Loader2 } from "lucide-react";
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
  const [submissionResult, setSubmissionResult] = useState<{
    name: string;
    email: string;
    sentLive: boolean;
    requiresSmtpSetup: boolean;
    previewUrl?: string;
  } | null>(null);
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
      setErrorMessage("Please fill in your name, valid email, and message.");
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
        throw new Error(resData?.error || "Unable to send your message right now. Please try again or reach out directly on WhatsApp.");
      }

      const result = resData;

      // Safe local backup (doesn't fail if private mode blocks localStorage)
      try {
        const existing = JSON.parse(localStorage.getItem("portfolio_contact_messages") || "[]");
        const newEntry = {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: cleanMessage,
          id: result?.id || `msg_${Date.now()}`,
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem("portfolio_contact_messages", JSON.stringify([newEntry, ...existing]));
      } catch (storageErr) {
        console.warn("Storage backup notice:", storageErr);
      }

      setSubmissionResult({
        name: cleanName,
        email: cleanEmail,
        sentLive: Boolean(result?.sentLive),
        requiresSmtpSetup: Boolean(result?.requiresSmtpSetup),
        previewUrl: result?.previewUrl,
      });
      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to send your message. Please try again or reach out on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="get-in-touch-modal-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-5 md:p-8"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Container - height expands so action button is completely visible */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative w-full max-w-[940px] h-auto min-h-0 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white dark:bg-[#12161c] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] border border-neutral-200/80 dark:border-neutral-800 p-3.5 sm:p-5 md:p-6 z-10 flex flex-col justify-between my-auto"
          >
            {/* Close Button on Desktop/Mobile Header */}
            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: "0px",
                marginTop: "-10px",
                marginBottom: "0px",
                marginRight: "-5px",
              }}
              className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 z-30 p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer -mt-[10px] -mr-[5px] ml-0 mb-0"
              aria-label="Close contact modal"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Two-Column Grid Frame matching user image */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-7 items-stretch my-auto">
              
              {/* LEFT COLUMN: Contact Information Card (Primary Blue) */}
              <div className="lg:col-span-5 relative rounded-xl bg-[var(--blue)] text-white p-4 sm:p-7 md:p-9 flex flex-col justify-end overflow-hidden min-h-0 sm:min-h-[240px] lg:min-h-[460px]">
                
                {/* Decorative Overlapping Circles in Bottom Right */}
                <div
                  className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-white/[0.08] pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/[0.12] pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute bottom-12 right-12 w-20 h-20 rounded-full bg-white/[0.06] pointer-events-none"
                  aria-hidden="true"
                />

                {/* Bottom: Header & Contact Icons */}
                <div className="relative z-10 mt-auto">
                  <h2
                    id="contact-modal-title"
                    className="text-[19px] sm:text-[22px] lg:text-[25px] font-sans font-bold text-white tracking-tight leading-[1.25]"
                  >
                    Let's connect<br className="hidden sm:inline" /> about what comes next
                  </h2>
                  <p className="text-neutral-200/90 text-[12.5px] sm:text-[13.5px] font-sans mt-1.5 sm:mt-3 font-normal leading-relaxed max-w-sm">
                    Open to senior product design roles, design leadership, and AI-first product teams. I respond within 48 hours.
                  </p>

                  {/* Social Circles (WhatsApp, LinkedIn, X, Gmail) */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 mt-3 sm:mt-6 lg:mt-8">
                    {/* WhatsApp */}
                    <a
                      href="https://wa.me/917559082108"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white flex items-center justify-center p-1.5 sm:p-2 transition-all duration-200 hover:scale-105 bg-white hover:bg-neutral-100"
                      aria-label="WhatsApp"
                      title="WhatsApp"
                    >
                      <img
                        src={social_icon_feeder.whatsApp}
                        alt="WhatsApp"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>

                    {/* LinkedIn */}
                    <a
                      href="https://www.linkedin.com/in/avinash-shajan-169b631aa/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white flex items-center justify-center p-1.5 sm:p-2 transition-all duration-200 hover:scale-105 bg-white hover:bg-neutral-100"
                      aria-label="LinkedIn"
                      title="LinkedIn"
                    >
                      <img
                        src={social_icon_feeder.linkedIn}
                        alt="LinkedIn"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>

                    {/* X (formerly Twitter) */}
                    <a
                      href="https://x.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white flex items-center justify-center p-1.5 sm:p-2 transition-all duration-200 hover:scale-105 bg-white hover:bg-neutral-100"
                      aria-label="X Profile"
                      title="X"
                    >
                      <img
                        src={social_icon_feeder.x}
                        alt="X"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>

                    {/* Gmail */}
                    <a
                      href="mailto:avinashts1122@gmail.com"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white flex items-center justify-center p-1.5 sm:p-2 transition-all duration-200 hover:scale-105 bg-white hover:bg-neutral-100"
                      aria-label="Gmail"
                      title="avinashts1122@gmail.com"
                    >
                      <img
                        src={social_icon_feeder.gmail}
                        alt="Gmail"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Minimalist Underline Form */}
              <div className="lg:col-span-7 p-3 sm:p-5 lg:p-7 flex flex-col justify-between relative">
                
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4 sm:px-6 my-auto"
                  >
                    {/* Animated Checkmark Badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 22,
                        delay: 0.08,
                      }}
                      className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-900/60 shadow-xs"
                    >
                      <Check size={30} strokeWidth={2.5} />
                    </motion.div>

                    {/* Heading */}
                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.18 }}
                      className="text-xl sm:text-2xl font-sans font-bold text-[var(--ink)] mb-3 tracking-tight"
                    >
                      Message Sent Successfully!
                    </motion.h3>

                    {/* Paragraph with user-specified copy */}
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.28 }}
                      className="text-sm sm:text-[14.5px] text-[var(--ink-soft)] font-sans max-w-md leading-relaxed mb-7"
                    >
                      Thank you for reaching out!
                      <span className="block mt-1">
                        Your message has been successfully sent to <strong className="text-[var(--ink)] font-semibold">Avinash, Product Designer</strong>.
                      </span>
                    </motion.p>

                    {/* Minimal button */}
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.38 }}
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-sm font-sans font-medium text-[var(--ink)] transition-colors cursor-pointer active:scale-98"
                    >
                      Send another message
                    </motion.button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col justify-between h-auto sm:h-full space-y-3 sm:space-y-4 pt-1">
                    {errorMessage && (
                      <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 font-sans">
                        {errorMessage}
                      </div>
                    )}
                    
                    {/* Input 1: Your Name */}
                    <div className="group relative">
                      <label htmlFor="contact-name" className="sr-only">
                        Your Name
                      </label>
                      <div className="relative">
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          required
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={handleChange}
                          className="no-focus-outline w-full bg-transparent py-2 sm:py-2.5 text-sm sm:text-[15px] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 transition-colors caret-[var(--blue)] border-0"
                          style={{ outline: "none", boxShadow: "none" }}
                        />
                        {/* Always visible base underline */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-300 dark:bg-neutral-600 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors pointer-events-none" />
                        {/* Animated primary focus indicator line */}
                        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--blue)] transition-all duration-300 ease-out group-focus-within:w-full pointer-events-none z-10" />
                      </div>
                    </div>

                    {/* Inputs 2 & 3: Email & Phone Number Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Email */}
                      <div className="group relative">
                        <label htmlFor="contact-email" className="sr-only">
                          Email
                        </label>
                        <div className="relative">
                          <input
                            id="contact-email"
                            type="email"
                            name="email"
                            required
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="no-focus-outline w-full bg-transparent py-2 sm:py-2.5 text-sm sm:text-[15px] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 transition-colors caret-[var(--blue)] border-0"
                            style={{ outline: "none", boxShadow: "none" }}
                          />
                          {/* Always visible base underline */}
                          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-300 dark:bg-neutral-600 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors pointer-events-none" />
                          {/* Animated primary focus indicator line */}
                          <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--blue)] transition-all duration-300 ease-out group-focus-within:w-full pointer-events-none z-10" />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="group relative">
                        <label htmlFor="contact-phone" className="sr-only">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            id="contact-phone"
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={handleChange}
                            className="no-focus-outline w-full bg-transparent py-2 sm:py-2.5 text-sm sm:text-[15px] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 transition-colors caret-[var(--blue)] border-0"
                            style={{ outline: "none", boxShadow: "none" }}
                          />
                          {/* Always visible base underline */}
                          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-300 dark:bg-neutral-600 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors pointer-events-none" />
                          {/* Animated primary focus indicator line */}
                          <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--blue)] transition-all duration-300 ease-out group-focus-within:w-full pointer-events-none z-10" />
                        </div>
                      </div>
                    </div>

                    {/* Input 4: Message */}
                    <div className="group relative">
                      <label htmlFor="contact-message" className="sr-only">
                        Message
                      </label>
                      <div className="relative">
                        <textarea
                          id="contact-message"
                          name="message"
                          required
                          rows={2}
                          placeholder="Message"
                          value={formData.message}
                          onChange={handleChange}
                          className="no-focus-outline w-full bg-transparent py-2 sm:py-2.5 text-sm sm:text-[15px] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 transition-colors resize-none caret-[var(--blue)] border-0"
                          style={{ outline: "none", boxShadow: "none" }}
                        />
                        {/* Always visible base underline */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-300 dark:bg-neutral-600 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-colors pointer-events-none" />
                        {/* Animated primary focus indicator line */}
                        <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--blue)] transition-all duration-300 ease-out group-focus-within:w-full pointer-events-none z-10" />
                      </div>
                    </div>

                    {/* Bottom Area: Action button */}
                    <div className="pt-2 sm:pt-2.5 flex justify-end">
                      
                      {/* Send Message Button (Primary Blue) */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative z-10 px-7 sm:px-9 py-2.5 sm:py-3.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-sm sm:text-[14.5px] font-sans font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Send Message</span>
                        )}
                      </button>

                    </div>

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
