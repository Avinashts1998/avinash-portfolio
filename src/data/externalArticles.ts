import { ExternalArticle } from "../types/externalArticle";
import { isFirebaseConfigured, db } from "../utils/firebase";
import { collection, onSnapshot, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

const STORAGE_KEY = "portfolio_external_articles";
const CLEARED_KEY = "portfolio_external_articles_cleared";
const COLLECTION_NAME = "external_articles";

export const DEFAULT_EXTERNAL_ARTICLES: ExternalArticle[] = [
  {
    id: "ext-autonomy-agentic-ai",
    title: "Designing For Autonomy: Applying Classic Nielsen Heuristics to Agentic AI",
    excerpt: "How classic UX heuristics translate into autonomous agent loops, prompt feedback cycles, and cognitive safety in enterprise tools.",
    platform: "Medium",
    publication: "Medium",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "@avinashts1122",
    },
    publishedDate: "Sep 2026",
    readTime: "6 min read",
    url: "https://medium.com/@avinashts1122",
    topic: "AI & UX",
    createdAt: 1726000000000,
  },
  {
    id: "ext-fintech-onboarding",
    title: "Reducing Merchant Onboarding Friction by 50% in Complex Fintech Ecosystems",
    excerpt: "Key architectural patterns and iterative user research methods that stripped away cognitive overload in fintech device setup workflows.",
    platform: "LinkedIn",
    publication: "LinkedIn",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "in/avinashshajan",
    },
    publishedDate: "Aug 2026",
    readTime: "5 min read",
    url: "https://www.linkedin.com/in/avinash-shajan-169b631aa/",
    topic: "Fintech UX",
    createdAt: 1723500000000,
  },
  {
    id: "ext-scale-design-systems",
    title: "Building Resilient Multi-Platform Design Systems for Scale",
    excerpt: "Structuring token architecture, component contracts, and cross-discipline governance across web and mobile surfaces.",
    platform: "Medium",
    publication: "Medium",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "@avinashts1122",
    },
    publishedDate: "Jul 2026",
    readTime: "7 min read",
    url: "https://medium.com/@avinashts1122",
    topic: "Design Systems",
    createdAt: 1721000000000,
  },
  {
    id: "ext-calm-computing-fintech",
    title: "Calm Computing & Cognitive Load: Designing Stress-Free Transaction Dashboards",
    excerpt: "Principles for high-density financial data visualization where clarity, calm typography, and real-time state matter most.",
    platform: "LinkedIn",
    publication: "LinkedIn",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "in/avinashshajan",
    },
    publishedDate: "Jun 2026",
    readTime: "4 min read",
    url: "https://www.linkedin.com/in/avinash-shajan-169b631aa/",
    topic: "Product Strategy",
    createdAt: 1718500000000,
  },
  {
    id: "ext-micro-interactions-motion",
    title: "Micro-Interactions That Matter: Crafting Spatial Feedback with Motion and Sound",
    excerpt: "Subtle physics, tactile feedback loops, and animation timing curves that elevate utility products into delightful tools.",
    platform: "Medium",
    publication: "Medium",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "@avinashts1122",
    },
    publishedDate: "May 2026",
    readTime: "5 min read",
    url: "https://medium.com/@avinashts1122",
    topic: "Interaction Design",
    createdAt: 1716000000000,
  },
  {
    id: "ext-product-systems-thinking-substack",
    title: "Systems Thinking in Product Design: Beyond Components and Tokens",
    excerpt: "Exploring the feedback loops, behavioral incentives, and long-term consequences of UI patterns in high-velocity products.",
    platform: "Substack",
    publication: "Substack",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "@avinashshajan",
    },
    publishedDate: "Oct 2026",
    readTime: "7 min read",
    url: "https://substack.com",
    topic: "Design Strategy",
    createdAt: 1728500000000,
  },
  {
    id: "ext-frontend-craft-devio",
    title: "Crafting High-Performance React Web Interfaces for Creative Portfolios",
    excerpt: "Architectural insights on buttery scroll dynamics, bundle calibration, and tactile interaction design.",
    platform: "Dev.io",
    publication: "Dev.io",
    author: {
      name: "Avinash Shajan",
      avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      handle: "@avinash",
    },
    publishedDate: "Sep 2026",
    readTime: "5 min read",
    url: "https://dev.to",
    topic: "Engineering",
    createdAt: 1727000000000,
  },
];

/**
 * Clean and sanitize an article for Firestore.
 * Firestore strictly rejects documents with fields having value `undefined`.
 */
export function sanitizeExternalArticleForFirestore(art: ExternalArticle): Record<string, any> {
  const clean: Record<string, any> = {
    id: art.id,
    title: art.title || "Untitled Article",
    platform: art.platform || "Medium",
    publishedDate: art.publishedDate || new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
    readTime: art.readTime || "5 min read",
    url: art.url || "",
    createdAt: typeof art.createdAt === "number" ? art.createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  if (typeof art.excerpt === "string" && art.excerpt.trim()) {
    clean.excerpt = art.excerpt.trim();
  }
  if (typeof art.publication === "string" && art.publication.trim()) {
    clean.publication = art.publication.trim();
  }
  if (typeof art.topic === "string" && art.topic.trim()) {
    clean.topic = art.topic.trim();
  }
  if (typeof art.clapsOrLikes === "number" && !isNaN(art.clapsOrLikes)) {
    clean.clapsOrLikes = art.clapsOrLikes;
  }
  if (art.author && typeof art.author === "object") {
    const authorClean: Record<string, any> = {};
    if (typeof art.author.name === "string" && art.author.name.trim()) {
      authorClean.name = art.author.name.trim();
    }
    if (typeof art.author.handle === "string" && art.author.handle.trim()) {
      authorClean.handle = art.author.handle.trim();
    }
    if (typeof art.author.avatar === "string" && art.author.avatar.trim()) {
      authorClean.avatar = art.author.avatar.trim();
    }
    clean.author = authorClean;
  }

  return clean;
}

let firestoreListenerSetup = false;

function setupExternalArticlesFirestoreSync() {
  if (firestoreListenerSetup || !isFirebaseConfigured || !db) return;
  firestoreListenerSetup = true;

  try {
    const collRef = collection(db, COLLECTION_NAME);
    onSnapshot(
      collRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteArticles: ExternalArticle[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ExternalArticle;
            if (data && data.title) {
              remoteArticles.push({
                ...data,
                id: docSnap.id || data.id,
              });
            }
          });

          // Sort by createdAt descending
          remoteArticles.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteArticles));
          localStorage.removeItem(CLEARED_KEY);
          window.dispatchEvent(new CustomEvent("external_articles_updated"));
          return;
        }

        // Snapshot is empty:
        // Check if user explicitly clicked "Clear all external articles"
        const isCleared = localStorage.getItem(CLEARED_KEY) === "true";
        if (isCleared) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          window.dispatchEvent(new CustomEvent("external_articles_updated"));
          return;
        }

        // If Firestore is empty on initial connection, DO NOT wipe out local articles!
        // Instead, seed Firestore from local articles so the user's data is safely preserved.
        const local = getExternalArticles();
        if (local && local.length > 0) {
          syncToFirestore(local).catch((e) => {
            console.warn("Could not seed initial external articles to Firestore:", e);
          });
        }
      },
      (error) => {
        console.warn("Firestore external_articles listener warning:", error.message || error);
      }
    );
  } catch (err) {
    console.warn("Failed to set up Firestore sync for external_articles:", err);
  }
}

export async function syncToFirestore(articles: ExternalArticle[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const collRef = collection(db, COLLECTION_NAME);
    const existing = await getDocs(collRef);
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const newIds = new Set(articles.map((a) => a.id));

    // Delete articles removed from the list
    for (const docSnap of existing.docs) {
      if (!newIds.has(docSnap.id)) {
        try {
          await deleteDoc(docSnap.ref);
        } catch (delErr) {
          console.warn("Error deleting removed external article from Firestore:", delErr);
        }
      }
    }

    // Upsert current articles using sanitized data
    for (const art of articles) {
      try {
        const sanitized = sanitizeExternalArticleForFirestore(art);
        const docRef = doc(db, COLLECTION_NAME, art.id);
        await setDoc(docRef, sanitized, { merge: true });
      } catch (writeErr) {
        console.warn(`Error writing external article "${art.id}" to Firestore:`, writeErr);
      }
    }
  } catch (err) {
    console.warn("Error syncing external articles to Firestore:", err);
  }
}

// Start listener immediately on module load
setupExternalArticlesFirestoreSync();

export function getExternalArticles(): ExternalArticle[] {
  setupExternalArticlesFirestoreSync();
  try {
    const isCleared = localStorage.getItem(CLEARED_KEY) === "true";
    if (isCleared) {
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => {
          if (item.platform === "LinkedIn" && item.publication === "LinkedIn Pulse") {
            return { ...item, publication: "LinkedIn" };
          }
          return item;
        });
      }
    }
    return DEFAULT_EXTERNAL_ARTICLES;
  } catch {
    return DEFAULT_EXTERNAL_ARTICLES;
  }
}

export function saveExternalArticles(articles: ExternalArticle[]): void {
  try {
    if (articles.length === 0) {
      localStorage.setItem(CLEARED_KEY, "true");
    } else {
      localStorage.removeItem(CLEARED_KEY);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new CustomEvent("external_articles_updated"));

    // Persist to Firestore
    syncToFirestore(articles).catch((err) => {
      console.warn("Background syncToFirestore error:", err);
    });
  } catch (e) {
    console.error("Failed to save external articles:", e);
  }
}

export async function deleteExternalArticle(id: string): Promise<void> {
  const current = getExternalArticles();
  const updated = current.filter((a) => a.id !== id);
  if (updated.length === 0) {
    localStorage.setItem(CLEARED_KEY, "true");
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("external_articles_updated"));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      console.warn("Could not delete external article from Firestore:", err);
    }
  }
}
