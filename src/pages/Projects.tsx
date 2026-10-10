import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getPreviousPath } from "../utils/navigationHistory";
import Tag from "../components/ui/Tag";
import CustomDropdown from "../components/ui/CustomDropdown";
import ScrollReveal from "../components/layout/ScrollReveal";
import ComingSoonFrame from "../components/common/ComingSoonFrame";
import { 
  ArrowRight, 
  ChevronDown, 
  Check, 
  Share2 as Share, 
  AlertCircle, 
  Info, 
  ArrowLeft, 
  Calendar,
  Search,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCircle2,
  Eye
} from "lucide-react";
import { subscriptionService, SubscribeResponse } from "../services/subscriptionService";
import EmailPreviewModal from "../components/common/EmailPreviewModal";
import { CASE_STUDIES } from "../data/caseStudies";
import { PRODUCT_TYPE_OPTIONS, CATEGORY_OPTIONS } from "../components/admin/CreateProjectModal";

// Deterministic stats generator based on project title
const getProjectStats = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const views = (absHash % 1200000) + 248000;
  const saves = Math.floor(views * 0.00021) + 42;
  const likes = Math.floor(views * 0.00045) + 112;
  const comments = Math.floor(likes * 0.12) + 8;

  return {
    views: views.toLocaleString(),
    saves: saves.toLocaleString(),
    likes: likes.toLocaleString(),
    comments: comments.toLocaleString()
  };
};

// Tags mapping for project
const getProjectTags = (project: any) => {
  const list: string[] = [];
  if (project.product === "mobile_app") {
    list.push("crypto", "finance", "motion", "logo", "branding", "mobile icon", "mobile app", "ui", "design");
  } else {
    list.push("dashboard", "analytics", "ui", "ux", "web design", "finance", "data tool", "branding", "motion");
  }
  if (project.category) {
    list.push(project.category.toLowerCase());
  }
  return Array.from(new Set(list)).slice(0, 9);
};

import { getLenis } from "../hooks/useLenis";
import { useLoader } from "../context/LoaderContext";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { dataStore } from "../utils/dataStore";
import { projectService, sortProjectsByLatest } from "../services/projectService";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import ShortDetailsModal from "../components/projects/ShortDetailsModal";
import ShareModal from "../components/projects/ShareModal";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    subtitle: string;
    tag: string;
    category: string;
    description: string;
    thumbnail: string;
    link: string;
    year: string;
    month: string;
    isNew: boolean;
    isLive: boolean;
    product?: string;
    buttonText?: string;
    ctaLabel?: string;
  };
  idx: number;
}

function ProjectCard({ project, idx }: ProjectCardProps) {
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [isImgError, setIsImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShortDetails, setShowShortDetails] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  const customContribs = (project as any).keyContributions;
  const hasCustomContribs = Array.isArray(customContribs)
    ? customContribs.length > 0
    : Boolean(customContribs);

  const detailsToDisplay = {
    projectName: project.title,
    onelineDescription: project.description || project.subtitle || "Comprehensive case study and product design details.",
    position: {
      role: (project as any).role || "Product Designer",
      keyContributions: hasCustomContribs
        ? customContribs
        : `${project.tag || project.category || "Product Design"} • UX Strategy • Prototyping`,
    },
    duration: {
      duration: (project as any).duration || "3 Months",
      startAndEnd: (project as any).year ? `2024 - ${project.year}` : "2024 - Present",
    },
    createdDate: (project as any).month ? `${(project as any).month} ${(project as any).year}` : (project as any).year ? `June ${(project as any).year}` : "June 2026",
  };

  // Trigger Lenis resize on load to prevent layout shift desyncs
  const handleOnLoad = () => {
    setIsImgLoaded(true);
    getLenis()?.resize();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  // Optimize Cloudinary URL (width: 800 for 3-column responsive grid on desktop)
  const optimizedThumbnail = getOptimizedImageUrl(project.thumbnail, 800);

  return (
    <ScrollReveal delay={0.05 * (idx % 3)}>
      <div className="flex flex-col space-y-2 relative group/card">
        {/* Left Column: Image Thumbnail */}
        <Link 
          to={project.link}
          state={{ from: "/projects" }}
          className="group project-card-image w-full aspect-[3/2] bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/50 dark:border-white/[0.06] shadow-none rounded-2xl flex items-center justify-center overflow-hidden relative p-4 sm:p-5 cursor-pointer block hover:border-[var(--blue)]/40 transition-[border-color] duration-300"
        >
          {optimizedThumbnail && !isImgError ? (
            <>
              <img 
                src={optimizedThumbnail} 
                alt={project.title}
                referrerPolicy="no-referrer"
                width={project.product === "desktop_software" ? 800 : 533}
                height={533}
                style={{ aspectRatio: project.product === "desktop_software" ? "16/10" : "3/4" }}
                onLoad={handleOnLoad}
                className={`w-full h-full object-contain select-none pointer-events-none transition-[transform,opacity] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] ${
                  isImgLoaded
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-[0.96] translate-y-3"
                }`}
                onError={() => setIsImgError(true)}
              />
              {!isImgLoaded && (
                <div className="absolute inset-0 bg-neutral-200/20 animate-pulse rounded-2xl flex items-center justify-center">
                  <span className="text-xs font-mono tracking-wider text-neutral-400">Loading Preview...</span>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 p-2">
              <ComingSoonFrame
                title={`${project.title}`}
                subtitle="Image Coming Soon"
                aspectRatio="aspect-full h-full"
                className="w-full h-full rounded-xl border-dashed border-[var(--line)]"
              />
            </div>
          )}

          {/* Hover Overlay showing Description and Created Date */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out flex flex-col justify-end p-4 sm:p-5 z-10 rounded-2xl pointer-events-none">
            {detailsToDisplay.onelineDescription && (
              <p className="text-white/85 text-[12px] sm:text-[13px] line-clamp-2 leading-snug font-sans drop-shadow-xs select-none">
                {detailsToDisplay.onelineDescription}
              </p>
            )}
            <span className="text-white/65 text-[11px] font-mono font-medium tracking-wide uppercase mt-1.5 select-none">
              {detailsToDisplay.createdDate}
            </span>
          </div>
        </Link>
        
        {/* Project Title Below the Box */}
        <div className="px-1 py-1 flex items-start justify-between gap-3">
          <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={project.link}
                state={{ from: "/projects" }}
                className="text-[18px] font-sans font-[650] tracking-tight text-[var(--ink)] hover:text-[var(--blue)] transition-colors duration-300 inline-block cursor-pointer"
                style={{ fontWeight: 650 }}
              >
                {project.title}
              </Link>
            </div>
            <p className="text-[14px] font-sans text-neutral-500 dark:text-neutral-400 font-medium tracking-tight truncate">
              {project.tag}
            </p>
          </div>

          {/* Action Buttons: Info & Share */}
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {/* Info / Details Button (with Info icon) */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowShortDetails(true);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                aria-label="View project details"
                className="group/info flex items-center justify-center p-2 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--blue-tint)] hover:border-[var(--blue)]/30 hover:text-[var(--blue)] text-[var(--ink-soft)] transition-all duration-250 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--blue)]/20"
              >
                <Info size={13} className="transition-transform duration-300 group-hover/info:scale-110" />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 5, scale: prefersReducedMotion ? 1 : 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 3, scale: prefersReducedMotion ? 1 : 0.95 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 26 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-[#0d0d15] text-[#f4f4f5] text-[13px] font-sans font-medium tracking-tight px-3.5 py-2 rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] pointer-events-none whitespace-nowrap z-50 border border-white/5"
                    style={{ originX: 1, originY: 0.5 }}
                  >
                    Shot details
                    {/* Triangle Pointer */}
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#0d0d15] border-t border-r border-white/5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Share Button on the Right Side */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={handleShare}
                onMouseEnter={() => setShowShareTooltip(true)}
                onMouseLeave={() => setShowShareTooltip(false)}
                onFocus={() => setShowShareTooltip(true)}
                onBlur={() => setShowShareTooltip(false)}
                aria-label={`Share ${project.title}`}
                className="group/share flex items-center justify-center p-2 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--blue-tint)] hover:border-[var(--blue)]/30 hover:text-[var(--blue)] text-[var(--ink-soft)] transition-all duration-250 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--blue)]/20"
              >
                <Share size={14} className="transition-transform duration-300 group-hover/share:scale-110" />
              </button>
              <AnimatePresence>
                {!copied && showShareTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5, scale: prefersReducedMotion ? 1 : 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 3, scale: prefersReducedMotion ? 1 : 0.95 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 26 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#0d0d15] text-[#f4f4f5] text-[13px] font-sans font-medium tracking-tight px-3.5 py-2 rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-white/5 pointer-events-none whitespace-nowrap z-50"
                    style={{ originX: 0.5, originY: 1 }}
                  >
                    Share
                    {/* Triangle Pointer */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 bg-[#0d0d15] border-b border-r border-white/5" />
                  </motion.div>
                )}
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 3 }}
                    className="absolute right-0 bottom-full mb-2 bg-neutral-900/95 dark:bg-zinc-900/95 text-white text-[10px] font-mono font-medium tracking-wider uppercase px-2.5 py-1 rounded-[4px] shadow-md border border-neutral-800 dark:border-zinc-700 pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5"
                  >
                    <Check size={10} className="text-emerald-400 shrink-0" />
                    <span>Copied</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Short Details Modal */}
        <AnimatePresence>
          {showShortDetails && (
            <ShortDetailsModal
              onClose={() => setShowShortDetails(false)}
              details={detailsToDisplay}
            />
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <ShareModal
              onClose={() => setShowShareModal(false)}
              project={{
                title: project.title,
                thumbnail: getOptimizedImageUrl(project.thumbnail, 600),
                link: project.link
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </ScrollReveal>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded } = useLoader();
  const shouldReduceMotion = useReducedMotion();
  const [projectsList, setProjectsList] = useState(() => dataStore.getProjects());

  const handleBack = () => {
    const currentPath = location.pathname;
    const prevPath = getPreviousPath();
    if (prevPath && prevPath !== currentPath) {
      navigate(-1);
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          navigate(prevPath);
        }
      }, 120);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((updated) => {
      if (updated) {
        setProjectsList(updated);
      }
    });

    const handleUpdate = () => {
      setProjectsList(dataStore.getProjects());
    };
    window.addEventListener("portfolio_data_update", handleUpdate);
    return () => {
      unsub();
      window.removeEventListener("portfolio_data_update", handleUpdate);
    };
  }, []);

  // Recalculate Lenis scroll dimensions once loader dismisses and animations complete
  useEffect(() => {
    if (isLoaded) {
      getLenis()?.resize();

      const timers = [
        setTimeout(() => getLenis()?.resize(), 400),
        setTimeout(() => getLenis()?.resize(), 800),
        setTimeout(() => getLenis()?.resize(), 1200),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isLoaded]);

  const sortedProjectsList = sortProjectsByLatest(projectsList);

  const projects = sortedProjectsList.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.category,
    tag: p.productType || p.category || (p.product === "mobile_app" ? "Mobile Application" : "Desktop Software"),
    category: p.category || p.productType || (p.product === "mobile_app" ? "Mobile App" : "Desktop Software"),
    productType: p.productType || p.category || (p.product === "mobile_app" ? "Mobile App" : "Desktop Software"),
    description: p.description,
    thumbnail: Array.isArray(p.thumbnail) ? p.thumbnail[0] : (p.thumbnail || ""),
    link: `/project/${p.id}`,
    year: (p as any).year || (p.isNew ? "2026" : "2025"),
    month: (p as any).month || (p.isNew ? "June" : "July"),
    isNew: Boolean(p.isNew === true || (p.isNew as any) === "Yes" || (p.isNew as any) === "true"),
    isLive: Boolean(p.isLive === true || (p.isLive as any) === "Yes" || (p.isLive as any) === "true"),
    product: p.product,
    keyContributions: p.keyContributions,
  }));

  // Helper: Extract industry and domain types associated with a project
  const getProjectTypes = (p: any): string[] => {
    const types: string[] = [];
    const text = [
      p.title,
      p.subtitle,
      p.category,
      p.productType,
      p.description,
      p.shortDetails,
      p.details,
      p.tag,
      Array.isArray(p.tags) ? p.tags.join(" ") : "",
      Array.isArray(p.keyContributions) ? p.keyContributions.join(" ") : "",
      (p as any).type,
      (p as any).industry,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Fintech
    if (
      text.includes("fintech") ||
      text.includes("finance") ||
      text.includes("crypto") ||
      text.includes("banking") ||
      text.includes("payment") ||
      text.includes("wallet") ||
      text.includes("trading") ||
      text.includes("crux")
    ) {
      types.push("Fintech");
    }

    // Health
    if (
      text.includes("health") ||
      text.includes("fitness") ||
      text.includes("physio") ||
      text.includes("rehabilitation") ||
      text.includes("workout") ||
      text.includes("therapy") ||
      text.includes("medical") ||
      text.includes("fitznow")
    ) {
      types.push("Health");
    }

    // eCommerce
    if (
      text.includes("ecommerce") ||
      text.includes("e-commerce") ||
      text.includes("retail") ||
      text.includes("b2c") ||
      text.includes("store") ||
      text.includes("shopping") ||
      text.includes("order") ||
      text.includes("crux")
    ) {
      types.push("eCommerce");
    }

    // IoT & Smart Home
    if (
      text.includes("iot") ||
      text.includes("smart home") ||
      text.includes("hardware") ||
      text.includes("sensors") ||
      text.includes("controller") ||
      text.includes("home decor") ||
      text.includes("smart soil") ||
      text.includes("agricultural")
    ) {
      types.push("IoT & Smart Home");
    }

    // Enterprise & SaaS
    if (
      text.includes("crm") ||
      text.includes("saas") ||
      text.includes("b2b") ||
      text.includes("enterprise") ||
      text.includes("workspace") ||
      text.includes("operations") ||
      text.includes("analytics") ||
      text.includes("dashboard")
    ) {
      types.push("Enterprise & SaaS");
    }

    // Automotive & Mobility
    if (
      text.includes("car") ||
      text.includes("automotive") ||
      text.includes("mobility") ||
      text.includes("navigation") ||
      text.includes("parking") ||
      text.includes("vehicle")
    ) {
      types.push("Automotive & Mobility");
    }

    // Direct custom type or productType match
    if (p.productType && !["desktop software", "mobile app", "mobile application"].includes(p.productType.toLowerCase().trim())) {
      if (!types.some((t) => t.toLowerCase() === p.productType.toLowerCase().trim())) {
        types.push(p.productType.trim());
      }
    }
    if ((p as any).type && typeof (p as any).type === "string") {
      if (!types.some((t) => t.toLowerCase() === (p as any).type.toLowerCase().trim())) {
        types.push((p as any).type.trim());
      }
    }

    return types;
  };

  // Helper: Category format and domain matching
  const matchesCategory = (p: any, cat: string): boolean => {
    if (!cat || cat === "All Categories" || cat === "All Projects") return true;
    const cLower = cat.toLowerCase().trim();

    // 1. Direct field matches
    if (p.category?.toLowerCase() === cLower) return true;
    if (p.productType?.toLowerCase() === cLower) return true;
    if (p.tag?.toLowerCase() === cLower) return true;
    if (p.subtitle?.toLowerCase() === cLower) return true;
    if ((p as any).type?.toLowerCase() === cLower) return true;

    // 2. Mobile App
    if (cLower === "mobile app" || cLower === "mobile application") {
      return (
        p.product === "mobile_app" ||
        p.productType?.toLowerCase().includes("mobile") ||
        p.category?.toLowerCase().includes("mobile") ||
        p.tag?.toLowerCase().includes("mobile")
      );
    }

    // 3. Desktop Software
    if (cLower === "desktop software") {
      return (
        p.product === "desktop_software" ||
        p.productType?.toLowerCase().includes("desktop") ||
        p.category?.toLowerCase().includes("desktop") ||
        p.tag?.toLowerCase().includes("desktop") ||
        p.tag?.toLowerCase().includes("crm")
      );
    }

    // 4. Web Platform & Web Application
    if (cLower === "web platform" || cLower === "web application") {
      return (
        p.productType?.toLowerCase().includes("web") ||
        p.category?.toLowerCase().includes("web") ||
        p.tag?.toLowerCase().includes("web")
      );
    }

    // 5. Website
    if (cLower === "website") {
      return (
        p.productType?.toLowerCase().includes("website") ||
        p.category?.toLowerCase().includes("website") ||
        p.tag?.toLowerCase().includes("website")
      );
    }

    // 6. Design System
    if (cLower === "design system") {
      return (
        p.productType?.toLowerCase().includes("design system") ||
        p.category?.toLowerCase().includes("design system") ||
        p.tag?.toLowerCase().includes("design system")
      );
    }

    // 7. Dashboard
    if (cLower === "dashboard") {
      return (
        p.productType?.toLowerCase().includes("dashboard") ||
        p.category?.toLowerCase().includes("dashboard") ||
        p.tag?.toLowerCase().includes("dashboard")
      );
    }

    // 8. SaaS Platform / Enterprise Software
    if (cLower === "saas platform") {
      return (
        p.productType?.toLowerCase().includes("saas") ||
        p.category?.toLowerCase().includes("saas")
      );
    }
    if (cLower === "enterprise software") {
      return (
        p.productType?.toLowerCase().includes("enterprise") ||
        p.category?.toLowerCase().includes("enterprise")
      );
    }

    // 9. FinTech
    if (cLower === "fintech") {
      return (
        p.category?.toLowerCase().includes("fintech") ||
        p.productType?.toLowerCase().includes("fintech") ||
        getProjectTypes(p).some((t) => t.toLowerCase().includes("fintech"))
      );
    }

    // 10. Health & Fitness
    if (cLower === "health & fitness" || cLower === "health") {
      return (
        p.category?.toLowerCase().includes("health") ||
        p.category?.toLowerCase().includes("fitness") ||
        p.productType?.toLowerCase().includes("health") ||
        getProjectTypes(p).some((t) => t.toLowerCase().includes("health"))
      );
    }

    // 11. E-commerce
    if (cLower === "e-commerce" || cLower === "ecommerce") {
      return (
        p.category?.toLowerCase().includes("commerce") ||
        p.category?.toLowerCase().includes("retail") ||
        p.productType?.toLowerCase().includes("commerce") ||
        getProjectTypes(p).some((t) => t.toLowerCase().includes("commerce"))
      );
    }

    // 12. AI & Machine Learning
    if (cLower === "ai & machine learning" || cLower === "ai") {
      return (
        p.category?.toLowerCase().includes("ai") ||
        p.category?.toLowerCase().includes("machine") ||
        p.productType?.toLowerCase().includes("ai") ||
        p.description?.toLowerCase().includes("ai")
      );
    }

    // 13. General substring / text match fallback
    const pCat = (p.category || "").toLowerCase();
    const pType = (p.productType || "").toLowerCase();
    const pTag = (p.tag || "").toLowerCase();
    const pSub = (p.subtitle || "").toLowerCase();

    return (
      pCat.includes(cLower) ||
      pType.includes(cLower) ||
      pTag.includes(cLower) ||
      pSub.includes(cLower) ||
      getProjectTypes(p).some((t) => t.toLowerCase() === cLower)
    );
  };

  // Helper: Type matching logic
  const matchesType = (p: any, type: string): boolean => {
    if (!type || type === "All Types" || type === "All Projects") return true;
    const tLower = type.toLowerCase().trim();

    // 1. Direct field matches
    if (p.productType?.toLowerCase() === tLower) return true;
    if (p.category?.toLowerCase() === tLower) return true;
    if (p.tag?.toLowerCase() === tLower) return true;
    if ((p as any).type?.toLowerCase() === tLower) return true;

    // 2. Platform formats
    if (tLower === "mobile app") {
      return (
        p.product === "mobile_app" ||
        p.productType?.toLowerCase().includes("mobile") ||
        p.tag?.toLowerCase().includes("mobile")
      );
    }
    if (tLower === "desktop software") {
      return (
        p.product === "desktop_software" ||
        p.productType?.toLowerCase().includes("desktop") ||
        p.tag?.toLowerCase().includes("desktop")
      );
    }
    if (tLower === "web platform" || tLower === "web application") {
      return (
        p.productType?.toLowerCase().includes("web") ||
        p.category?.toLowerCase().includes("web") ||
        p.tag?.toLowerCase().includes("web")
      );
    }

    // 3. Types list matching
    const projectTypes = getProjectTypes(p);
    if (projectTypes.some((t) => t.toLowerCase() === tLower || t.toLowerCase().includes(tLower) || tLower.includes(t.toLowerCase()))) {
      return true;
    }

    // 4. Substring fallback
    const pType = (p.productType || "").toLowerCase();
    const pCat = (p.category || "").toLowerCase();
    return pType.includes(tLower) || pCat.includes(tLower);
  };

  // Build dynamic dropdown types list
  const typesSet = new Set<string>();
  const normalizedTypesList: string[] = ["All Types"];

  const registerType = (t?: string) => {
    if (!t) return;
    const trimmed = t.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === "all" || lower === "all types" || lower === "all projects") return;
    if (!typesSet.has(lower)) {
      typesSet.add(lower);
      normalizedTypesList.push(trimmed);
    }
  };

  // 1. All creation Product Types
  PRODUCT_TYPE_OPTIONS.forEach(registerType);
  registerType("Desktop Software");

  // 2. Domain & Industry Types (CATEGORY_OPTIONS + extras)
  CATEGORY_OPTIONS.forEach(registerType);
  registerType("IoT & Smart Home");
  registerType("Automotive & Mobility");
  registerType("Enterprise & SaaS");

  // 3. Dynamic types from actual user projects
  projectsList.forEach((p) => {
    registerType(p.productType);
    registerType((p as any).type);
    registerType(p.category);
  });

  const typesList = normalizedTypesList;

  // Build comprehensive Category list reflecting all project creation categories
  // (from CreateProjectModal CATEGORY_OPTIONS and PRODUCT_TYPE_OPTIONS)
  // as well as any categories present on existing projects.
  const categoriesSet = new Set<string>();
  const normalizedCategoryList: string[] = ["All Categories"];

  const registerCategory = (cat?: string) => {
    if (!cat) return;
    const trimmed = cat.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === "all" || lower === "all projects" || lower === "all categories") return;
    if (!categoriesSet.has(lower)) {
      categoriesSet.add(lower);
      normalizedCategoryList.push(trimmed);
    }
  };

  // 1. All creation Category options (CATEGORY_OPTIONS from CreateProjectModal)
  CATEGORY_OPTIONS.forEach(registerCategory);

  // 2. All creation Product Type options (PRODUCT_TYPE_OPTIONS from CreateProjectModal)
  PRODUCT_TYPE_OPTIONS.forEach(registerCategory);

  // 3. Additional platform and industry formats
  registerCategory("Desktop Software");
  registerCategory("Web Platform");
  registerCategory("IoT & Smart Home");
  registerCategory("Automotive & Mobility");
  registerCategory("Enterprise & SaaS");

  // 4. Any custom category, productType, or type from existing projects
  projectsList.forEach((p) => {
    registerCategory(p.category);
    registerCategory(p.productType);
    registerCategory((p as any).type);
    registerCategory((p as any).industry);
  });

  const categoriesList = normalizedCategoryList;

  // Filter states
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const handleResetFilters = () => {
    setSelectedType("All Types");
    setSelectedCategory("All Categories");
  };

  const isFiltered = selectedType !== "All Types" || selectedCategory !== "All Categories";

  // Email subscription state for coming soon / empty state
  const [subEmail, setSubEmail] = useState("");
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [subError, setSubError] = useState("");
  const [subResult, setSubResult] = useState<SubscribeResponse | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError("");

    if (!subEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail)) {
      setSubError("Please enter a valid email address.");
      return;
    }

    setIsSubmittingSub(true);
    try {
      const res = await subscriptionService.subscribe(subEmail, "projects_empty_state");
      if (res.success) {
        setSubResult(res);
        setSubSuccess(true);
      } else {
        setSubError(res.error || "Unable to subscribe. Please try again.");
      }
    } catch {
      setSubError("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleResetSubscription = () => {
    setSubSuccess(false);
    setSubEmail("");
    setSubError("");
    setSubResult(null);
  };

  // Recalculate scroll dimensions whenever filtering changes
  useEffect(() => {
    getLenis()?.resize();
    const timer = setTimeout(() => getLenis()?.resize(), 300);
    return () => clearTimeout(timer);
  }, [selectedType, selectedCategory]);

  const filteredProjects = projects.filter((p) => {
    const matchesTypeFilter = matchesType(p, selectedType);
    const matchesCat = matchesCategory(p, selectedCategory);
    return matchesTypeFilter && matchesCat;
  });

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(() => {
    return typeof document !== "undefined" ? document.getElementById("navbar-subnav-portal") : null;
  });

  useEffect(() => {
    const el = document.getElementById("navbar-subnav-portal");
    if (el) {
      setPortalTarget(el);
    }
  }, []);

  const subnavContent = (
    <div className="w-full max-w-[1150px] 2xl:max-w-[1360px] min-[1900px]:max-w-[1440px] mx-auto px-4 sm:px-6 2xl:px-8">
      <div 
        className="flex flex-row items-center justify-between gap-2.5 sm:gap-4 !pl-0 pt-1 sm:pt-1.5 pb-1 sm:pb-1.5"
      >
        {/* Left Side: Go Back button */}
        <div className="flex items-center shrink-0">
          <button 
            onClick={handleBack}
            className="h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none whitespace-nowrap shadow-none shrink-0 active:scale-95"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span className="font-medium">Go Back</span>
          </button>
        </div>

        {/* Right Side: Filters positioned to the right on the same level */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end">
          {/* Type Filter Dropdown */}
          <CustomDropdown
            variant="pill"
            value={selectedType}
            options={typesList}
            onChange={setSelectedType}
            align="right"
            ariaLabel="Filter projects by industry type"
            triggerClassName="!h-9 sm:!h-10 !normal-case !font-sans !tracking-normal text-xs sm:text-[13px] !font-medium shrink-0"
            menuClassName="w-60 sm:w-64 max-h-80 no-scrollbar"
          />

          {/* Category Filter Dropdown */}
          <CustomDropdown
            variant="pill"
            value={selectedCategory}
            options={categoriesList}
            onChange={setSelectedCategory}
            align="right"
            ariaLabel="Filter projects by platform category"
            triggerClassName="!h-9 sm:!h-10 !normal-case !font-sans !tracking-normal text-xs sm:text-[13px] !font-medium shrink-0"
            menuClassName="w-60 sm:w-64 max-h-80 no-scrollbar"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div id="page-projects" className="space-y-6 sm:space-y-8 -mt-6 sm:-mt-8 pb-2">
      {portalTarget ? createPortal(subnavContent, portalTarget) : (
        <div className="w-full">
          {subnavContent}
        </div>
      )}

      {/* Projects Showcase list */}
      <section className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8 lg:gap-y-8 min-h-[300px]">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-24 px-4 sm:px-8 text-center my-4 relative overflow-hidden">
              {/* Subtle ambient radial pattern */}
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(var(--ink) 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="relative z-10 flex flex-col items-center max-w-xl w-full">
                {/* Coming Soon Heading matching design */}
                <h3 className="text-4xl sm:text-6xl font-bold text-neutral-400 dark:text-zinc-500 tracking-tight leading-tight mb-3 select-none">
                  Coming Soon
                </h3>

                {/* Subtitle with highlighted Subscribe */}
                <p className="text-sm sm:text-base text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                  I'm working on it. Ready for something new?{" "}
                  <span className="text-[var(--blue)] font-semibold">Subscribe</span> to get the latest updates when it goes live.
                </p>

                {/* Email Subscription Feature */}
                <div className="w-full max-w-[440px] mt-6">
                  <AnimatePresence mode="wait">
                    {!subSuccess ? (
                      <motion.form
                        key="proj-sub-form"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        onSubmit={handleSubscribe}
                        className="flex flex-col items-center w-full"
                      >
                        {/* Rounded Pill Container with full-width rounded input */}
                        <div className="relative w-full flex items-center">
                          <input
                            type="email"
                            value={subEmail}
                            onChange={(e) => {
                              setSubEmail(e.target.value);
                              if (subError) setSubError("");
                            }}
                            placeholder="Please enter your email address"
                            disabled={isSubmittingSub}
                            required
                            className="w-full h-11 sm:h-12 pl-4 sm:pl-5 pr-28 sm:pr-32 rounded-full bg-neutral-100/90 dark:bg-zinc-850/90 border border-neutral-200/80 dark:border-white/10 text-xs sm:text-[13.5px] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-zinc-500 font-sans shadow-xs outline-none focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/40 transition-all"
                            style={{ borderRadius: "9999px" }}
                          />

                          <button
                            type="submit"
                            disabled={isSubmittingSub}
                            className="absolute right-1 sm:right-1.5 h-8 sm:h-9 px-4 sm:px-5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-semibold tracking-wide transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
                          >
                            {isSubmittingSub ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <span>Subscribe</span>
                            )}
                          </button>
                        </div>

                        {subError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-rose-500 mt-2 font-medium"
                          >
                            {subError}
                          </motion.p>
                        )}
                      </motion.form>
                    ) : (
                      <motion.div
                        key="proj-sub-success"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="w-full py-3.5 px-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm sm:text-base font-medium text-center shadow-xs"
                      >
                        You are subscribed.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.98 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-full"
                >
                  <ProjectCard project={project} idx={idx} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Subscription Email Preview Modal */}
      {subResult && (
        <EmailPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          email={subResult.email}
          subject={subResult.emailSubject || "You're subscribed! Welcome to Avinash's Design Updates 🎉"}
          htmlContent={subResult.emailHtml || ""}
          previewUrl={subResult.previewUrl}
        />
      )}
    </div>
  );
}

