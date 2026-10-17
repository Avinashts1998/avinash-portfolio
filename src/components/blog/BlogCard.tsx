import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { BlogPost } from "../../types/blog";
import { Icons8ForwardArrow } from "../icons/Icons8ForwardArrow";
import ShareModal from "../projects/ShareModal";

interface BlogCardProps {
  post: BlogPost;
  onSelect?: (post: BlogPost) => void;
}

export default function BlogCard({ post, onSelect }: BlogCardProps) {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  // Star appreciation state (persisted per article)
  const storageKey = `article_starred_${post.id}`;
  const countStorageKey = `article_star_count_${post.id}`;

  const [hasStarred, setHasStarred] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const [starCount, setStarCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(countStorageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          return Math.min(Math.max(1, parsed), 24);
        }
      }
    } catch {}
    // Deterministic base count strictly under 25 (between 6 and 18)
    const seed = (post.id || "article").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 13) + 6;
  });

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStarred = !hasStarred;
    // Keep count strictly less than 25 (maximum 24)
    const nextCount = nextStarred ? Math.min(24, starCount + 1) : Math.max(0, starCount - 1);
    setHasStarred(nextStarred);
    setStarCount(nextCount);
    try {
      localStorage.setItem(storageKey, String(nextStarred));
      localStorage.setItem(countStorageKey, String(nextCount));
    } catch {}
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleCardClick = () => {
    if (onSelect) onSelect(post);
    navigate(`/blog/${post.slug || post.id}`);
  };

  return (
    <>
      <article
        id={`blog-card-${post.id}`}
        onClick={handleCardClick}
        className="group w-full py-7 sm:py-8 border-b border-neutral-200/80 dark:border-neutral-800/80 cursor-pointer select-none"
      >
        <div className="flex items-start justify-between gap-5 sm:gap-8 md:gap-10">
        {/* Left Column: Metadata -> Title -> Excerpt -> Engagement Footer */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-2 sm:space-y-2.5">
            {/* 1. Read Time Meta Row */}
            {post.readTime && (
              <div className="flex items-center text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 font-sans">
                <span>{post.readTime}</span>
              </div>
            )}

            {/* 2. Article Title */}
            <h3 className="text-lg sm:text-xl md:text-[22px] font-bold font-sans text-neutral-900 dark:text-white tracking-tight leading-[1.28] group-hover:text-[var(--blue)] transition-colors pt-0.5">
              {post.title}
            </h3>

            {/* 3. Subtitle / Excerpt */}
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm md:text-[14.5px] leading-relaxed line-clamp-2 font-sans font-normal">
              {post.excerpt || post.title}
            </p>
          </div>

          {/* 4. Bottom Row & Controls */}
          <div className="flex items-center justify-between pt-4 sm:pt-5 text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 font-sans">
            {/* Left side: Star appreciation button & Date */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={handleStar}
                className="group/star inline-flex items-center gap-1.5 -ml-1 px-1.5 py-0.5 rounded-full transition-colors duration-200 cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title={hasStarred ? "You appreciated this article! Click to undo" : "Give a star to appreciate this article"}
              >
                <Star
                  size={14}
                  className={`transition-all duration-300 ${
                    hasStarred
                      ? "fill-amber-400 text-amber-500 scale-110"
                      : "text-neutral-400 hover:text-amber-500 dark:text-neutral-500 dark:hover:text-amber-400 group-hover/star:scale-110"
                  }`}
                />
                <span
                  className={`text-xs font-sans font-medium tabular-nums transition-colors select-none ${
                    hasStarred
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {Math.min(24, starCount)}
                </span>
              </button>

              {post.date && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600 select-none">·</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans font-normal">
                    {post.date}
                  </span>
                </>
              )}
            </div>

            {/* Right side: Share button */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleShare}
                title="Share article"
                className="group/share inline-flex items-center gap-1.5 text-xs font-medium font-sans text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors duration-200 cursor-pointer select-none bg-transparent border-0 p-0"
              >
                <Icons8ForwardArrow size={13} className="shrink-0 transition-transform duration-200 group-hover/share:translate-x-0.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Square/Landscape Card Thumbnail */}
        {post.coverPhoto && (
          <div className="shrink-0 w-24 h-18 xs:w-28 xs:h-20 sm:w-36 sm:h-24 md:w-40 md:h-26 rounded-none overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800/60 shadow-2xs">
            <img
              src={post.coverPhoto}
              alt={post.title}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover rounded-none transform transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        )}
      </div>
    </article>

    {/* Share Modal Matching Project Page Share Window - rendered outside article to isolate event propagation */}
    {showShareModal && (
      <ShareModal
        onClose={() => setShowShareModal(false)}
        project={{
          title: post.title,
          thumbnail: post.coverPhoto,
          link: `/blog/${post.slug || post.id}`,
        }}
        type="article"
      />
    )}
  </>
  );
}
