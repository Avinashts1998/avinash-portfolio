import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SunMedium, MoonStar } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [isPressed, setIsPressed] = useState(false);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(20);
      } catch (_) {
        // Ignore devices that block vibration
      }
    }
  };

  const handleToggle = (e?: React.MouseEvent<HTMLElement>) => {
    triggerHaptic();
    toggleTheme(e);
  };

  return (
    <motion.div
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
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
        aria-label={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] touch-manipulation flex items-center justify-center transition-transform duration-200 active:scale-[0.92]"
      >
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
  );
}
