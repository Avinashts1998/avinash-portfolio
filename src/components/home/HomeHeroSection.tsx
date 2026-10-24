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
              className="px-6 sm:px-7 2xl:px-8 py-3 2xl:py-3.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white transition-all duration-300 shrink-0 flex items-center gap-2 group font-sans text-sm md:text-[15px] 2xl:text-base font-medium cursor-pointer"
            >
              <span>View selected works</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-150 shrink-0" />
            </button>

            <button
              type="button"
              onClick={onOpenContact}
              className="btn-f4-hover px-6 sm:px-7 2xl:px-8 py-3 2xl:py-3.5 rounded-full shrink-0 flex items-center justify-center gap-2 group font-sans text-sm md:text-[15px] 2xl:text-base font-medium cursor-pointer"
            >
              <span>Get in touch</span>
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
