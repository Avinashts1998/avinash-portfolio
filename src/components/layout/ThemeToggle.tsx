import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SunMedium, MoonStar } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { QuickNoteUploadModal } from "../fieldNotes/QuickNoteUploadModal";

export default function ThemeToggle() {
  const { theme, toggleTheme, isThemeLocked } = useTheme();
  const isDark = theme === "dark";
  const [isPressed, setIsPressed] = useState(false);
  const location = useLocation();


  // Mobile detection
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Long-press secret feature active only on mobile view in the article page
  const isArticlePage =
    location.pathname === "/blog" ||
    location.pathname.startsWith("/blog/") ||
    location.pathname === "/field-notes";

  const [isCharging, setIsCharging] = useState(false);
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const didTriggerLongPressRef = useRef(false);
  const longPressTriggeredTimeRef = useRef(0);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(20);
      } catch (_) {
        // Ignore devices that block vibration
      }
    }
  };

  const triggerLongPressHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate([40, 60, 40]);
      } catch (_) {}
    }
  };

  const handlePressStart = () => {
    setIsPressed(true);
    didTriggerLongPressRef.current = false;

    // Start 1-second long-press timer if on mobile in the article page
    if (isMobileView && isArticlePage) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsCharging(true);

      timerRef.current = setTimeout(() => {
        didTriggerLongPressRef.current = true;
        longPressTriggeredTimeRef.current = Date.now();
        setIsCharging(false);
        triggerLongPressHaptic();
        setIsQuickUploadOpen(true);
      }, 1000);
    }
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsCharging(false);
  };

  const handleToggle = (e?: React.MouseEvent<HTMLElement>) => {
    if (
      didTriggerLongPressRef.current ||
      Date.now() - longPressTriggeredTimeRef.current < 800
    ) {
      // Long press already triggered the quick upload modal, skip theme change
      didTriggerLongPressRef.current = false;
      return;
    }
    triggerHaptic();
    toggleTheme(e);
  };

  // Hide theme toggle on project detail pages where project theme is strictly preserved
  // Executed after all hooks to strictly adhere to React's Rules of Hooks
  if (isThemeLocked || location.pathname.startsWith("/project/")) {
    return null;
  }

  return (
    <>
      <motion.div
        id="theme-toggle-container"
        initial={{ scale: 0.85, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 24 }}
        className="fixed z-[100] select-none flex items-center pointer-events-auto max-[768px]:right-4 max-[768px]:bottom-[calc(76px+env(safe-area-inset-bottom,0px))] min-[769px]:right-6 min-[769px]:bottom-6"
      >
        {/* Universal Theme Toggle Button: Circular floating button positioned above the nav bar on the right */}
        <button
          id="theme-toggle-btn"
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={(e) => handleToggle(e)}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={(e) => {
            if (
              didTriggerLongPressRef.current ||
              Date.now() - longPressTriggeredTimeRef.current < 800
            ) {
              e.preventDefault();
            }
            handlePressEnd();
          }}
          onTouchCancel={handlePressEnd}
          onContextMenu={(e) => {
            if (isMobileView && isArticlePage) {
              e.preventDefault();
            }
          }}
          aria-label={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
          title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
          className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] touch-manipulation flex items-center justify-center transition-transform duration-200 active:scale-[0.92]"
        >
          {/* 1-Second Charging Progress Indicator on Mobile in Article Page */}
          {isCharging && isMobileView && isArticlePage && (
            <svg
              className="absolute -inset-[3px] w-[56px] h-[56px] -rotate-90 pointer-events-none z-30 drop-shadow-md"
              viewBox="0 0 56 56"
            >
              <motion.circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="163.4"
                initial={{ strokeDashoffset: 163.4 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
          )}

          {/* Theme Toggle Element: Circular Floating Disk on Mobile, Toggle Switch on Desktop */}
          <div
            className={`relative theme-toggle-track rounded-full flex items-center transition-all duration-300 border border-black/[0.08] dark:border-white/10 ${
              isPressed ? "scale-95" : "scale-100"
            }`}
          >
            {/* Mobile View: Circular floating button disk (Unchanged) */}
            <div className="max-[768px]:flex min-[769px]:hidden items-center justify-center w-full h-full relative">
              {/* Subtle hover glow ring */}
              <div className="absolute inset-0 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-black/[0.03] dark:bg-white/[0.04] pointer-events-none" />

              {/* Icon with smooth rotation & scale animation matching screenshot */}
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="dark-sun"
                    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-center text-amber-400"
                  >
                    <SunMedium className="w-[21px] h-[21px] stroke-[2.2] fill-amber-400/20" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="light-moon"
                    initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-center text-[#4A463F] dark:text-[#E8E4DD]"
                  >
                    <MoonStar className="w-[21px] h-[21px] stroke-[1.8] fill-current" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop View: Pill Toggle Button Switch */}
            <div className="max-[768px]:hidden min-[769px]:flex items-center justify-between w-full h-full relative px-[6px] select-none mx-0">
              {/* Left Track Icon: Sun (dimmed when thumb moves away) */}
              <span
                className={`flex items-center justify-center z-0 w-[22px] h-[22px] transition-opacity duration-200 ${
                  isDark ? "opacity-35 text-neutral-400 dark:text-neutral-500" : "opacity-0"
                }`}
              >
                <SunMedium className="w-4 h-4 stroke-[2]" />
              </span>

              {/* Right Track Icon: Moon (dimmed when thumb moves away) */}
              <span
                className={`flex items-center justify-center z-0 w-[22px] h-[22px] transition-opacity duration-200 ${
                  isDark ? "opacity-0" : "opacity-35 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <MoonStar className="w-4 h-4 stroke-[1.8]" />
              </span>

              {/* Sliding Thumb Knob */}
              <motion.div
                animate={{ x: isDark ? 34 : 0 }}
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
                className="absolute left-[3px] top-[2px] w-[32px] h-[32px] -ml-[1px] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.16)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.5)] bg-white dark:bg-[#252830] border border-black/[0.08] dark:border-white/10 z-10"
              >
                {isDark ? (
                  <MoonStar className="w-4 h-4 stroke-[2] text-indigo-400 fill-indigo-400/20" />
                ) : (
                  <SunMedium className="w-4 h-4 stroke-[2.2] text-amber-500 fill-amber-500/20" />
                )}
              </motion.div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Quick Note Upload Modal (triggered by 1-second long press on mobile in article page) */}
      <QuickNoteUploadModal
        isOpen={isQuickUploadOpen}
        onClose={() => setIsQuickUploadOpen(false)}
      />
    </>
  );
}
