import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getLenis } from "./useLenis";

// Module-level state so Navbar and MobileBottomNav stay 100% in sync with zero jitter
let globalNavVisible = true;
const subscribers = new Set<(visible: boolean) => void>();

function setNavVisibility(visible: boolean) {
  if (globalNavVisible !== visible) {
    globalNavVisible = visible;
    subscribers.forEach((cb) => cb(visible));
  }
}

export function useProjectNavScroll() {
  const location = useLocation();
  const isProjectViewPage = location.pathname.startsWith("/project/");
  const isArticleOrProjectPage = location.pathname.startsWith("/project/") || location.pathname.startsWith("/blog/");
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(globalNavVisible);

  useEffect(() => {
    const subscriber = (visible: boolean) => {
      setIsMobileNavVisible(visible);
    };
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  useEffect(() => {
    // When navigating to a new route, always show navigation
    setNavVisibility(true);

    if (!isArticleOrProjectPage) {
      setNavVisibility(true);
      return;
    }

    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let accumulatedDelta = 0;
    let lastDirection = 0;

    const handleScroll = () => {
      // Only active on mobile devices
      if (window.innerWidth > 768) {
        return;
      }

      const lenis = getLenis();
      const scrollY = Math.max(0, lenis ? lenis.scroll : window.scrollY);

      // Always show near the very top of the page
      if (scrollY <= 20) {
        setNavVisibility(true);
        accumulatedDelta = 0;
        lastScrollY = scrollY;
        return;
      }

      // Always show when reaching bottom of page
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      if (winHeight + scrollY >= docHeight - 40) {
        setNavVisibility(true);
        accumulatedDelta = 0;
        lastScrollY = scrollY;
        return;
      }

      const diff = scrollY - lastScrollY;
      const currentDirection = diff > 0 ? 1 : diff < 0 ? -1 : 0;

      if (currentDirection !== 0 && currentDirection !== lastDirection) {
        accumulatedDelta = 0;
        lastDirection = currentDirection;
      }

      accumulatedDelta += diff;

      // Scrolling down: once scroll is started, hide immediately
      if (diff > 1 && accumulatedDelta > 2) {
        setNavVisibility(false);
      }
      // Scrolling up: immediately come back
      else if (diff < -1 || accumulatedDelta < -1) {
        setNavVisibility(true);
      }

      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("lenis-scroll", handleScroll, { passive: true });
    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("lenis-scroll", handleScroll);
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, [isArticleOrProjectPage, location.pathname]);

  return { isMobileNavVisible, isProjectViewPage, isArticleOrProjectPage };
}
