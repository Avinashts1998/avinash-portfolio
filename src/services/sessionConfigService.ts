import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";

export interface SessionConfig {
  bookingUrl: string;
  meetUrl?: string;
  communityUrl?: string;
  openInNewTab: boolean;
  updatedAt?: string;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  bookingUrl: "https://adplist.org",
  meetUrl: "https://meet.google.com/new",
  communityUrl: "https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v",
  openInNewTab: true,
};

const STORAGE_KEY = "portfolio_session_booking_config";
const FIRESTORE_DOC_PATH = "settings/session_booking";
const EVENT_NAME = "portfolio_session_config_updated";

// Cache in memory
let cachedConfig: SessionConfig = (() => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.bookingUrl === "string") {
          return {
            bookingUrl: parsed.bookingUrl,
            meetUrl: parsed.meetUrl || DEFAULT_SESSION_CONFIG.meetUrl,
            communityUrl: parsed.communityUrl || DEFAULT_SESSION_CONFIG.communityUrl,
            openInNewTab: parsed.openInNewTab !== false,
            updatedAt: parsed.updatedAt,
          };
        }
      }
    } catch {
      // fallback
    }
  }
  return { ...DEFAULT_SESSION_CONFIG };
})();

// Helper to ensure URL has valid protocol
export function formatBookingUrl(rawUrl: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return DEFAULT_SESSION_CONFIG.bookingUrl;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // If it's an internal path like /session-booking, keep it
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const sessionConfigService = {
  /**
   * Get current cached configuration synchronously
   */
  getConfig(): SessionConfig {
    return { ...cachedConfig };
  },

  /**
   * Get formatted booking destination URL
   */
  getBookingUrl(): string {
    return formatBookingUrl(cachedConfig.bookingUrl);
  },

  /**
   * Directly navigate to the session booking website according to config
   */
  navigateToBooking(customUrl?: string): void {
    const url = customUrl ? formatBookingUrl(customUrl) : this.getBookingUrl();
    if (!url || typeof window === "undefined") return;

    if (cachedConfig.openInNewTab && (url.startsWith("http://") || url.startsWith("https://"))) {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        window.location.href = url;
      }
    } else {
      window.location.href = url;
    }
  },

  /**
   * Save updated configuration across LocalStorage, Server API, and Firestore
   */
  async saveConfig(partial: Partial<SessionConfig>): Promise<SessionConfig> {
    const updated: SessionConfig = {
      ...cachedConfig,
      ...partial,
      bookingUrl: partial.bookingUrl !== undefined ? formatBookingUrl(partial.bookingUrl) : cachedConfig.bookingUrl,
      meetUrl: partial.meetUrl !== undefined ? partial.meetUrl.trim() : cachedConfig.meetUrl,
      communityUrl: partial.communityUrl !== undefined ? partial.communityUrl.trim() : cachedConfig.communityUrl,
      openInNewTab: partial.openInNewTab !== undefined ? Boolean(partial.openInNewTab) : cachedConfig.openInNewTab,
      updatedAt: new Date().toISOString(),
    };

    cachedConfig = updated;

    // 1. LocalStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
      } catch (e) {
        console.warn("Could not save session config to localStorage:", e);
      }
    }

    // 2. Server API fallback
    try {
      fetch("/api/session-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // 3. Firestore Document sync
    if (isFirebaseConfigured && db) {
      try {
        const configDocRef = doc(db, "settings", "session_booking");
        await setDoc(configDocRef, updated, { merge: true });
      } catch (err) {
        console.warn("Notice: Firestore sync for session_booking:", err);
      }
    }

    return updated;
  },

  /**
   * Subscribe to real-time configuration updates
   */
  initListener(callback: (config: SessionConfig) => void): () => void {
    // Deliver initial cached value
    callback({ ...cachedConfig });

    // In-browser event listener
    const handleEvent = (e: any) => {
      if (e?.detail) {
        callback(e.detail);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(EVENT_NAME, handleEvent);
    }

    // Server API fetch on mount
    fetch("/api/session-config")
      .then((r) => r.json())
      .then((serverData) => {
        if (serverData && typeof serverData.bookingUrl === "string" && serverData.bookingUrl.trim()) {
          const merged: SessionConfig = {
            bookingUrl: formatBookingUrl(serverData.bookingUrl),
            openInNewTab: serverData.openInNewTab !== false,
            updatedAt: serverData.updatedAt || cachedConfig.updatedAt,
          };
          cachedConfig = merged;
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
          }
          callback(merged);
        }
      })
      .catch(() => {});

    // Firestore real-time listener if available
    let unsubFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const configDocRef = doc(db, "settings", "session_booking");
        unsubFirestore = onSnapshot(configDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<SessionConfig>;
            if (data?.bookingUrl) {
              const synced: SessionConfig = {
                bookingUrl: formatBookingUrl(data.bookingUrl),
                openInNewTab: data.openInNewTab !== false,
                updatedAt: data.updatedAt,
              };
              cachedConfig = synced;
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
                } catch {}
              }
              callback(synced);
            }
          }
        }, (err) => {
          console.warn("Firestore session_booking listener notice:", err);
        });
      } catch {
        // ignore
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(EVENT_NAME, handleEvent);
      }
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  },
};
