import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MapPin, Sparkles, Compass } from "lucide-react";
import { FieldNote } from "../../types/fieldNotes";

interface FieldNoteDetailModalProps {
  note: FieldNote | null;
  notesList?: FieldNote[];
  allNotes?: FieldNote[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: FieldNote) => void;
}

export const FieldNoteDetailModal: React.FC<FieldNoteDetailModalProps> = ({
  note,
  notesList,
  allNotes,
  isOpen,
  onClose,
  onSelectNote,
}) => {
  const activeList = notesList || allNotes || [];

  useEffect(() => {
    if (!isOpen || !note) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        navigateNote(-1);
      } else if (e.key === "ArrowRight") {
        navigateNote(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, note, activeList]);

  if (!isOpen || !note) return null;

  const currentIndex = activeList.length > 0 ? activeList.findIndex((n) => n.id === note.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < activeList.length - 1;

  const navigateNote = (delta: number) => {
    const nextIndex = currentIndex + delta;
    if (nextIndex >= 0 && nextIndex < activeList.length) {
      onSelectNote(activeList[nextIndex]);
    }
  };

  const isPhoto = note.type === "photo";
  const isText = note.type === "text";
  const isDesign = note.type === "design";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/75 backdrop-blur-md overflow-y-auto"
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
            className="fixed left-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer z-50"
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
            className="fixed right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer z-50"
            title="Next note (Right Arrow)"
            aria-label="Next note"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl lg:max-w-5xl bg-[var(--bg)] border border-[var(--line)] rounded-2xl sm:rounded-3xl shadow-modal overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--card)]/50 shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[var(--ink-soft)] uppercase">
              {isPhoto && (
                <span className="inline-flex items-center gap-1.5 text-[var(--blue)] font-medium">
                  <Compass size={13} />
                  <span>Photo Note</span>
                </span>
              )}
              {isText && (
                <span className="inline-flex items-center gap-1.5 text-[var(--blue)] font-medium">
                  <Sparkles size={13} />
                  <span>Thought</span>
                </span>
              )}
              {isDesign && (
                <span className="inline-flex items-center gap-1.5 text-[var(--blue)] font-medium">
                  <Sparkles size={13} />
                  <span>Design Note</span>
                </span>
              )}
              <span>•</span>
              <time dateTime={note.date}>{note.date}</time>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close note details"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Image (Photo or Design) */}
            {note.imageUrl && (
              <div className="w-full rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--line)]">
                <img
                  src={note.imageUrl}
                  alt={note.title || note.content}
                  className="w-full h-auto max-h-[580px] object-contain mx-auto"
                />
              </div>
            )}

            {/* Location (for photo) */}
            {note.location && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] border border-[var(--line)]">
                <MapPin size={12} className="text-[var(--blue)]" />
                <span>{note.location}</span>
              </div>
            )}

            {/* Title (for text or design) */}
            {note.title && (
              <h2 className="font-hero font-bold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight leading-snug">
                {note.title}
              </h2>
            )}

            {/* Body / Content */}
            {isText ? (
              <blockquote className="font-serif text-xl sm:text-2xl text-[var(--ink)] leading-relaxed italic border-l-2 border-[var(--blue)] pl-5 py-1">
                {note.content}
              </blockquote>
            ) : isPhoto ? (
              <p className="font-serif text-lg sm:text-xl text-[var(--ink)] leading-relaxed italic">
                {note.content}
              </p>
            ) : (
              <div className="font-sans text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed space-y-3">
                <p>{note.content}</p>
              </div>
            )}

            {/* Tags & Footer Metadata */}
            {note.tags && note.tags.length > 0 && (
              <div className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--ink-soft)] bg-neutral-100 dark:bg-zinc-800/80 border border-[var(--line)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-[var(--ink-soft)]">
                  {currentIndex + 1} of {notesList.length}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
