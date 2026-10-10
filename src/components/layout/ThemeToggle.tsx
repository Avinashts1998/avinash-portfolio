import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(25);
      } catch (_) {
        // Ignore devices that block vibration
      }
    }
  };

  const handleToggle = (
    e?: React.MouseEvent<HTMLElement>,
    targetSide?: "light" | "dark"
  ) => {
    if (targetSide && targetSide === theme) {
      return;
    }
    triggerHaptic();
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 500);
    toggleTheme(e);
  };

  // Touch gesture support for mobile flick / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false);
    if (touchStartX.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - (touchStartY.current || 0);

    // If vertical swipe is significant (> 14px) and dominant over horizontal
    if (Math.abs(diffY) > 14 && Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY > 0 && theme !== "dark") {
        // Swiped down -> switch to dark
        handleToggle(undefined, "dark");
      } else if (diffY < 0 && theme !== "light") {
        // Swiped up -> switch to light
        handleToggle(undefined, "light");
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Vertical travel distance for mobile reel notch pill:
  // Track height 70px - 6px padding (3px top + 3px bottom) - 28px knob height = 36px
  const travelDistance = 36;
  // Horizontal travel distance for desktop switch knob:
  // Track width 68px - left/right padding 6px - knob width 30px = 32px
  const desktopTravelDistance = 32;

  return (
    <div className="fixed z-40 select-none flex items-center pointer-events-auto max-[768px]:right-0 max-[768px]:bottom-[20%] min-[769px]:right-6 min-[769px]:bottom-6">
      {/* Universal Theme Toggle Button: Mobile Vertical Sticky Chamfer Tab + Desktop Floating Switch */}
      <button
        id="theme-toggle-btn"
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={(e) => handleToggle(e)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        aria-label={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] touch-manipulation flex items-center justify-center transition-all duration-150 active:scale-[0.96]"
      >
        {/* MOBILE VIEW ONLY: Floating Minimal Toggle Track without bulky SVG scoop background */}
        <div className="flex min-[769px]:hidden relative items-center justify-center mr-3 mb-2">
          {/* Vertical Reel Track */}
          <div
            className="relative w-[30px] h-[72px] rounded-full flex flex-col items-center justify-between p-[3px] pointer-events-none transition-all duration-200 z-10 border border-black/5 dark:border-white/10"
            style={{
              background: isDark ? "rgba(21, 23, 28, 0.75)" : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: isDark
                ? "0 4px 14px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)"
                : "0 4px 14px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.9)",
            }}
          >
            {/* Top Reel Slot Indicator (Sun) */}
            <div
              className={`w-[24px] h-[24px] flex items-center justify-center transition-opacity duration-200 ${
                !isDark ? "opacity-0" : "opacity-50"
              }`}
            >
              <Sun className="w-[13px] h-[13px] text-amber-500 stroke-[2.2]" />
            </div>

            {/* Bottom Reel Slot Indicator (Moon) */}
            <div
              className={`w-[24px] h-[24px] flex items-center justify-center transition-opacity duration-200 ${
                isDark ? "opacity-0" : "opacity-50"
              }`}
            >
              <Moon className="w-[13px] h-[13px] text-slate-400 stroke-[2.2]" />
            </div>

            {/* Sliding Active Selected Toggle Pill */}
            <motion.div
              animate={{
                y: isDark ? travelDistance : 0,
                scaleY: isPressed ? 0.93 : 1,
                scaleX: 1,
              }}
              transition={{
                y: {
                  type: "spring",
                  stiffness: 440,
                  damping: 28,
                },
                scaleY: { duration: 0.12, ease: "easeOut" },
              }}
              className="absolute left-[3px] top-[3px] w-[24px] h-[30px] rounded-full flex items-center justify-center z-10 transition-colors duration-200 bg-white dark:bg-[#252830] shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
            >
              {/* Active Icon Inside Pill */}
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="moon-knob-mobile"
                    initial={{ rotate: -80, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 80, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.35, 1] }}
                    className="flex items-center justify-center text-blue-500 dark:text-blue-400"
                  >
                    <Moon className="w-[14px] h-[14px] stroke-[2.4] fill-current" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun-knob-mobile"
                    initial={{ rotate: 80, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -80, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.35, 1] }}
                    className="flex items-center justify-center text-amber-500"
                  >
                    <Sun className="w-[14px] h-[14px] stroke-[2.4] fill-amber-500/20" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* DESKTOP VIEW ONLY: Pure Neumorphic Capsule Toggle Switch with Moon & Sun */}
        <div className="hidden min-[769px]:flex items-center justify-center">
          <div
            className="relative w-[68px] h-[36px] rounded-full flex items-center mr-[15px] mb-[10px] transition-colors duration-300 overflow-hidden cursor-pointer"
            style={{
              marginRight: "15px",
              marginBottom: "10px",
              background: isDark ? "#141519" : "#dde0e6",
              boxShadow: isDark
                ? "inset 3px 3px 6px rgba(0, 0, 0, 0.85), inset 1.2px 1.2px 2.5px rgba(0, 0, 0, 0.7), inset -2px -2px 4.5px rgba(255, 255, 255, 0.05)"
                : "inset 3px 3px 6px rgba(0, 0, 0, 0.16), inset 1.2px 1.2px 2.5px rgba(0, 0, 0, 0.12), inset -3px -3px 6px rgba(255, 255, 255, 0.95), inset -1.2px -1.2px 2.5px rgba(255, 255, 255, 0.9)",
            }}
          >
            {/* Left Moon Track Socket Indicator */}
            <div
              className={`absolute left-[3px] top-[3px] w-[30px] h-[30px] flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
                !isDark ? "opacity-85" : "opacity-0"
              }`}
            >
              <Moon className="w-[13.5px] h-[13.5px] text-[#717684] stroke-[2.2]" />
            </div>

            {/* Right Sun Track Socket Indicator */}
            <div
              className={`absolute right-[3px] top-[3px] w-[30px] h-[30px] flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
                isDark ? "opacity-45" : "opacity-0"
              }`}
            >
              <Sun className="w-[14.5px] h-[14.5px] text-[#f59e0b] stroke-[2.2]" />
            </div>

            {/* Horizontal Sliding Pure Neumorphic Tactile Puck / Knob */}
            <motion.div
              animate={{
                x: isDark ? 0 : desktopTravelDistance,
                scaleX: isPressed ? 1.05 : 1,
                scaleY: isPressed ? 0.95 : 1,
              }}
              transition={{
                x: {
                  type: "spring",
                  stiffness: 440,
                  damping: 28,
                },
                scaleX: { duration: 0.12, ease: "easeOut" },
                scaleY: { duration: 0.12, ease: "easeOut" },
              }}
              className="absolute left-[3px] top-[3px] w-[30px] h-[30px] rounded-full flex items-center justify-center pointer-events-none z-10 transition-colors duration-200"
              style={{
                background: isDark
                  ? "linear-gradient(145deg, #272a32 0%, #1a1c22 100%)"
                  : "linear-gradient(145deg, #f4f5f8 0%, #d8dbe2 100%)",
                boxShadow: isDark
                  ? "3px 3px 7px rgba(0, 0, 0, 0.8), 1.2px 1.2px 3px rgba(0, 0, 0, 0.6), -1.5px -1.5px 4px rgba(255, 255, 255, 0.06), inset 1px 1px 1px rgba(255, 255, 255, 0.15)"
                  : "3px 3px 7px rgba(0, 0, 0, 0.16), 1.2px 1.2px 3px rgba(0, 0, 0, 0.1), -2.2px -2.2px 5px rgba(255, 255, 255, 0.95), inset 1px 1px 1px rgba(255, 255, 255, 0.85)",
              }}
            >
              {/* Active Icon Inside Knob */}
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="moon-knob-desktop"
                    initial={{ rotate: -80, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 80, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.35, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="w-[13.5px] h-[13.5px] text-[#93c5fd] stroke-[2.3] fill-[#93c5fd]/20" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun-knob-desktop"
                    initial={{ rotate: 80, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -80, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.35, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="w-[14px] h-[14px] stroke-[2.3] text-[#d97706]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </button>
    </div>
  );
}


