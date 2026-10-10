import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { X, Check, Copy } from "reicon-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { social_icon_feeder } from "../../feeders/feeder";

interface ShareModalProps {
  onClose: () => void;
  project: {
    title: string;
    thumbnail: string;
    link: string;
  };
  type?: "project" | "blog" | "article";
}

export default function ShareModal({ onClose, project, type = "project" }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const shareUrl = project.link.startsWith("http")
    ? project.link
    : `${window.location.origin}${project.link}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy link: ", err);
        });
    }
  };

  const noun = type === "project" ? "project" : "article";
  // WhatsApp Share Link
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this ${noun}: ${project.title} - ${shareUrl}`)}`;
  
  // Pinterest Share Link
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(project.thumbnail)}&description=${encodeURIComponent(project.title)}`;
  
  // X (Twitter) Share Link
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${project.title}`)}`;
  
  // LinkedIn Share Link
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  // Block scrolling
  useScrollLock(true);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: shouldReduceMotion ? 1 : 0.95,
      y: shouldReduceMotion ? 0 : 15 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0 
    },
  };

  const transition = shouldReduceMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, damping: 25, stiffness: 350 };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const modalElement = (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 cursor-default"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px] cursor-default"
      />

      {/* Modal Dialog - Highly optimized compact size & layout */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={transition}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] bg-[var(--bg)] border border-[var(--line)] rounded-xl pt-9 pb-8 px-6 sm:px-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)] text-left z-10 overflow-hidden pointer-events-auto flex flex-col gap-5 cursor-auto"
      >
        {/* Close Button - Transparent background with hover effect like ShortDetailsModal */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[var(--ink-soft)] hover:bg-[var(--line)]/50 hover:text-[var(--ink)] transition-colors duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--blue)]/20 z-30 flex items-center justify-center"
        >
          <X size={16} />
        </button>

        {/* Top level: Project Thumbnail Cover - Decreased margin, image fully fits frame, instant loading */}
        {project.thumbnail && (
          <div className="w-full max-w-[300px] max-h-[190px] mx-auto rounded-lg bg-[var(--line)]/10 overflow-hidden flex items-center justify-center border border-[var(--line)] p-2 relative">
            <img
              src={project.thumbnail}
              alt={project.title}
              referrerPolicy="no-referrer"
              loading="eager"
              fetchPriority="high"
              className="w-full max-h-[170px] object-cover block rounded-md"
            />
          </div>
        )}

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-[17px] font-hero font-bold text-[var(--ink)] tracking-tight leading-tight mx-auto">
            Share this with your social Community
          </h2>
        </div>

        {/* Social Share Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on WhatsApp"
            className="transition-all duration-200 flex items-center justify-center transform hover:scale-110 p-1"
          >
            {social_icon_feeder?.whatsApp ? (
              <img
                src={social_icon_feeder.whatsApp}
                alt="WhatsApp"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-mono text-xs font-bold text-[#25D366]">WA</span>
            )}
          </a>

          {/* Pinterest */}
          <a
            href={pinterestUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Pinterest"
            className="transition-all duration-200 flex items-center justify-center transform hover:scale-110 p-1"
          >
            {social_icon_feeder?.pintrest ? (
              <img
                src={social_icon_feeder.pintrest}
                alt="Pinterest"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-mono text-xs font-bold text-[#E60023]">PIN</span>
            )}
          </a>

          {/* X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on X"
            className="transition-all duration-200 flex items-center justify-center transform hover:scale-110 p-1"
          >
            {social_icon_feeder?.x ? (
              <img
                src={social_icon_feeder.x}
                alt="X"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-mono text-xs font-bold text-[var(--ink)]">X</span>
            )}
          </a>

          {/* LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on LinkedIn"
            className="transition-all duration-200 flex items-center justify-center transform hover:scale-110 p-1"
          >
            {social_icon_feeder?.linkedIn ? (
              <img
                src={social_icon_feeder.linkedIn}
                alt="LinkedIn"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="font-mono text-xs font-bold text-[#0A66C2]">IN</span>
            )}
          </a>
        </div>

        {/* Copy Link Section */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="text-left pl-1">
            <span className="text-xs font-sans text-[var(--muted)]">
              Or copy link
            </span>
          </div>

          {/* Copy Link Field Group */}
          <div className="flex items-center gap-3 p-2 pl-4 pr-2 rounded-lg bg-[var(--line)]/15 border border-[var(--line)]/40 transition-all focus-within:border-[var(--muted)]/40">
            <span className="text-[13px] font-sans text-[var(--ink-soft)] select-all truncate flex-1 pr-2">
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`px-4.5 py-2 rounded-lg font-sans text-[12px] font-semibold tracking-wide flex items-center gap-1.5 transition-all duration-200 select-none cursor-pointer border ${
                copied
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white border-[var(--blue)]"
              }`}
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={3} className="shrink-0" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={11} strokeWidth={2.5} className="shrink-0" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
