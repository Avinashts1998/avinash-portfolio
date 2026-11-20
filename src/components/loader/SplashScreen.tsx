import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { startGlobalDataAndAssetPreload } from "../../utils/firebaseAssetPreloader";

// Track in-memory display during active client-side routing
let hasShownSplashInApp = false;

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname === "/admin-login";

  const [currentStep, setCurrentStep] = useState<0 | 1>(0); // 0: "Hi there!", 1: "Welcome to Avinash's portfolio"
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    if (isAdminRoute) return false;
    // Clear any stale sessionStorage key
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("splash_screen_shown");
      }
    } catch {}
    if (hasShownSplashInApp) return false;
    return true;
  });

  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isAdminRoute || !isVisible) {
      onComplete?.();
      return;
    }

    hasShownSplashInApp = true;
    mountTimeRef.current = Date.now();
    let isMounted = true;

    const cleanupListeners = () => {
      window.removeEventListener("wheel", handleUserIntent);
      window.removeEventListener("touchstart", handleUserIntent);
      window.removeEventListener("keydown", handleKeyDown);
    };
    cleanupListenersRef.current = cleanupListeners;

    // If user attempts to scroll or swipe after brief initial display, smoothly lift the curtain
    const handleUserIntent = () => {
      // 400ms grace period to avoid instant dismiss on touch inertia or residual gestures
      if (Date.now() - mountTimeRef.current < 400) return;
      if (isMounted && !isExiting) {
        cleanupListeners();
        setIsExiting(true);
        onComplete?.();
        startGlobalDataAndAssetPreload();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Enter", "Escape"].includes(e.code)) {
        handleUserIntent();
      }
    };

    // Passive listeners: never block browser native momentum scrolling
    window.addEventListener("wheel", handleUserIntent, { passive: true });
    window.addEventListener("touchstart", handleUserIntent, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const stepDuration = isMobile ? 850 : 1100;
    const liftDuration = isMobile ? 2100 : 2500;

    // 1. Roll from "Hi there!" to "Welcome to Avinash's portfolio"
    const rollTimer = setTimeout(() => {
      if (isMounted) {
        setCurrentStep(1);
      }
    }, stepDuration);

    // 2. Lift the curtain
    const liftTimer = setTimeout(() => {
      if (isMounted) {
        cleanupListeners();
        setIsExiting(true);
        onComplete?.();
        startGlobalDataAndAssetPreload();
      }
    }, liftDuration);

    return () => {
      isMounted = false;
      cleanupListeners();
      clearTimeout(rollTimer);
      clearTimeout(liftTimer);
    };
  }, [isAdminRoute, isVisible, onComplete, isExiting]);

  // Handle transition completion when curtain finishes lifting up
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && isExiting) {
      setIsVisible(false);
      onComplete?.();
      startGlobalDataAndAssetPreload();
    }
  };

  // Safety fallback in case transitionend is skipped by browser
  useEffect(() => {
    if (isExiting) {
      const safetyTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
        startGlobalDataAndAssetPreload();
      }, 750);
      return () => clearTimeout(safetyTimer);
    }
  }, [isExiting, onComplete]);

  if (isAdminRoute || !isVisible) {
    return null;
  }

  // User can tap/click to fast-forward the curtain lift immediately
  const handleFastForward = () => {
    if (Date.now() - mountTimeRef.current < 350) return;
    cleanupListenersRef.current?.();
    if (!isExiting) {
      setIsExiting(true);
      onComplete?.();
      startGlobalDataAndAssetPreload();
    }
  };

  return (
    <div
      id="splash-screen"
      onTransitionEnd={handleTransitionEnd}
      onClick={handleFastForward}
      className={`flex items-center justify-center text-neutral-900 dark:text-neutral-100 select-none cursor-pointer ${
        isExiting ? "is-lifting pointer-events-none" : ""
      }`}
      aria-label="Welcome splash screen"
    >
      {/* Centered Message: Masked rolling text (Hi there! -> Welcome to Avinash's portfolio) */}
      <div className="w-full px-4 text-center max-w-4xl mx-auto flex items-center justify-center">
        <div className="relative overflow-hidden h-[54px] sm:h-[62px] w-full max-w-full flex justify-center items-start">
          <motion.div
            className="w-full flex flex-col items-center"
            initial={{ y: "0%" }}
            animate={{ y: currentStep === 0 ? "0%" : "-50%" }}
            transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
            style={{ willChange: "transform" }}
          >
            {/* Step 1: Initial greeting - clean opacity 0 to 100% increasing */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="h-[54px] sm:h-[62px] w-full flex items-center justify-center text-[clamp(20px,5vw,32px)] min-[769px]:text-[24px] font-extralight tracking-tight text-neutral-900 dark:text-neutral-100 leading-none select-none text-center m-0 p-0 whitespace-nowrap will-change-opacity"
              style={{
                fontFamily: "'Onest', sans-serif",
                fontWeight: 200,
              }}
            >
              Hi there!
            </motion.h1>

            {/* Step 2: Rolled greeting */}
            <h1
              className="h-[54px] sm:h-[62px] w-full flex items-center justify-center text-[clamp(18px,4.8vw,32px)] min-[769px]:text-[22px] font-extralight tracking-normal text-neutral-900 dark:text-neutral-100 leading-none select-none text-center m-0 p-0 whitespace-nowrap"
              style={{
                fontFamily: "'Onest', sans-serif",
                fontWeight: 200,
              }}
            >
              Welcome to Avinash's portfolio
            </h1>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
