import React, { useState, useEffect, useRef, useCallback } from "react";
import { getLenis } from "../../hooks/useLenis";

interface RightSideScrollbarProps {
  className?: string;
}

export default function RightSideScrollbar({ className = "" }: RightSideScrollbarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Cached layout metrics to avoid reading DOM layout repeatedly on pointer move
  const trackMetricsRef = useRef({
    trackTop: 0,
    trackHeight: 0,
    thumbHeight: 48,
    availableTravel: 0,
    maxScroll: 0,
  });

  const dragStartYRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure track & synchronize thumb dimensions and position
  const syncMetricsAndThumb = useCallback(() => {
    if (!trackRef.current || !thumbRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const tHeight = trackRect.height;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(1, docHeight - winHeight);

    // Dynamic thumb height proportional to viewport ratio (min 36px, max 40% of track)
    const calculatedThumbHeight = Math.min(
      tHeight * 0.4,
      Math.max(36, (winHeight / docHeight) * tHeight)
    );
    const availableTravel = Math.max(0, tHeight - calculatedThumbHeight);

    trackMetricsRef.current = {
      trackTop: trackRect.top,
      trackHeight: tHeight,
      thumbHeight: calculatedThumbHeight,
      availableTravel,
      maxScroll,
    };

    // Update thumb height on the DOM
    thumbRef.current.style.height = `${calculatedThumbHeight}px`;

    // Only update position from scroll event if not actively dragging
    if (!isDraggingRef.current) {
      const lenis = getLenis();
      const currentScroll = Math.max(
        0,
        lenis ? lenis.scroll : (window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0)
      );
      const progress = Math.min(1, Math.max(0, currentScroll / maxScroll));
      const thumbTop = progress * availableTravel;

      thumbRef.current.style.transform = `translate3d(0, ${thumbTop}px, 0)`;

      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 700);
    }
  }, []);

  useEffect(() => {
    syncMetricsAndThumb();
    window.addEventListener("scroll", syncMetricsAndThumb, { passive: true });
    window.addEventListener("lenis-scroll", syncMetricsAndThumb, { passive: true });
    window.addEventListener("resize", syncMetricsAndThumb, { passive: true });

    const timer = setTimeout(syncMetricsAndThumb, 350);

    return () => {
      window.removeEventListener("scroll", syncMetricsAndThumb);
      window.removeEventListener("lenis-scroll", syncMetricsAndThumb);
      window.removeEventListener("resize", syncMetricsAndThumb);
      clearTimeout(timer);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [syncMetricsAndThumb]);

  // Click anywhere on track to instantly jump to that position (standard scrollbar behavior, zero lingering momentum)
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If a drag gesture just finished, suppress the synthetic click event
    if (didDragRef.current || isDraggingRef.current || !trackRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const ratio = Math.min(1, Math.max(0, clickY / trackRect.height));

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);
    const targetScroll = ratio * maxScroll;

    const lenis = getLenis();
    if (lenis) {
      lenis.velocity = 0;
      lenis.scrollTo(targetScroll, { immediate: true });
    }
    window.scrollTo(0, targetScroll);
    syncMetricsAndThumb();
  };

  // Ultra-responsive, direct drag implementation with zero inertial overshoot
  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    // Cache latest metrics on drag start
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const tHeight = trackRect.height;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);
      const calculatedThumbHeight = Math.min(
        tHeight * 0.4,
        Math.max(36, (winHeight / docHeight) * tHeight)
      );
      const availableTravel = Math.max(0, tHeight - calculatedThumbHeight);

      trackMetricsRef.current = {
        trackTop: trackRect.top,
        trackHeight: tHeight,
        thumbHeight: calculatedThumbHeight,
        availableTravel,
        maxScroll,
      };
    }

    isDraggingRef.current = true;
    didDragRef.current = false;
    setIsDragging(true);
    dragStartYRef.current = e.clientY;

    const lenis = getLenis();
    if (lenis) {
      lenis.velocity = 0;
    }

    const currentScroll = Math.max(
      0,
      lenis ? lenis.scroll : (window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0)
    );
    dragStartScrollRef.current = currentScroll;

    // Prevent text selection or cursor fighting during drag
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !thumbRef.current) return;

      const { availableTravel, maxScroll } = trackMetricsRef.current;
      if (availableTravel <= 0 || maxScroll <= 0) return;

      const deltaY = moveEvent.clientY - dragStartYRef.current;
      if (Math.abs(deltaY) > 2) {
        didDragRef.current = true;
      }

      const scrollDelta = (deltaY / availableTravel) * maxScroll;
      const targetScroll = Math.min(maxScroll, Math.max(0, dragStartScrollRef.current + scrollDelta));

      // 1. Direct hardware-accelerated transform update on the thumb (0ms latency)
      const newProgress = maxScroll > 0 ? targetScroll / maxScroll : 0;
      const newThumbTop = newProgress * availableTravel;
      thumbRef.current.style.transform = `translate3d(0, ${newThumbTop}px, 0)`;

      // 2. Direct 1:1 scroll without residual momentum
      const activeLenis = getLenis();
      if (activeLenis) {
        activeLenis.velocity = 0;
        activeLenis.scrollTo(targetScroll, { immediate: true });
      }
      window.scrollTo(0, targetScroll);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);

      // Restore body styles
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      // Ensure Lenis momentum is completely reset to prevent trailing drift
      const activeLenis = getLenis();
      if (activeLenis) {
        activeLenis.velocity = 0;
      }

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      // Keep didDragRef true briefly to suppress the trailing click event on track
      setTimeout(() => {
        didDragRef.current = false;
      }, 100);

      // Final re-sync
      syncMetricsAndThumb();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
  };

  const isVisible = isHovered || isDragging || isScrolling;
  const isPrimaryActive = isHovered || isDragging;

  return (
    <div
      id="right-side-scrollbar"
      aria-label="Case study scroll position"
      role="scrollbar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed right-1 sm:right-2.5 top-20 bottom-20 z-[95] w-6 flex items-center justify-center select-none pointer-events-auto transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-35 hover:opacity-100"
      } ${className}`}
    >
      {/* Clickable Track Rail */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-full h-full flex justify-center cursor-pointer py-1"
      >
        {/* Subtle Background Track Line */}
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            isPrimaryActive
              ? "bg-black/[0.1] dark:bg-white/[0.14] w-[3px]"
              : "bg-black/[0.05] dark:bg-white/[0.07] w-[2.5px]"
          }`}
        />

        {/* Floating Animated Thumb Capsule */}
        <div
          ref={thumbRef}
          onPointerDown={handleThumbPointerDown}
          style={{
            touchAction: "none",
            willChange: "transform, height, width",
          }}
          className={`absolute left-1/2 -translate-x-1/2 rounded-full cursor-grab active:cursor-grabbing transition-[width,background-color,box-shadow] duration-200 ease-out ${
            isPrimaryActive
              ? "w-[8px] bg-[var(--blue)] shadow-[0_0_12px_rgba(0,82,255,0.45)] ring-1 ring-[var(--blue)]/30"
              : "w-[3.5px] bg-neutral-400/80 dark:bg-neutral-500/80"
          }`}
        >
          {/* Expanded transparent hit area around thumb for effortless grabbing */}
          <div className="absolute -inset-x-2.5 -inset-y-1 rounded-full cursor-grab active:cursor-grabbing" />
        </div>
      </div>
    </div>
  );
}
