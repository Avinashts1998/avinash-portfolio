import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, GraduationCap, ChevronLeft, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import { almaMaterService, AlmaMater, DEFAULT_ALMA_MATERS } from "../../services/almaMaterService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import ScrollReveal from "../layout/ScrollReveal";

export const AlmaMatersSection: React.FC = () => {
  const [almaMaters, setAlmaMaters] = useState<AlmaMater[]>(() => almaMaterService.getAlmaMaters());
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = almaMaterService.initListener((items) => {
      if (items && items.length > 0) {
        setAlmaMaters(items);
      }
    });
    return () => unsubscribe();
  }, []);

  const totalItems = almaMaters.length;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      scrollToCard(currentIndex - 1);
    } else {
      setCurrentIndex(totalItems - 1);
      scrollToCard(totalItems - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
      scrollToCard(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      scrollToCard(0);
    }
  };

  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll<HTMLElement>(".alma-card-item");
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
  };

  return (
    <section className="relative z-10 pt-16 sm:pt-20" id="about-alma-maters-section">
      {/* Header with Eyebrow and Serif Display Typography matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-12">
        <ScrollReveal>
          <div className="space-y-4">
            {/* Eyebrow Chip matching Mentorship chip design */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ebebeb] dark:bg-neutral-800 text-[var(--ink)] font-sans text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--blue)] shrink-0" />
              <span>My Alma Maters</span>
            </div>

            {/* Editorial Heading using font-hero on a single line */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-hero font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
              Where it all <span className="text-[var(--blue)]">began</span>
            </h2>
          </div>
        </ScrollReveal>
      </div>

      {/* Cards Grid / Interactive Showcase */}
      <ScrollReveal delay={0.15}>
        <div 
          ref={scrollContainerRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        >
          {almaMaters.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="alma-card-item snap-start group relative flex flex-col rounded-[28px] sm:rounded-[32px] overflow-hidden bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none transition-all duration-400"
            >
              {/* Campus Landscape Photo Container */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                <img
                  src={getOptimizedImageUrl(item.imageUrl, 1600)}
                  alt={`${item.name} Campus`}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="eager"
                  decoding="async"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                {/* Top-Left Floating Logo Pill */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-2 shadow-md border border-white/40 dark:border-white/10 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    {item.logoUrl ? (
                      <img
                        src={getOptimizedImageUrl(item.logoUrl, 200)}
                        alt={`${item.name} Logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <GraduationCap className="w-5 h-5 text-[var(--blue)]" />
                    )}
                  </div>
                </div>

                {/* Bottom-Right Year Tag (Matching reference) */}
                <div className="absolute bottom-4 right-4 z-10">
                  <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white/95 text-xs sm:text-[13px] font-sans font-medium shadow-sm">
                    <span>{item.period}</span>
                  </div>
                </div>
              </div>

              {/* Card Bottom Meta & Context */}
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-sm font-sans font-bold text-[var(--blue)]">
                      {item.degree}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-sans font-bold text-[var(--ink)] tracking-tight leading-snug">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  {/* Location & Tag (Positioned above the paragraph) */}
                  <div className="flex items-center justify-between text-xs font-sans pt-0.5">
                    <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                      <MapPin size={13} className="text-[var(--blue)] shrink-0" />
                      <span className="font-semibold text-xs sm:text-[13px] text-neutral-900 dark:text-neutral-100">
                        {item.location}
                      </span>
                    </div>

                    {item.shortName && (
                      <span className="font-mono text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[var(--blue)]/10 text-[var(--blue)]">
                        {item.shortName}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans leading-relaxed pt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

export default AlmaMatersSection;
