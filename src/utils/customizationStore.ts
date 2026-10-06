import { isFirebaseConfigured, db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export interface PortfolioCustomization {
  primaryColor: string;
  colorPreset: string;
  fontStyle: "default" | "serif" | "mono";
  borderRadius: "sharp" | "balanced" | "soft";
  accentStyle: "solid" | "gradient" | "glow";
  heroGreeting?: string;
  heroRole?: string;
  heroBio?: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "royal-blue", name: "Royal Blue", hex: "#2444f0", description: "Default vibrant corporate blue" },
  { id: "emerald", name: "Emerald Green", hex: "#10b981", description: "Fresh, modern organic green" },
  { id: "violet", name: "Violet Purple", hex: "#6A44F2", description: "Creative, sleek purple accent" },
  { id: "rose", name: "Rose Crimson", hex: "#f43f5e", description: "Bold, warm crimson accent" },
  { id: "amber", name: "Amber Sunset", hex: "#f59e0b", description: "Warm golden amber tone" },
  { id: "purple-vibe", name: "Purple Vibe", hex: "#6A44F2", description: "Vibrant electric purple accent" },
  { id: "indigo", name: "Indigo Wave", hex: "#6366f1", description: "Deep tech indigo accent" },
  { id: "teal", name: "Teal Fresh", hex: "#14b8a6", description: "Balanced minty teal shade" },
];

export const DEFAULT_CUSTOMIZATION: PortfolioCustomization = {
  primaryColor: "#2444f0",
  colorPreset: "royal-blue",
  fontStyle: "default",
  borderRadius: "balanced",
  accentStyle: "solid",
  heroGreeting: "Hi, I'm Avinash",
  heroRole: "Full-Stack Engineer & Product Designer",
  heroBio: "Building thoughtful, high-performance digital products and intuitive web experiences."
};

const STORAGE_KEY = "portfolio_customization_settings";
let isFirebaseThemeListenerSetup = false;

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 36, g: 68, b: 240 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function adjustColorBrightness(hex: string, percent: number) {
  const clean = hex.replace("#", "");
  let num = parseInt(clean, 16);
  if (isNaN(num)) return hex;
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00ff) + amt;
  let B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

export function applyCustomizationToDOM(customization?: PortfolioCustomization) {
  if (typeof window === "undefined") return;
  const settings = customization || getCustomizationSettings();
  const root = document.documentElement;

  const hex = settings.primaryColor || "#2444f0";
  const rgb = hexToRgb(hex);

  const isDark = root.getAttribute("data-theme") === "dark" || root.classList.contains("dark");

  if (isDark) {
    const darkAccent =
      !settings.primaryColor || settings.primaryColor.toLowerCase() === "#2444f0"
        ? "#2663FF"
        : adjustColorBrightness(hex, 12);
    const darkRgb = hexToRgb(darkAccent);

    root.style.setProperty("--blue", darkAccent);
    root.style.setProperty("--brand-primary", darkAccent);
    root.style.setProperty("--blue-hover", adjustColorBrightness(darkAccent, 10));
    root.style.setProperty("--blue-deep", adjustColorBrightness(darkAccent, 20));
    root.style.setProperty("--blue-tint", `rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 0.18)`);
    root.style.setProperty("--brand-accent", `rgba(${darkRgb.r}, ${darkRgb.g}, ${darkRgb.b}, 0.18)`);
  } else {
    // Primary Accent Colors (Light Mode)
    root.style.setProperty("--blue", hex);
    root.style.setProperty("--brand-primary", hex);
    root.style.setProperty("--blue-hover", adjustColorBrightness(hex, -15));
    root.style.setProperty("--blue-deep", adjustColorBrightness(hex, -30));
    root.style.setProperty("--blue-tint", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
    root.style.setProperty("--brand-accent", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
  }

  // Border Radius customization
  if (settings.borderRadius === "sharp") {
    root.style.setProperty("--card-radius", "6px");
  } else if (settings.borderRadius === "soft") {
    root.style.setProperty("--card-radius", "24px");
  } else {
    root.style.setProperty("--card-radius", "16px");
  }

  // Font customization
  if (settings.fontStyle === "serif") {
    root.style.setProperty("--font-hero", "'Fraunces', Georgia, serif");
  } else if (settings.fontStyle === "mono") {
    root.style.setProperty("--font-hero", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace");
  } else {
    root.style.setProperty("--font-hero", "'Vastago Grotesk', var(--sans)");
  }
}

export function setupFirebaseThemeListener() {
  if (typeof window === "undefined" || isFirebaseThemeListenerSetup || !isFirebaseConfigured || !db) return;
  isFirebaseThemeListenerSetup = true;

  try {
    const docRef = doc(db, "settings", "theme_customization");
    onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const themeSettings: PortfolioCustomization = {
            ...DEFAULT_CUSTOMIZATION,
            ...data,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(themeSettings));
          applyCustomizationToDOM(themeSettings);
          window.dispatchEvent(new CustomEvent("portfolio_customization_update", { detail: themeSettings }));
        }
      },
      (error) => {
        console.warn("Firestore theme customization listener warning:", error.message || error);
      }
    );
  } catch (error) {
    console.error("Failed to set up Firestore theme listener:", error);
  }
}

export function getCustomizationSettings(): PortfolioCustomization {
  if (typeof window === "undefined") return DEFAULT_CUSTOMIZATION;
  setupFirebaseThemeListener();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CUSTOMIZATION, ...parsed };
    }
  } catch {}
  return DEFAULT_CUSTOMIZATION;
}

export function saveCustomizationSettings(settings: PortfolioCustomization) {
  if (typeof window === "undefined") return;
  
  const cleanSettings: PortfolioCustomization = {
    primaryColor: settings.primaryColor || "#2444f0",
    colorPreset: settings.colorPreset || "royal-blue",
    fontStyle: settings.fontStyle || "default",
    borderRadius: settings.borderRadius || "balanced",
    accentStyle: settings.accentStyle || "solid",
    heroGreeting: settings.heroGreeting,
    heroRole: settings.heroRole,
    heroBio: settings.heroBio,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanSettings));
  applyCustomizationToDOM(cleanSettings);
  window.dispatchEvent(new CustomEvent("portfolio_customization_update", { detail: cleanSettings }));

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "settings", "theme_customization");
      setDoc(docRef, { id: "theme_customization", ...cleanSettings }).catch((err) => {
        console.error("Error saving theme customization to Firestore:", err);
      });
    } catch (err) {
      console.error("Error referencing theme customization Firestore doc:", err);
    }
  }
}

export function resetCustomizationSettings() {
  saveCustomizationSettings(DEFAULT_CUSTOMIZATION);
}

