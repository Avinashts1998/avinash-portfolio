import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useLoader } from "../../context/LoaderContext";

// Primary critical assets to monitor for adaptive loading
const CRITICAL_ASSETS: string[] = [
  "https://res.cloudinary.com/p66qxgqe/image/upload/v1784958046/eclipqr3elwuuhz9jwm4.webp",
  "https://res.cloudinary.com/p66qxgqe/image/upload/v1784958046/x10noqpftpmbupldbtrf.webp",
];

interface AppLoaderProps {
  onComplete: () => void;
}

export default function AppLoader({ onComplete }: AppLoaderProps) {
  const { hasLoadedInSession, completeLoader } = useLoader();
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // References for adaptive progress tracking
  const targetProgressRef = useRef(15);
  const currentProgressRef = useRef(0);
  const isFinishedRef = useRef(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Adaptive Readiness Engine: monitors DOM, Web Fonts, Images, and Window Load
  useEffect(() => {
    if (hasLoadedInSession) {
      onComplete();
      return;
    }

    let active = true;

    // 1. Initial base progress on mount
    targetProgressRef.current = Math.max(targetProgressRef.current, 25);

    // 2. DOM Ready State
    const updateReadyState = () => {
      if (!active) return;
      if (document.readyState === "interactive") {
        targetProgressRef.current = Math.max(targetProgressRef.current, 50);
      } else if (document.readyState === "complete") {
        targetProgressRef.current = Math.max(targetProgressRef.current, 85);
      }
    };
    updateReadyState();

    if (document.readyState !== "complete") {
      window.addEventListener("DOMContentLoaded", updateReadyState);
      window.addEventListener("load", () => {
        if (!active) return;
        targetProgressRef.current = 100;
      });
    } else {
      targetProgressRef.current = Math.max(targetProgressRef.current, 85);
    }

    // 3. Web Fonts Ready
    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      document.fonts.ready
        .then(() => {
          if (!active) return;
          targetProgressRef.current = Math.max(targetProgressRef.current, 65);
        })
        .catch(() => {});
    }

    // 4. Critical & In-DOM Images Preloading
    const imagesToTrack = new Set<string>(CRITICAL_ASSETS);
    if (typeof document !== "undefined") {
      document.querySelectorAll("img").forEach((img) => {
        if (img.src && !img.src.startsWith("data:")) {
          imagesToTrack.add(img.src);
        }
      });
    }

    const totalImages = imagesToTrack.size;
    let resolvedImages = 0;

    const checkImageCompletion = () => {
      if (!active) return;
      resolvedImages++;
      const imageRatio = totalImages > 0 ? resolvedImages / totalImages : 1;
      const calculatedTarget = Math.round(35 + imageRatio * 55);
      targetProgressRef.current = Math.max(targetProgressRef.current, calculatedTarget);

      if (resolvedImages >= totalImages && document.readyState === "complete") {
        targetProgressRef.current = 100;
      }
    };

    if (totalImages === 0) {
      targetProgressRef.current = Math.max(targetProgressRef.current, 80);
    } else {
      imagesToTrack.forEach((src) => {
        const img = new Image();
        img.src = src;
        if (img.complete) {
          checkImageCompletion();
        } else {
          img.onload = checkImageCompletion;
          img.onerror = checkImageCompletion;
        }
      });
    }

    // 5. Reliability Safety Net: max 4.2s before resolving to 100%
    const safetyTimer = setTimeout(() => {
      if (active) {
        targetProgressRef.current = 100;
      }
    }, 4200);

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      window.removeEventListener("DOMContentLoaded", updateReadyState);
    };
  }, [hasLoadedInSession, onComplete]);

  // Smooth & Slow Animation Loop
  // Combines a deliberate 3.6s easing curve with live resource readiness
  useEffect(() => {
    if (hasLoadedInSession) return;

    let animFrameId: number;
    const startTime = performance.now();
    // 3.6s target duration for a deliberate, slow, luxurious animation
    const DURATION = prefersReducedMotion ? 400 : 3600;

    // Cubic ease-in-out curve for soft startup, fluid body, and gentle finish
    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const updateLoop = (now: number) => {
      const elapsed = now - startTime;
      const timeRatio = Math.min(1, Math.max(0, elapsed / DURATION));
      const naturalProgress = easeInOutCubic(timeRatio) * 100;

      // Gate progress with actual readiness: hold around 92% if assets are still pending
      const target = targetProgressRef.current;
      const maxAllowed = target >= 100 ? 100 : Math.min(92, target);
      const computedNext = Math.min(naturalProgress, maxAllowed);

      // Smoothly advance current progress
      const prev = currentProgressRef.current;
      const next = Math.max(prev, computedNext);
      currentProgressRef.current = next;
      setSmoothProgress(next);

      if (next >= 100) {
        if (!isFinishedRef.current) {
          isFinishedRef.current = true;
          setSmoothProgress(100);
          setTimeout(() => {
            completeLoader();
            onComplete();
          }, prefersReducedMotion ? 0 : 350);
        }
        return;
      }

      animFrameId = requestAnimationFrame(updateLoop);
    };

    animFrameId = requestAnimationFrame(updateLoop);

    return () => cancelAnimationFrame(animFrameId);
  }, [hasLoadedInSession, completeLoader, onComplete, prefersReducedMotion]);

  // Lock scroll while loader is visible
  useEffect(() => {
    if (smoothProgress < 100) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [smoothProgress]);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // Use floating-point smoothProgress for sub-pixel fluid circle rendering
  const strokeDashoffset = circumference - (smoothProgress / 100) * circumference;
  const displayInteger = Math.min(100, Math.floor(smoothProgress));

  return (
    <motion.div
      id="app-loader"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 0.99,
        filter: "blur(8px)",
      }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white dark:bg-[var(--bg)] select-none px-6"
    >
      <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44">
        {/* Circular Progress Arc */}
        <svg
          className="w-full h-full"
          viewBox="0 0 160 160"
          style={{ transform: "scaleX(-1) rotate(-90deg)" }}
        >
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#2b66ff"
            strokeWidth="11"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Centered Number */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-sans text-4xl sm:text-5xl font-medium tracking-tight text-[#2b66ff] tabular-nums select-none">
            {displayInteger}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
