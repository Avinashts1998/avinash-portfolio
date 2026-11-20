import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { getLenis } from "../../hooks/useLenis";

interface GoToTopChipProps {
  isMobileNavVisible?: boolean;
  isDesktopNavVisible?: boolean;
  onScrollToTop?: () => void;
  onScrollDown?: () => void;
}

export default function GoToTopChip({
  isMobileNavVisible = true,
  isDesktopNavVisible = true,
  onScrollToTop,
  onScrollDown,
}: GoToTopChipProps) {
  const [isPastThirtyFivePercent, setIsPastThirtyFivePercent] = useState(false);
  const [isSlowReturn, setIsSlowReturn] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Track slow and smooth transition when user triggers scroll-to-top from chip
  useEffect(() => {
    const handleStart = () => setIsSlowReturn(true);
    const handleEnd = () => {
      setTimeout(() => {
        setIsSlowReturn(false);
      }, 1000);
    };
    window.addEventListener("portfolio_scrolling_to_top_started", handleStart);
    window.addEventListener("portfolio_scrolling_to_top_ended", handleEnd);
    return () => {
      window.removeEventListener("portfolio_scrolling_to_top_started", handleStart);
      window.removeEventListener("portfolio_scrolling_to_top_ended", handleEnd);
    };
  }, []);

  // Track 35% scroll threshold of the case study page
  useEffect(() => {
    const checkScrollProgress = () => {
      const lenis = getLenis();
      const currentScroll = Math.max(
        0,
        lenis ? lenis.scroll : (window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0)
      );
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);

      const progress = currentScroll / maxScroll;
      setIsPastThirtyFivePercent(progress >= 0.35);
    };

    window.addEventListener("scroll", checkScrollProgress, { passive: true });
    window.addEventListener("lenis-scroll", checkScrollProgress, { passive: true });
    checkScrollProgress();

    return () => {
      window.removeEventListener("scroll", checkScrollProgress);
      window.removeEventListener("lenis-scroll", checkScrollProgress);
    };
  }, []);

  // Smooth scroll back to top of project
  const handleScrollToTop = useCallback(() => {
    // Notify navbar to stay hidden during programmatic scroll to top until landing at top
    window.dispatchEvent(new CustomEvent("portfolio_scrolling_to_top_started"));

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, {
        duration: prefersReducedMotion ? 0 : 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: () => {
          window.dispatchEvent(new CustomEvent("portfolio_scrolling_to_top_ended"));
        },
      });
    } else {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("portfolio_scrolling_to_top_ended"));
      }, prefersReducedMotion ? 50 : 900);
    }
    if (onScrollToTop) {
      onScrollToTop();
    }
  }, [prefersReducedMotion, onScrollToTop]);

  // Smooth scroll down to first page/slice of project case study
  const handleNavigateDown = useCallback(() => {
    const contentEl = document.getElementById("project-case-study-content");
    const lenis = getLenis();

    if (contentEl) {
      const rect = contentEl.getBoundingClientRect();
      const currentScroll = lenis ? lenis.scroll : (window.pageYOffset || window.scrollY || 0);
      // Offset by 68px to account for the sticky top header bar
      const targetY = rect.top + currentScroll - 68;

      if (lenis) {
        lenis.scrollTo(targetY, {
          duration: prefersReducedMotion ? 0 : 0.95,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        window.scrollTo({ top: targetY, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    } else {
      const fallbackTarget = window.innerHeight * 0.75;
      if (lenis) {
        lenis.scrollTo(fallbackTarget, { duration: prefersReducedMotion ? 0 : 0.95 });
      } else {
        window.scrollTo({ top: fallbackTarget, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    }

    if (onScrollDown) {
      onScrollDown();
    }
  }, [prefersReducedMotion, onScrollDown]);

  const handleClick = () => {
    if (isPastThirtyFivePercent) {
      handleScrollToTop();
    } else {
      handleNavigateDown();
    }
  };

  return (
    <motion.div
      id="go-to-top-chip-container"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14, scale: prefersReducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 10, scale: prefersReducedMotion ? 1 : 0.95 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.22,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed left-0 right-0 pointer-events-none z-[110] flex justify-center px-4"
      style={{
        bottom: "calc(var(--chip-bottom-offset, 92px) + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <style>{`
        #go-to-top-chip-container {
          --chip-bottom-offset: ${isDesktopNavVisible ? "88px" : "24px"};
          transition: bottom ${isSlowReturn ? "0.75s" : "0.35s"} cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 1536px) {
          #go-to-top-chip-container {
            --chip-bottom-offset: ${isDesktopNavVisible ? "90px" : "24px"};
          }
        }
        @media (max-width: 768px) {
          #go-to-top-chip-container {
            --chip-bottom-offset: ${isMobileNavVisible ? "76px" : "20px"};
          }
        }
      `}</style>

      {/* Styled exactly to match the user's reference mockup (avinashshajan.online):
          Dark rounded-full capsule pill, with a solid 24px blue circular badge and crisp 13px white typography */}
      <button
        type="button"
        aria-label={isPastThirtyFivePercent ? "Go to top" : "Scroll down to read"}
        onClick={handleClick}
        className="group pointer-events-auto flex items-center justify-center rounded-full select-none transition-all duration-200 whitespace-nowrap pl-1.5 pr-3.5 py-1.5 gap-2.5 h-[36px] w-auto max-w-max focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          bg-white/30 dark:bg-black/30
          backdrop-blur-md
          border-0 border-none
          shadow-sm shadow-black/5 dark:shadow-black/20
          hover:bg-white/45 dark:hover:bg-black/45
          active:scale-[0.97] cursor-pointer
        "
      >
        <AnimatePresence mode="wait" initial={false}>
          {isPastThirtyFivePercent ? (
            <motion.div
              key="state-go-to-top"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="flex items-center gap-2.5"
            >
              {/* Solid Blue Circle Badge on Left with White Up Arrow */}
              <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0 shadow-xs shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                <ArrowUp
                  size={13}
                  strokeWidth={2.4}
                  className="text-white group-hover:-translate-y-0.5 transition-transform duration-200"
                />
              </div>

              {/* Crisp Text: Neutral-900 in light mode, White in dark mode */}
              <span className="font-sans font-medium tracking-tight text-neutral-900 dark:text-white text-[13px] leading-none pr-0.5">
                Go to top
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="state-scroll-down"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 3 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="flex items-center gap-2.5"
            >
              {/* Solid Blue Circle Badge on Left with White Down Arrow */}
              <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0 shadow-xs shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                <ArrowDown
                  size={13}
                  strokeWidth={2.4}
                  className="text-white group-hover:translate-y-0.5 transition-transform duration-200"
                />
              </div>

              {/* Crisp Text: Neutral-900 in light mode, White in dark mode */}
              <span className="font-sans font-medium tracking-tight text-neutral-900 dark:text-white text-[13px] leading-none pr-0.5">
                Scroll down to read
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
