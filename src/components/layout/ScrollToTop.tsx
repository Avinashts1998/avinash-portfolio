import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { getLenis } from "../../hooks/useLenis";
import { pushHistoryPath, popHistoryPath, replaceHistoryPath } from "../../utils/navigationHistory";

// In-memory cache for scroll positions keyed by router history key and pathname
const scrollPositions = new Map<string, number>();

function getSavedPosition(key: string, pathname: string): number | null {
  if (key && scrollPositions.has(key)) {
    return scrollPositions.get(key)!;
  }
  if (pathname && scrollPositions.has(pathname)) {
    return scrollPositions.get(pathname)!;
  }
  try {
    if (key) {
      const val = sessionStorage.getItem(`scroll_k_${key}`);
      if (val !== null) return parseFloat(val);
    }
    if (pathname) {
      const valP = sessionStorage.getItem(`scroll_p_${pathname}`);
      if (valP !== null) return parseFloat(valP);
    }
  } catch {}
  return null;
}

function persistPosition(key: string, pathname: string, y: number, isCleanup = false) {
  // If cleanup runs after scroll was already zeroed out, don't overwrite previous valid position
  if (isCleanup && y === 0) {
    const existing = getSavedPosition(key, pathname);
    if (existing && existing > 0) return;
  }

  if (key) {
    scrollPositions.set(key, y);
    try {
      sessionStorage.setItem(`scroll_k_${key}`, String(y));
    } catch {}
  }
  if (pathname) {
    scrollPositions.set(pathname, y);
    try {
      sessionStorage.setItem(`scroll_p_${pathname}`, String(y));
    } catch {}
  }
}

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

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

  // Continuously record scroll position for the current active page
  useEffect(() => {
    const saveCurrent = (isCleanup = false) => {
      const lenis = getLenis();
      const y = lenis ? lenis.scroll : window.scrollY;
      persistPosition(location.key, location.pathname, y, isCleanup);
    };

    window.addEventListener("scroll", () => saveCurrent(false), { passive: true });
    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", () => saveCurrent(false));
    }

    return () => {
      // Save position before route change / unmount
      saveCurrent(true);
      window.removeEventListener("scroll", () => saveCurrent(false));
      if (lenis) {
        lenis.off("scroll", () => saveCurrent(false));
      }
    };
  }, [location.key, location.pathname]);

  // Handle route change: restore previous scroll on POP (back/forward), or reset to top on PUSH
  useEffect(() => {
    // If returning to Home's featured projects section, let Home.tsx handle the restored position
    const hasHomeFeaturedScroll = typeof sessionStorage !== "undefined" && (
      sessionStorage.getItem("home_featured_scroll") !== null ||
      location.hash === "#selected-works"
    );
    if (location.pathname === "/" && hasHomeFeaturedScroll) {
      return;
    }

    const isPop = navigationType === "POP";
    const targetY = isPop ? getSavedPosition(location.key, location.pathname) : 0;

    const applyScroll = (y: number) => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(y, { immediate: true });
      } else {
        window.scrollTo(0, y);
      }
    };

    if (isPop && targetY !== null && targetY > 0) {
      // Restore previous scroll position immediately
      applyScroll(targetY);

      // Verify once dynamic components and AnimatePresence mount
      const t1 = setTimeout(() => applyScroll(targetY), 80);
      const t2 = setTimeout(() => {
        applyScroll(targetY);
        getLenis()?.resize();
      }, 350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      // Normal forward navigation: reset to top
      applyScroll(0);
      const t1 = setTimeout(() => getLenis()?.resize(), 350);

      return () => {
        clearTimeout(t1);
      };
    }
  }, [location.key, location.pathname, navigationType]);

  return null;
}

