import React from "react";
import { Calendar, User } from "lucide-react";
import { FieldNote } from "../../types/fieldNotes";

interface FieldNoteCardProps {
  note: FieldNote;
  onClick: () => void;
  onImageZoom?: (e: React.MouseEvent) => void;
}

export const FieldNoteCard: React.FC<FieldNoteCardProps> = ({
  note,
  onClick,
}) => {
  const isPhoto = note.type === "photo";
  const isDesign = note.type === "design";

  // Derive top-left badge label (prefer first tag, fallback to type)
  const badgeLabel =
    note.tags && note.tags.length > 0
      ? note.tags[0]
      : isPhoto
      ? "Photo"
      : isDesign
      ? "Design"
      : "Note";

  // Headline: prefer note.title if available, else note.content
  const rawTitle = note.title?.trim() || note.content?.trim() || "Field Note";
  // Reduce length for the preview card headline
  const displayTitle = rawTitle.length > 38 ? `${rawTitle.slice(0, 36).trim()}...` : rawTitle;

  return (
    <article
      id={`field-note-${note.id}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col bg-transparent border-0 shadow-none cursor-pointer select-none transition-transform duration-200"
    >
      {/* 1. Thumbnail Container with Top-Left Category Badge */}
      <div className="w-full">
        <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[4px] bg-neutral-100 dark:bg-neutral-800">
          {note.imageUrl ? (
            <img
              src={note.imageUrl}
              alt={rawTitle}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-100 to-neutral-200/80 dark:from-zinc-900 dark:to-zinc-800 text-[var(--ink)]">
              <span className="font-serif italic text-sm sm:text-base text-center line-clamp-3 leading-snug px-3 text-[var(--ink)]/80">
                "{note.content}"
              </span>
            </div>
          )}

          {/* Top-Left Category Badge (flush with top-left corner per reference image) */}
          <div className="absolute top-0 left-0 z-10">
            <span className="inline-block px-3.5 py-1.5 bg-white/95 dark:bg-white text-neutral-900 text-[11.5px] sm:text-xs font-sans font-medium tracking-normal select-none shadow-xs">
              {badgeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Text & Meta Information (Centered matching reference screenshot) */}
      <div className="pt-4 sm:pt-4.5 flex flex-col items-center text-center space-y-2 w-full">
        {/* Headline: Serif Bold, Centered, Reduced length */}
        <h3
          className="font-serif font-bold text-base sm:text-[17px] text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors leading-[1.3] truncate max-w-[85%] sm:max-w-[260px] mx-auto text-center px-1"
          title={rawTitle}
        >
          {displayTitle}
        </h3>

        {/* Meta Row: Centered Author & Date */}
        <div className="flex items-center justify-center gap-3 text-[11px] sm:text-[12px] font-sans text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <User size={12} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
            <span>Avinash Shajan</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Calendar size={12} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
            <span>{note.date}</span>
          </span>
        </div>
      </div>
    </article>
  );
};
