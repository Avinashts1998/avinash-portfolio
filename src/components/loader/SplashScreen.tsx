import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { startGlobalDataAndAssetPreload } from "../../utils/firebaseAssetPreloader";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname === "/admin-login";

  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(!isAdminRoute);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isAdminRoute) {
      onComplete?.();
      return;
    }

    let isMounted = true;
    const SPLASH_DURATION_MS = 2100; // Allows rotating text to complete its full roll and rest before curtain lifts

    const cleanupListeners = () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
    cleanupListenersRef.current = cleanupListeners;

    // Keep right-side scrollbar visible during loading so page never jumps.
    // Prevent accidental wheel/touch scroll of background page while splash holds.
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (
        ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.code)
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    // Lift splash screen after 2.1 seconds
    let safetyTimer: NodeJS.Timeout | null = null;

    const liftTimer = setTimeout(() => {
      if (isMounted) {
        cleanupListeners();
        setIsExiting(true);
        onComplete?.();
        // Immediately trigger eager database & image preloading
        startGlobalDataAndAssetPreload();

        // Safety timeout to ensure splash screen dismisses even if transitionend is missed
        safetyTimer = setTimeout(() => {
          if (isMounted) {
            setIsVisible(false);
            onComplete?.();
          }
        }, 950);
      }
    }, SPLASH_DURATION_MS);

    return () => {
      isMounted = false;
      cleanupListeners();
      clearTimeout(liftTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [isAdminRoute, onComplete]);

  if (isAdminRoute) {
    return null;
  }

  const handleAnimationComplete = () => {
    if (isExiting) {
      setIsVisible(false);
      onComplete?.();
      // Eagerly pull and preload all Firebase data and images into browser cache
      startGlobalDataAndAssetPreload();
    }
  };

  // User can tap/click to fast-forward the curtain lift immediately
  const handleFastForward = () => {
    cleanupListenersRef.current?.();
    if (!isExiting) {
      setIsExiting(true);
      onComplete?.();
      startGlobalDataAndAssetPreload();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      id="splash-screen"
      onTransitionEnd={handleAnimationComplete}
      onClick={handleFastForward}
      className={`flex items-center justify-center text-neutral-900 select-none ${
        isExiting ? "is-lifting pointer-events-none" : "cursor-default"
      }`}
      aria-label="Welcome splash screen"
    >
      {/* Centered Message: Masked rotating text like Maomao Ding portfolio reference */}
      <div className="px-6 text-center max-w-3xl mx-auto flex items-center justify-center">
        <div className="splash-loader-wrapper">
          <h1
            className="splash-rotating-text text-[18px] sm:text-[20px] md:text-[23px] lg:text-[24px] font-extralight tracking-normal text-neutral-900 leading-snug select-none text-center"
            style={{
              fontFamily: "'Onest', sans-serif",
              fontWeight: 200,
            }}
          >
            Hey there! Welcome to Avinash Portfolio!
          </h1>
        </div>
      </div>
    </div>
  );
}
