import React, { useState } from "react";
import { Calendar, User, MapPin } from "lucide-react";
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


  const [isImgLoaded, setIsImgLoaded] = useState(false);

  // Headline: prefer note.title if available, else note.content
  const rawTitle = note.title?.trim() || note.content?.trim() || "Field Note";
  // Reduce length for the preview card headline
  const displayTitle = rawTitle.length > 38 ? `${rawTitle.slice(0, 36).trim()}...` : rawTitle;

  // Stable aspect ratio calculation: honors portrait, landscape, and square uploads without layout shift
  const aspectType: "portrait" | "landscape" | "square" = React.useMemo(() => {
    if (
      note.aspectRatio === "16/9" ||
      note.aspectRatio === "4/3" ||
      note.aspectRatio === "landscape"
    ) {
      return "landscape";
    }
    if (
      note.aspectRatio === "3/4" ||
      note.aspectRatio === "portrait" ||
      note.type === "photo"
    ) {
      return "portrait";
    }
    if (note.aspectRatio === "1/1" || note.aspectRatio === "square") {
      return "square";
    }
    return note.type === "photo" ? "portrait" : "landscape";
  }, [note.aspectRatio, note.type]);

  const aspectClass =
    aspectType === "portrait"
      ? "aspect-[4/5] sm:aspect-[3/4] max-h-[300px] sm:max-h-[330px] lg:max-h-[340px] xl:max-h-[360px]"
      : aspectType === "square"
      ? "aspect-square max-h-[260px] sm:max-h-[290px] lg:max-h-[310px] xl:max-h-[330px]"
      : "aspect-[16/11] max-h-[220px] sm:max-h-[240px] lg:max-h-[260px]";

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
      className="group relative flex flex-col bg-transparent border-0 shadow-none cursor-pointer select-none transition-transform duration-200 w-full max-w-[310px] mx-auto"
    >
      {/* 1. Thumbnail Container with Top-Left Category Badge */}
      <div className="w-full">
        <div className={`relative ${aspectClass} w-full overflow-hidden rounded-[8px] sm:rounded-[10px] bg-neutral-100 dark:bg-neutral-800 shadow-2xs`}>
          {note.imageUrl ? (
            <>
              {!isImgLoaded && (
                <div className="absolute inset-0 skeleton-box rounded-[8px] sm:rounded-[10px] z-10 pointer-events-none" />
              )}
              <img
                src={note.imageUrl}
                alt={rawTitle}
                loading="eager"
                decoding="async"
                draggable={false}
                onLoad={() => setIsImgLoaded(true)}
                className={`w-full h-full object-cover object-center transform transition-[opacity,transform] duration-500 ease-out group-hover:scale-105 pointer-events-none select-none ${
                  isImgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-100 to-neutral-200/80 dark:from-zinc-900 dark:to-zinc-800 text-[var(--ink)]">
              <span className="font-serif italic text-sm sm:text-base text-center line-clamp-3 leading-snug px-3 text-[var(--ink)]/80">
                "{note.content}"
              </span>
            </div>
          )}


        </div>
      </div>

      {/* 2. Text & Meta Information (Centered matching reference screenshot) */}
      <div className="pt-2.5 sm:pt-3 flex flex-col items-center text-center space-y-1 w-full">
        {/* Headline: Serif Bold, Centered */}
        <h3
          className="font-serif font-bold text-[14.5px] sm:text-[15.5px] lg:text-[16px] text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors leading-[1.3] truncate max-w-[90%] sm:max-w-[260px] mx-auto text-center px-1"
          title={rawTitle}
        >
          {displayTitle}
        </h3>

        {/* Meta Row: Centered Author, Date & Location (on right side of date) */}
        <div className="flex items-center justify-center flex-wrap gap-x-2.5 gap-y-0.5 text-[10.5px] sm:text-[11.5px] font-sans text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <User size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
            <span>Avinash Shajan</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Calendar size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
            <span>{note.date}</span>
          </span>

          {note.location && (
            <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
              <MapPin size={10.5} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
              <span>{note.location}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
