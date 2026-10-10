import React, { useState } from "react";
import { motion } from "motion/react";
import about3Dobjects from "../../feeders/about_3d_feeders";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import ScrollReveal from "../layout/ScrollReveal";

export const InterestsMarqueeSection: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Display items from the feeder file repeated for seamless infinite scrolling
  const displayList = about3Dobjects && about3Dobjects.length > 0 ? about3Dobjects : [];
  // Repeat list 2 times (20 elements) for seamless loop while conserving GPU memory
  const repeatedItems = [
    ...displayList,
    ...displayList
  ];

  return (
    <section id="about-interests-section" className="relative z-10 pt-14 sm:pt-18 pb-10 sm:pb-14 overflow-hidden">
      {/* Header with Eyebrow Chip */}
      <div className="mb-8 sm:mb-10">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 sm:py-1.5 rounded-full bg-[#ebebeb] dark:bg-neutral-800 text-[var(--ink)] font-sans text-xs sm:text-[13px] font-medium shadow-sm shadow-black/[0.02]">
            <span className="w-2 h-2 rounded-full bg-[var(--blue)] shrink-0 animate-pulse" />
            <span>Interests</span>
          </div>
        </ScrollReveal>
      </div>

      {/* 3D Elements Infinite Marquee Stage */}
      <div
        className="relative w-full overflow-hidden py-6 sm:py-8 select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveItem(null);
        }}
      >
        {/* Left and Right Subtle Edge Feathering Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-12 bg-gradient-to-r from-[var(--bg)]/30 via-[var(--bg)]/10 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-12 bg-gradient-to-l from-[var(--bg)]/30 via-[var(--bg)]/10 to-transparent z-20" />

        {/* Scrolling Track Container */}
        <div className="flex w-full">
          <motion.div
            className="flex items-center gap-14 sm:gap-20 md:gap-28 lg:gap-32 shrink-0"
            animate={{
              x: ["0%", "-50%"]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: isHovered ? 100 : 65,
                ease: "linear"
              }
            }}
          >
            {repeatedItems.map((item, idx) => {
              const itemKey = `${item.category}-${idx}`;
              const isSelected = activeItem === itemKey;

              return (
                <div
                  key={itemKey}
                  className="relative group flex flex-col items-center justify-center shrink-0 cursor-pointer"
                  onMouseEnter={() => setActiveItem(itemKey)}
                  onMouseLeave={() => setActiveItem(null)}
                >
                  {/* Floating 3D Object */}
                  <motion.div
                    whileHover={{ scale: 1.12, y: -6, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                    className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex items-center justify-center p-2"
                  >
                    <img
                      src={getOptimizedImageUrl(item.imgUrl, 400)}
                      alt={item.category || "3D Interest Element"}
                      className="w-full h-full object-contain select-none pointer-events-none transform transition-transform duration-500"
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>

                  {/* Hover Floating Category Pill */}
                  <div
                    className={`absolute -bottom-2 transition-all duration-300 pointer-events-none z-30 ${
                      isSelected
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-2 scale-95"
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 text-xs sm:text-sm font-sans font-semibold tracking-tight shadow-xl backdrop-blur-md whitespace-nowrap">
                      <span>{item.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InterestsMarqueeSection;
