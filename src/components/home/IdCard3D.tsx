import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { HangingCard } from "./HangingCard";
import { ProfileData, ThemeData } from "./cardTextures";

export const defaultProfile: ProfileData = {
  firstName: "Avinash",
  lastName: "Shajan",
  idNumber: "10-2026",
  role: "Product Designer",
  available: true,
  location: "Dubai, UAE",
  experience: "5+ years",
  site: "https://avinashshajan.com",
  photo: "https://res.cloudinary.com/p66qxgqe/image/upload/v1793268434/uktvzdvidu8gbfudpo32.png",
  photoFocus: 0.5,
  photoStyle: "original",
  contact: {
    email: "avinashts1122@gmail.com",
    linkedin: "linkedin.com/in/avinashshajan",
    website: "avinashshajan.com",
  },
  currently: "Designing 0-1 products & scalable systems",
};

export const defaultTheme: ThemeData = {
  accent: "#2563eb",
  ink: "#111318",
};

function haptic(ms = 12) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {}
  }
}

function loadFonts() {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const fonts = ['700 100px "Space Grotesk"', '500 100px "Space Grotesk"', '500 24px "JetBrains Mono"'];
  const ready = Promise.all(fonts.map((f) => document.fonts.load(f)));
  const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
  return Promise.race([ready, timeout]).catch(() => {});
}

interface IdCard3DProps {
  key?: React.Key;
  profile?: ProfileData;
  theme?: ThemeData;
  onPull?: (progress: number) => void;
}

export default function IdCard3D({
  profile = defaultProfile,
  theme = defaultTheme,
  onPull,
}: IdCard3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const cardRef = useRef<HangingCard | null>(null);

  useEffect(() => {
    // Only mount and animate 3D card when active on Home page
    if (!isHome) {
      if (cardRef.current) {
        cardRef.current.dispose();
        cardRef.current = null;
      }
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    let resizeObserver: ResizeObserver | null = null;
    let visibilityObserver: IntersectionObserver | null = null;
    let unmounted = false;
    let lastPull = 0;

    const toggleTheme = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";

      if (isDark) {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
        sessionStorage.setItem("theme", "light");
        cardRef.current?.setMode("light");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        sessionStorage.setItem("theme", "dark");
        cardRef.current?.setMode("dark");
      }
    };

    const currentMode =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";

    loadFonts().then(() => {
      if (unmounted || !host) return;

      // Clean up previous instance if any
      if (cardRef.current) {
        cardRef.current.dispose();
        cardRef.current = null;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const card = new HangingCard(host, {
        profile,
        theme,
        mode: currentMode,
        reducedMotion,
        onPull: (progress) => {
          if (progress >= 1 && lastPull < 1) haptic(14);
          lastPull = progress;
          onPull?.(progress);
        },
        onToggle: () => {
          haptic(25);
          toggleTheme();
        },
      });

      cardRef.current = card;

      // Ensure card wakes up and resizes as soon as container dimensions are painted
      requestAnimationFrame(() => {
        if (!unmounted && cardRef.current) {
          cardRef.current.wakeUp();
        }
      });

      resizeObserver = new ResizeObserver(() => {
        if (!unmounted && cardRef.current) {
          cardRef.current.resize();
        }
      });
      resizeObserver.observe(host);

      visibilityObserver = new IntersectionObserver(([entry]) => {
        if (!unmounted && cardRef.current) {
          if (entry.isIntersecting) {
            cardRef.current.wakeUp();
          } else {
            cardRef.current.setActive(false);
          }
        }
      }, {
        threshold: 0.05,
      });
      visibilityObserver.observe(host);
    });

    return () => {
      unmounted = true;
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      if (cardRef.current) {
        cardRef.current.dispose();
        cardRef.current = null;
      }
    };
  }, [isHome, profile, theme, onPull]);

  return (
    <div
      ref={hostRef}
      className="idcard-stage absolute inset-0 w-full h-full select-none overflow-hidden flex items-center justify-center"
      role="img"
      aria-label={`Interactive 3D ID card for ${profile.firstName} ${profile.lastName}. Drag to swing, click to flip, pull down to switch light and dark mode.`}
    />
  );
}
