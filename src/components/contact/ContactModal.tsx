import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  Loader2,
  ArrowRight,
  Copy,
  CheckCheck,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { social_icon_feeder } from "../../feeders/feeder";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOPIC_PRESETS = [
  "Senior Product Design",
  "Design Leadership",
  "AI & Design Systems",
  "Advisory / Consulting",
  "General Inquiry",
];

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [selectedTopic, setSelectedTopic] = useState<string>("Senior Product Design");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
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
      setCopiedEmail(false);
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

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText("avinashts1122@gmail.com");
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2200);
    } catch (err) {
      console.warn("Clipboard copy not permitted:", err);
    }
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    // If the message is currently empty or just has a previous topic prefix, set a friendly starter
    if (!formData.message.trim() || formData.message.startsWith("Hi Avinash, regarding ")) {
      setFormData((prev) => ({
        ...prev,
        message: `Hi Avinash, regarding ${topic}: `,
      }));
    }
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

    // Contextual message including selected topic
    const messageWithTopic = selectedTopic
      ? `[Topic: ${selectedTopic}]\n\n${cleanMessage}`
      : cleanMessage;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message: messageWithTopic,
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
          topic: selectedTopic,
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
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
              aria-label="Close contact modal"
            >
              <X size={17} strokeWidth={2.2} />
            </button>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-0">
              
              {/* LEFT COLUMN: Profile, Story & Direct Communication Channels */}
              <div className="lg:col-span-5 p-6 sm:p-8 md:p-9 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--line)] bg-neutral-50/70 dark:bg-zinc-900/40 relative overflow-hidden">
                
                {/* Subtle Ambient Glow */}
                <div
                  className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[var(--blue)]/10 blur-3xl pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative z-10 space-y-6">
                  {/* Availability Status Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium tracking-wide">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Available for Opportunities</span>
                  </div>

                  {/* Headline */}
                  <div>
                    <h2
                      id="contact-modal-title"
                      className="text-2xl sm:text-3xl font-hero font-bold text-[var(--ink)] tracking-tight leading-[1.18]"
                    >
                      Let's build something thoughtful.
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-[13.5px] font-sans text-[var(--ink-soft)] leading-relaxed">
                      Open to senior product design roles, design leadership, and high-impact AI product teams.
                    </p>
                  </div>

                  {/* Direct Email Card with 1-Click Copy */}
                  <div className="rounded-2xl p-4 bg-[var(--card)] border border-[var(--line)] shadow-xs transition-all hover:border-[var(--blue)]/40 group">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={12} className="text-[var(--blue)]" />
                        <span>Direct Email</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Primary inbox
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <a
                        href="mailto:avinashts1122@gmail.com"
                        className="text-sm sm:text-[14.5px] font-mono font-medium text-[var(--ink)] hover:text-[var(--blue)] transition-colors truncate"
                        title="Open email client"
                      >
                        avinashts1122@gmail.com
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="shrink-0 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-sans font-medium flex items-center gap-1 bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] hover:bg-[var(--blue)] hover:text-white transition-all cursor-pointer active:scale-95"
                        title="Copy email to clipboard"
                        aria-label="Copy email address"
                      >
                        {copiedEmail ? (
                          <>
                            <CheckCheck size={13} className="text-emerald-500 group-hover:text-white" />
                            <span className="hidden sm:inline text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span className="hidden sm:inline text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Direct Social Channels */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] block">
                      Direct Messaging & Profiles
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      {/* WhatsApp Direct */}
                      <a
                        href="https://wa.me/917559082108"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800/80 border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] transition-all group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <img
                            src={social_icon_feeder.whatsApp}
                            alt="WhatsApp"
                            className="w-4 h-4 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <span className="block truncate">WhatsApp</span>
                        </div>
                        <ExternalLink size={11} className="text-[var(--ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>

                      {/* LinkedIn Direct */}
                      <a
                        href="https://www.linkedin.com/in/avinash-shajan-169b631aa/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800/80 border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] transition-all group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                          <img
                            src={social_icon_feeder.linkedIn}
                            alt="LinkedIn"
                            className="w-4 h-4 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <span className="block truncate">LinkedIn</span>
                        </div>
                        <ExternalLink size={11} className="text-[var(--ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>

                      {/* X (Twitter) Direct */}
                      <a
                        href="https://x.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800/80 border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] transition-all group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                          <img
                            src={social_icon_feeder.x}
                            alt="X"
                            className="w-4 h-4 object-contain dark:invert"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <span className="block truncate">X / Twitter</span>
                        </div>
                        <ExternalLink size={11} className="text-[var(--ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>

                      {/* Gmail Direct */}
                      <a
                        href="mailto:avinashts1122@gmail.com"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800/80 border border-[var(--line)] text-xs font-sans font-medium text-[var(--ink)] transition-all group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <img
                            src={social_icon_feeder.gmail}
                            alt="Gmail"
                            className="w-4 h-4 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <span className="block truncate">Mail App</span>
                        </div>
                        <ExternalLink size={11} className="text-[var(--ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Location & Timezone Footer */}
                <div className="pt-6 mt-6 border-t border-[var(--line)]/80 flex items-center justify-between text-[11px] font-mono text-[var(--ink-soft)]">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[var(--blue)] shrink-0" />
                    <span>Bengaluru, India</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="opacity-75 shrink-0" />
                    <span>IST (UTC+5:30)</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Dedicated Message Form */}
              <div className="lg:col-span-7 p-6 sm:p-8 md:p-9 flex flex-col justify-between">
                {isSubmitted ? (
                  /* Celebratory Success State */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center text-center py-10 sm:py-14 px-2 sm:px-6 my-auto space-y-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                      <Check size={32} strokeWidth={2.4} />
                    </div>

                    <div className="space-y-1.5 max-w-md">
                      <h3 className="text-xl sm:text-2xl font-hero font-bold text-[var(--ink)] tracking-tight">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-xs sm:text-sm font-sans text-[var(--ink-soft)] leading-relaxed">
                        Thank you for reaching out! Your message was delivered directly to Avinash's personal inbox. Expect a response within 24 to 48 hours.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs sm:text-[13px] font-sans font-medium text-[var(--ink)] transition-colors cursor-pointer active:scale-95"
                      >
                        Send another message
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-xs sm:text-[13px] font-sans font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Close Window
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Redesigned Clean Form */
                  <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full space-y-4">
                    
                    {/* Header with Form Title */}
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                      <div>
                        <h3 className="text-sm sm:text-base font-sans font-semibold text-[var(--ink)]">
                          Send a Message
                        </h3>
                        <p className="text-[11px] font-mono text-[var(--ink-soft)]">
                          Replies go directly to your provided email
                        </p>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={13} />
                        <span>Encrypted & Direct</span>
                      </span>
                    </div>

                    {/* Quick Topic Chips */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                        What would you like to discuss?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {TOPIC_PRESETS.map((topic) => {
                          const isActive = selectedTopic === topic;
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => handleTopicClick(topic)}
                              className={`px-3 py-1 rounded-full text-xs font-sans transition-all duration-150 cursor-pointer select-none ${
                                isActive
                                  ? "bg-[var(--blue)] text-white font-medium shadow-xs"
                                  : "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-200 dark:hover:bg-zinc-700"
                              }`}
                            >
                              {topic}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Error Banner if any */}
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-sans">
                        {errorMessage}
                      </div>
                    )}

                    {/* Inputs Area */}
                    <div className="space-y-3 pt-1">
                      {/* Name Field */}
                      <div className="space-y-1">
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-sans font-medium text-[var(--ink)]"
                        >
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          required
                          placeholder="e.g. Alex Morgan"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-[var(--line)] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                        />
                      </div>

                      {/* Email & Phone Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Email Field */}
                        <div className="space-y-1">
                          <label
                            htmlFor="contact-email"
                            className="block text-xs font-sans font-medium text-[var(--ink)]"
                          >
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            name="email"
                            required
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-[var(--line)] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                          />
                        </div>

                        {/* Phone Field (Optional) */}
                        <div className="space-y-1">
                          <label
                            htmlFor="contact-phone"
                            className="block text-xs font-sans font-medium text-[var(--ink)]"
                          >
                            Phone <span className="text-xs text-[var(--ink-soft)] font-normal">(Optional)</span>
                          </label>
                          <input
                            id="contact-phone"
                            type="tel"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-[var(--line)] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 transition-all"
                          />
                        </div>
                      </div>

                      {/* Message Field */}
                      <div className="space-y-1">
                        <label
                          htmlFor="contact-message"
                          className="block text-xs font-sans font-medium text-[var(--ink)]"
                        >
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          required
                          rows={3}
                          placeholder="Tell me about the role, product problem, or vision..."
                          value={formData.message}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-[var(--line)] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 resize-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--line)]">
                      <div className="text-[11px] font-mono text-[var(--ink-soft)] flex items-center gap-1.5 self-start sm:self-center">
                        <Sparkles size={12} className="text-[var(--blue)] shrink-0" />
                        <span>Typical response in &lt; 48 hours</span>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group relative overflow-hidden w-full sm:w-auto pl-[20px] pr-[24px] py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-[13.5px] font-sans font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.07)] active:scale-98"
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
