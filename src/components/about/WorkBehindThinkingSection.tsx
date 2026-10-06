import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ExternalLink } from "lucide-react";
import Icons8AIIcon from "../icons/Icons8AIIcon";
import ScrollReveal from "../layout/ScrollReveal";
import { dataStore, Project } from "../../utils/dataStore";
import { projectService, sortProjectsByLatest } from "../../services/projectService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

interface ShowcaseCardData {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  link: string;
}

const FALLBACK_PROJECTS: ShowcaseCardData[] = [
  {
    id: "safe-routes-maps",
    title: "Safe Routes in Google Maps",
    category: "Maps UX & AI",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    link: "/projects",
  },
  {
    id: "enterprise-ai-platform",
    title: "Enterprise AI Workflows",
    category: "AI & Zero-to-One",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    link: "/projects",
  },
  {
    id: "design-system-scale",
    title: "Design Systems at Scale",
    category: "Design System",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop",
    link: "/projects",
  },
];

export const WorkBehindThinkingSection: React.FC = () => {
  const navigate = useNavigate();
  const [isBoxHovered, setIsBoxHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showcaseCards, setShowcaseCards] = useState<ShowcaseCardData[]>(() => {
    return buildShowcaseCards(dataStore.getProjects());
  });

  function buildShowcaseCards(projects: Project[]): ShowcaseCardData[] {
    const sorted = sortProjectsByLatest(projects || []);
    const cards: ShowcaseCardData[] = [];

    for (const p of sorted) {
      if (cards.length >= 3) break;
      const rawImg =
        (Array.isArray(p.thumbnail) && p.thumbnail[0]) ||
        (Array.isArray(p.images) && p.images[0]) ||
        (Array.isArray(p.heroSectionImg) && p.heroSectionImg[0]) ||
        (typeof p.thumbnail === "string" ? p.thumbnail : "");

      if (rawImg && rawImg.trim()) {
        cards.push({
          id: p.id,
          title: p.title || "Featured Project",
          category: p.category || p.productType || "Case Study",
          imageUrl: rawImg,
          link: `/project/${p.id}`,
        });
      }
    }

    // Fill remaining slots up to 3 cards using fallback cards
    while (cards.length < 3) {
      const fallback = FALLBACK_PROJECTS[cards.length];
      if (fallback) cards.push(fallback);
      else break;
    }

    return cards;
  }

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((updated) => {
      if (updated && updated.length > 0) {
        setShowcaseCards(buildShowcaseCards(updated));
      }
    });
    return () => unsub();
  }, []);

  const handleOpenAIChat = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: { message: "Tell me about Avinash's key projects, case studies, and design impact." },
      })
    );
  };

  // 3 card positioning configurations matching the fanned polaroid reference and Home "out of work" pop effect
  const cardLayoutConfigs = [
    {
      // Left Card: tilted counter-clockwise, fans left and lifts on box hover
      baseRotate: -8,
      boxHoverRotate: -14,
      hoverRotate: -2,
      baseY: 8,
      boxHoverY: -8,
      hoverY: -16,
      baseX: 0,
      boxHoverX: -12,
      baseScale: 0.95,
      boxHoverScale: 1.04,
      hoverScale: 1.14,
      zIndex: 10,
    },
    {
      // Center Card: prominent, foreground, upright, lifts up high on box hover
      baseRotate: 1,
      boxHoverRotate: 0,
      hoverRotate: 0,
      baseY: -4,
      boxHoverY: -16,
      hoverY: -24,
      baseX: 0,
      boxHoverX: 0,
      baseScale: 1.04,
      boxHoverScale: 1.11,
      hoverScale: 1.18,
      zIndex: 20,
    },
    {
      // Right Card: tilted clockwise, fans right and lifts on box hover
      baseRotate: 9,
      boxHoverRotate: 14,
      hoverRotate: 3,
      baseY: 10,
      boxHoverY: -6,
      hoverY: -16,
      baseX: 0,
      boxHoverX: 12,
      baseScale: 0.95,
      boxHoverScale: 1.04,
      hoverScale: 1.14,
      zIndex: 10,
    },
  ];

  return (
    <section className="relative z-10 pt-10 sm:pt-14" id="about-works-showcase-section">
      <ScrollReveal delay={0.1}>
        <div
          onMouseEnter={() => setIsBoxHovered(true)}
          onMouseLeave={() => {
            setIsBoxHovered(false);
            setHoveredCardIndex(null);
          }}
          className="group relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none py-6 sm:py-8 lg:py-9 px-6 sm:px-8 md:px-10 lg:px-12 transition-colors duration-300"
        >
          {/* Subtle atmospheric ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] bg-[var(--blue)]/5 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-10 bottom-0 w-[220px] h-[220px] bg-neutral-400/5 dark:bg-neutral-600/5 rounded-full blur-2xl"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-3.5 sm:space-y-4">
              {/* Eyebrow */}
              <div className="flex items-center">
                <span className="text-xs sm:text-sm font-sans font-medium text-[var(--ink-soft)] tracking-tight">
                  — My work
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-bold tracking-tight text-[var(--ink)] leading-[1.14]">
                The work behind <br className="hidden sm:inline" />
                the thinking
              </h2>

              {/* Description */}
              <p className="text-[var(--ink-soft)] text-xs sm:text-sm font-sans leading-relaxed max-w-[460px]">
                From enterprise AI workflows to design systems and zero-to-one products. See the cases, decisions, and outcomes that define how I design.
              </p>

              {/* Button Group */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                {/* View Works Button */}
                <Link
                  to="/projects"
                  id="about-works-view-button"
                  className="group/btn inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md cursor-pointer select-none hover:[&>svg]:translate-x-1"
                >
                  <span>View works</span>
                  <ArrowRight
                    size={13}
                    className="opacity-90 transition-transform duration-200 ease-out group-hover/btn:translate-x-1 shrink-0"
                  />
                </Link>

                {/* Ask AI Button */}
                <button
                  type="button"
                  id="about-works-ask-ai-button"
                  onClick={handleOpenAIChat}
                  className="group inline-flex items-center justify-center gap-2 px-4.5 sm:px-5 py-2.5 rounded-full bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[var(--ink)] border border-[var(--line)] hover:border-[var(--muted)]/50 text-xs sm:text-sm font-sans font-medium transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs select-none"
                  title="Open AI chat to ask about Avinash's work"
                >
                  <Icons8AIIcon
                    size={14}
                    className="text-[var(--blue)] animate-illuminate group-hover:scale-110 transition-transform duration-200 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Ask AI about Avinash</span>
                </button>
              </div>
            </div>

            {/* Right Column: Fan of Polaroid Project Cards */}
            <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center py-3 sm:py-4 lg:py-2">
              <div className="relative flex items-center justify-center w-full max-w-[380px] sm:max-w-[440px] min-h-[230px] sm:min-h-[270px]">
                {showcaseCards.map((card, idx) => {
                  const cfg = cardLayoutConfigs[idx] || cardLayoutConfigs[1];
                  const isCardHovered = hoveredCardIndex === idx;
                  const isAnyCardHovered = hoveredCardIndex !== null;

                  // Dynamic pop animation logic matching Home "outside of work" section
                  const currentRotate = isCardHovered
                    ? cfg.hoverRotate
                    : isBoxHovered
                    ? cfg.boxHoverRotate
                    : cfg.baseRotate;

                  const currentY = isCardHovered
                    ? cfg.hoverY
                    : isBoxHovered
                    ? cfg.boxHoverY
                    : cfg.baseY;

                  const currentX = isCardHovered
                    ? 0
                    : isBoxHovered
                    ? cfg.boxHoverX
                    : 0;

                  const currentScale = isCardHovered
                    ? cfg.hoverScale
                    : isAnyCardHovered
                    ? cfg.baseScale * 0.94
                    : isBoxHovered
                    ? cfg.boxHoverScale
                    : cfg.baseScale;

                  const currentZIndex = isCardHovered
                    ? 40
                    : isBoxHovered && idx === 1
                    ? 25
                    : cfg.zIndex;

                  return (
                    <motion.div
                      key={card.id || idx}
                      onMouseEnter={() => setHoveredCardIndex(idx)}
                      onMouseLeave={() => setHoveredCardIndex(null)}
                      onClick={() => {
                        if (card.link) navigate(card.link);
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      animate={{
                        rotate: currentRotate,
                        y: currentY,
                        x: currentX,
                        scale: currentScale,
                        zIndex: currentZIndex,
                      }}
                      transition={{
                        duration: 0.55,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`cursor-pointer absolute origin-bottom select-none ${
                        idx === 0
                          ? "-translate-x-14 sm:-translate-x-20 md:-translate-x-24"
                          : idx === 1
                          ? "translate-x-0"
                          : "translate-x-14 sm:translate-x-20 md:translate-x-24"
                      }`}
                      style={{
                        zIndex: currentZIndex,
                      }}
                    >
                      {/* Image Card Frame */}
                      <div
                        className={`w-[150px] sm:w-[185px] md:w-[205px] p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white dark:bg-[#1e1e22] border border-black/8 dark:border-white/10 transition-all duration-500 ease-out ${
                          isCardHovered
                            ? "shadow-[0_24px_48px_rgba(0,0,0,0.22)] dark:shadow-[0_28px_56px_rgba(0,0,0,0.75)] ring-2 ring-[var(--blue)]/40"
                            : isBoxHovered
                            ? "shadow-[0_18px_38px_rgba(0,0,0,0.15)] dark:shadow-[0_22px_44px_rgba(0,0,0,0.6)]"
                            : "shadow-[0_10px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
                        }`}
                      >
                        {/* Image Canvas Container */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] sm:rounded-[6px] bg-neutral-900">
                          <img
                            src={getOptimizedImageUrl(card.imageUrl, 700)}
                            alt={card.title}
                            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                              isCardHovered ? "scale-108" : isBoxHovered ? "scale-104" : "scale-100"
                            }`}
                            loading="lazy"
                          />

                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

                          {/* Hover indicator */}
                          {isCardHovered && (
                            <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/75 backdrop-blur-md text-white shadow-md">
                              <ExternalLink size={11} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default WorkBehindThinkingSection;
