import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { BackgroundItem } from "../../services/aboutBackgroundService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { useScrollLock } from "../../hooks/useScrollLock";

interface AboutBackgroundViewerProps {
  items: BackgroundItem[];
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutBackgroundViewer({
  items,
  activeId,
  isOpen,
  onClose,
}: AboutBackgroundViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const profilePicture = useProfilePicture();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState("0:00");
  const [audioCurrentTime, setAudioCurrentTime] = useState("0:00");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Prevent background scrolling and stop Lenis when viewer is open
  useScrollLock(isOpen);

  // Sync active item index on open or when activeId changes
  useEffect(() => {
    if (isOpen && items && items.length > 0) {
      if (activeId) {
        const foundIdx = items.findIndex((it) => it.id === activeId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
          return;
        }
      }
      const activeIdx = items.findIndex((it) => it.isActive);
      setCurrentIndex(activeIdx !== -1 ? activeIdx : 0);
    }
  }, [isOpen, activeId]);

  const fallbackItem: BackgroundItem = {
    id: "default-bg-fallback",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2400&auto=format&fit=crop",
    title: "Scenic Exploration",
    location: "",
    authorName: "Avinash Shajan",
    authorAvatar: "",
    audioUrl: "",
    audioLabel: "Ambient Audio",
    blurAmount: 28,
    isActive: true,
  };

  const activeItem: BackgroundItem = items[currentIndex] || items[0] || fallbackItem;

  // Close on Escape & Arrow keys for carousel navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items.length, currentIndex]);

  const handleNext = () => {
    if (items.length <= 1) return;
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    if (items.length <= 1) return;
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Handle audio play/pause
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current || !activeItem.audioUrl) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn("Audio play blocked or failed:", err);
        setIsPlayingAudio(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setAudioProgress((current / duration) * 100);

    const mins = Math.floor(current / 60);
    const secs = Math.floor(current % 60);
    setAudioCurrentTime(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const duration = audioRef.current.duration;
    if (duration && !isNaN(duration)) {
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      setAudioDuration(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
    }
  };

  // Auto-play audio when viewer is opened or current item changes
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (isOpen && activeItem.audioUrl) {
      let isMounted = true;

      const playAudio = () => {
        if (!audioRef.current || !isMounted) return;
        audioRef.current
          .play()
          .then(() => {
            if (isMounted) {
              setIsPlayingAudio(true);
            }
          })
          .catch((err) => {
            console.log("Autoplay waiting for user gesture:", err);
            // If browser autoplay policy blocked it, start on first gesture
            const handleFirstGesture = () => {
              if (audioRef.current && isMounted && isOpen) {
                audioRef.current
                  .play()
                  .then(() => {
                    if (isMounted) setIsPlayingAudio(true);
                  })
                  .catch(() => {});
              }
              window.removeEventListener("click", handleFirstGesture);
              window.removeEventListener("keydown", handleFirstGesture);
              window.removeEventListener("touchstart", handleFirstGesture);
            };

            window.addEventListener("click", handleFirstGesture, { once: true });
            window.addEventListener("keydown", handleFirstGesture, { once: true });
            window.addEventListener("touchstart", handleFirstGesture, { once: true });
          });
      };

      const timer = setTimeout(playAudio, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [isOpen, activeItem.audioUrl, currentIndex]);

  const bgImageUrl = activeItem.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2400&auto=format&fit=crop";

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] w-full h-full overflow-hidden bg-black select-none no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Audio element */}
          {activeItem.audioUrl && (
            <audio
              ref={audioRef}
              key={activeItem.audioUrl}
              src={activeItem.audioUrl}
              autoPlay
              onPlay={() => setIsPlayingAudio(true)}
              onPause={() => setIsPlayingAudio(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={() => {
                setIsPlayingAudio(false);
                setAudioProgress(0);
              }}
              onEnded={() => {
                setIsPlayingAudio(false);
                setAudioProgress(0);
              }}
              loop
            />
          )}

          {/* High Resolution Landscape Background (Static, No Zoom) */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
            <motion.div
              key={activeItem.id || activeItem.imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${getOptimizedImageUrl(bgImageUrl, 2560)})`,
              }}
            />

            {/* Cinematic Gradient Vignettes */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/10 to-black/60 pointer-events-none" />
          </div>

          {/* Top Bar Floating Controls */}
          <div className="absolute top-6 sm:top-10 left-6 sm:left-10 right-6 sm:right-10 flex items-center justify-between pointer-events-auto z-20">
            {/* Back to content Button */}
            <motion.button
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={onClose}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-sans font-medium bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Back to content</span>
            </motion.button>
          </div>

          {/* Multi-item Navigation Arrows (if > 1 item) */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 z-20"
                title="Previous Scene"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 z-20"
                title="Next Scene"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Bottom Area: Title, Location & Audio Details */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-auto z-20">
            {/* Left Info: Title + Author Card */}
            <motion.div
              key={activeItem.id || activeItem.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 max-w-3xl lg:max-w-5xl min-w-0 flex-1"
            >
              {/* Title - Always single line */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-hero font-bold tracking-tight text-white drop-shadow-md whitespace-nowrap truncate max-w-full">
                {activeItem.title || "Scenic Exploration"}
              </h1>

              {/* Author & Location badge */}
              <div className="flex items-center gap-3.5 pt-1">
                {/* Author Avatar */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white/40 bg-white/10 shrink-0 shadow-md">
                  {activeItem.authorAvatar || profilePicture?.imageUrl ? (
                    <img
                      src={getOptimizedImageUrl(activeItem.authorAvatar || profilePicture!.imageUrl, 120)}
                      alt={activeItem.authorName || "Author"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-700/60 text-white font-hero font-bold text-sm">
                      {(activeItem.authorName || "A")[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Author text */}
                <div className="space-y-0.5">
                  <p className="text-sm sm:text-base font-sans font-semibold text-white tracking-wide">
                    {activeItem.authorName || "Avinash Shajan"}
                  </p>
                  {activeItem.location && (
                    <p className="text-xs sm:text-sm text-white/70 font-sans flex items-center gap-1.5">
                      <MapPin size={12} className="text-white/60 shrink-0" />
                      <span>Clicked from {activeItem.location.replace(/^Clicked from\s*:?\s*/i, "")}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Audio Player */}
            {activeItem.audioUrl && (
              <motion.div
                key={`audio-${activeItem.id || activeItem.audioUrl}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-1.5 w-full sm:w-auto"
              >
                <div className="flex items-center gap-2.5 bg-white/2 border border-white/5 backdrop-blur-md px-2 py-2 rounded-full w-full sm:w-[230px] md:w-[250px]">
                  <button
                    onClick={toggleAudio}
                    className="w-7 h-7 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-xs cursor-pointer"
                    title={isPlayingAudio ? "Pause ambient sound" : "Play ambient sound"}
                  >
                    <div className="flex items-center justify-center w-3.5 h-3.5 overflow-hidden">
                      {isPlayingAudio ? (
                        <svg
                          className="w-3.5 h-3.5 text-neutral-900"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <defs>
                            <clipPath id="audio-wave-mask">
                              <rect x="2.5" y="3.5" width="11" height="9" rx="0.5" />
                            </clipPath>
                          </defs>
                          <g clipPath="url(#audio-wave-mask)">
                            <motion.path
                              d="M -22 8 C -20.2 4.8, -18.3 4.8, -16.5 8 C -14.7 11.2, -12.8 11.2, -11 8 C -9.2 4.8, -7.3 4.8, -5.5 8 C -3.7 11.2, -1.8 11.2, 0 8 C 1.8 4.8, 3.7 4.8, 5.5 8 C 7.3 11.2, 9.2 11.2, 11 8 C 12.8 4.8, 14.7 4.8, 16.5 8 C 18.3 11.2, 20.2 11.2, 22 8 C 23.8 4.8, 25.7 4.8, 27.5 8 C 29.3 11.2, 31.2 11.2, 33 8"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                              animate={{ x: [0, -11] }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          </g>
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 text-neutral-900"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <line
                            x1="2.5"
                            y1="8"
                            x2="13.5"
                            y2="8"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  <div className="flex-1">
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-200"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-white/90 shrink-0 font-medium tracking-tight">
                    {audioCurrentTime || "0:00"}
                  </span>
                </div>

                <span className="text-xs font-sans text-white font-medium tracking-tight drop-shadow-md text-center whitespace-nowrap shrink-0">
                  Audio recorded from the view point
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
