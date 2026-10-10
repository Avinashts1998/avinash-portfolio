import { useEffect } from "react";
import { getLenis } from "./useLenis";

let lockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";
let savedBodyPaddingRight = "";

/**
 * Custom hook to lock scrolling across both Lenis and native browser window
 * whenever a modal, popup, or overlay is open.
 * Uses reference counting so nested or sequential modals behave correctly.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      // 1. Pause Lenis smooth scrolling immediately
      const lenis = getLenis();
      if (lenis) {
        lenis.stop();
      }

      // 2. Save original inline styles (guard against pre-existing 'hidden' from previous uncleaned locks)
      savedBodyOverflow = document.body.style.overflow === "hidden" ? "" : document.body.style.overflow;
      savedHtmlOverflow = document.documentElement.style.overflow === "hidden" ? "" : document.documentElement.style.overflow;
      savedBodyPaddingRight = document.body.style.paddingRight;

      // 3. Compensate scrollbar disappearance only if layout would shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const hasStableGutter = window.getComputedStyle(document.documentElement).scrollbarGutter?.includes("stable");
      if (scrollbarWidth > 0 && !hasStableGutter) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // 4. Lock document and body scroll
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("overflow-hidden");
    }

    lockCount++;

    return () => {
      lockCount--;

      if (lockCount <= 0) {
        lockCount = 0;

        // Restore native styles safely
        document.body.style.overflow = savedBodyOverflow === "hidden" ? "" : savedBodyOverflow;
        document.documentElement.style.overflow = savedHtmlOverflow === "hidden" ? "" : savedHtmlOverflow;
        document.body.style.paddingRight = savedBodyPaddingRight;
        document.body.classList.remove("overflow-hidden");
        document.documentElement.classList.remove("lenis-stopped");

        // Resume Lenis smooth scrolling and re-calculate dimensions
        const lenisAfter = getLenis();
        if (lenisAfter) {
          lenisAfter.start();
          lenisAfter.resize();
        }
      }
    };
  }, [isLocked]);
}
