import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BlogPost } from "../../types/blog";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { DEFAULT_PROFILE_PICTURE } from "../../services/profilePictureService";

interface BlogCarouselProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
}

export default function BlogCarousel({ posts, onSelectPost }: BlogCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1);
  const profilePicture = useProfilePicture();
  const touchStartX = useRef<number | null>(null);

  // Take up to 4 latest featured posts for the carousel
  const carouselPosts = posts.slice(0, 4);
  const count = carouselPosts.length;

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto advance every 7 seconds, paused on hover
  useEffect(() => {
    if (isHovered || count <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(timer);
  }, [isHovered, count, nextSlide]);

  if (count === 0) return null;

  const currentPost = carouselPosts[currentIndex];

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-full flex flex-col">
      <div
        id="blog-top-carousel"
        className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-900 select-none group/carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Aspect Ratio Container: Reduced 25% in height per user request */}
        <div className="relative w-full h-[315px] sm:h-[360px] md:h-[390px] lg:h-[405px]">
          {/* Animated Background Slides */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentPost.id}
              custom={direction}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={() => onSelectPost(currentPost)}
            >
              <img
                src={currentPost.coverPhoto}
                alt={currentPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform transition-transform duration-[1200ms] ease-out group-hover/carousel:scale-[1.03]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Subtle bottom gradient overlay so image remains bright and fully visible while text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

          {/* Bottom Main Content Overlay */}
          <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-end z-20 pointer-events-none">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
              
              {/* Left Column: Category Pill, Headline, Excerpt, Author Info */}
              <div className="space-y-2 sm:space-y-2.5 max-w-2xl pointer-events-auto">
                
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium tracking-wide bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 transition-colors">
                    {currentPost.category}
                  </span>
                </div>

                {/* Title */}
                <h2
                  onClick={() => onSelectPost(currentPost)}
                  className="text-xl sm:text-2xl md:text-[26px] lg:text-[30px] font-hero font-bold text-white tracking-tight leading-[1.2] drop-shadow-md cursor-pointer hover:text-blue-200 transition-colors line-clamp-2"
                >
                  {currentPost.title}
                </h2>

                {/* Excerpt (Description) */}
                <p className="text-xs sm:text-sm text-white/80 font-sans leading-relaxed line-clamp-1 sm:line-clamp-2 drop-shadow-sm max-w-xl">
                  {currentPost.excerpt}
                </p>

                {/* Author Info Element - Kept left below description */}
                <div
                  onClick={() => onSelectPost(currentPost)}
                  className="flex items-center gap-2.5 pt-1 cursor-pointer transition-all duration-200 group/author"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/40 shadow-sm shrink-0 bg-neutral-800">
                    <img
                      src={
                        profilePicture?.imageUrl ||
                        DEFAULT_PROFILE_PICTURE.imageUrl ||
                        currentPost.author.avatar ||
                        "/assets/title-logo/LOGO004.png"
                      }
                      alt={currentPost.author.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-xs sm:text-sm font-semibold font-hero text-white group-hover/author:text-blue-300 transition-colors drop-shadow-sm block">
                      {currentPost.author.name}
                    </span>
                    <p className="text-[11px] sm:text-xs text-white/75 font-mono drop-shadow-sm">
                      {currentPost.readTime.includes("minute read")
                        ? currentPost.readTime
                        : currentPost.readTime.replace(/min(\s*read)?/i, "minute read")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Slide changing arrows */}
              {count > 1 && (
                <div className="pointer-events-auto flex items-center gap-1.5 self-end shrink-0 pb-1">
                  <button
                    id="blog-carousel-prev"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    aria-label="Previous article"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-lg"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    id="blog-carousel-next"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    aria-label="Next article"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-lg"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Outside Centered Position Indicators */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-2 pt-3 sm:pt-3.5">
          {carouselPosts.map((post, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-6 h-2 bg-[var(--blue)] shadow-sm shadow-[var(--blue)]/25"
                    : "w-2 h-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-[var(--blue)]/40 dark:hover:bg-[var(--blue)]/40"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
