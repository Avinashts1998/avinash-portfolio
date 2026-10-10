import { useEffect } from "react";
import Lenis from "lenis";
import { useLoader } from "../context/LoaderContext";

// Module-level reference to the active Lenis instance for global access
let lenisInstance: Lenis | null = null;

export function getLenis() {
  return lenisInstance;
}

export function useLenis() {
  const { isLoaded } = useLoader();

  useEffect(() => {
    // Wait until preloader is completely finished to avoid scroll-lock issues and height calculation mismatches
    if (!isLoaded) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      console.log(
        "Lenis: prefers-reduced-motion is enabled. Falling back to native scrolling."
      );
      return;
    }

    let lenis: Lenis | null = null;
    let rafId: number | null = null;
    let resizeTimeout: NodeJS.Timeout | null = null;
    let debouncedResize: (() => void) | null = null;

    // Delay Lenis initialization slightly so curtain lift and hero entrance finish with 100% silky 60/120fps
    const initTimer = setTimeout(() => {
      // 1. Initialize Lenis with smooth physical damping and natural 1:1 wheel response.
      lenis = new Lenis({
        lerp: 0.1, // Direct, fluid, buttery responsiveness
        smoothWheel: true,
        wheelMultiplier: 1.0, // Natural 1:1 scroll responsiveness (eliminates artificial drag/friction)
        touchMultiplier: 1.0,
        infinite: false,
        autoResize: true,
        prevent: (node) => {
          return (
            node.hasAttribute?.("data-lenis-prevent") ||
            Boolean(
              node.closest?.(
                "[data-lenis-prevent], #page-ask-ai, #admin-dashboard-page, #admin-resume-modal-portal, [role='dialog'], .overflow-y-auto, .admin-scrollbar"
              )
            )
          );
        },
      });

      lenisInstance = lenis;

      // 2. Continually synchronize Lenis dimensions on window resize and font loading
      debouncedResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          lenis?.resize();
        }, 150);
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          lenis?.resize();
        });
      }

      window.addEventListener("resize", debouncedResize, { passive: true });

      function raf(time: number) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);

      // Initial resize to ensure correct limits immediately
      lenis.resize();
    }, 700);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (debouncedResize) window.removeEventListener("resize", debouncedResize);
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) {
        lenis.destroy();
        lenisInstance = null;
      }
    };
  }, [isLoaded]);
}
