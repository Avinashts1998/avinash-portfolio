import React, { useState, useEffect } from "react";
import { ExternalArticle, PORTAL_ICONS, getPortalIconUrl } from "../../types/externalArticle";
import { getExternalArticles } from "../../data/externalArticles";

interface ExternalArticlesSidebarProps {
  isAdmin?: boolean;
}

const MEDIUM_ICON_URL = PORTAL_ICONS.Medium;
// Trimmed LinkedIn SVG with viewBox="4 4 40 40" eliminating transparent padding so the circle matches Medium's circle 1:1
const LINKEDIN_ICON_URL = `data:image/svg+xml;utf8,<svg viewBox="4 4 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" fill="%230077B5"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18.7747 14.2839C18.7747 15.529 17.8267 16.5366 16.3442 16.5366C14.9194 16.5366 13.9713 15.529 14.0007 14.2839C13.9713 12.9783 14.9193 12 16.3726 12C17.8267 12 18.7463 12.9783 18.7747 14.2839ZM14.1199 32.8191V18.3162H18.6271V32.8181H14.1199V32.8191Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M22.2393 22.9446C22.2393 21.1357 22.1797 19.5935 22.1201 18.3182H26.0351L26.2432 20.305H26.3322C26.9254 19.3854 28.4079 17.9927 30.8101 17.9927C33.7752 17.9927 35.9995 19.9502 35.9995 24.219V32.821H31.4922V24.7838C31.4922 22.9144 30.8404 21.6399 29.2093 21.6399C27.9633 21.6399 27.2224 22.4999 26.9263 23.3297C26.8071 23.6268 26.7484 24.0412 26.7484 24.4574V32.821H22.2411V22.9446H22.2393Z" fill="white"/></svg>`;

// Official brand icon assets for supported publishing portals
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

export const SubstackLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <img
    src={PORTAL_ICONS.Substack}
    alt="Substack"
    width={size}
    height={size}
    className={`w-full h-full object-contain rounded-full inline-block shrink-0 select-none ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
    loading="eager"
    decoding="async"
  />
);

export const DevIoLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <img
    src={PORTAL_ICONS["Dev.io"]}
    alt="Dev.io"
    width={size}
    height={size}
    className={`w-full h-full object-contain rounded-full inline-block shrink-0 select-none ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
    loading="eager"
    decoding="async"
  />
);

export const RedditLogo: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <img
    src={PORTAL_ICONS.Reddit}
    alt="Reddit"
    width={size}
    height={size}
    className={`w-full h-full object-contain rounded-full inline-block shrink-0 select-none ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
    loading="eager"
    decoding="async"
  />
);

export const PlatformLogo: React.FC<{ platform: string; size?: number; className?: string }> = ({
  platform,
  size = 18,
  className = "",
}) => {
  const norm = (platform || "").trim().toLowerCase();
  if (norm.includes("linkedin")) {
    return <LinkedInLogo size={size} className={className} />;
  }
  const iconUrl = getPortalIconUrl(platform);
  return (
    <img
      src={iconUrl}
      alt={platform}
      width={size}
      height={size}
      className={`w-full h-full object-contain rounded-full inline-block shrink-0 select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      loading="eager"
      decoding="async"
    />
  );
};

const ALL_EXTERNAL_PLATFORMS = [
  {
    id: "medium",
    name: "Medium",
    title: "Medium",
    profileUrl: "https://medium.com/@avinashts1122",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    title: "LinkedIn",
    profileUrl: "https://www.linkedin.com/in/avinash-shajan-169b631aa/",
  },
  {
    id: "substack",
    name: "Substack",
    title: "Substack",
    profileUrl: "https://substack.com/@avinashshajan",
  },
  {
    id: "devio",
    name: "Dev.io",
    title: "Dev.to",
    profileUrl: "https://dev.to/avinashts1122",
  },
  {
    id: "reddit",
    name: "Reddit",
    title: "Reddit",
    profileUrl: "https://www.reddit.com/user/avinashts1122",
  },
] as const;

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
      className="w-full lg:border-l lg:border-[var(--line)] lg:pl-8 xl:pl-10 space-y-6 pt-1 lg:pt-0"
    >
      {/* Sidebar Header Title */}
      <div className="flex items-center justify-between pb-1 gap-2">
        <h2 className="text-[13px] sm:text-[14px] font-sans font-semibold tracking-tight text-[var(--ink)]">
          Articles on other platforms
        </h2>
        <div
          className="flex items-center gap-2 shrink-0"
          aria-label="Author profiles on other platforms: Medium, LinkedIn, Substack, Dev.to, Reddit"
        >
          {ALL_EXTERNAL_PLATFORMS.map((plat) => (
            <a
              key={plat.id}
              href={plat.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-2xs hover:scale-115 hover:shadow-xs transition-all duration-150 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              title={`Visit Avinash on ${plat.title}`}
              aria-label={`Visit Avinash's profile on ${plat.title}`}
            >
              <PlatformLogo platform={plat.name} size={26} className="w-full h-full object-contain" />
            </a>
          ))}
        </div>
      </div>

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
                className="w-[18px] h-[18px] rounded-full overflow-hidden flex items-center justify-center shrink-0"
                title={`Published on ${art.platform}`}
              >
                <PlatformLogo platform={art.platform} size={18} />
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
