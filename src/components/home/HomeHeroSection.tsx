import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "reicon-react";
import { hero_section } from "../../feeders/feeder";

interface HomeHeroSectionProps {
  onScrollToWorks: () => void;
  onOpenContact: () => void;
  prefersReducedMotion?: boolean;
  isMobile?: boolean;
}

export default function HomeHeroSection({
  onScrollToWorks,
  onOpenContact,
  prefersReducedMotion = false,
  isMobile = false,
}: HomeHeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Reveal hero elements right after initial background paint
    const t = setTimeout(() => {
      setIsRendered(true);
    }, 40);
    return () => clearTimeout(t);
  }, []);

  const backRotateY = isMobile ? 6 : 12;
  const backRotateX = isMobile ? 2 : 4;
  const backRotate = isMobile ? -1.5 : -3;

  const frontRotateY = isMobile ? -5 : -10;
  const frontRotateX = isMobile ? 1.5 : 3;
  const frontRotate = isMobile ? 1 : 2;

  if (!isRendered) {
    // Initially while switching to Home, only the background is present
    return (
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-2 sm:pt-0 mt-0 lg:-mt-1 min-h-[460px] lg:min-h-[540px]">
        <div className="lg:col-span-7" />
        <div className="lg:col-span-5" />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-2 sm:pt-0 mt-0 lg:-mt-1 transition-opacity duration-300">
      {/* Left Column: Headline, Bio Description, and Action Buttons */}
      <div className="lg:col-span-7 space-y-6 pb-[45px] pt-4 sm:pt-2 md:pt-0 translate-y-0 md:-translate-y-10 lg:-translate-y-18">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <h1 className="hero-section-headline text-[2.2rem] md:text-[2.9rem] lg:text-[3.5rem] 2xl:text-[4rem] font-hero font-bold tracking-tight leading-[1.1] text-[var(--ink)]">
            Crafting digital experiences with <span className="text-[var(--blue)]">precision</span> and intent
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            ease: [0.16, 1, 0.3, 1],
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          <p className="text-sm md:text-base 2xl:text-[1.125rem] text-[var(--ink-soft)] max-w-[640px] 2xl:max-w-[720px] leading-relaxed font-normal">
            Hello! I'm <span className="text-[var(--ink)] font-semibold" style={{ fontWeight: 600 }}>Avinash Shajan</span>, product designer with <span className="text-[var(--ink)] font-semibold" style={{ fontWeight: 600 }}>5+ years</span> of shipping complex systems, AI-powered collaboration tools, and 0-1 products that deliver impactful experiences globally.
          </p>
        </motion.div>

        <motion.div
          className="pt-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.65,
            ease: [0.16, 1, 0.3, 1],
            delay: prefersReducedMotion ? 0 : 0.16,
          }}
        >
          <div className="flex flex-wrap gap-3 2xl:gap-3.5 items-center">
            <button
              onClick={onScrollToWorks}
              className="group relative overflow-hidden pl-[20px] pr-[24px] pt-[12px] pb-[12px] rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shrink-0 flex items-center font-sans text-sm md:text-[15px] 2xl:text-base font-medium cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.07)] transition-all duration-300 active:scale-[0.98]"
            >
              {/* Expanding Circle Layer originating from the left dot position */}
              <span
                aria-hidden="true"
                className="absolute left-[25px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white pointer-events-none transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[80] group-hover:duration-[850ms] group-hover:ease-[cubic-bezier(0.35,0.05,0.2,1)] will-change-transform"
              />

              {/* Content layer above expanding fill with synchronized color transition */}
              <div className="relative z-10 -ml-[1px] flex items-center gap-2 sm:gap-2.5 text-white transition-colors duration-400 group-hover:text-[var(--blue)] group-hover:delay-150">
                <span className="w-2.5 h-2.5 rounded-full opacity-0 shrink-0 pointer-events-none" aria-hidden="true" />
                <span className="tracking-tight whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.35,0.05,0.2,1)] group-hover:-translate-x-4 sm:group-hover:-translate-x-5">
                  View selected works
                </span>
              </div>

              {/* Bolder Arrow positioned absolutely so the button total size never changes */}
              <span
                aria-hidden="true"
                className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-[var(--blue)] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 -translate-x-2.5 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:delay-300"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenContact}
              className="group relative overflow-hidden pl-[20px] pr-[24px] pt-[12px] pb-[12px] rounded-full bg-[var(--card)] border border-[var(--line)] text-[var(--ink)] shrink-0 flex items-center font-sans text-sm md:text-[15px] 2xl:text-base font-medium cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.07)] transition-all duration-300 active:scale-[0.98]"
            >
              {/* Expanding Circle Layer originating from the left dot position - based on light button color, spreads brand dark/blue fill */}
              <span
                aria-hidden="true"
                className="absolute left-[25px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[var(--blue)] dark:bg-white pointer-events-none transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[80] group-hover:duration-[850ms] group-hover:ease-[cubic-bezier(0.35,0.05,0.2,1)] will-change-transform"
              />

              {/* Content layer above expanding fill with synchronized color transition */}
              <div className="relative z-10 -ml-[1px] flex items-center gap-2 sm:gap-2.5 text-[var(--ink)] transition-colors duration-400 group-hover:text-white dark:group-hover:text-[#18181b] group-hover:delay-150">
                <span className="w-2.5 h-2.5 rounded-full opacity-0 shrink-0 pointer-events-none" aria-hidden="true" />
                <span className="tracking-tight whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.35,0.05,0.2,1)] group-hover:-translate-x-4 sm:group-hover:-translate-x-5">
                  Get in touch
                </span>
              </div>

              {/* Bolder Arrow positioned absolutely so the button total size never changes */}
              <span
                aria-hidden="true"
                className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white dark:text-[#18181b] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 -translate-x-2.5 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:delay-300"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Floating 3D Mobile Mockups */}
      <motion.div
        className="lg:col-span-5 relative w-full flex flex-col items-center justify-center lg:translate-x-0 xl:translate-x-0"
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.75,
          ease: [0.16, 1, 0.3, 1],
          delay: prefersReducedMotion ? 0 : 0.1,
        }}
      >
        <div
          ref={containerRef}
          className="relative w-full max-w-[400px] sm:max-w-[450px] lg:max-w-full aspect-[4/5] flex items-center justify-center mt-[10px]"
          style={{
            marginTop: "10px",
            perspective: "1200px",
            transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {/* Mobile screen images from hero_section feeder */}
          <>
            {/* Mobile / Back image 1 */}
            <div className="absolute left-[8%] top-[32%] -translate-y-1/2 w-[55%] z-10 select-none pointer-events-none">
              <div
                className="w-full h-auto hero-mockup-float-back will-change-transform"
                style={{ animation: "hero-mockup-float-back 6s ease-in-out infinite" }}
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
              </div>
            </div>

            {/* Mobile / Front image 2 */}
            <div className="absolute right-[8%] top-[38%] -translate-y-1/2 w-[52%] z-20 select-none pointer-events-none">
              <div
                className="w-full h-auto hero-mockup-float-front will-change-transform"
                style={{ animation: "hero-mockup-float-front 6.5s ease-in-out infinite" }}
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
              </div>
            </div>
          </>
        </div>
      </motion.div>
    </section>
  );
}
