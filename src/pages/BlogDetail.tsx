import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  BookOpen,
  Camera,
} from "lucide-react";
import { BlogPost } from "../types/blog";
import { dataStore } from "../utils/dataStore";
import { getMergedBlogPosts } from "../data/blogPosts";
import { useProfilePicture } from "../hooks/useProfilePicture";
import { Icons8ForwardArrow } from "../components/icons/Icons8ForwardArrow";
import ShareModal from "../components/projects/ShareModal";
import ScrollReveal from "../components/layout/ScrollReveal";
import { useProjectNavScroll } from "../hooks/useProjectNavScroll";
import { getLenis } from "../hooks/useLenis";

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profilePicture = useProfilePicture();
  const [showShareModal, setShowShareModal] = useState(false);
  const { isMobileNavVisible } = useProjectNavScroll();
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Fetch all posts to find current post
  const allPosts = useMemo<BlogPost[]>(() => {
    return getMergedBlogPosts(dataStore.getBlogs());
  }, []);

  const postIndex = useMemo(() => {
    if (!id) return -1;
    return allPosts.findIndex(
      (p) => p.id === id || p.slug === id || p.id.toLowerCase() === id.toLowerCase()
    );
  }, [allPosts, id]);

  const post = postIndex !== -1 ? allPosts[postIndex] : null;

  // Star appreciation state (persisted per article)
  const storageKey = post ? `article_starred_${post.id}` : "";
  const countStorageKey = post ? `article_star_count_${post.id}` : "";

  const [hasStarred, setHasStarred] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const [starCount, setStarCount] = useState<number>(() => {
    if (!countStorageKey || !post) return 12;
    try {
      const saved = localStorage.getItem(countStorageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {}
    const seed = (post.id || "article").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 13) + 8;
  });

  const handleStar = () => {
    const nextStarred = !hasStarred;
    const nextCount = nextStarred ? starCount + 1 : Math.max(0, starCount - 1);
    setHasStarred(nextStarred);
    setStarCount(nextCount);
    if (storageKey && countStorageKey) {
      try {
        localStorage.setItem(storageKey, String(nextStarred));
        localStorage.setItem(countStorageKey, String(nextCount));
      } catch {}
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const hasSpaHistory =
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state.idx === "number" &&
      window.history.state.idx > 0;
    if (hasSpaHistory) {
      navigate(-1);
    } else {
      navigate("/blog");
    }
  };

  // Scroll to top on article change and track zero-delay scroll progress
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const updateProgressBar = () => {
      const lenis = getLenis();
      const scrollTop = Math.max(0, lenis ? lenis.scroll : (window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0));
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressRatio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progressRatio})`;
      }
    };

    const attachLenis = () => {
      const lenis = getLenis();
      if (lenis) {
        lenis.on("scroll", updateProgressBar);
      }
    };

    window.addEventListener("scroll", updateProgressBar, { passive: true });
    window.addEventListener("lenis-scroll", updateProgressBar, { passive: true });
    window.addEventListener("lenis-ready", attachLenis, { passive: true });
    attachLenis();
    updateProgressBar();

    return () => {
      window.removeEventListener("scroll", updateProgressBar);
      window.removeEventListener("lenis-scroll", updateProgressBar);
      window.removeEventListener("lenis-ready", attachLenis);
      const lenis = getLenis();
      if (lenis) {
        lenis.off("scroll", updateProgressBar);
      }
    };
  }, [id]);

  if (!post) {
    return (
      <div className="py-24 text-center space-y-4">
        <BookOpen size={40} className="mx-auto text-[var(--muted)] opacity-60" />
        <h1 className="text-2xl sm:text-3xl font-hero font-bold text-[var(--ink)]">
          Article Not Found
        </h1>
        <p className="text-sm text-[var(--ink-soft)] max-w-md mx-auto">
          The article you are looking for may have been moved, renamed, or is no longer available.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-xs font-medium bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={14} />
          <span className="font-medium">Back to Articles</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 0. Minimal Top Scroll Progress Bar: Fixed to very top edge of viewport (2-3px line in website accent blue) */}
      <div 
        className="fixed top-0 left-0 right-0 z-[120] h-[2.5px] pointer-events-none bg-black/[0.03] dark:bg-white/[0.04]"
        aria-hidden="true"
      >
        <div 
          ref={progressBarRef}
          className="w-full h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
          style={{ 
            transform: "scaleX(0)",
            transformOrigin: "0% 50%",
            willChange: "transform"
          }}
        />
      </div>

      <article id={`blog-article-${post.id}`} className="w-full space-y-8 -mt-8 sm:-mt-10 pt-2 pb-20">
        {/* Navigation & Action Header (Identical placement and styling to Projects, Blog, and About pages) */}
        <div
          style={{ top: isMobileNavVisible ? "var(--navbar-offset, 0px)" : "0px" }}
          className="sticky top-0 z-40 bg-[var(--bg)] w-full py-2.5 -mt-3 sm:-mt-4 mb-2 shadow-none border-none transition-[top] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <header className="w-full flex items-center justify-between max-[768px]:justify-end gap-3 sm:gap-6 border-none shadow-none">
          <Link
            to="/blog"
            onClick={handleBack}
            className="hidden min-[769px]:flex h-8 px-3 sm:px-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium items-center gap-1.5 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none whitespace-nowrap shadow-none shrink-0 active:scale-95"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            <span className="font-medium">Go Back</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Star Action */}
            <button
              type="button"
              onClick={handleStar}
              className={`h-8 px-3 sm:px-3.5 rounded-full text-xs sm:text-[13px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap active:scale-95 ${
                hasStarred
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "border-transparent dark:border-white/10 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              }`}
              title={hasStarred ? "Article appreciated" : "Appreciate this article"}
            >
              <Star
                size={13}
                className={hasStarred ? "fill-amber-400 text-amber-500" : "text-zinc-500 dark:text-zinc-400"}
              />
              <span className="tabular-nums font-mono">{starCount}</span>
            </button>

            {/* Share Action: Theme blue styling */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="h-8 px-3 sm:px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white font-sans text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-sm shadow-blue-600/20 select-none whitespace-nowrap active:scale-95"
            >
              <Icons8ForwardArrow size={13} className="text-white" />
              <span>Share</span>
            </button>
          </div>
        </header>
      </div>

        {/* Article Headline Header Section */}
        <div className="space-y-5 max-w-4xl">
          {/* Metadata pill strip */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[var(--ink-soft)]">
            <span className="inline-flex items-center gap-1.5">
              {post.category}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {post.date}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-[34px] font-hero font-bold text-[var(--ink)] tracking-tight leading-snug">
            {post.title}
          </h1>

          {/* Author Block */}
          <div className="pt-2 flex items-center gap-3.5 border-t border-[var(--line)]/60 pt-5">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--line)] bg-neutral-200 dark:bg-neutral-800 shrink-0">
              <img
                src={
                  post.author.avatar ||
                  profilePicture?.imageUrl ||
                  "/assets/title-logo/LOGO004.png"
                }
                alt={post.author.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-sm sm:text-base font-semibold font-hero text-[var(--ink)]">
                {post.author.name || "Avinash Shajan"}
              </div>
              <div className="text-xs text-[var(--ink-soft)] font-sans">
                {post.author.role || "Lead Product Designer & Technologist"}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Cover Image */}
        {post.coverPhoto && (
          <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] border border-[var(--line)] bg-neutral-900 shadow-md">
            <img
              src={post.coverPhoto}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main Article Prose Content */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="prose prose-neutral dark:prose-invert max-w-none text-[var(--ink)] font-sans text-base sm:text-[17px] leading-relaxed space-y-6">
            {post.body ? (
              post.body.split("\n\n").map((block, idx) => {
                if (block.startsWith("### ")) {
                  return (
                    <h3
                      key={idx}
                      className="text-2xl sm:text-3xl font-hero font-bold tracking-tight text-[var(--ink)] pt-8 pb-1 border-b border-[var(--line)]/40"
                    >
                      {block.replace("### ", "")}
                    </h3>
                  );
                }
                if (block.startsWith("#### ")) {
                  return (
                    <h4
                      key={idx}
                      className="text-xl sm:text-2xl font-hero font-semibold text-[var(--ink)] pt-6"
                    >
                      {block.replace("#### ", "")}
                    </h4>
                  );
                }
                if (block.startsWith("```")) {
                  const cleaned = block.replace(/```[a-z]*\n?/g, "");
                  return (
                    <pre
                      key={idx}
                      className="p-5 rounded-2xl bg-neutral-900 text-neutral-100 text-xs sm:text-sm font-mono overflow-x-auto border border-neutral-800 my-6 shadow-sm"
                    >
                      <code>{cleaned}</code>
                    </pre>
                  );
                }
                if (block.startsWith("- ") || block.startsWith("1. ")) {
                  const items = block.split("\n");
                  return (
                    <ul key={idx} className="list-disc pl-6 space-y-2.5 text-[var(--ink-soft)] my-4">
                      {items.map((it, i) => (
                        <li key={i} className="leading-relaxed">
                          {it.replace(/^[-*]|\d+\.\s*/, "").trim()}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.startsWith("> ")) {
                  return (
                    <blockquote
                      key={idx}
                      className="pl-5 border-l-4 border-[var(--blue)] italic text-lg sm:text-xl text-[var(--ink)] my-6 py-1"
                    >
                      {block.replace(/^>\s*/, "")}
                    </blockquote>
                  );
                }
                return (
                  <p key={idx} className="text-[var(--ink-soft)] leading-relaxed font-sans">
                    {block}
                  </p>
                );
              })
            ) : (
              <p className="text-[var(--ink-soft)] leading-relaxed">{post.excerpt}</p>
            )}
          </div>

          {/* Note Photos & Artifacts Gallery (if any) */}
          {post.notePhotos && post.notePhotos.length > 0 && (
            <div className="pt-10 mt-10 border-t border-[var(--line)] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Camera size={18} />
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-hero font-bold text-[var(--ink)]">
                      Artifacts, Sketches &amp; Process Notes
                    </h4>
                    <p className="text-xs text-[var(--ink-soft)] font-sans">
                      Scans from physical notebook pages, whiteboard layouts, and system calculations.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-medium px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {post.notePhotos.length} {post.notePhotos.length === 1 ? "Artifact" : "Artifacts"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {post.notePhotos.map((item, idx) => {
                  const url = typeof item === "string" ? item : item.url;
                  const caption = typeof item === "string" ? undefined : item.caption;
                  return (
                    <div
                      key={idx}
                      className="group rounded-2xl overflow-hidden border border-[var(--line)] bg-[var(--card)] hover:border-amber-500/40 transition-all shadow-xs"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-neutral-900">
                        <img
                          src={url}
                          alt={caption || `Note photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="eager"
                          decoding="async"
                        />
                      </div>
                      {caption && (
                        <div className="p-3.5 text-xs text-[var(--ink-soft)] font-sans border-t border-[var(--line)]/60 bg-[var(--bg)]/50 leading-relaxed">
                          {caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          type="article"
          project={{
            title: post.title,
            thumbnail: post.coverPhoto,
            link: window.location.href,
          }}
        />
      )}
    </>
  );
}
