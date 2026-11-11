import { useEffect, useState, TransitionEvent } from "react";

interface AISearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom hook to detect prefers-reduced-motion
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return prefersReducedMotion;
}

function getInitialOrigin() {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  const iconEl = document.getElementById("ai-sparkle-icon");
  const inputEl = document.querySelector('input[placeholder*="Ask AI"]');
  const navbarEl = document.getElementById("navbar");

  if (iconEl) {
    const iconRect = iconEl.getBoundingClientRect();
    return {
      x: iconRect.left + iconRect.width / 2,
      y: iconRect.top + iconRect.height / 2,
    };
  } else if (inputEl && navbarEl) {
    const inputRect = inputEl.getBoundingClientRect();
    const navbarRect = navbarEl.getBoundingClientRect();
    return {
      x: inputRect.left + inputRect.width / 2,
      y: navbarRect.top + navbarRect.height / 2,
    };
  }

  return { x: window.innerWidth / 2, y: 32 };
}

export default function AISearchOverlay({ isOpen, onClose }: AISearchOverlayProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [origin, setOrigin] = useState(() => getInitialOrigin());
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateOpen, setAnimateOpen] = useState(false);

  // Synchronize mount/unmount and animate cycles
  useEffect(() => {
    let active = true;
    let raf1: number | null = null;
    let raf2: number | null = null;

    if (isOpen) {
      setShouldRender(true);
      // Synchronously recalculate origin when opening to ensure transition starts from correct center
      setOrigin(getInitialOrigin());

      if (prefersReducedMotion) {
        setAnimateOpen(true);
      } else {
        // Double rAF ensures the browser paints the initial "closed" frame in the DOM
        // before transitioning, preventing skip-to-end on mount.
        raf1 = requestAnimationFrame(() => {
          if (!active) return;
          raf2 = requestAnimationFrame(() => {
            if (!active) return;
            setAnimateOpen(true);
          });
        });
      }
    } else {
      setAnimateOpen(false);
      if (prefersReducedMotion) {
        setShouldRender(false);
      }
    }

    return () => {
      active = false;
      if (raf1 !== null) cancelAnimationFrame(raf1);
      if (raf2 !== null) cancelAnimationFrame(raf2);
    };
  }, [isOpen, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOrigin = () => {
      setOrigin(getInitialOrigin());
    };

    // Recalculate on window resize
    window.addEventListener("resize", updateOrigin);
    return () => {
      window.removeEventListener("resize", updateOrigin);
    };
  }, []);

  // Unmount completely when the close transition completes
  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isOpen) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  // Compute CSS Transition properties dynamically based on state
  const transitionStyle = prefersReducedMotion
    ? "none"
    : "clip-path 700ms cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 700ms cubic-bezier(0.4, 0, 0.2, 1), -webkit-backdrop-filter 700ms cubic-bezier(0.4, 0, 0.2, 1), background-color 700ms cubic-bezier(0.4, 0, 0.2, 1)";

  const isCurrentlyActive = animateOpen && isOpen;

  const clipPathStyle = prefersReducedMotion
    ? "none"
    : isCurrentlyActive
    ? `circle(150% at ${origin.x}px ${origin.y}px)`
    : `circle(0% at ${origin.x}px ${origin.y}px)`;

  return (
    <div
      id="ai-search-overlay"
      onClick={onClose}
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isCurrentlyActive ? "rgba(0, 0, 0, 0.35)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isCurrentlyActive ? "blur(16px)" : "none",
        WebkitBackdropFilter: isCurrentlyActive ? "blur(16px)" : "none",
        zIndex: 80,
        pointerEvents: isOpen ? "auto" : "none",
        clipPath: clipPathStyle,
        transition: transitionStyle,
        willChange: prefersReducedMotion ? "auto" : "clip-path, backdrop-filter, background-color",
      }}
    />
  );
}
