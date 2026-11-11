import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { getLenis } from "../../hooks/useLenis";
import { pushHistoryPath, popHistoryPath, replaceHistoryPath } from "../../utils/navigationHistory";

// Ensure native browser scroll restoration does not conflict with our SPA restoration
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// In-memory caches for scroll positions keyed by router history key and pathname
const keyScrollPositions = new Map<string, number>();
const pathScrollPositions = new Map<string, number>();

// Global flag to prevent scroll events during route transitions from corrupting saved positions
let isTransitioning = false;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;

function getSavedPosition(key: string, pathname: string): number | null {
  // If navigating to root home page, always return 0 so the hero section intro plays cleanly
  if (pathname === "/") {
    return 0;
  }

  // 1. Prefer exact router history key
  if (key && keyScrollPositions.has(key)) {
    return keyScrollPositions.get(key)!;
  }
  try {
    if (key) {
      const valK = sessionStorage.getItem(`scroll_k_${key}`);
      if (valK !== null) {
        const parsed = parseFloat(valK);
        if (!isNaN(parsed)) return parsed;
      }
    }
  } catch {}

  // 2. Fallback to pathname ONLY if this exact pathname was recorded
  if (pathname && pathScrollPositions.has(pathname)) {
    return pathScrollPositions.get(pathname)!;
  }
  try {
    if (pathname) {
      const valP = sessionStorage.getItem(`scroll_p_${pathname}`);
      if (valP !== null) {
        const parsedP = parseFloat(valP);
        if (!isNaN(parsedP)) return parsedP;
      }
    }
  } catch {}

  return null;
}

function persistPosition(key: string, pathname: string, y: number, isCleanup = false) {
  // Never persist while restoring / transitioning between pages (unless it's cleanup of outgoing page)
  if (isTransitioning && !isCleanup) {
    return;
  }

  // Never overwrite an existing positive position with 0 during cleanup if not user-intended
  if (isCleanup && y === 0) {
    const existing = getSavedPosition(key, pathname);
    if (existing !== null && existing > 0) return;
  }

  if (key) {
    keyScrollPositions.set(key, y);
    try {
      sessionStorage.setItem(`scroll_k_${key}`, String(y));
    } catch {}
  }
  if (pathname) {
    pathScrollPositions.set(pathname, y);
    try {
      sessionStorage.setItem(`scroll_p_${pathname}`, String(y));
    } catch {}
  }
}

function applyScroll(y: number) {
  window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
  if (document.documentElement) document.documentElement.scrollTop = y;
  if (document.body) document.body.scrollTop = y;
  const lenis = getLenis();
  if (lenis) {
    lenis.stop();
    lenis.scrollTo(y, { immediate: true, force: true });
    lenis.start();
  }
}

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lastKeyRef = useRef(location.key);
  const lastPathRef = useRef(location.pathname);

  // Track session navigation history stack
  useEffect(() => {
    const fullPath = location.pathname + (location.search || "");
    if (navigationType === "POP") {
      popHistoryPath();
    } else if (navigationType === "REPLACE") {
      replaceHistoryPath(fullPath);
    } else {
      pushHistoryPath(fullPath);
    }
  }, [location.pathname, location.search, navigationType]);

  // Handle route change: restore previous scroll on POP (back/forward), or reset to top on PUSH
  useLayoutEffect(() => {
    // Lock scroll recording during transition
    isTransitioning = true;
    if (transitionTimer) clearTimeout(transitionTimer);

    // Save previous route's scroll before switching
    if (lastKeyRef.current && lastKeyRef.current !== location.key) {
      const currentScroll = getLenis() ? getLenis()!.scroll : window.scrollY;
      persistPosition(lastKeyRef.current, lastPathRef.current, currentScroll, true);
    }
    lastKeyRef.current = location.key;
    lastPathRef.current = location.pathname;

    const isPop = navigationType === "POP";
    const hasHomeFeaturedScroll =
      isPop &&
      typeof sessionStorage !== "undefined" &&
      (sessionStorage.getItem("home_featured_scroll") !== null || location.hash === "#selected-works");

    if (location.pathname === "/" && hasHomeFeaturedScroll) {
      // Home page has dedicated selected-works restoration handler
      isTransitioning = false;
      return;
    }

    if (!isPop) {
      try {
        sessionStorage.removeItem("home_featured_scroll");
      } catch {}
    }

    // Determine target scroll position
    let targetY = 0;
    if (isPop) {
      const saved = getSavedPosition(location.key, location.pathname);
      targetY = saved !== null && !isNaN(saved) && saved >= 0 ? saved : 0;
    } else {
      targetY = 0;
    }

    // Immediately apply scroll position before paint
    applyScroll(targetY);

    // Only repeatedly re-verify on POP navigation (browser back/forward button)
    // when restoring a specific non-zero scroll position.
    // On new page visits or initial load (targetY === 0), do NOT repeatedly snap
    // user touch gestures back to 0!
    if (isPop && targetY > 0) {
      const checkAndApply = () => {
        const current = getLenis() ? getLenis()!.scroll : window.scrollY;
        if (Math.abs(current - targetY) > 4) {
          applyScroll(targetY);
        }
      };

      const rId = requestAnimationFrame(checkAndApply);
      const t1 = setTimeout(checkAndApply, 60);
      const t2 = setTimeout(() => {
        checkAndApply();
        getLenis()?.resize();
      }, 150);
      const t3 = setTimeout(() => {
        getLenis()?.resize();
        isTransitioning = false;
      }, 280);

      transitionTimer = t3;

      return () => {
        cancelAnimationFrame(rId);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      isTransitioning = false;
    }
  }, [location.key, location.pathname, navigationType]);

  // Continuously record scroll position for the current active page when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (isTransitioning) return;
      const lenis = getLenis();
      const y = lenis ? lenis.scroll : window.scrollY;
      persistPosition(location.key, location.pathname, y, false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }

    return () => {
      // Save position before route change / unmount
      handleScroll();
      window.removeEventListener("scroll", handleScroll);
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, [location.key, location.pathname]);

  return null;
}
