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

      // 2. Save original inline styles
      savedBodyOverflow = document.body.style.overflow;
      savedHtmlOverflow = document.documentElement.style.overflow;
      savedBodyPaddingRight = document.body.style.paddingRight;

      // 3. Compensate scrollbar disappearance to prevent horizontal layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
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

        // Restore native styles
        document.body.style.overflow = savedBodyOverflow;
        document.documentElement.style.overflow = savedHtmlOverflow;
        document.body.style.paddingRight = savedBodyPaddingRight;
        document.body.classList.remove("overflow-hidden");

        // Resume Lenis smooth scrolling
        const lenisAfter = getLenis();
        if (lenisAfter) {
          lenisAfter.start();
        }
      }
    };
  }, [isLocked]);
}
