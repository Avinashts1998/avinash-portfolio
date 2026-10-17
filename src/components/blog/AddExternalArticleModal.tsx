import React, { useState, useEffect } from "react";
import { X, Sparkles, Trash2, Globe, Clock, Tag, BookOpen, Layers } from "lucide-react";
import { ExternalArticle, ExternalPlatform } from "../../types/externalArticle";
import { saveExternalArticles, getExternalArticles } from "../../data/externalArticles";
import { useScrollLock } from "../../hooks/useScrollLock";

const MEDIUM_ICON_URL = "https://res.cloudinary.com/p66qxgqe/image/upload/v1790675748/pailt5wgsvujldpjhsl0.png";
const LINKEDIN_ICON_URL = "https://res.cloudinary.com/p66qxgqe/image/upload/v1785159955/hbzwr4eeotny0cvxzyop.svg";

interface AddExternalArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (article: ExternalArticle) => void;
  initialArticle?: ExternalArticle | null;
}

export function extractTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (!segments.length) return "";

    let slug = segments[segments.length - 1];
    if (segments.includes("pulse")) {
      const pIdx = segments.indexOf("pulse");
      if (segments[pIdx + 1]) slug = segments[pIdx + 1];
    }

    // Strip trailing hash from Medium (e.g. -7a8f9b1c2)
    slug = slug.replace(/-[a-f0-9]{8,}$/i, "");
    slug = slug.replace(/-\d+$/, "");

    const words = slug.split(/[-_]+/).filter(Boolean);
    if (!words.length) return "";

    return words
      .map((w) => {
        const lower = w.toLowerCase();
        if (lower === "ui") return "UI";
        if (lower === "ux") return "UX";
        if (lower === "ai") return "AI";
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  } catch {
    return "";
  }
}

const PLATFORMS: ExternalPlatform[] = ["Medium", "LinkedIn", "Substack", "Dev.to"];

export default function AddExternalArticleModal({
  isOpen,
  onClose,
  onAdded,
  initialArticle = null,
}: AddExternalArticleModalProps) {
  useScrollLock(isOpen);

  const [title, setTitle] = useState("");
  const [excerpt, setContent] = useState("");
  const [platform, setPlatform] = useState<ExternalPlatform>("Medium");
  const [publication, setPublication] = useState("");
  const [readTime, setReadTime] = useState("5 min read");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("UX & AI");
  const [authorName, setAuthorName] = useState("Avinash Shajan");
  const [clapsOrLikes, setClapsOrLikes] = useState<number | undefined>(undefined);

  const isEditing = Boolean(initialArticle);

  useEffect(() => {
    if (initialArticle) {
      setTitle(initialArticle.title || "");
      setContent(initialArticle.excerpt || "");
      setPlatform(initialArticle.platform || "Medium");
      setPublication(initialArticle.publication || "");
      setReadTime(initialArticle.readTime || "5 min read");
      setUrl(initialArticle.url || "");
      setTopic(initialArticle.topic || "UX & AI");
      setAuthorName(initialArticle.author?.name || "Avinash Shajan");
      setClapsOrLikes(initialArticle.clapsOrLikes);
    } else {
      setTitle("");
      setContent("");
      setPlatform("Medium");
      setPublication("");
      setReadTime("5 min read");
      setUrl("");
      setTopic("UX & AI");
      setAuthorName("Avinash Shajan");
      setClapsOrLikes(undefined);
    }
  }, [initialArticle, isOpen]);

  if (!isOpen) return null;

  // Auto-detect platform and extract title when URL changes
  const handleUrlChange = (val: string) => {
    setUrl(val);
    const lower = val.toLowerCase();

    // Auto-select platform from URL if not already explicitly selected
    if (lower.includes("medium.com")) {
      setPlatform("Medium");
      if (!publication) setPublication("Medium");
    } else if (lower.includes("linkedin.com")) {
      setPlatform("LinkedIn");
      if (!publication) setPublication("LinkedIn");
    } else if (lower.includes("substack.com")) {
      setPlatform("Substack");
    } else if (lower.includes("dev.to")) {
      setPlatform("Dev.to");
    }

    // Auto-extract title if title is currently empty
    if (!title || !title.trim()) {
      const extracted = extractTitleFromUrl(val);
      if (extracted) {
        setTitle(extracted);
      }
    }
  };

  const handleSelectPlatform = (selected: ExternalPlatform) => {
    setPlatform(selected);
    if (selected === "Medium" && (!publication || publication === "LinkedIn")) {
      setPublication("Medium");
    } else if (selected === "LinkedIn" && (!publication || publication === "Medium")) {
      setPublication("LinkedIn");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !url.trim()) return;

    const current = getExternalArticles();
    const finalTitle = title.trim() || extractTitleFromUrl(url) || "Untitled Article";

    if (isEditing && initialArticle) {
      const updatedList = current.map((item) =>
        item.id === initialArticle.id
          ? {
              ...item,
              title: finalTitle,
              excerpt: excerpt.trim() || undefined,
              platform,
              publication: publication.trim() || (platform === "Medium" ? "Medium" : "LinkedIn"),
              author: {
                ...item.author,
                name: authorName.trim() || "Avinash Shajan",
              },
              readTime: readTime.trim() || "4 min read",
              url: url.trim(),
              topic: topic.trim() || "Design",
              clapsOrLikes: clapsOrLikes,
            }
          : item
      );
      saveExternalArticles(updatedList);
      if (onAdded) {
        const found = updatedList.find((x) => x.id === initialArticle.id);
        if (found) onAdded(found);
      }
    } else {
      const newArticle: ExternalArticle = {
        id: `ext-${Date.now()}`,
        title: finalTitle,
        excerpt: excerpt.trim() || undefined,
        platform,
        publication: publication.trim() || (platform === "Medium" ? "Medium" : "LinkedIn"),
        author: {
          name: authorName.trim() || "Avinash Shajan",
          handle: platform === "Medium" ? "@avinashshajan" : "in/avinashshajan",
        },
        publishedDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
        readTime: readTime.trim() || "4 min read",
        url: url.trim(),
        topic: topic.trim() || "Design",
        clapsOrLikes: clapsOrLikes,
        createdAt: Date.now(),
      };

      saveExternalArticles([newArticle, ...current]);
      if (onAdded) onAdded(newArticle);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!initialArticle) return;
    const current = getExternalArticles();
    const updated = current.filter((x) => x.id !== initialArticle.id);
    saveExternalArticles(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl lg:max-w-5xl bg-[var(--bg)] border border-[var(--line)] rounded-2xl sm:rounded-3xl shadow-modal overflow-hidden my-auto flex flex-col z-10"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)] bg-[var(--bg)] shrink-0 z-20">
          <div>
            <h3 className="font-hero font-bold text-lg sm:text-xl text-[var(--ink)] tracking-tight">
              {isEditing ? "Edit External Article" : "Add External Article"}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
              Add your story from Medium, LinkedIn, or external platforms to your blog sidebar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body: Simple, Minimal, Clean Writing Canvas */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 sm:px-10 py-6 space-y-6">
            
            {/* Platform Selector: Minimal pill toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {PLATFORMS.map((p) => {
                const isSelected = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPlatform(p)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-[var(--line)]"
                    }`}
                  >
                    <img
                      src={p === "Medium" ? MEDIUM_ICON_URL : LINKEDIN_ICON_URL}
                      alt={p}
                      className="w-3.5 h-3.5 object-contain"
                    />
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>

            {/* Minimal Writing Canvas */}
            <div className="space-y-4 pt-2">
              {/* Title Input */}
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article Title / Headline..."
                  className="w-full bg-transparent text-xl sm:text-2xl font-hero font-bold text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none tracking-tight pr-28"
                />
                {url && !title && (
                  <button
                    type="button"
                    onClick={() => {
                      const ext = extractTitleFromUrl(url);
                      if (ext) setTitle(ext);
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--blue)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Auto-detect</span>
                  </button>
                )}
              </div>

              {/* URL Input (clean, minimal line) */}
              <div className="flex items-center gap-2 py-1 border-b border-[var(--line)]/60 text-sm">
                <Globe size={16} className="text-[var(--muted)] shrink-0" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste article URL (e.g. https://medium.com/@... or https://linkedin.com/pulse/...)"
                  className="w-full bg-transparent text-xs sm:text-sm font-sans text-[var(--ink)] placeholder:text-[var(--muted)]/50 focus:outline-none"
                />
              </div>

              {/* Story / Excerpt Textarea */}
              <textarea
                value={excerpt}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Write your thought, reflection, or key takeaway here..."
                className="w-full bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none resize-none leading-relaxed text-sm sm:text-base font-sans min-h-[100px]"
              />

              {/* Metadata Inputs (Publication, Read Time, Topic Tag) - Minimal inline strip */}
              <div className="pt-4 border-t border-[var(--line)]/60">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Publication / Channel */}
                  <div className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-soft)] px-3.5 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                    <Layers size={15} className="text-[var(--blue)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] uppercase tracking-wider font-mono text-[var(--muted)] font-medium">Channel / Publication</label>
                      <input
                        type="text"
                        value={publication}
                        onChange={(e) => setPublication(e.target.value)}
                        placeholder={platform === "Medium" ? "UX Collective" : "LinkedIn"}
                        className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-sans font-semibold mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Read Time */}
                  <div className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-soft)] px-3.5 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                    <Clock size={15} className="text-[var(--muted)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] uppercase tracking-wider font-mono text-[var(--muted)] font-medium">Read Time</label>
                      <input
                        type="text"
                        value={readTime}
                        onChange={(e) => setReadTime(e.target.value)}
                        placeholder="5 min read"
                        className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-sans font-semibold mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Topic Tag */}
                  <div className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-soft)] px-3.5 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                    <Tag size={15} className="text-[var(--muted)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] uppercase tracking-wider font-mono text-[var(--muted)] font-medium">Topic Tag</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="UX & AI, Systems"
                        className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-sans font-semibold mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Minimal Bottom Action Bar */}
          <div className="px-6 sm:px-10 py-4 border-t border-[var(--line)] bg-[var(--bg)] shrink-0 flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-sans font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Article</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim() && !title.trim()}
                className="px-6 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <span>{isEditing ? "Update Article" : "Publish Article"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
