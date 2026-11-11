import React, { useState } from "react";
import { Quote } from "lucide-react";
import { FieldNote } from "../../types/fieldNotes";

interface FieldNoteGalleryItemProps {
  note: FieldNote;
  onClick: () => void;
}

export const FieldNoteGalleryItem: React.FC<FieldNoteGalleryItemProps> = ({
  note,
  onClick,
}) => {
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const hasImage = Boolean(note.imageUrl && note.imageUrl.trim());
  const rawTitle = note.title?.trim() || note.content?.trim() || "Field Note";

  // Stable aspect ratio calculation: honors landscape, portrait, and square uploads without layout shift
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
      note.aspectRatio === "portrait"
    ) {
      return "portrait";
    }
    if (note.aspectRatio === "1/1" || note.aspectRatio === "square") {
      return "square";
    }
    return "portrait";
  }, [note.aspectRatio]);

  // Assign tailored aspect ratio classes based on photo orientation
  const aspectClass =
    aspectType === "landscape"
      ? "aspect-[4/3] sm:aspect-[16/10]"
      : aspectType === "square"
      ? "aspect-square"
      : "aspect-[3/4]";

  // Visual Image Gallery Item: pure clean visual with no headline, date, or location overlays.
  // Full details (headline, date, location, tags, content) are revealed in the detail modal on click.
  if (hasImage) {
    return (
      <article
        id={`mobile-gallery-note-${note.id}`}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`View note: ${rawTitle}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={`group relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-neutral-100 dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10 shadow-xs cursor-pointer select-none active:scale-[0.97]`}
      >
        {!isImgLoaded && (
          <div className="absolute inset-0 skeleton-box rounded-2xl z-10 pointer-events-none" />
        )}
        <img
          src={note.imageUrl}
          alt={rawTitle}
          loading="eager"
          decoding="async"
          draggable={false}
          onLoad={() => setIsImgLoaded(true)}
          className={`w-full h-full object-cover object-center group-hover:scale-105 pointer-events-none select-none transition-[opacity,transform] duration-300 ease-out ${
            isImgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </article>
    );
  }

  // Text / Thought Note Card: clean minimalist card without headline, date, or location.
  // Clicking opens the detail modal with all full info.
  return (
    <article
      id={`mobile-gallery-note-${note.id}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View thought: ${rawTitle}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden p-3.5 flex flex-col justify-center items-center text-center cursor-pointer select-none active:scale-[0.97] transition-all duration-200 border shadow-xs bg-[#FAF9F5] dark:bg-zinc-900 border-amber-900/10 dark:border-zinc-800 text-neutral-900 dark:text-zinc-100 ring-1 ring-black/5 dark:ring-white/5"
    >
      <Quote size={18} className="text-amber-600/70 dark:text-amber-400/70 mb-2 shrink-0" />
      <p className="font-serif italic text-xs leading-relaxed text-[var(--ink)] line-clamp-5">
        "{note.content}"
      </p>
    </article>
  );
};
