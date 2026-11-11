import React, { useState, useEffect, useRef } from "react";
import { Play, Film, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isMediaVideo } from "../../utils/mediaUtils";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

interface ProjectThumbnailViewerProps {
  thumbnail?: string | string[];
  thumbnails?: string[];
  alt?: string;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  optimizeWidth?: number;
  onLoaded?: () => void;
  showBadge?: boolean;
  showThumbnailsRow?: boolean;
  autoCycle?: boolean;
  cycleInterval?: number;
}

export default function ProjectThumbnailViewer({
  thumbnail,
  thumbnails,
  alt = "Project Preview",
  className = "w-full h-full",
  imageClassName = "w-full h-full object-contain",
  width,
  height,
  aspectRatio,
  optimizeWidth = 800,
  onLoaded,
  showBadge = false,
  showThumbnailsRow = true,
  autoCycle = true,
  cycleInterval = 3000,
}: ProjectThumbnailViewerProps) {
  // Aggregate all thumbnail items into an array
  const mediaList: string[] = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      thumbnails.forEach((t) => {
        if (t && typeof t === "string") list.push(t);
      });
    } else if (Array.isArray(thumbnail) && thumbnail.length > 0) {
      thumbnail.forEach((t) => {
        if (t && typeof t === "string") list.push(t);
      });
    } else if (typeof thumbnail === "string" && thumbnail.trim()) {
      list.push(thumbnail.trim());
    }
    return list;
  }, [thumbnail, thumbnails]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isStripHovered, setIsStripHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const total = mediaList.length;
  const isCarousel = total > 1;
  const currentMedia = mediaList[activeIndex] || mediaList[0] || "";
  const isCurrentVideo = isMediaVideo(currentMedia);

  const optimizedSrc = isCurrentVideo
    ? currentMedia
    : getOptimizedImageUrl(currentMedia, optimizeWidth);

  // Auto-cycle through images ("images passing" carousel effect)
  useEffect(() => {
    if (!isCarousel || !autoCycle || total <= 1 || isStripHovered) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, cycleInterval);

    return () => clearInterval(timer);
  }, [isCarousel, autoCycle, total, cycleInterval, isStripHovered]);

  const handleMediaLoaded = () => {
    setIsLoaded(true);
    if (onLoaded) onLoaded();
  };

  const handleSelectSlide = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex(index);
  };

  // Touch swipe support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next
        setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
      } else {
        // swipe right -> prev
        setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
      }
    }
    touchStartXRef.current = null;
  };

  if (!currentMedia) {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden select-none group/thumb ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsStripHovered(false);
      }}
      onTouchStart={isCarousel ? handleTouchStart : undefined}
      onTouchEnd={isCarousel ? handleTouchEnd : undefined}
    >
      {/* 1. Main Media Display with Animated Blur Transition */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentMedia}
          initial={{ opacity: 0, filter: "blur(12px)", scale: 1.02 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="w-full h-full flex items-center justify-center"
        >
          {isCurrentVideo ? (
            <video
              src={optimizedSrc}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={handleMediaLoaded}
              className={`${imageClassName} transition-opacity duration-300 ease-out ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <img
              src={optimizedSrc}
              alt={`${alt} ${isCarousel ? `(${activeIndex + 1}/${total})` : ""}`}
              referrerPolicy="no-referrer"
              loading="eager"
              width={width}
              height={height}
              style={aspectRatio ? { aspectRatio } : undefined}
              onLoad={handleMediaLoaded}
              className={`${imageClassName} transition-opacity duration-300 ease-out ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Loading Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton-box rounded-xl z-5 pointer-events-none" />
      )}

      {/* Badges: Video or Carousel indicator (Optional) */}
      {showBadge && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5">
          {isCurrentVideo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-semibold tracking-wider uppercase border border-white/10 shadow-xs">
              <Film size={10} />
              <span>Video</span>
            </span>
          )}
          {isCarousel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-semibold tracking-wider uppercase border border-white/10 shadow-xs">
              <Layers size={10} />
              <span>{activeIndex + 1}/{total}</span>
            </span>
          )}
        </div>
      )}

      {/* Carousel Mini Thumbnails (Matching Reference Design: Group_3_12bbaefb.png) */}
      {isCarousel && showThumbnailsRow && (
        <>
          {/* 2. RECREATED DESIGN: Floating Mini Thumbnail Cards Strip at Bottom */}
          <div
            onMouseEnter={() => setIsStripHovered(true)}
            onMouseLeave={() => setIsStripHovered(false)}
            style={{
              paddingTop: "0px",
              marginTop: "0px",
              paddingLeft: "9px",
              marginBottom: "-8px",
            }}
            className="absolute bottom-2 sm:bottom-2.5 inset-x-0 z-30 flex items-center justify-center px-2 pt-0 mt-0 pl-[9px] -mb-2 pointer-events-auto"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-md sm:rounded-lg bg-black/35 dark:bg-black/45 backdrop-blur-md border border-white/10 shadow-lg max-w-full overflow-x-auto no-scrollbar">
              {mediaList.map((mediaUrl, idx) => {
                const isActive = activeIndex === idx;
                const isItemVideo = isMediaVideo(mediaUrl);
                const thumbImg = isItemVideo
                  ? mediaUrl
                  : getOptimizedImageUrl(mediaUrl, 240);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleSelectSlide(e, idx)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    aria-label={`View thumbnail slide ${idx + 1}`}
                    className={`relative shrink-0 w-9 h-7 sm:w-11 sm:h-8 md:w-12 md:h-9 rounded-[3.5px] sm:rounded-[4px] overflow-hidden cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "border-2 border-[#3b82f6] ring-1.5 ring-[#3b82f6]/40 shadow-md shadow-blue-500/25 scale-105 z-10"
                        : "border border-white/20 dark:border-white/10 bg-black/60 opacity-75 hover:opacity-100 hover:scale-[1.03]"
                    }`}
                  >
                    {isItemVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <video
                          src={thumbImg}
                          muted
                          playsInline
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25">
                          <div className="w-3.5 h-3.5 rounded-full bg-black/70 flex items-center justify-center text-white">
                            <Play size={7} className="fill-white text-white ml-0.2" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={thumbImg}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
