import React, { useState, useRef } from "react";
import {
  Play,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  RefreshCw,
  Film,
  Image as ImageIcon,
  Check,
  Star,
  Info,
} from "lucide-react";
import { isMediaVideo, isVideoFile, isSupportedMediaFile } from "../../utils/mediaUtils";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

export interface ThumbnailMediaItem {
  id: string;
  url: string;
  file?: File;
  isVideo: boolean;
  name?: string;
}

interface MediaThumbnailManagerProps {
  items: ThumbnailMediaItem[];
  onChange: (items: ThumbnailMediaItem[]) => void;
  onAddFiles?: (files: FileList | File[]) => void;
  availableGalleryMedia?: { url: string; file?: File; isVideo: boolean; title?: string }[];
  maxItems?: number;
  isUploading?: boolean;
  tileColor?: string;
  className?: string;
}

export default function MediaThumbnailManager({
  items,
  onChange,
  onAddFiles,
  availableGalleryMedia = [],
  maxItems = 5,
  isUploading = false,
  tileColor,
  className = "",
}: MediaThumbnailManagerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Safe active item index
  const safeActiveIndex = items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const activeItem = items[safeActiveIndex];

  // Handle direct file uploads from "+" button
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (onAddFiles) {
      onAddFiles(files);
    } else {
      // Default direct handling if no external handler
      const newItems: ThumbnailMediaItem[] = [...items];
      Array.from(files).forEach((file: File) => {
        if (newItems.length >= maxItems) return;
        if (!isSupportedMediaFile(file)) return;
        const isVideo = isVideoFile(file);
        const url = URL.createObjectURL(file);
        newItems.push({
          id: `thumb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          file,
          isVideo,
          name: file.name,
        });
      });
      onChange(newItems);
      setActiveIndex(newItems.length - 1);
    }

    if (e.target) e.target.value = "";
  };

  // Replace active item
  const handleReplaceActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeItem) return;
    const file = files[0];
    if (!isSupportedMediaFile(file)) return;

    const isVideo = isVideoFile(file);
    const url = URL.createObjectURL(file);

    const updated = [...items];
    updated[safeActiveIndex] = {
      ...updated[safeActiveIndex],
      url,
      file,
      isVideo,
      name: file.name,
    };
    onChange(updated);

    if (e.target) e.target.value = "";
  };

  // Remove an item
  const handleRemove = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (items.length <= 1) return; // Keep at least 1 item

    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
    if (safeActiveIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1));
    }
  };

  // Reorder left/right
  const handleMove = (index: number, direction: "left" | "right", e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;

    onChange(updated);
    if (safeActiveIndex === index) {
      setActiveIndex(target);
    } else if (safeActiveIndex === target) {
      setActiveIndex(index);
    }
  };

  // Set item as cover (move to position 0)
  const handleSetAsCover = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (index === 0) return;

    const targetItem = items[index];
    const remaining = items.filter((_, i) => i !== index);
    const updated = [targetItem, ...remaining];

    onChange(updated);
    setActiveIndex(0);
  };

  // Toggle gallery item into/out of thumbnail slots
  const handleToggleGalleryItem = (galleryItem: { url: string; file?: File; isVideo: boolean; title?: string }) => {
    const existingIndex = items.findIndex((i) => i.url === galleryItem.url);

    if (existingIndex >= 0) {
      if (items.length <= 1) return; // Must have at least 1
      handleRemove(existingIndex);
    } else {
      if (items.length >= maxItems) return; // Max reached
      const newItem: ThumbnailMediaItem = {
        id: `thumb-gal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: galleryItem.url,
        file: galleryItem.file,
        isVideo: galleryItem.isVideo,
        name: galleryItem.title,
      };
      const updated = [...items, newItem];
      onChange(updated);
      setActiveIndex(updated.length - 1);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg,image/gif"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg,image/gif"
        onChange={handleReplaceActive}
        className="hidden"
      />

      {/* Top Header & Slot Counter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-hero font-bold text-[var(--ink)] tracking-tight">
            Project Thumbnail Media
          </h3>
          <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
            Choose from 1 up to {maxItems} photos or videos. Mixed formats supported.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-[var(--line)]/50 text-[var(--ink)] font-semibold border border-[var(--line)]">
            {items.length} of {maxItems} media slots
          </span>
          {items.length > 1 && (
            <span className="text-xs font-sans px-2.5 py-1 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] font-medium border border-[var(--blue)]/20">
              Carousel Thumbnail
            </span>
          )}
        </div>
      </div>

      {/* 1. LARGE ACTIVE PREVIEW CARD (Matching Reference Design) */}
      <div 
        style={tileColor ? { backgroundColor: tileColor } : undefined}
        className={`relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[460px] rounded-[28px] sm:rounded-[36px] overflow-hidden ${
          tileColor ? "" : "bg-[#0a0a0c] dark:bg-black"
        } border border-neutral-800/80 shadow-2xl flex items-center justify-center group transition-colors duration-300`}
      >
        {activeItem ? (
          <>
            {activeItem.isVideo ? (
              <video
                key={activeItem.url}
                src={activeItem.url}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-contain sm:object-cover"
              />
            ) : (
              <img
                key={activeItem.url}
                src={getOptimizedImageUrl(activeItem.url, 1200)}
                alt="Active thumbnail preview"
                className="w-full h-full object-contain sm:object-cover"
              />
            )}

            {/* Top-Left Status Pills */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
              {safeActiveIndex === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-black text-xs font-mono font-bold tracking-wider uppercase shadow-md backdrop-blur-md">
                  <Star size={12} className="fill-black text-black" />
                  Cover (Slot 1)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 text-white text-xs font-mono font-semibold tracking-wider uppercase shadow-md backdrop-blur-md border border-white/10">
                  Slide #{safeActiveIndex + 1}
                </span>
              )}

              {activeItem.isVideo ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/80 text-white text-xs font-mono font-bold tracking-wider uppercase shadow-md backdrop-blur-md">
                  <Film size={12} />
                  Video
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/80 text-white text-xs font-mono font-bold tracking-wider uppercase shadow-md backdrop-blur-md">
                  <ImageIcon size={12} />
                  Photo
                </span>
              )}
            </div>

            {/* Top-Right Quick Actions */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {safeActiveIndex > 0 && (
                <button
                  type="button"
                  onClick={() => handleSetAsCover(safeActiveIndex)}
                  className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white text-xs font-sans font-medium border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Make this item the primary cover thumbnail"
                >
                  <Star size={12} />
                  <span>Set as Cover</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => replaceInputRef.current?.click()}
                className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white text-xs font-sans font-medium border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Replace this media file"
              >
                <RefreshCw size={12} />
                <span>Replace</span>
              </button>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(safeActiveIndex)}
                  className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white border border-red-500/40 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  title="Remove this item from thumbnail slots"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center p-8 text-neutral-400 space-y-3">
            <ImageIcon size={44} className="mx-auto opacity-40 text-neutral-500" />
            <p className="text-sm font-sans font-medium">No thumbnail media selected</p>
            <p className="text-xs text-neutral-500">
              Click the <span className="font-bold text-white">+</span> button below to choose up to {maxItems} photos or videos.
            </p>
          </div>
        )}
      </div>

      {/* 2. THUMBNAIL STRIP ROW (Matching Reference Design: Group_2_2d4229e9.png) */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3 sm:gap-4 overflow-x-auto py-2 px-1">
          {items.map((item, index) => {
            const isActive = index === safeActiveIndex;
            return (
              <div
                key={item.id || item.url || index}
                onClick={() => setActiveIndex(index)}
                className={`relative group/slot shrink-0 w-20 h-14 sm:w-28 sm:h-20 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-neutral-900 ${
                  isActive
                    ? "ring-2 ring-[var(--blue)] ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-md scale-105"
                    : "opacity-80 hover:opacity-100 hover:scale-[1.02] border border-neutral-300 dark:border-white/10"
                }`}
              >
                {/* Media representation */}
                {item.isVideo ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      src={item.url}
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    {/* Centered Play Button Overlay (Matching Group_2_2d4229e9.png) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-md border border-white/20">
                        <Play size={12} className="fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={getOptimizedImageUrl(item.url, 200)}
                    alt={`Thumbnail slot ${index + 1}`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                )}

                {/* Slot Sequence Badge */}
                <div className="absolute top-1 left-1 z-10 pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-white backdrop-blur-xs">
                    {index === 0 ? "Cover" : `#${index + 1}`}
                  </span>
                </div>

                {/* Hover Action Overlays: Reorder & Delete */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center gap-1 z-20">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleMove(index, "left", e)}
                      title="Move Left"
                      className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                    >
                      <ChevronLeft size={11} />
                    </button>
                  )}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(index, e)}
                      title="Remove"
                      className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                  {index < items.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleMove(index, "right", e)}
                      title="Move Right"
                      className="p-1 rounded bg-white/20 hover:bg-white text-white hover:text-black transition-colors"
                    >
                      <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Plus Add Slot Button (Matching Group_2_2d4229e9.png Slot 4) */}
          {items.length < maxItems && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="relative shrink-0 w-20 h-14 sm:w-28 sm:h-20 rounded-xl bg-neutral-100 dark:bg-zinc-800/80 hover:bg-neutral-200 dark:hover:bg-zinc-700/80 border border-neutral-200/80 dark:border-white/10 flex items-center justify-center cursor-pointer transition-all group/plus active:scale-95"
              title={`Add image or video (${items.length}/${maxItems})`}
            >
              <Plus
                size={22}
                strokeWidth={1.75}
                className="text-neutral-400 group-hover/plus:text-neutral-700 dark:text-neutral-400 dark:group-hover/plus:text-white transition-colors"
              />
            </button>
          )}
        </div>

        {/* Helpful text below the strip */}
        <p className="text-center text-[11px] font-sans text-[var(--ink-soft)]">
          {items.length === 1 ? (
            <span>Single thumbnail selected. Click <strong className="text-[var(--ink)]">+</strong> to add up to 5 photos/videos to turn it into an interactive carousel.</span>
          ) : (
            <span>Carousel active ({items.length} items). Slot 1 is the primary cover. Hover over any tile to reorder or delete.</span>
          )}
        </p>
      </div>

      {/* 3. OPTIONAL GALLERY PICKER (If project already has images/videos uploaded) */}
      {availableGalleryMedia.length > 0 && (
        <div className="pt-4 border-t border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-semibold flex items-center gap-1.5">
              <Info size={13} className="text-[var(--blue)]" />
              <span>Or Choose from Project Media Uploads ({availableGalleryMedia.length})</span>
            </span>
            <span className="text-[11px] font-sans text-[var(--ink-soft)]">
              Click any item to toggle in thumbnail
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {availableGalleryMedia.map((media, idx) => {
              const isSelected = items.some((i) => i.url === media.url);
              const isFull = items.length >= maxItems && !isSelected;
              return (
                <div
                  key={media.url || idx}
                  onClick={() => !isFull && handleToggleGalleryItem(media)}
                  className={`relative aspect-[16/10] rounded-lg overflow-hidden border transition-all cursor-pointer group/gal ${
                    isSelected
                      ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/30 opacity-100"
                      : isFull
                      ? "border-[var(--line)] opacity-40 cursor-not-allowed"
                      : "border-[var(--line)] opacity-80 hover:opacity-100 hover:border-neutral-400"
                  }`}
                >
                  {media.isVideo ? (
                    <video
                      src={media.url}
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={getOptimizedImageUrl(media.url, 200)}
                      alt={`Gallery option ${idx + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )}

                  {media.isVideo && (
                    <div className="absolute bottom-1 left-1 bg-black/75 px-1 py-0.5 rounded text-[8px] font-mono text-white flex items-center gap-0.5">
                      <Film size={8} />
                      <span>VID</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-[var(--blue)] text-white p-0.5 rounded-full shadow">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
