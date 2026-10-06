import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import ScrollReveal from "../layout/ScrollReveal";
import { communityBoardService, CommunityMark } from "../../services/communityBoardService";
import { ANIMATED_EMOJIS, getAnimatedEmojiUrl, getAnimatedEmoji } from "../../utils/animatedEmojis";
import { useScrollLock } from "../../hooks/useScrollLock";

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr).getTime();
  if (isNaN(date)) return "Recently";
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSec < 45) return "Just now";
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

interface CommunityBoardSectionProps {}

export const CommunityBoardSection: React.FC<CommunityBoardSectionProps> = () => {
  const [marks, setMarks] = useState<CommunityMark[]>(() => communityBoardService.getMarks());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("🤩");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafMoveRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    rectRef.current = e.currentTarget.getBoundingClientRect();
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "1";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    if (!board) return;
    if (!rectRef.current) {
      rectRef.current = board.getBoundingClientRect();
    }
    const rect = rectRef.current;
    const clientX = e.clientX;
    const clientY = e.clientY;

    cancelAnimationFrame(rafMoveRef.current);
    rafMoveRef.current = requestAnimationFrame(() => {
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      board.style.setProperty("--mouse-x", `${x}px`);
      board.style.setProperty("--mouse-y", `${y}px`);
    });
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    cancelAnimationFrame(rafMoveRef.current);
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
  };

  useEffect(() => {
    const onResize = () => {
      rectRef.current = null;
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafMoveRef.current);
    };
  }, []);

  useEffect(() => {
    const unsub = communityBoardService.initListener((updated) => {
      setMarks(updated);
    });
    return () => unsub();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Lock both Lenis and native background scrolling when modal is open
  useScrollLock(isModalOpen);

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEmoji || !userName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newMark = await communityBoardService.addMark(selectedEmoji, userName.trim());
      setRecentAddedId(newMark.id);
      setIsModalOpen(false);
      setUserName("");

      // Remove recent added celebration state after 4 seconds
      setTimeout(() => {
        setRecentAddedId(null);
      }, 4000);
    } catch (err) {
      console.error("Failed to post mark:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="about-community-board-section" className="relative z-10 pt-10 sm:pt-12 pb-8 sm:pb-10 scroll-mt-24 overflow-hidden">
      {/* Header with Eyebrow Chip and Headline */}
      <div className="mb-4 sm:mb-5">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:py-1.5 rounded-full bg-[#ebebeb] dark:bg-neutral-800 text-[var(--ink)] font-sans text-xs sm:text-[13px] font-medium shadow-sm shadow-black/[0.02] mb-2 sm:mb-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--blue)] shrink-0 animate-pulse" />
            <span>Community board</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <h2 className="pt-2 text-2xl sm:text-3xl md:text-4xl font-hero font-bold tracking-tight text-[var(--ink)] leading-[1.15]">
            Everyone who <span className="text-[var(--blue)]">stopped by</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.14}>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed max-w-xl">
            Leave your mark on the public board! Thank you for stopping by!
          </p>
        </ScrollReveal>
      </div>

      {/* Community Board Stage Container */}
      <ScrollReveal delay={0.2}>
        <div
          ref={boardRef}
          id="community-board-canvas"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="community-board-canvas relative w-full h-[290px] sm:h-[330px] md:h-[370px] lg:h-[380px] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#131411] border border-[#262820] shadow-none select-none text-white/[0.08]"
          style={{ touchAction: "pan-y" }}
        >
          {/* Subtle Ambient Radial Lighting in Center */}
          <div className="pointer-events-none absolute inset-0 bg-radial from-white/[0.04] via-transparent to-transparent z-0" />

          {/* High-Performance GPU CSS Dot Grid (Zero canvas CPU overhead, perfectly fluid scroll) */}
          <div
            className="pointer-events-none absolute inset-0 w-full h-full block z-0"
            style={{
              backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.12) 1.25px, transparent 1.25px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "14px 14px",
            }}
          />

          {/* Interactive Cursor Spotlight Glow */}
          <div
            ref={spotlightRef}
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 opacity-0"
            style={{
              background: "radial-gradient(180px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 255, 255, 0.08), transparent 75%)",
            }}
          />

          {/* Floating Emoji Marks */}
          {marks.map((mark) => {
            const isRecent = recentAddedId === mark.id;

            return (
              <div
                key={mark.id}
                className={`board-card absolute select-none ${
                  isRecent ? "z-40" : "z-10"
                }`}
                style={{
                  left: `${mark.x}%`,
                  top: `${mark.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="relative group flex flex-col items-center cursor-pointer">
                  {/* Minimal Subtle Ring Indicator for Recently Added Mark (4-Second Window) */}
                  {isRecent && (
                    <span className="absolute -inset-1.5 rounded-full border border-blue-400/50 animate-minimal-ring pointer-events-none" />
                  )}

                  {/* Emoji Element */}
                  <div
                    className={`relative transition-transform duration-200 ease-out ${
                      isRecent
                        ? "animate-minimal-breathe scale-110"
                        : "group-hover:scale-125"
                    }`}
                  >
                    <img
                      src={getAnimatedEmojiUrl(mark.emoji)}
                      alt={mark.emoji}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-[32px] md:h-[32px] object-contain pointer-events-none transition-transform duration-200"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Tooltip Card */}
                  <div
                    className={`absolute top-full mt-2 px-3 py-1.5 rounded-xl border text-white shadow-tooltip pointer-events-none whitespace-nowrap z-50 flex flex-col items-center justify-center min-w-[70px] transition-all duration-200 ease-out ${
                      isRecent
                        ? "opacity-100 scale-100 translate-y-0 bg-[#1d1f1a] border-white/30"
                        : "opacity-0 scale-90 -translate-y-1 bg-[#1d1f1a] border-white/20 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11.5px] sm:text-xs font-semibold text-[#f2f3ef] leading-tight tracking-tight">
                        {mark.name}
                      </span>
                      {isRecent && (
                        <span className="text-blue-400 text-[10px] font-medium">• you</span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-[#9a9d94] leading-tight mt-0.5 font-normal">
                      {isRecent ? "Just posted" : formatRelativeTime(mark.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bottom Center "Leave your mark +" Button */}
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              id="btn-leave-your-mark"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 font-sans font-medium text-xs sm:text-sm tracking-tight transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25"
            >
              <span>Leave your mark</span>
              <span className="text-base font-bold leading-none text-blue-200">+</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Leave Your Mark Modal (Rendered via Portal above Navbar & all UI) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <div
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto"
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsModalOpen(false)}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs cursor-pointer"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-[480px] bg-white dark:bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] rounded-[24px] shadow-modal p-6 sm:p-7 z-10 select-none my-auto"
                  onClick={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">
                        Leave your mark
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[var(--ink-soft)] mt-1">
                        Pick an emoji and enter your name.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-8 h-8 rounded-xl bg-[var(--line)]/50 hover:bg-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Animated 3D Emoji Grid (7 Columns x 4 Rows = 28 Emojis, No Scroll) */}
                  <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mb-5">
                    {ANIMATED_EMOJIS.slice(0, 28).map((item) => {
                      const isSelected = selectedEmoji === item.unicode || selectedEmoji === item.url || selectedEmoji === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedEmoji(item.unicode)}
                          title={item.name}
                          className={`h-11 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer select-none border relative ${
                            isSelected
                              ? "border-2 border-[var(--blue)] bg-[var(--blue-tint)] scale-105 shadow-xs z-10"
                              : "bg-[var(--bg)] hover:bg-[var(--line)]/50 border-[var(--line)] hover:border-[var(--muted)]/40 hover:scale-105"
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 object-contain pointer-events-none transition-transform duration-150"
                            loading="eager"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* PREVIEW Area (Clean layout with floating 3D emoji and name pill) */}
                  <div className="mb-4">
                    <span className="text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase font-semibold block mb-2">
                      PREVIEW
                    </span>
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                        <img
                          src={getAnimatedEmojiUrl(selectedEmoji)}
                          alt="Selected preview"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="px-3.5 py-1 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-sans font-medium tracking-tight shadow-xs">
                        {userName.trim() ? userName.trim() : "Your name"}
                      </div>
                    </div>
                  </div>

                  {/* Form Input and Post Button */}
                  <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your name or handle"
                      maxLength={35}
                      className="flex-1 bg-[var(--bg)] border border-[var(--line)] focus:border-blue-400 focus:ring-0 focus:outline-none rounded-xl px-4 py-2.5 sm:py-3 text-sm text-[var(--ink)] placeholder-[var(--muted)] outline-none transition-colors"
                    />

                    <button
                      type="submit"
                      disabled={!userName.trim() || isSubmitting}
                      className="px-5 py-2.5 sm:py-3 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white font-sans font-medium text-sm flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 cursor-pointer shadow-xs"
                    >
                      <span>{isSubmitting ? "Posting..." : "Post it"}</span>
                      <span>→</span>
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
};

export default CommunityBoardSection;
