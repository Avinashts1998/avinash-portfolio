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

    // If horizontal swipe is significant (> 18px) and dominant over vertical
    if (Math.abs(diffX) > 18 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0 && theme !== "light") {
        // Swiped right -> switch to light
        handleToggle(undefined, "light");
      } else if (diffX < 0 && theme !== "dark") {
        // Swiped left -> switch to dark
        handleToggle(undefined, "dark");
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

  // Knob travel distance:
  // Mobile: outer width 70px, padding 3.5px -> inner 63px, knob 32px -> travel = 31px
  // Desktop: outer width 62px, padding 3px -> inner 56px, knob 28px -> travel = 28px
  const travelDistance = isMobile ? 31 : 28;

  return (
    <div className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40 flex items-center select-none">
      {/* 3D Tactile Capsule Toggle Button */}
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={(e) => handleToggle(e)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        aria-label={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
        className="relative group flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 rounded-full transition-transform duration-200 active:scale-[0.93] touch-manipulation w-[70px] h-[39px] p-[3.5px] sm:w-[62px] sm:h-[34px] sm:p-[3px]"
        style={{
          // Concave 3D recessed track with rich tactile bevel, no colored drop shadow
          background: isDark
            ? "linear-gradient(180deg, #111217 0%, #1c1d25 100%)"
            : "linear-gradient(180deg, #d3d6de 0%, #ebedf2 100%)",
          boxShadow: isDark
            ? "inset 0 2.5px 5px rgba(0, 0, 0, 0.85), inset 0 1px 2px rgba(0, 0, 0, 0.5), inset 0 -1.5px 2px rgba(255, 255, 255, 0.09)"
            : "inset 0 2.5px 5px rgba(0, 0, 0, 0.18), inset 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 -1.5px 2px rgba(255, 255, 255, 0.95)",
        }}
      >
        {/* Interactive Tap Wave Ripple */}
        {showRipple && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0.5 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={`absolute inset-0 rounded-full pointer-events-none ${
              isDark ? "bg-white/10" : "bg-black/10"
            }`}
          />
        )}

        {/* Debossed Stationary Track Indicators */}
        <div className="absolute inset-[3.5px] sm:inset-[3px] flex items-center justify-between px-2 sm:px-1.5 pointer-events-none">
          {/* Left: Moon Indicator for Dark Mode */}
          <div
            className={`flex items-center justify-center transition-all duration-500 ${
              isDark
                ? "opacity-0 scale-75"
                : "opacity-45 text-blue-700/80 scale-100"
            }`}
          >
            <Moon className="w-3 h-3 sm:w-2.5 sm:h-2.5 stroke-[2.4]" />
          </div>

          {/* Right: Sun Indicator for Light Mode */}
          <div
            className={`flex items-center justify-center transition-all duration-500 ${
              !isDark
                ? "opacity-0 scale-75"
                : "opacity-40 text-neutral-400 scale-100"
            }`}
          >
            <Sun className="w-3 h-3 sm:w-2.5 sm:h-2.5 stroke-[2.4]" />
          </div>
        </div>

        {/* 3D Tactile Sliding Puck / Knob */}
        <motion.div
          animate={{
            x: isDark ? 0 : travelDistance,
            scaleX: isPressed ? 1.12 : 1,
            scaleY: isPressed ? 0.92 : 1,
          }}
          transition={{
            x: {
              type: "spring",
              stiffness: 380,
              damping: 28,
            },
            scaleX: { duration: 0.15, ease: "easeOut" },
            scaleY: { duration: 0.15, ease: "easeOut" },
          }}
          className="relative rounded-full flex items-center justify-center pointer-events-none shadow-md w-[32px] h-[32px] sm:w-[28px] sm:h-[28px]"
          style={{
            // Tactile 3D dome sphere with physical highlight and drop-shadow
            background: isDark
              ? "radial-gradient(circle at 35% 30%, #60a5fa 0%, #3b82f6 40%, #2563eb 75%, #1d4ed8 100%)"
              : "radial-gradient(circle at 35% 30%, #ffffff 0%, #f9fafb 50%, #e5e7eb 100%)",
            boxShadow: isDark
              ? "inset 0 1.5px 2px rgba(255, 255, 255, 0.65), inset 0 -2px 3px rgba(30, 58, 138, 0.55), 0 3px 8px rgba(0, 0, 0, 0.45)"
              : "inset 0 1.5px 2px rgba(255, 255, 255, 1), inset 0 -2px 2.5px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.12)",
          }}
        >
          {/* Active 3D Icon with Rotation and Dynamic Reveal */}
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -80, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 80, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.35, 1] }}
                className="flex items-center justify-center text-white"
              >
                <Moon className="w-[14px] h-[14px] sm:w-[12px] sm:h-[12px] stroke-[2.4] fill-white/20 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 80, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -80, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.35, 1] }}
                className="flex items-center justify-center text-amber-500"
              >
                <Sun className="w-[14px] h-[14px] sm:w-[12px] sm:h-[12px] stroke-[2.4] fill-amber-400/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>
    </div>
  );
}


