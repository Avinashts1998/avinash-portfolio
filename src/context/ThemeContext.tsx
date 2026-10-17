import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { applyCustomizationToDOM, setupFirebaseThemeListener } from "../utils/customizationStore";
import { playThemeSound } from "../utils/themeSound";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent<HTMLElement> | { clientX: number; clientY: number }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        // Clean up legacy localStorage settings so opening the site fresh always defaults to light theme
        window.localStorage.removeItem("theme_user_selected");
        window.localStorage.removeItem("theme");

        const sessionTheme = window.sessionStorage.getItem("theme") as Theme | null;
        if (sessionTheme === "light" || sessionTheme === "dark") {
          return sessionTheme;
        }
      } catch (e) {}
    }
    // Default to lighter theme on initial load
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("theme", theme);
      } catch (e) {}
    }

    // Apply portfolio color & typography customization
    setupFirebaseThemeListener();
    applyCustomizationToDOM();

    const handleCustomizationEvent = () => {
      applyCustomizationToDOM();
    };
    window.addEventListener("portfolio_customization_update", handleCustomizationEvent);
    return () => {
      window.removeEventListener("portfolio_customization_update", handleCustomizationEvent);
    };
  }, [theme]);

  const toggleTheme = (e?: React.MouseEvent<HTMLElement> | { clientX: number; clientY: number }) => {
    const nextTheme = theme === "light" ? "dark" : "light";

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("theme", nextTheme);
      } catch (e) {}
    }

    // Play subtle synthesized tactile chime & click
    playThemeSound(nextTheme);

    // Calculate exact center of origin for the spreading circle
    let x = typeof window !== "undefined" ? window.innerWidth - 48 : 0;
    let y = typeof window !== "undefined" ? window.innerHeight - 48 : 0;

    if (e) {
      if ("currentTarget" in e && e.currentTarget instanceof HTMLElement) {
        const rect = e.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if ("clientX" in e && typeof e.clientX === "number") {
        x = e.clientX;
        y = e.clientY;
      }
    }

    const maxRadius = typeof window !== "undefined"
      ? Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      : 1600;

    // View Transitions API for the iconic circular spreading wave
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      try {
        const transition = (document as any).startViewTransition(() => {
          setTheme(nextTheme);
        });

        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 650,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        }).catch(() => {
          setTheme(nextTheme);
        });
        return;
      } catch (err) {
        console.warn("View Transitions not supported or blocked, applying theme directly:", err);
      }
    }

    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
