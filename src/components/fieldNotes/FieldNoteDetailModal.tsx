import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles, MapPin } from "lucide-react";
import { FieldNote } from "../../types/fieldNotes";
import { useScrollLock } from "../../hooks/useScrollLock";

interface FieldNoteDetailModalProps {
  note: FieldNote | null;
  notesList?: FieldNote[];
  allNotes?: FieldNote[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: FieldNote) => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "85%" : direction < 0 ? "-85%" : 0,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
      opacity: { duration: 0.2, ease: "easeOut" },
      scale: { duration: 0.2, ease: "easeOut" },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-85%" : "85%",
    opacity: 0,
    scale: 0.96,
    transition: {
      x: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
      opacity: { duration: 0.18, ease: "easeIn" },
      scale: { duration: 0.18, ease: "easeIn" },
    },
  }),
};

const captionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 30 : direction < 0 ? -30 : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -30 : 30,
    opacity: 0,
    transition: {
      duration: 0.16,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const FieldNoteDetailModal: React.FC<FieldNoteDetailModalProps> = ({
  note,
  notesList,
  allNotes,
  isOpen,
  onClose,
  onSelectNote,
}) => {
  const activeList = notesList || allNotes || [];
  const currentIndex = activeList.length > 0 ? activeList.findIndex((n) => n.id === note?.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < activeList.length - 1;

  const [swipeDir, setSwipeDir] = useState<number>(0);

  const navigateNote = useCallback(
    (delta: number) => {
      const nextIndex = currentIndex + delta;
      if (nextIndex >= 0 && nextIndex < activeList.length) {
        setSwipeDir(delta);
        onSelectNote(activeList[nextIndex]);
      }
    },
    [currentIndex, activeList, onSelectNote]
  );

  const navigateRef = useRef(navigateNote);
  navigateRef.current = navigateNote;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Unified scroll lock preventing layout shifts and background scrolling
  useScrollLock(isOpen && Boolean(note));

  // Preload neighboring images for instant 60/120fps swiping without lag or hesitation
  useEffect(() => {
    if (!isOpen || currentIndex === -1 || activeList.length === 0) return;
    const preloadImage = (url?: string) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };
    if (currentIndex > 0) {
      preloadImage(activeList[currentIndex - 1]?.imageUrl);
    }
    if (currentIndex < activeList.length - 1) {
      preloadImage(activeList[currentIndex + 1]?.imageUrl);
    }
  }, [isOpen, currentIndex, activeList]);

  // Keydown listener decoupled from scroll locking
  useEffect(() => {
    if (!isOpen || !note) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      } else if (e.key === "ArrowLeft") {
        navigateRef.current(-1);
      } else if (e.key === "ArrowRight") {
        navigateRef.current(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, Boolean(note)]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && note && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 backdrop-blur-2xl overflow-hidden select-none touch-none overscroll-none"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          {/* Navigation Arrow Left */}
          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateNote(-1);
              }}
              className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer z-50 shadow-md hover:scale-105 active:scale-95"
              title="Previous note (Left Arrow)"
              aria-label="Previous note"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Navigation Arrow Right */}
          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateNote(1);
              }}
              className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer z-50 shadow-md hover:scale-105 active:scale-95"
              title="Next note (Right Arrow)"
              aria-label="Next note"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full bg-transparent border-0 shadow-none touch-none ${
              note.imageUrl
                ? "max-w-3xl lg:max-w-4xl h-[88vh] sm:h-[90vh] max-h-[820px] flex flex-col justify-between items-center p-2 sm:p-4"
                : "max-w-xl my-auto p-2 sm:p-4"
            }`}
          >
            {/* Image (Photo or Design) with Caption below and Close X at right edge */}
            {note.imageUrl ? (
              <div className="flex flex-col items-center justify-between w-full h-full select-none">
                {/* Image Display Area - Centered in available space, bounds image independently */}
                <div className="flex-1 w-full min-h-0 flex items-center justify-center relative select-none overflow-hidden">
                  <AnimatePresence initial={false} custom={swipeDir} mode="popLayout">
                    {/* Draggable & Animated Carousel Card */}
                    <motion.div
                      key={note.id}
                      custom={swipeDir}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      drag={activeList.length > 1 ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.25}
                      dragTransition={{ bounceStiffness: 550, bounceDamping: 35 }}
                      onDragEnd={(_e, info) => {
                        const swipeDistance = info.offset.x;
                        const swipeVelocity = info.velocity.x;
                        // Buttery smooth trigger: responsive flick or dragged past 40px
                        if (swipeDistance < -40 || swipeVelocity < -280) {
                          if (hasNext) navigateNote(1);
                        } else if (swipeDistance > 40 || swipeVelocity > 280) {
                          if (hasPrev) navigateNote(-1);
                        }
                      }}
                      style={{
                        touchAction: "pan-y",
                        willChange: "transform, opacity",
                      }}
                      className="relative flex items-center justify-center max-h-full max-w-full cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="relative inline-flex items-center justify-center max-h-full max-w-full w-fit h-fit">
                        <img
                          src={note.imageUrl}
                          alt={note.title || note.content || "Field Note"}
                          draggable={false}
                          className="max-h-[calc(88vh-130px)] sm:max-h-[calc(90vh-140px)] max-w-[92vw] sm:max-w-2xl lg:max-w-3xl object-contain block mx-auto rounded-xl sm:rounded-2xl pointer-events-none select-none transition-opacity duration-200 drop-shadow-2xl"
                        />

                        {/* Floating Close X right edge side of the image */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-40 inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-neutral-900/80 hover:bg-neutral-800 text-white backdrop-blur-md transition-all cursor-pointer shadow-md hover:scale-110 active:scale-95 pointer-events-auto"
                          title="Close (Esc)"
                          aria-label="Close note details"
                        >
                          <X size={17} strokeWidth={2.4} />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Caption & Position Dots Container - Anchored in ONE fixed place at the bottom */}
                <div className="w-full shrink-0 flex flex-col items-center justify-center pt-2 pb-1 select-none z-30">
                  <div className="w-full max-w-[480px] mx-auto text-center px-3 min-h-[44px] flex flex-col items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait" initial={false} custom={swipeDir}>
                      <motion.div
                        key={note.id}
                        custom={swipeDir}
                        variants={captionVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full"
                      >
                        {note.content && (
                          <p className="font-sans text-sm sm:text-base text-white/95 leading-relaxed font-normal">
                            {note.content}
                          </p>
                        )}
                        {(note.date || note.location) && (
                          <div className="flex items-center justify-center gap-2 mt-1 text-xs font-mono text-white/60">
                            {note.date && <time dateTime={note.date}>{note.date}</time>}
                            {note.date && note.location && <span>•</span>}
                            {note.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={11} className="opacity-75 shrink-0" />
                                <span>{note.location}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Position dots - Interactive & smoothly animated with spring curves */}
                  {activeList.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2 pointer-events-auto">
                      {activeList.map((n, idx) => {
                        const isActive = idx === currentIndex;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              if (idx !== currentIndex) {
                                setSwipeDir(idx > currentIndex ? 1 : -1);
                                onSelectNote(activeList[idx]);
                              }
                            }}
                            aria-label={`Go to note ${idx + 1}`}
                            className="p-1 cursor-pointer focus:outline-hidden"
                          >
                            <motion.span
                              animate={{
                                width: isActive ? 20 : 6,
                                backgroundColor: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
                                opacity: isActive ? 1 : 0.6,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 450,
                                damping: 30,
                              }}
                              className="h-1.5 rounded-full block"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Text-only note (without image) with smooth carousel swipe */
              <div className="relative w-full overflow-hidden">
                <AnimatePresence initial={false} custom={swipeDir} mode="popLayout">
                  <motion.div
                    key={note.id}
                    custom={swipeDir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag={activeList.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    dragTransition={{ bounceStiffness: 550, bounceDamping: 35 }}
                    onDragEnd={(_e, info) => {
                      const swipeDistance = info.offset.x;
                      const swipeVelocity = info.velocity.x;
                      if (swipeDistance < -40 || swipeVelocity < -280) {
                        if (hasNext) navigateNote(1);
                      } else if (swipeDistance > 40 || swipeVelocity > 280) {
                        if (hasPrev) navigateNote(-1);
                      }
                    }}
                    style={{
                      touchAction: "pan-y",
                      willChange: "transform, opacity",
                    }}
                    className="relative mx-auto w-full max-w-xl rounded-2xl p-5 sm:p-6 bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--line)] shadow-[0_10px_20px_rgba(0,0,0,0.14)] space-y-4 cursor-grab active:cursor-grabbing select-none"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono tracking-wider text-[var(--ink-soft)] uppercase">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[var(--blue)] font-medium">
                          <Sparkles size={13} />
                          <span>{note.type === "design" ? "Design Note" : "Thought"}</span>
                        </span>
                        <span>•</span>
                        <time dateTime={note.date}>{note.date}</time>
                        {note.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} className="opacity-70 shrink-0" />
                              <span>{note.location}</span>
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={onClose}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)]/50 text-[var(--ink)] backdrop-blur-md transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 pointer-events-auto"
                        title="Close (Esc)"
                        aria-label="Close note details"
                      >
                        <X size={15} strokeWidth={2.4} />
                      </button>
                    </div>

                    {note.title && (
                      <h2 className="font-hero font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight leading-snug">
                        {note.title}
                      </h2>
                    )}

                    <blockquote className="font-serif text-lg sm:text-xl text-[var(--ink)] leading-relaxed italic border-l-2 border-[var(--blue)] pl-4 sm:pl-5 py-1">
                      {note.content}
                    </blockquote>

                    {note.tags && note.tags.length > 0 && (
                      <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {note.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--ink-soft)] bg-neutral-100 dark:bg-zinc-800/80 border border-[var(--line)] shadow-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="text-[11px] font-mono text-[var(--ink-soft)]">
                          {currentIndex + 1} of {activeList.length}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
