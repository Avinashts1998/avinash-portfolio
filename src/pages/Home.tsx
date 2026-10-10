import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, ArrowUpRight, Layers, ShieldNetwork as Network, Compass, Envelope as Mail, Link as Linkedin, Download, CloudUpload, Upload, Image as ImageIcon, Mobile as Smartphone, Monitor, Calendar } from "reicon-react";
import { motion, useScroll } from "motion/react";
import ScrollReveal from "../components/layout/ScrollReveal";
import Card from "../components/ui/Card";
import Tag from "../components/ui/Tag";
import TestimonialCard from "../components/ui/TestimonialCard";
import { useLoader } from "../context/LoaderContext";
import { getLenis } from "../hooks/useLenis";
import { useResumeModal } from "../context/ResumeModalContext";
import { useContactModal } from "../context/ContactModalContext";
import { dataStore } from "../utils/dataStore";
import { getOptimizedImageUrl, buildCloudinaryUrl } from "../utils/cloudinary";
import { hero_section } from "../feeders/feeder";
import { uiIconsFeeder } from "../ui-feeders/icon-feeders-reicons";
import { projectService, sortProjectsByLatest, getHomeFeaturedProjects } from "../services/projectService";
import ComingSoonFrame from "../components/common/ComingSoonFrame";
import WhatIBringScrollTrigger from "../components/home/WhatIBringScrollTrigger";
import { testimonialService } from "../services/testimonialService";
import { getMergedBlogPosts } from "../data/blogPosts";
import { startGlobalDataAndAssetPreload } from "../utils/firebaseAssetPreloader";
import Icons8AIIcon from "../components/icons/Icons8AIIcon";

const heroProject = dataStore.getProjects().find((p) => p.heroSection);
const backImgUrl = heroProject?.heroSectionImg?.[0]
  ? buildCloudinaryUrl(heroProject.heroSectionImg[0], 1200)
  : "";

const frontImgUrl = heroProject?.heroSectionImg?.[1]
  ? buildCloudinaryUrl(heroProject.heroSectionImg[1], 1200)
  : "";

function DribbbleIcon({ className = "w-4 h-4 fill-current" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.605 4.61a8.002 8.002 0 012.316 5.253c-.333-.07-2.616-.523-5.228-.211a24.16 24.16 0 00-1.077-2.181c2.617-1.127 3.86-2.709 3.989-2.861zM12 3.93c2.012 0 3.847.747 5.254 1.986-.118.156-1.233 1.583-3.693 2.615-1.196-2.193-2.528-4.062-2.72-4.327A7.95 7.95 0 0112 3.93zM9.54 4.582c.197.268 1.531 2.126 2.73 4.305-3.328 1.01-6.702 1.026-7.054 1.023A8.005 8.005 0 019.54 4.582zM3.93 12v-.235c.348.003 4.093.003 7.685-1.111.455.932.87 1.87 1.24 2.805-4.267 1.258-8.243 1.213-8.625 1.205A7.962 7.962 0 013.93 12zm2.085 4.908c.381.008 3.985.035 8.077-1.139.697 1.921 1.229 3.812 1.385 4.385A7.98 7.98 0 016.015 16.908zm11.36 2.502c-.172-.614-.707-2.476-1.393-4.37 2.456-.252 4.606.149 4.905.212a8.003 8.003 0 01-3.512 4.158z" />
    </svg>
  );
}

function MediumIcon({ className = "w-4 h-4 fill-current" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

const getProjectButtonText = (btnText?: string) => {
  if (!btnText) return "View Project";
  const lower = btnText.trim().toLowerCase();
  if (lower === "view project" || lower === "view case study") {
    return "View Project";
  }
  return btnText;
};

interface HomeShowcaseProjectCardProps {
  key?: any;
  project: any;
  index: number;
}

function HomeShowcaseProjectCard({ project, index }: HomeShowcaseProjectCardProps) {
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [isImgError, setIsImgError] = useState(false);

  const handleOnLoad = () => {
    setIsImgLoaded(true);
    getLenis()?.resize();
  };

  // Optimize Cloudinary URL (width: 1000 for main showcase layout)
  const optimizedThumbnail = getOptimizedImageUrl(project.thumbnail, 1000);

  const isLive = Boolean(project.isLive === true || (project.isLive as any) === "Yes" || (project.isLive as any) === "true");
  const isNew = Boolean(project.isNew === true || (project.isNew as any) === "Yes" || (project.isNew as any) === "true");

  return (
    <ScrollReveal delay={0.1 * (index + 1)}>
      {/* Single Panel Container with consistent #ebebeb grey background */}
      <div className="group relative w-full min-[900px]:h-[410px] 2xl:min-h-[460px] 2xl:h-auto h-auto bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none rounded-[20px] overflow-hidden flex flex-col min-[900px]:flex-row items-center gap-8 min-[900px]:gap-12 lg:gap-16 2xl:gap-20 transition-all duration-300 p-6 sm:p-8 min-[900px]:py-10 min-[900px]:pl-14 min-[900px]:pr-12 lg:pr-16 2xl:py-12 2xl:pl-16 2xl:pr-20">
        
        {/* Top Right Badges (Live) */}
        {isLive && (
          <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-20 flex items-center gap-2 pointer-events-none">
            <span className="inline-flex items-center gap-[5px] h-[22px] px-2.5 rounded-full bg-[#fee2e2] text-[#ff0000] text-[10px] font-bold tracking-wider uppercase select-none shadow-xs">
              <span className="relative flex h-[7px] w-[7px] aspect-square shrink-0 items-center justify-center">
                <span className="animate-live-ping absolute inline-flex h-[180%] w-[180%] rounded-full aspect-square bg-red-500/50"></span>
                <span className="absolute inline-flex h-full w-full rounded-full aspect-square bg-red-500/30 animate-live-pulse"></span>
                <span className="relative inline-flex rounded-full aspect-square h-[7px] w-[7px] bg-[#ff0000]"></span>
              </span>
              <span>LIVE</span>
            </span>
          </div>
        )}

        {/* Left Column: Image Area, aligned flush to the left margin on desktop */}
        <div className="relative w-full h-[260px] sm:h-[320px] min-[900px]:h-full shrink-0 flex items-center justify-start overflow-hidden pl-0 ml-0 mt-0 mr-0 min-[900px]:w-[53%] min-[900px]:ml-0 min-[900px]:mr-0">
          {optimizedThumbnail && !isImgError ? (
            <div className={`relative w-full h-full flex items-center ${
              project.product === "desktop_software" ? "justify-start" : "justify-center min-[900px]:justify-end"
            }`}>
              <img
                src={optimizedThumbnail}
                alt={`${project.title} Preview`}
                referrerPolicy="no-referrer"
                loading="eager"
                width={project.product === "desktop_software" ? 1000 : 750}
                height={project.product === "desktop_software" ? 625 : 1000}
                style={{ aspectRatio: project.product === "desktop_software" ? "16/10" : "3/4" }}
                onLoad={handleOnLoad}
                className={`h-full object-contain pointer-events-none select-none transition-[transform,opacity] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] ${
                  project.product === "desktop_software"
                    ? "w-full object-left min-[900px]:ml-[15px]"
                    : project.id === "005"
                      ? "w-[72%] object-center min-[900px]:object-right min-[900px]:mr-[72px]"
                      : "w-[72%] object-center min-[900px]:object-right min-[900px]:mr-[110px]"
                } ${
                  isImgLoaded
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-[0.96] translate-y-3"
                }`}
                onError={() => setIsImgError(true)}
              />
              {!isImgLoaded && (
                <div className="absolute inset-0 bg-neutral-200/50 dark:bg-neutral-800/40 animate-pulse rounded-[12px] flex items-center justify-center">
                  <span className="text-xs font-mono tracking-wider text-neutral-400">Loading Preview...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full p-2">
              <ComingSoonFrame
                title={`${project.title} Preview`}
                subtitle="Visual preview under preparation"
                aspectRatio="aspect-full h-full"
                className="w-full h-full rounded-[20px]"
              />
            </div>
          )}
        </div>

        {/* Right Column: Vertically Centered text block with theme-adaptive contrast */}
        <div className="w-full min-[900px]:flex-1 flex flex-col justify-center text-left py-4 min-[900px]:py-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-2xl sm:text-[26px] 2xl:text-[28px] font-sans font-bold tracking-tight text-neutral-950 dark:text-neutral-50 leading-none">
              {project.title}
            </h3>
            {isNew && (
              <span className="inline-flex items-center justify-center h-[22px] px-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#10b981] text-white select-none animate-badge-shimmer leading-none">
                New
              </span>
            )}
          </div>
          <p className="text-sm sm:text-[14px] 2xl:text-[15px] text-neutral-500 dark:text-neutral-400 font-normal tracking-wide mt-2">
            {project.subtitle}
          </p>
          
          <p className="text-[15px] sm:text-[15px] 2xl:text-[16px] text-neutral-700 dark:text-neutral-300 font-normal leading-relaxed mt-3.5 mb-5 max-w-[400px] 2xl:max-w-[480px]">
            {project.description}
          </p>

          <div>
            <Link
              to={project.link}
              state={{ from: "/#selected-works", fromSection: "selected-works" }}
              onClick={() => {
                const lenis = getLenis();
                const currentY = lenis ? lenis.scroll : window.scrollY;
                try {
                  sessionStorage.setItem("home_featured_scroll", String(currentY));
                } catch {}
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 2xl:px-6 2xl:py-3 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white transition-all duration-300 font-sans text-[14px] 2xl:text-[15px] font-semibold tracking-wide cursor-pointer text-center select-none shadow-none border-none outline-none group"
            >
              <span>{getProjectButtonText(project.buttonText || project.ctaLabel)}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

      </div>
    </ScrollReveal>
  );
}

interface HomeGridProjectCardProps {
  key?: any;
  project: any;
  idx: number;
}

function HomeGridProjectCard({ project, idx }: HomeGridProjectCardProps) {
  const navigate = useNavigate();
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [isImgError, setIsImgError] = useState(false);

  const handleOnLoad = () => {
    setIsImgLoaded(true);
    getLenis()?.resize();
  };

  const handleNavigate = () => {
    const lenis = getLenis();
    const currentY = lenis ? lenis.scroll : window.scrollY;
    try {
      sessionStorage.setItem("home_featured_scroll", String(currentY));
    } catch {}
    navigate(project.link, {
      state: { from: "/#selected-works", fromSection: "selected-works" },
    });
  };

  // Optimize Cloudinary URL (width: 800 for 2-column grid layout on desktop)
  const optimizedThumbnail = getOptimizedImageUrl(project.thumbnail, 800);

  const isLive = Boolean(project.isLive === true || (project.isLive as any) === "Yes" || (project.isLive as any) === "true");
  const isNew = Boolean(project.isNew === true || (project.isNew as any) === "Yes" || (project.isNew as any) === "true");

  return (
    <ScrollReveal delay={0.1 * (idx + 1)}>
      <div 
        onClick={handleNavigate}
        className="group relative w-full min-[900px]:h-[410px] h-[320px] bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none rounded-[20px] overflow-hidden flex items-center justify-center p-6 sm:p-10 transition-all duration-300 cursor-pointer"
      >
        
        {/* Top Right Badges (Live) - Only shown while hovering */}
        {isLive && (
          <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-30 flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
            <span className="inline-flex items-center gap-[5px] h-[22px] px-2.5 rounded-full bg-[#fee2e2] text-[#ff0000] text-[10px] font-bold tracking-wider uppercase select-none shadow-xs">
              <span className="relative flex h-[7px] w-[7px] aspect-square shrink-0 items-center justify-center">
                <span className="animate-live-ping absolute inline-flex h-[180%] w-[180%] rounded-full aspect-square bg-red-500/50"></span>
                <span className="absolute inline-flex h-full w-full rounded-full aspect-square bg-red-500/30 animate-live-pulse"></span>
                <span className="relative inline-flex rounded-full aspect-square h-[7px] w-[7px] bg-[#ff0000]"></span>
              </span>
              <span>LIVE</span>
            </span>
          </div>
        )}

        {/* Mockup Image Centered */}
        <div className="relative w-full h-full flex items-center justify-center p-2">
          {optimizedThumbnail && !isImgError ? (
            <>
              <img
                 src={optimizedThumbnail}
                 alt={`${project.title} Mockup`}
                 referrerPolicy="no-referrer"
                 loading="eager"
                 width={project.product === "desktop_software" ? 800 : 600}
                 height={project.product === "desktop_software" ? 500 : 800}
                 style={{ aspectRatio: project.product === "desktop_software" ? "16/10" : "3/4" }}
                 onLoad={handleOnLoad}
                 className={`w-full h-full object-contain pointer-events-none select-none transition-[transform,opacity] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.01] ${
                   isImgLoaded
                     ? "opacity-100 scale-100 translate-y-0"
                     : "opacity-0 scale-[0.96] translate-y-3"
                 }`}
                 onError={() => setIsImgError(true)}
              />
              {!isImgLoaded && (
                <div className="absolute inset-0 bg-neutral-200/50 dark:bg-neutral-800/40 animate-pulse rounded-[12px] flex items-center justify-center">
                  <span className="text-xs font-mono tracking-wider text-neutral-400">Loading Preview...</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full p-2">
              <ComingSoonFrame
                title={`${project.title}`}
                subtitle="Image Coming Soon"
                aspectRatio="aspect-full h-full"
                className="w-full h-full rounded-[16px]"
              />
            </div>
          )}
        </div>

        {/* Elegant hover overlay containing case study details - entire overlay triggers navigation */}
        <div 
          onClick={handleNavigate}
          className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-6 sm:p-8 text-white rounded-[20px] cursor-pointer"
        >
          
          {/* Top Bar with Date Badge */}
          <div className="flex items-center justify-between w-full transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out delay-50">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-xs font-mono font-semibold text-white/95 border border-white/20 shadow-sm">
              <Calendar size={13} className="text-neutral-400 shrink-0" />
              <span>{project.month ? `${project.month} ${project.year}` : project.year}</span>
            </span>
          </div>

          {/* Content Group: Category, Title, Description & CTA */}
          <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out delay-75">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-2xl sm:text-[26px] font-sans font-bold tracking-tight text-white leading-none">
                {project.title}
              </h3>
              {isNew && (
                <span className="inline-flex items-center justify-center h-[22px] px-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#10b981] text-white select-none animate-badge-shimmer shadow-none leading-none">
                  New
                </span>
              )}
            </div>

            <p className="text-[13px] sm:text-[14px] text-white/95 font-normal leading-relaxed max-w-[340px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
              {project.description}
            </p>

            <div>
              <span
                className="group/btn inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white transition-all duration-300 font-sans text-[12px] sm:text-[13px] font-semibold tracking-wide select-none cursor-pointer shadow-none"
              >
                <span>{getProjectButtonText(project.buttonText || project.ctaLabel)}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
            </div>
          </div>

        </div>
        
      </div>
    </ScrollReveal>
  );
}

function ComingSoonShowcaseCard({ index }: { index: number }) {
  return (
    <ScrollReveal delay={0.1 * (index + 1)}>
      <div className="w-full min-[900px]:h-[410px] h-auto bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none rounded-[20px] overflow-hidden flex flex-col min-[900px]:flex-row items-center gap-8 min-[900px]:gap-12 lg:gap-16 transition-all duration-300 p-6 sm:p-8 min-[900px]:py-10 min-[900px]:pl-14 min-[900px]:pr-12 lg:pr-16">
        {/* Left Column: Coming Soon Frame */}
        <div className="relative w-full h-[240px] sm:h-[300px] min-[900px]:h-full shrink-0 flex items-center justify-start overflow-hidden min-[900px]:w-[53%]">
          <ComingSoonFrame
            title="Project Case Study"
            subtitle="Details & visual preview coming soon"
            aspectRatio="aspect-full h-full"
            className="w-full h-full rounded-[16px]"
          />
        </div>

        {/* Right Column: Text Information */}
        <div className="w-full min-[900px]:flex-1 flex flex-col justify-center text-left py-4 min-[900px]:py-0 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
              Coming Soon
            </span>
          </div>

          <h3 className="text-2xl sm:text-[26px] font-sans font-bold tracking-tight text-neutral-950 dark:text-neutral-50 leading-tight">
            Case Study Preparation
          </h3>

          <p className="text-sm sm:text-[14px] text-neutral-500 dark:text-neutral-400 font-normal">
            Product Design & Research
          </p>

          <p className="text-[15px] text-neutral-700 dark:text-neutral-300 font-normal leading-relaxed max-w-[400px]">
            New project details and interactive case studies will be displayed here as soon as they are added to the database.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-sans text-[14px] font-semibold tracking-wide cursor-default select-none">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

function ComingSoonGridCard({ idx }: { idx: number }) {
  return (
    <ScrollReveal delay={0.1 * (idx + 1)}>
      <div className="group relative w-full min-[900px]:h-[410px] h-[320px] bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none rounded-[20px] overflow-hidden flex items-center justify-center p-6 sm:p-8">
        <ComingSoonFrame
          title="Project Coming Soon"
          subtitle="Case study details under preparation"
          aspectRatio="aspect-full h-full"
          className="w-full h-full rounded-[16px]"
        />
      </div>
    </ScrollReveal>
  );
}

interface CardData {
  icon: any;
  headline: string;
  paragraph: string;
}

const myImages: any = [];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded } = useLoader();
  const { openResume } = useResumeModal();
  const { openContact } = useContactModal();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [projectsList, setProjectsList] = useState(() => dataStore.getProjects());
  const [blogsList, setBlogsList] = useState(() => dataStore.getBlogs());
  const [testimonialsList, setTestimonialsList] = useState(() => dataStore.getTestimonials());
  const [outsideWorkSettings, setOutsideWorkSettings] = useState(() => dataStore.getOutsideWorkSettings());

  // Scroll restoration: if returning to the Home featured projects section
  useEffect(() => {
    const savedFeaturedScroll = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("home_featured_scroll") : null;
    const isFromFeatured = location.hash === "#selected-works" || location.state?.fromSection === "selected-works";

    if (savedFeaturedScroll || isFromFeatured) {
      const targetY = savedFeaturedScroll ? parseFloat(savedFeaturedScroll) : null;

      const scrollToFeatured = () => {
        const el = document.getElementById("selected-works");
        const lenis = getLenis();
        if (targetY && targetY > 200) {
          if (lenis) {
            lenis.scrollTo(targetY, { immediate: true });
          } else {
            window.scrollTo(0, targetY);
          }
        } else if (el) {
          if (lenis) {
            lenis.scrollTo(el, { offset: -90, immediate: true });
          } else {
            const targetPos = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90);
            window.scrollTo({ top: targetPos, behavior: "instant" });
          }
        }
      };

      // Restore position smoothly in sync with browser paint without thrashing layout
      scrollToFeatured();
      const rId = requestAnimationFrame(scrollToFeatured);
      const t1 = setTimeout(scrollToFeatured, 100);
      const t2 = setTimeout(() => {
        scrollToFeatured();
        getLenis()?.resize();
      }, 350);

      // Once restored, clear the flag so direct navigation to Home starts from hero
      const clearTimer = setTimeout(() => {
        try {
          sessionStorage.removeItem("home_featured_scroll");
        } catch {}
      }, 1500);

      return () => {
        cancelAnimationFrame(rId);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(clearTimer);
      };
    }
  }, [location.hash, location.state]);

  useEffect(() => {
    const unsubProjects = projectService.subscribeToProjects((updated) => {
      if (updated) {
        setProjectsList(updated);
      }
    });

    const unsubTestimonials = testimonialService.subscribeToTestimonials((updated) => {
      if (updated) {
        setTestimonialsList(updated);
      }
    });

    const handleUpdate = () => {
      setProjectsList(dataStore.getProjects());
      setBlogsList(dataStore.getBlogs());
      setTestimonialsList(testimonialService.getTestimonials());
      setOutsideWorkSettings(dataStore.getOutsideWorkSettings());
    };
    window.addEventListener("portfolio_data_update", handleUpdate);
    return () => {
      unsubProjects();
      unsubTestimonials();
      window.removeEventListener("portfolio_data_update", handleUpdate);
    };
  }, []);
  const [isMobile, setIsMobile] = useState(false);
  const isHovered = false;
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Detect screen size (isMobile < 900px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Eagerly preload all database assets once loader dismisses
  useEffect(() => {
    if (isLoaded) {
      // Eagerly fetch whole database collections & preload all images
      startGlobalDataAndAssetPreload();
      getLenis()?.resize();
    }
  }, [isLoaded]);

  const handleScrollToWorks = () => {
    const el = document.getElementById("selected-works");
    if (!el) return;
    
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el, {
        offset: -90,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      const targetPosition = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90);
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    }
  };

  const featuredProjects = [
    {
      title: "Synthetix Engine",
      category: "Creative Coding",
      description: "Interactive audio-visual ecosystem driven by browser-based synthesizers.",
      year: "2026",
    },
    {
      title: "Where's My Car",
      category: "UI Architecture",
      description: "A highly customizable token-based framework optimized for performance.",
      year: "2025",
    },
  ];

  const recentPosts = [
    {
      title: "Designing with CSS Variables and Fluid Type Scales",
      date: "Jun 15, 2026",
      readTime: "4 min read",
    },
    {
      title: "The Architecture of Modern Smooth Scroll Containers",
      date: "May 28, 2026",
      readTime: "7 min read",
    },
  ];

  const mergedBlogs = useMemo(() => getMergedBlogPosts(blogsList), [blogsList]);

  const fallbackArticles = useMemo(
    () => [
      {
        id: "design-systems-scale",
        slug: "designing-for-scale-building-resilient-design-systems",
        title: "Designing for Scale: Building Resilient Design Systems for Multi-Platform Apps",
        coverPhoto: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
        date: "May 28, 2026",
        readTime: "6 min read",
        author: {
          name: "Avinash Shajan",
          role: "Lead Product Designer",
          avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
        },
      },
      {
        id: "calm-computing-fintech",
        slug: "cognitive-load-calm-computing-stress-free-interfaces",
        title: "Cognitive Load & Calm Computing: Crafting Stress-Free Digital Interfaces",
        coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        date: "May 14, 2026",
        readTime: "5 min read",
        author: {
          name: "Avinash Shajan",
          role: "Lead Product Designer",
          avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
        },
      },
      {
        id: "spatial-motion-feedback",
        slug: "micro-interactions-crafting-spatial-feedback-motion",
        title: "Micro-Interactions That Matter: Crafting Spatial Feedback with Motion and Haptics",
        coverPhoto: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
        date: "Apr 22, 2026",
        readTime: "4 min read",
        author: {
          name: "Avinash Shajan",
          role: "Lead Product Designer",
          avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
        },
      },
    ],
    []
  );

  const displayBlogs = useMemo(() => {
    if (mergedBlogs.length >= 6) {
      return mergedBlogs.slice(0, 6);
    }
    const combined = [...mergedBlogs];
    for (const fb of fallbackArticles) {
      if (combined.length >= 6) break;
      if (!combined.some((b) => b.title === fb.title || b.id === fb.id)) {
        combined.push(fb as any);
      }
    }
    return combined.slice(0, 6);
  }, [mergedBlogs, fallbackArticles]);

  const homeProjects = getHomeFeaturedProjects(projectsList);

  const mappedProjects = homeProjects.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.category,
    description: p.description,
    thumbnail: p.thumbnail?.[0] || "",
    link: `/project/${p.id}`,
    year: (p as any).year || (p.isNew ? "2026" : "2025"),
    month: (p as any).month || (p.isNew ? "June" : "November"),
    isNew: Boolean(p.isNew === true || (p.isNew as any) === "Yes" || (p.isNew as any) === "true"),
    isLive: Boolean(p.isLive === true || (p.isLive as any) === "Yes" || (p.isLive as any) === "true"),
    product: p.product,
    buttonText: p.buttonText || p.ctaLabel,
  }));

  const showcaseTop = mappedProjects.filter((_, idx) => idx === 0);
  const gridProjects = mappedProjects.filter((_, idx) => idx === 1 || idx === 2);
  const showcaseBottom = mappedProjects.filter((_, idx) => idx >= 3 && idx < 5);

  const testimonials = (testimonialsList || []).map((tc) => ({
    photo: tc.ImgUrl || "",
    name: tc.name || "",
    role: tc.position || "",
    company: tc.company || "",
    linkedinUrl: tc.linkedInUrl || "",
    quote: tc.quote || ""
  }));

  const backRotateY = isMobile ? 6 : 12;
  const backRotateX = isMobile ? 2 : 4;
  const backRotate = isMobile ? -1.5 : -3;

  const frontRotateY = isMobile ? -5 : -10;
  const frontRotateX = isMobile ? 1.5 : 3;
  const frontRotate = isMobile ? 1 : 2;

  return (
    <div id="page-home" className="space-y-24 py-6">
      {/* 1. Hero Section - Static and cleanly revealed when splash screen lifts */}
      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-0 -mt-8 lg:-mt-1"
      >
        <div className="lg:col-span-7 space-y-6 pb-[45px] lg:-translate-y-18 md:-translate-y-10 -translate-y-6">
          <div>
            <h1 className="hero-section-headline text-[2.2rem] md:text-[2.9rem] lg:text-[3.5rem] 2xl:text-[4rem] font-hero font-bold tracking-tight leading-[1.1] text-[var(--ink)]">
              Crafting digital experiences with <span className="text-[var(--blue)]">precision</span> and intent
            </h1>
          </div>

          <div>
            <p className="text-sm md:text-base 2xl:text-[1.125rem] text-[var(--ink-soft)] max-w-[640px] 2xl:max-w-[720px] leading-relaxed font-normal" style={{ fontWeight: "normal" }}>
              Hello! I'm <span className="text-[var(--ink)] font-semibold">Avinash Shajan</span>, product designer with 5+ years of shipping complex systems, AI-powered collaboration tools, and 0-1 products that deliver impactful experiences globally.
            </p>
          </div>

          <div className="pt-2">
            <div className="flex flex-wrap gap-3 2xl:gap-3.5 items-center">
              <button
                onClick={handleScrollToWorks}
                className="px-6 sm:px-7 2xl:px-8 py-3 2xl:py-3.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white transition-all duration-300 shrink-0 flex items-center gap-2 group font-sans text-sm md:text-[15px] 2xl:text-base font-medium cursor-pointer"
              >
                <span>View selected works</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-150 shrink-0" />
              </button>

              <button
                type="button"
                onClick={openContact}
                className="btn-f4-hover px-6 sm:px-7 2xl:px-8 py-3 2xl:py-3.5 rounded-full shrink-0 flex items-center justify-center gap-2 group font-sans text-sm md:text-[15px] 2xl:text-base font-medium cursor-pointer"
              >
                <span>Get in touch</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center lg:translate-x-0 xl:translate-x-0">
          <div
            ref={containerRef}
            className="relative w-full max-w-[400px] sm:max-w-[450px] lg:max-w-full aspect-[4/5] flex items-center justify-center mt-[10px]"
            style={{
              marginTop: "10px",
              perspective: "1200px",
              transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {/* Display 2 mobile screen images from hero_section feeder */}
            <>
              {/* Mobile / Back image 1 */}
              <motion.div
                animate={prefersReducedMotion ? {} : {
                  y: isHovered ? [0, 0] : [0, -12, 0],
                }}
                transition={{
                  duration: 6,
                  ease: "easeInOut",
                  repeat: isHovered ? 0 : Infinity,
                  repeatType: "loop",
                }}
                className="absolute left-[8%] top-[32%] -translate-y-1/2 w-[55%] z-10 select-none pointer-events-none"
              >
                <div
                  style={{
                    transform: `rotateY(${backRotateY}deg) rotateX(${backRotateX}deg) rotate(${backRotate}deg)`,
                  }}
                  className="w-full h-auto will-change-transform"
                >
                  <img
                    src={hero_section.img_one}
                    alt="Fitznow Mobile App 1"
                    className="w-full h-auto object-contain border-none outline-none"
                    referrerPolicy="no-referrer"
                    style={{
                      filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.12))",
                    }}
                  />
                </div>
              </motion.div>

              {/* Mobile / Front image 2 */}
              <motion.div
                animate={prefersReducedMotion ? {} : {
                  y: isHovered ? [0, 0] : [0, 12, 0],
                }}
                transition={{
                  duration: 6.5,
                  ease: "easeInOut",
                  repeat: isHovered ? 0 : Infinity,
                  repeatType: "loop",
                }}
                className="absolute right-[8%] top-[38%] -translate-y-1/2 w-[52%] z-20 select-none pointer-events-none"
              >
                <div
                  style={{
                    transform: `rotateY(${frontRotateY}deg) rotateX(${frontRotateX}deg) rotate(${frontRotate}deg)`,
                  }}
                  className="w-full h-auto will-change-transform"
                >
                  <img
                    src={hero_section.img_two}
                    alt="Fitznow Mobile App 2"
                    className="w-full h-auto object-contain border-none outline-none"
                    referrerPolicy="no-referrer"
                    style={{
                      filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.2))",
                    }}
                  />
                </div>
              </motion.div>
            </>
          </div>
        </div>
      </section>

      {/* 2. Impact Metrics Section */}
      <section className="!-mt-12 sm:!-mt-16 md:!-mt-20 pt-0 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <ScrollReveal delay={0.1}>
            <div className="flex flex-col space-y-3">
              <div className="text-[1.625rem] font-sans font-semibold text-[var(--ink)] leading-none tracking-tight w-fit animate-badge-shimmer">
                5+ Years
              </div>
              <h3 className="text-[1.125rem] font-medium text-[var(--ink-soft)] font-sans tracking-tight">
                Shipping enterprise products
              </h3>
              <p className="text-[1rem] font-normal text-[var(--muted)] leading-[1.6] font-sans">
                Designing scalable digital experiences for complex workflows, cross-functional teams, and business-critical platforms.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="flex flex-col space-y-3">
              <div className="text-[1.625rem] font-sans font-semibold text-[var(--ink)] leading-none tracking-tight w-fit animate-badge-shimmer">
                0-1 Products
              </div>
              <h3 className="text-[1.125rem] font-medium text-[var(--ink-soft)] font-sans tracking-tight">
                From concept to launch
              </h3>
              <p className="text-[1rem] font-normal text-[var(--muted)] leading-[1.6] font-sans">
                Transforming ideas into launch-ready products through research, strategy, prototyping, and iterative design.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-col space-y-3">
              <div className="text-[1.625rem] font-sans font-semibold text-[var(--ink)] leading-none tracking-tight w-fit animate-badge-shimmer">
                20+ Features
              </div>
              <h3 className="text-[1.125rem] font-medium text-[var(--ink-soft)] font-sans tracking-tight">
                Owned end-to-end
              </h3>
              <p className="text-[1rem] font-normal text-[var(--muted)] leading-[1.6] font-sans">
                Leading feature design from discovery to delivery, balancing user needs with business goals at every stage.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. Selected Works Section */}
      <section id="selected-works" className="!mt-8 sm:!mt-10 pt-0">
        <div className="mt-4 sm:mt-6 md:mt-8 mb-12 sm:mb-14 md:mb-16">
          <ScrollReveal delay={0.1} className="w-full space-y-3">
            <div className="!mt-0 ml-[5px] pb-[13px] flex">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1 sm:py-1.5 rounded-full bg-[#ebebeb] dark:bg-white/[0.08] text-[#0b0b0c] dark:text-neutral-300 border border-transparent dark:border-white/[0.08] font-sans text-[13px] sm:text-[14px] font-normal transition-all shadow-sm shadow-black/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>Projects</span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-[2.2rem] md:text-[2.9rem] lg:text-[3.5rem] 2xl:text-[4rem] font-sans font-semibold tracking-tight leading-[1.1] text-[var(--ink)]">
              Featured Projects<br />
              <span className="text-blue-600 dark:text-blue-400">owned</span> end to end
            </h2>

            <p className="text-[15px] md:text-[17px] 2xl:text-[1.125rem] text-[var(--ink-soft)] leading-relaxed font-sans font-normal max-w-[640px] 2xl:max-w-[720px]">
              5 projects from 20+, each chosen for problem complexity, depth of ownership, and measurable outcome.
            </p>
          </ScrollReveal>
        </div>

        {/* Slot 1: Top Hero Showcase (Full Width) */}
        <div className="space-y-12">
          {showcaseTop.length > 0 ? (
            showcaseTop.map((project, index) => (
              <HomeShowcaseProjectCard key={project.id} project={project} index={index} />
            ))
          ) : (
            <ComingSoonShowcaseCard index={0} />
          )}
        </div>

        {/* Slot 2 & Slot 3: 2 Equal Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 mb-12">
          {gridProjects.length > 0 ? (
            gridProjects.map((project, idx) => (
              <HomeGridProjectCard key={project.id} project={project} idx={idx} />
            ))
          ) : (
            <>
              <ComingSoonGridCard idx={0} />
              <ComingSoonGridCard idx={1} />
            </>
          )}
        </div>

        {/* Slot 4 & Slot 5: Lower Showcases positioned below the grid (Full Width) */}
        <div className="space-y-12">
          {showcaseBottom.length > 0 ? (
            showcaseBottom.map((project, index) => (
              <HomeShowcaseProjectCard key={project.id} project={project} index={index + 1} />
            ))
          ) : (
            <>
              <ComingSoonShowcaseCard index={1} />
              <ComingSoonShowcaseCard index={2} />
            </>
          )}
        </div>

        {/* Browse All Case Studies Centered CTA styled exactly like the uploaded image */}
        <div className="flex justify-center mt-16">
          <ScrollReveal delay={0.2}>
            <Link
              to="/projects"
              className="btn-f4-hover px-6 sm:px-7 py-3 rounded-full shrink-0 flex items-center gap-2 group font-sans text-sm md:text-[15px] font-medium cursor-pointer w-fit"
            >
              <span>Browse all case studies</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-150 shrink-0 text-[var(--muted)]" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. What I Bring Section (Scroll Trigger) */}
      <section className="pt-2 sm:pt-4">
        <WhatIBringScrollTrigger />
      </section>

      {/* Blog Preview Skeleton Section */}
      {blogsList && blogsList.length > 0 && (
      <section className="pt-16 sm:pt-20 mt-16">
        <div className="mb-12 sm:mb-14 md:mb-16">
          <ScrollReveal delay={0.1} className="max-w-[720px] space-y-3">
            <div className="!mt-0 ml-[5px] pb-[13px] flex">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1 sm:py-1.5 rounded-full bg-[#ebebeb] dark:bg-white/[0.08] text-[#0b0b0c] dark:text-neutral-300 border border-transparent dark:border-white/[0.08] font-sans text-[13px] sm:text-[14px] font-normal transition-all shadow-sm shadow-black/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>Insights</span>
              </div>
            </div>
            <h2 className="text-[2.2rem] md:text-[2.9rem] lg:text-[3.5rem] font-sans font-semibold tracking-tight leading-[1.1] text-[var(--ink)]">
              Thoughts on AI, <span className="text-blue-600 dark:text-blue-400">Design & Craft</span>
            </h2>
            <p className="text-[15px] md:text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans font-normal max-w-[640px]">
              Short, thoughtful insights on AI, design, and the craft of creating better experiences while staying sharp.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            {displayBlogs.map((post, idx) => {
              const postUrl = `/blog/${post.slug || post.id}`;

              return (
                <Link
                  key={post.id || idx}
                  to={postUrl}
                  className="group relative flex flex-col p-4 sm:p-5 rounded-[22px] bg-[#ebebeb] dark:bg-[#18181b] border-none cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-none overflow-hidden"
                >
                  {/* Ambient Image Color Background on Hover */}
                  {post.coverPhoto && (
                    <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none z-0">
                      <img
                        src={getOptimizedImageUrl(post.coverPhoto, 300)}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover scale-[2.2] blur-3xl opacity-60 dark:opacity-70 saturate-150"
                      />
                      {/* Subtle overlay to keep contrast refined and text readable */}
                      <div className="absolute inset-0 bg-white/40 dark:bg-black/50" />
                    </div>
                  )}

                  {/* YouTube-style Thumbnail with slightly increased height */}
                  <div className="relative z-10 aspect-[16/10] w-full rounded-[16px] overflow-hidden bg-neutral-900 border-none">
                    {post.coverPhoto ? (
                      <img
                        src={getOptimizedImageUrl(post.coverPhoto, 800)}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ComingSoonFrame
                        title="Article Visual"
                        subtitle="Cover photo coming soon"
                        aspectRatio="aspect-full h-full"
                        className="w-full h-full rounded-[16px]"
                      />
                    )}

                    {/* Duration / Read Time Badge at bottom-right (YouTube timestamp badge style) */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-white font-mono text-[11px] font-semibold tracking-wide select-none shadow-xs">
                      {post.readTime || "5 min"}
                    </div>
                  </div>

                  {/* Info Block: Title & Date */}
                  <div className="relative z-10 flex flex-col space-y-1.5 pt-3.5 px-0.5">
                    {/* Title - 2 lines max */}
                    <h3 className="text-[15px] sm:text-[16px] font-sans font-semibold leading-snug tracking-tight text-[var(--ink)] line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Date */}
                    <div className="text-[12px] font-mono text-[var(--muted)]">
                      {post.date}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Read all my blogs Centered CTA */}
        <div className="flex justify-center mt-12 sm:mt-16">
          <ScrollReveal delay={0.2}>
            <Link
              to="/blog"
              className="btn-f4-hover px-6 sm:px-7 py-3 rounded-full shrink-0 flex items-center gap-2 group font-sans text-sm md:text-[15px] font-medium cursor-pointer w-fit"
            >
              <span>Explore my articles</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-150 shrink-0 text-[var(--muted)]" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
      )}



      {/* 7. Testimonials Section */}
      <section id="testimonials" className="pt-16 sm:pt-20 mt-16">
        <div className="mb-12 sm:mb-14 md:mb-16">
          <ScrollReveal delay={0.1} className="max-w-[720px] space-y-3">
            <div className="!mt-0 ml-[5px] pb-[13px] flex">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1 sm:py-1.5 rounded-full bg-[#ebebeb] dark:bg-white/[0.08] text-[#0b0b0c] dark:text-neutral-300 border border-transparent dark:border-white/[0.08] font-sans text-[13px] sm:text-[14px] font-normal transition-all shadow-sm shadow-black/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span className="newTestimonialsSection">Testimonials</span>
              </div>
            </div>
            <h2 className="text-[2.2rem] md:text-[2.9rem] lg:text-[3.5rem] font-sans font-semibold tracking-tight leading-[1.1] text-[var(--ink)]">
              Some kind words <span className="text-blue-600 dark:text-blue-400">I’ve earned.</span>
            </h2>
            <p className="text-[15px] md:text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans font-normal max-w-[640px]">
              Reflections from colleagues and leaders I've collaborated with to build impactful products.
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col gap-6 sm:gap-8">
          {testimonials.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)]/50 text-center flex flex-col items-center justify-center gap-3">
              <p className="text-sm font-sans font-medium text-[var(--ink-soft)]">
                No testimonials published yet.
              </p>
              <Link
                to="/submit-testimonial"
                className="text-xs font-sans font-semibold text-[var(--blue)] hover:underline"
              >
                Be the first to share a recommendation &rarr;
              </Link>
            </div>
          ) : (
            testimonials.slice(0, 3).map((t, idx) => (
              <div key={t.name + "_" + idx}>
                <TestimonialCard
                  photo={t.photo}
                  name={t.name}
                  role={t.role}
                  company={t.company}
                  linkedinUrl={t.linkedinUrl}
                  quote={t.quote}
                />
              </div>
            ))
          )}
        </div>

        {/* See more testimonials Centered CTA */}
        {testimonials.length > 0 && (
          <div className="flex justify-center mt-12 sm:mt-16">
            <ScrollReveal delay={0.2}>
              <Link
                to="/testimonials"
                className="btn-f4-hover px-6 sm:px-7 py-3 rounded-full shrink-0 flex items-center gap-2 group font-sans text-sm md:text-[15px] font-medium cursor-pointer w-fit"
              >
                <span>See more testimonials</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-150 shrink-0 text-[var(--muted)]" />
              </Link>
            </ScrollReveal>
          </div>
        )}
      </section>

      {/* 5. Full-Width Decorative Box */}
      <section className="pt-10 sm:pt-14 mt-10 mb-6 sm:mb-8">
        <ScrollReveal>
          <div
            className="group w-full min-h-[270px] sm:min-h-[310px] lg:min-h-[350px] rounded-[22px] sm:rounded-[28px] bg-blue-950 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-6 sm:p-8 lg:p-10 relative pb-8 sm:pb-9 overflow-hidden text-white shadow-xl"
            style={{
              background: "linear-gradient(135deg, #2444f0 0%, #1a34b8 55%, #090e24 100%)",
            }}
          >
            {/* Background Wave Vector Art Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px]">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1200 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <g stroke="white" strokeWidth="1">
                  {/* Left expanding wave curves */}
                  {Array.from({ length: 22 }).map((_, i) => (
                    <path
                      key={`tl-${i}`}
                      d={`M ${-150 + i * 22} -100 Q ${120 + i * 26} ${120 + i * 18}, ${450 + i * 32} ${480 + i * 22}`}
                      opacity={0.06 + (i % 6) * 0.025}
                    />
                  ))}
                  {/* Right expanding wave curves */}
                  {Array.from({ length: 22 }).map((_, i) => (
                    <path
                      key={`br-${i}`}
                      d={`M ${1350 - i * 22} 500 Q ${1080 - i * 26} ${280 - i * 18}, ${750 - i * 32} ${-80 - i * 22}`}
                      opacity={0.06 + (i % 6) * 0.025}
                    />
                  ))}
                </g>
              </svg>
            </div>

            {/* Left: Overlapping Polaroids */}
            <div className="lg:col-span-6 flex items-center justify-center relative z-10">
              <div className="relative w-full max-w-[450px] h-[140px] min-[400px]:h-[165px] min-[480px]:h-[190px] sm:h-[220px] lg:h-[235px] flex items-center justify-center select-none">
                {/* Left Polaroid */}
                <div className="absolute left-[4%] top-[12%] w-[32%] bg-white p-1.5 sm:p-2 pb-4 sm:pb-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)] rounded-sm border border-white/80 -rotate-[10deg] z-10 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) group-hover:-translate-x-[15%] group-hover:-translate-y-[10%] group-hover:scale-[1.15] group-hover:-rotate-[16deg] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] group-hover:z-30">
                  <div className="aspect-square w-full overflow-hidden bg-neutral-200/80 rounded-xs flex items-center justify-center">
                    {(outsideWorkSettings?.MyImage01 || myImages?.[0]?.MyImage01) ? (
                      <img
                        src={getOptimizedImageUrl(outsideWorkSettings?.MyImage01 || myImages[0].MyImage01, 400)}
                        alt="Outside Work 1"
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ComingSoonFrame title="Photo 1" subtitle="Coming Soon" aspectRatio="aspect-square" className="w-full h-full text-[9px] p-1" />
                    )}
                  </div>
                </div>

                {/* Right Polaroid */}
                <div className="absolute right-[4%] top-[14%] w-[32%] bg-white p-1.5 sm:p-2 pb-4 sm:pb-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)] rounded-sm border border-white/80 rotate-[8deg] z-10 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) group-hover:translate-x-[15%] group-hover:-translate-y-[8%] group-hover:scale-[1.15] group-hover:rotate-[14deg] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] group-hover:z-30">
                  <div className="aspect-square w-full overflow-hidden bg-neutral-200/80 rounded-xs flex items-center justify-center">
                    {(outsideWorkSettings?.MyImage03 || myImages?.[0]?.MyImage03) ? (
                      <img
                        src={getOptimizedImageUrl(outsideWorkSettings?.MyImage03 || myImages[0].MyImage03, 400)}
                        alt="Outside Work 3"
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ComingSoonFrame title="Photo 3" subtitle="Coming Soon" aspectRatio="aspect-square" className="w-full h-full text-[9px] p-1" />
                    )}
                  </div>
                </div>

                {/* Center Polaroid (overlapping both) */}
                <div className="absolute left-[32%] top-[4%] w-[36%] bg-white p-1.5 sm:p-2 pb-5 sm:pb-7 shadow-[0_8px_20px_rgba(0,0,0,0.10)] rounded-sm border border-white -rotate-[2deg] z-20 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) group-hover:-translate-y-[15%] group-hover:scale-[1.18] group-hover:rotate-[1deg] group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.14)]">
                  <div className="aspect-[4/4.2] w-full overflow-hidden bg-neutral-200/80 rounded-xs flex items-center justify-center">
                    {(outsideWorkSettings?.MyImage02 || myImages?.[0]?.MyImage02) ? (
                      <img
                        src={getOptimizedImageUrl(outsideWorkSettings?.MyImage02 || myImages[0].MyImage02, 400)}
                        alt="Outside Work 2"
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ComingSoonFrame title="Photo 2" subtitle="Coming Soon" aspectRatio="aspect-[4/4.2]" className="w-full h-full text-[9px] p-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Text and CTA */}
            <div className="lg:col-span-6 flex flex-col justify-center lg:pl-6 text-left relative z-10 pt-1 sm:pt-2 lg:pt-2">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-xs font-mono tracking-widest text-white/80 font-semibold uppercase">
                  Outside of work
                </span>
              </div>

              <h2 className="text-[26px] sm:text-[28px] lg:text-[30px] font-bold tracking-tight leading-[32px] sm:leading-[34.5px] text-white mb-2 sm:mb-3">
                There's more to me<br />than the work
              </h2>

              <p className="text-[13.5px] sm:text-[15px] text-white/75 leading-[22px] max-w-[480px] font-normal mb-4 sm:mb-5" style={{ fontWeight: "normal" }}>
                Curious what keeps me grounded, inspired, and building outside of product design? Click to see the person behind the portfolio.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mt-1 sm:mt-1.5">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-sans font-semibold text-sm rounded-full transition-all duration-300 hover:-translate-y-0.5 group/btn cursor-pointer shrink-0"
                >
                  <span>See more about me</span>
                  <ArrowRight size={18} strokeWidth={2.5} className="group-hover/btn:translate-x-1 transition-all duration-150 shrink-0 text-current" />
                </Link>

                {/* Contact Icons with white background */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href="https://www.linkedin.com/in/avinash-shajan-169b631aa/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                    className="w-9 h-9 rounded-full bg-white text-blue-600 hover:bg-white/90 transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 shrink-0 overflow-hidden p-1.5"
                  >
                    <img src={uiIconsFeeder.linedIn} alt="LinkedIn" className="w-full h-full object-contain" />
                  </a>

                  <a
                    href="https://dribbble.com/ux_by_Avinash"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Dribbble"
                    title="Dribbble"
                    className="w-9 h-9 rounded-full bg-white text-blue-600 hover:bg-white/90 transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 shrink-0 overflow-hidden p-2"
                  >
                    <img src={uiIconsFeeder.dribble} alt="Dribbble" className="w-full h-full object-contain" />
                  </a>

                  <a
                    href="https://medium.com/@avinashts1122"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Medium"
                    title="Medium"
                    className="w-9 h-9 rounded-full bg-white text-blue-600 hover:bg-white/90 transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 shrink-0 overflow-hidden p-2"
                  >
                    <img src={uiIconsFeeder.mediume} alt="Medium" className="w-full h-full object-contain" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 8. Get in Touch Section */}
      <section id="contact-section" className="pt-16 sm:pt-20 mt-16 pb-8">
        <ScrollReveal>
          <div className="w-full rounded-[16px] bg-[#ebebeb] dark:bg-[#ebebeb] p-8 sm:p-12 md:p-16 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Title */}
            <h2 className="text-[32px] sm:text-[42px] md:text-[48px] font-sans font-semibold tracking-tight leading-[1.1] text-black text-center">
              Let’s connect<br />
              about what <span className="text-[var(--blue)]">comes next</span>
            </h2>

            {/* Subtitle */}
            <p className="text-[14px] sm:text-[15.5px] text-[#555] dark:text-[#555] leading-relaxed max-w-[580px] mx-auto text-center mt-4 font-normal" style={{ fontWeight: "normal" }}>
              Open to senior product design roles, design leadership, and AI-first product teams. I respond within 48 hours
            </p>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 w-full max-w-5xl mx-auto mt-10">
              {/* Email Card */}
              <button
                type="button"
                onClick={openContact}
                className="bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 rounded-[12px] p-3 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer group w-full text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <img src="https://img.icons8.com/?size=100&id=qyRpAggnV0zH&format=png&color=000000" alt="Email" className="w-5 h-5 object-contain dark:invert" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 font-sans font-medium mb-0.5">
                      Email
                    </span>
                    <span className="text-[13px] sm:text-[14.5px] font-sans font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
                      avinashts1122@gmail.com
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-6 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] mx-4 shrink-0" />
                  <ArrowRight size={16} className="text-neutral-800 dark:text-neutral-200 group-hover:translate-x-1 transition-transform duration-200 shrink-0 mr-[7px]" />
                </div>
              </button>

              {/* LinkedIn Card */}
              <a
                href="https://www.linkedin.com/in/avinash-shajan-169b631aa/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 rounded-[12px] p-3 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer group w-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <img src="https://img.icons8.com/?size=100&id=13930&format=png&color=000000" alt="LinkedIn" className="w-5 h-5 object-contain dark:invert" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 font-sans font-medium mb-0.5">
                      LinkedIn
                    </span>
                    <span className="text-[13px] sm:text-[14.5px] font-sans font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
                      avinashshajan
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-6 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] mx-4 shrink-0" />
                  <ArrowRight size={16} className="text-neutral-800 dark:text-neutral-200 group-hover:translate-x-1 transition-transform duration-200 shrink-0 mr-[7px]" />
                </div>
              </a>

              {/* Resume Card */}
              <button
                type="button"
                onClick={openResume}
                className="bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 rounded-[12px] p-3 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] cursor-pointer group w-full outline-none text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <img src="https://img.icons8.com/?size=100&id=TGd4NEfXhxLa&format=png&color=000000" alt="Download" className="w-5 h-5 object-contain dark:invert group-hover:translate-y-0.5 transition-transform duration-150" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 font-sans font-medium mb-0.5">
                      Resume
                    </span>
                    <span className="text-[13px] sm:text-[14.5px] font-sans font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
                      Download PDF
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-6 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] mx-4 shrink-0" />
                  <ArrowRight size={16} className="text-neutral-800 dark:text-neutral-200 group-hover:translate-x-1 transition-transform duration-200 shrink-0 mr-[7px]" />
                </div>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
