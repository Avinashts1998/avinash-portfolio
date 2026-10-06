import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { X } from "reicon-react";
import Tag from "../ui/Tag";
import { dataStore } from "../../utils/dataStore";
import { useScrollLock } from "../../hooks/useScrollLock";

interface ShortDetailsModalProps {
  onClose: () => void;
  details: {
    projectName: string;
    onelineDescription: string;
    position: {
      role: string;
      keyContributions: string;
    };
    duration: {
      duration: string;
      startAndEnd: string;
    };
    createdDate?: string;
    createdAt?: string;
  };
}

export default function ShortDetailsModal({ onClose, details }: ShortDetailsModalProps) {
  const shouldReduceMotion = useReducedMotion();

  // Disable background scrolling and coordinate Lenis when modal is open
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

  // Split contributions if string or use array directly
  const contributionTags = Array.isArray(details.position.keyContributions)
    ? details.position.keyContributions
    : typeof details.position.keyContributions === "string" && details.position.keyContributions
    ? details.position.keyContributions.split(" • ")
    : [];

  // Find matching project from dataStore
  const matchingProject = dataStore.getProjects().find(
    (p) => p.title?.toLowerCase() === details.projectName?.toLowerCase()
  );
  const category = matchingProject?.category;

  // Resolve created date
  const getCreatedDate = () => {
    if (details.createdDate) return details.createdDate;
    if (details.createdAt) return details.createdAt;
    
    if (matchingProject) {
      const mp = matchingProject as any;
      if (mp.createdDate) return mp.createdDate;
      if (mp.month && mp.year) return `${mp.month} ${mp.year}`;
      if (mp.year) return mp.isNew ? `June ${mp.year}` : `November ${mp.year}`;
      if (mp.createdAt) {
        if (typeof mp.createdAt?.toDate === "function") {
          return mp.createdAt.toDate().toLocaleDateString("en-US", { month: "long", year: "numeric" });
        }
        if (typeof mp.createdAt === "string" || typeof mp.createdAt === "number") {
          const d = new Date(mp.createdAt);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          }
        }
      }
    }
    return "June 2026";
  };

  const createdDate = getCreatedDate();

  const modalElement = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Backdrop overlay */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.2 }}
        onClick={onClose}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px] cursor-default"
        id="short-details-backdrop"
      />

      {/* Modal card */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={transition}
        className="relative w-full max-w-[600px] bg-[var(--bg)] rounded-xl p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-[var(--line)] text-left z-10 overflow-hidden pointer-events-auto"
        id="short-details-card"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-[var(--ink-soft)] hover:bg-[var(--line)]/50 hover:text-[var(--ink)] transition-colors duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--blue)]/20"
          aria-label="Close modal"
          id="short-details-close-btn"
        >
          <X size={18} />
        </button>

        {/* Title & Subtitle */}
        <div className="space-y-3 pr-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl sm:text-3xl font-hero font-bold tracking-tight text-[var(--ink)] leading-tight">
              {details.projectName}
            </h2>
            {category && (
              <span className="text-[12px] font-mono tracking-wider text-[var(--muted)] font-medium">
                {category}
              </span>
            )}
          </div>
          <p className="text-[14px] leading-relaxed text-[var(--ink-soft)] font-geist font-medium tracking-tight">
            {details.onelineDescription}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[13px] font-mono font-medium text-[var(--muted)]">Role:</span>
            <span className="text-[14px] font-sans font-medium text-[var(--ink)]">
              {details.position.role}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 py-6 sm:py-8 my-6 sm:my-8 border-y border-[var(--line)]/50">
          <div className="flex flex-col">
            <span className="text-[14px] font-mono font-medium text-[var(--muted)]">
              Duration
            </span>
            <div className="mt-[5px] text-[15px] sm:text-[16px] font-sans font-normal text-[var(--ink)] leading-snug">
              {details.duration.duration}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-mono font-medium text-[var(--muted)]">
              Timeline
            </span>
            <div className="mt-[5px] text-[15px] sm:text-[16px] font-sans font-normal text-[var(--ink)] leading-snug">
              {details.duration.startAndEnd}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-mono font-medium text-[var(--muted)]">
              Created Date
            </span>
            <div className="mt-[5px] text-[15px] sm:text-[16px] font-sans font-normal text-[var(--ink)] leading-snug">
              {createdDate}
            </div>
          </div>
        </div>

        {/* Key Contributions */}
        <div className="space-y-4">
          <span className="text-[11px] font-mono font-medium text-[var(--muted)] block">
            Key Contributions
          </span>
          <div className="flex flex-wrap gap-2">
            {contributionTags.map((tag, i) => (
              <Tag
                key={i}
                variant="neutral"
                className="text-[11px] py-1 px-3"
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
