import { useState, useEffect } from "react";
import { Triangle, ArrowRight } from "lucide-react";
import ScrollReveal from "../components/layout/ScrollReveal";
import PolaroidPhotoStack from "../components/about/PolaroidPhotoStack";
import AboutBackgroundViewer from "../components/about/AboutBackgroundViewer";
import AlmaMatersSection from "../components/about/AlmaMatersSection";
import BitMoreAboutMeSection from "../components/about/BitMoreAboutMeSection";
import InterestsMarqueeSection from "../components/about/InterestsMarqueeSection";
import WorkBehindThinkingSection from "../components/about/WorkBehindThinkingSection";
import CommunityBoardSection from "../components/about/CommunityBoardSection";
import { aboutBackgroundService, AboutBackgroundMultiConfig } from "../services/aboutBackgroundService";
import { mentorshipPhotosService, MentorshipPhoto, DEFAULT_MENTORSHIP_PHOTOS } from "../services/mentorshipPhotosService";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import { useMentorshipModal } from "../context/MentorshipModalContext";

export default function About() {
  const { openMentorship } = useMentorshipModal();
  const [bgMultiConfig, setBgMultiConfig] = useState<AboutBackgroundMultiConfig>(() => aboutBackgroundService.getMultiConfig());
  const [mentorshipPhotos, setMentorshipPhotos] = useState<MentorshipPhoto[]>(() => mentorshipPhotosService.getMentorshipPhotos());
  const [isBackgroundViewerOpen, setIsBackgroundViewerOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setBgMultiConfig(aboutBackgroundService.getMultiConfig());
    };

    window.addEventListener("portfolio_about_background_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Subscribe to real-time mentorship photos updates
    const unsubMentorship = mentorshipPhotosService.initListener((photos) => {
      setMentorshipPhotos(photos);
    });

    return () => {
      window.removeEventListener("portfolio_about_background_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      unsubMentorship();
    };
  }, []);


  const fallbackLandscapeUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2400&auto=format&fit=crop";
  const activeBg = bgMultiConfig.items && bgMultiConfig.items.length > 0 
    ? (bgMultiConfig.items.find((it) => it.id === bgMultiConfig.activeId || it.isActive) || bgMultiConfig.items[0])
    : null;
  const currentBgUrl = activeBg?.imageUrl || fallbackLandscapeUrl;

  const blurValue = activeBg?.blurAmount || bgMultiConfig.blurAmount || 18;

  return (
    <div id="page-about" className="relative space-y-16 py-0 sm:py-2 pb-12">
      {/* Atmospheric Background Image Backdrop with Clean Static Blur */}
      <div className="absolute top-[-3rem] sm:top-[-4rem] left-1/2 -translate-x-1/2 w-screen max-w-[100vw] h-[680px] sm:h-[760px] pointer-events-none overflow-hidden select-none z-0">
        {/* Static blurred exploration landscape image */}
        <div
          className="absolute inset-[-24px] bg-cover bg-center opacity-40 dark:opacity-50"
          style={{
            backgroundImage: `url(${getOptimizedImageUrl(currentBgUrl, 1920)})`,
            filter: `blur(${blurValue}px)`,
            transform: "scale(1.06)",
          }}
        />

        {/* Subtle geometric grid texture matching reference */}
        <div 
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Atmospheric Radial Highlight (Protects text contrast with soft backdrop spotlight) */}
        <div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_35%,transparent_15%,var(--bg)_80%)]"
        />

        {/* Bottom & Top vertical edge gradient blends */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/40 via-transparent to-[var(--bg)]" />
      </div>

      {/* 1. Hero Section: Bio Narrative + Interactive Polaroid Photo Stack */}
      <section className="relative z-10 pt-2 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start min-h-[380px]">
          {/* Left Text Narrative */}
          <div className="lg:col-span-7 space-y-6 -mt-1.5 sm:-mt-2 lg:-mt-2.5">
            <ScrollReveal delay={0.15}>
              <h1 className="tracking-tight text-[var(--ink)] leading-[1.15]">
                <span className="text-xl sm:text-2xl lg:text-[28px] font-hero font-semibold tracking-tight text-[var(--ink-soft)] block mb-1">
                  Hey there! I'm
                </span>
                <span className="text-[22px] xs:text-2xl sm:text-3xl md:text-4xl lg:text-[42px] xl:text-[48px] font-hero font-semibold tracking-tight block animate-name-gradient leading-[1.15] whitespace-nowrap">
                  Avinash Tharayil Shajan.
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="space-y-4 text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans max-w-[620px]">
                <p className="text-[17px]">
                  I'm deeply curious about how people think, behave, and adapt to the systems around them. That curiosity has shaped almost everything I do, from the way I observe everyday experiences to the way I approach creativity, technology, and problem solving.
                </p>
                <p className="text-[17px]">
                  Outside of work, I’m an explorer, nature field recordist, and travel & landscape photographer. I’m drawn to mountains, quiet landscapes, earthy spaces, and the little details that make a place feel alive. Long walks, unfamiliar places, new perspectives, and moments that blend aesthetics with intention are where I find inspiration. I’m also drawn to building things slowly, refining details obsessively, and finding meaning in the smallest elements along the way.
                </p>
                <p className="text-[17px]">
                  I believe the best experiences come from empathy, clarity, and an openness to constantly evolve.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Polaroid Photo Stack */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start w-full space-y-4 -mt-2 sm:-mt-4 lg:-mt-6">
            <ScrollReveal delay={0.25} className="w-full flex justify-center">
              <PolaroidPhotoStack />
            </ScrollReveal>

            {/* View Background & Scene Switcher under the Polaroid */}
            {bgMultiConfig.items && bgMultiConfig.items.length > 0 && (
              <ScrollReveal delay={0.3} className="w-full flex justify-center sm:justify-end pr-24 sm:pr-36 lg:pr-40 pt-10 sm:pt-14 relative z-30">
                <div className="inline-flex items-center p-1 rounded-full bg-[var(--card)]/90 border border-[var(--line)] backdrop-blur-md shadow-xs hover:border-[var(--ink-soft)]/40 transition-all">
                  <button
                    id="about-view-background-btn"
                    onClick={() => setIsBackgroundViewerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium bg-[var(--bg)] hover:bg-[var(--line)]/50 text-[var(--ink)] transition-colors cursor-pointer group"
                    title="View scene in full screen"
                  >
                    <Triangle size={10} className="fill-current text-[var(--ink-soft)] group-hover:text-[var(--blue)] transition-colors" />
                    <span>View background</span>
                  </button>
                </div>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* 2. Mentorship Featured Card Section (Matching Reference Design & Consistent Typography) */}
      <section className="relative z-10 pt-4">
        <ScrollReveal delay={0.15}>
          <div className="w-full rounded-[24px] sm:rounded-[28px] bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none p-6 sm:p-10 lg:p-12 overflow-hidden relative transition-colors duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              {/* Left Content Column */}
              <div className="lg:col-span-7 space-y-5">
                {/* Eyebrow Chip matching Home featured cards */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-[var(--ink)] font-sans text-xs font-medium shadow-xs border border-black/[0.04] dark:border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[var(--blue)] shrink-0" />
                  <span>Mentorship</span>
                </div>

                {/* Main Headline */}
                <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[var(--ink)] leading-[1.2]">
                  Career move or <br className="hidden sm:inline" />
                  early-stage startup idea?
                </h2>

                {/* Description */}
                <p className="text-xs sm:text-[14px] md:text-[15px] text-[var(--ink-soft)] font-sans leading-relaxed max-w-xl">
                  1:1 sessions focused on portfolio reviews, career transitions, and developing early-stage startup ideas. With 5+ years of industry experience and 100+ hours spent mentoring designers, PMs, and founders across startups, agencies, and enterprises.
                </p>

                {/* CTA Button */}
                <div className="pt-2">
                  <a
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      openMentorship();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openMentorship();
                      }
                    }}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all group active:scale-95 cursor-pointer shadow-sm select-none"
                  >
                    <span>Book a session with Avinash</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Right Dual Overlapping Photo Composition */}
              <div className="lg:col-span-5 flex items-center justify-center pt-2 sm:pt-4 lg:pt-0">
                <div className="relative w-full max-w-[380px] sm:max-w-[420px] h-[250px] sm:h-[280px] flex items-center justify-center">
                  {/* Photo 1 (Left / Back) */}
                  <div className="absolute left-0 top-1 w-[58%] sm:w-[60%] aspect-square rounded-2xl overflow-hidden shadow-card border border-black/10 dark:border-white/10 z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-300 bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={
                        mentorshipPhotos[0]?.imageUrl 
                          ? getOptimizedImageUrl(mentorshipPhotos[0].imageUrl, 800) 
                          : DEFAULT_MENTORSHIP_PHOTOS[0].imageUrl
                      }
                      alt={mentorshipPhotos[0]?.altText || "Mentoring session workshop"}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  </div>

                  {/* Photo 2 (Right / Front) */}
                  <div className="absolute right-0 bottom-1 w-[58%] sm:w-[60%] aspect-square rounded-2xl overflow-hidden shadow-card border border-black/10 dark:border-white/10 z-20 transform rotate-2 hover:rotate-0 transition-transform duration-300 bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={
                        mentorshipPhotos[1]?.imageUrl 
                          ? getOptimizedImageUrl(mentorshipPhotos[1].imageUrl, 800) 
                          : DEFAULT_MENTORSHIP_PHOTOS[1].imageUrl
                      }
                      alt={mentorshipPhotos[1]?.altText || "Speaking on stage presentation"}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. My Alma Maters (Education Institutions Showcase - Matching Design) */}
      <AlmaMatersSection />

      {/* 4. A Bit More About Me Section */}
      <BitMoreAboutMeSection />

      {/* 5. Interests 3D Elements Infinite Marquee Section */}
      <InterestsMarqueeSection />

      {/* 6. The Work Behind the Thinking (Recent Projects & AI Showcase Banner) */}
      <WorkBehindThinkingSection />

      {/* 7. Community Board (Everyone who stopped by) */}
      <CommunityBoardSection />

      {/* Fullscreen Interactive Background Viewer (Matching Screenshot 3) */}
      <AboutBackgroundViewer
        items={bgMultiConfig.items}
        activeId={bgMultiConfig.activeId}
        isOpen={isBackgroundViewerOpen}
        onClose={() => setIsBackgroundViewerOpen(false)}
      />
    </div>
  );
}

