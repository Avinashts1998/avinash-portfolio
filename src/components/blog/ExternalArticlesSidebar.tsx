import React, { useState, useEffect } from "react";
import { ExternalArticle } from "../../types/externalArticle";
import { getExternalArticles } from "../../data/externalArticles";

interface ExternalArticlesSidebarProps {
  isAdmin?: boolean;
}

const MEDIUM_ICON_URL = "https://res.cloudinary.com/p66qxgqe/image/upload/v1790675748/pailt5wgsvujldpjhsl0.png";
// Trimmed LinkedIn SVG with viewBox="4 4 40 40" eliminating transparent padding so the circle matches Medium's circle 1:1
const LINKEDIN_ICON_URL = `data:image/svg+xml;utf8,<svg viewBox="4 4 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" fill="%230077B5"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18.7747 14.2839C18.7747 15.529 17.8267 16.5366 16.3442 16.5366C14.9194 16.5366 13.9713 15.529 14.0007 14.2839C13.9713 12.9783 14.9193 12 16.3726 12C17.8267 12 18.7463 12.9783 18.7747 14.2839ZM14.1199 32.8191V18.3162H18.6271V32.8181H14.1199V32.8191Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M22.2393 22.9446C22.2393 21.1357 22.1797 19.5935 22.1201 18.3182H26.0351L26.2432 20.305H26.3322C26.9254 19.3854 28.4079 17.9927 30.8101 17.9927C33.7752 17.9927 35.9995 19.9502 35.9995 24.219V32.821H31.4922V24.7838C31.4922 22.9144 30.8404 21.6399 29.2093 21.6399C27.9633 21.6399 27.2224 22.4999 26.9263 23.3297C26.8071 23.6268 26.7484 24.0412 26.7484 24.4574V32.821H22.2411V22.9446H22.2393Z" fill="white"/></svg>`;

// Official brand icon assets for Medium & LinkedIn
export const MediumLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <img
    src={MEDIUM_ICON_URL}
    alt="Medium"
    width={size}
    height={size}
    className={`w-full h-full object-contain inline-block shrink-0 select-none ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
    loading="eager"
    decoding="async"
  />
);

export const LinkedInLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <img
    src={LINKEDIN_ICON_URL}
    alt="LinkedIn"
    width={size}
    height={size}
    className={`w-full h-full object-contain inline-block shrink-0 select-none ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
    loading="eager"
    decoding="async"
  />
);

export default function ExternalArticlesSidebar({}: ExternalArticlesSidebarProps) {
  const [articles, setArticles] = useState<ExternalArticle[]>(() => getExternalArticles());

  // Listen to external article updates
  useEffect(() => {
    const handleUpdate = () => setArticles(getExternalArticles());
    window.addEventListener("external_articles_updated", handleUpdate);
    return () => window.removeEventListener("external_articles_updated", handleUpdate);
  }, []);

  if (articles.length === 0) {
    return null;
  }

  return (
    <aside
      id="blog-external-sidebar"
      aria-label="Articles published on other platforms"
      className="w-full lg:border-l lg:border-[var(--line)] lg:pl-8 xl:pl-10 space-y-9 pt-1 lg:pt-0"
    >
      {/* List of External Articles */}
      <div className="space-y-6">
        {articles.map((art) => (
          <article
            key={art.id}
            className="group/item relative flex flex-col gap-1.5 border-b border-[var(--line)]/60 pb-5 last:border-b-0 last:pb-0"
          >
            {/* Author / Platform byline */}
            <div className="flex items-center gap-2 text-[12px] text-[var(--ink-soft)] font-sans">
              {/* Platform Badge Icon Container */}
              <div
                className="w-[18px] h-[18px] flex items-center justify-center shrink-0"
                title={`Published on ${art.platform}`}
              >
                {art.platform === "Medium" ? (
                  <MediumLogo size={18} />
                ) : (
                  <LinkedInLogo size={18} />
                )}
              </div>

              <span className="font-medium text-[var(--ink)] text-[12px] truncate max-w-[150px]">
                {art.platform === "LinkedIn" || art.publication === "LinkedIn Pulse"
                  ? "LinkedIn"
                  : (art.publication || art.author?.name || art.platform)}
              </span>

              <span className="text-[var(--line)]" aria-hidden="true">·</span>

              <span className="text-[11px] text-[var(--muted)] font-mono whitespace-nowrap">
                {art.publishedDate}
              </span>
            </div>

            {/* Title & External Link */}
            <a
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group-hover/item:text-[var(--blue)] transition-colors duration-150"
            >
              <h3 className="text-[14px] sm:text-[14.5px] font-sans font-bold leading-snug tracking-tight text-[var(--ink)] group-hover/item:text-[var(--blue)] transition-colors line-clamp-2">
                {art.title}
              </h3>
            </a>

            {/* Excerpt if present */}
            {art.excerpt && (
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed line-clamp-2 font-sans">
                {art.excerpt}
              </p>
            )}

            {/* Footer Meta: Read time & Platform Tag */}
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] font-mono pt-0.5">
              <span>{art.readTime || "4 min read"}</span>
              {art.topic && (
                <>
                  <span>·</span>
                  <span className="text-[10px] uppercase font-sans text-[var(--ink-soft)] font-medium">
                    {art.topic}
                  </span>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
