import { ExternalArticle } from "../types/externalArticle";
import { isFirebaseConfigured, db } from "../utils/firebase";
import { collection, onSnapshot, doc, getDocs, writeBatch, setDoc, deleteDoc } from "firebase/firestore";

const STORAGE_KEY = "portfolio_external_articles";
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
];

let firestoreListenerSetup = false;

function setupExternalArticlesFirestoreSync() {
  if (firestoreListenerSetup || !isFirebaseConfigured || !db) return;
  firestoreListenerSetup = true;

  try {
    const collRef = collection(db, COLLECTION_NAME);
    onSnapshot(
      collRef,
      (snapshot) => {
        if (snapshot.empty) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          window.dispatchEvent(new CustomEvent("external_articles_updated"));
          return;
        }

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
        window.dispatchEvent(new CustomEvent("external_articles_updated"));
      },
      (error) => {
        console.warn("Firestore external_articles listener error:", error.message || error);
      }
    );
  } catch (err) {
    console.warn("Failed to set up Firestore sync for external_articles:", err);
  }
}

async function syncToFirestore(articles: ExternalArticle[]) {
  if (!isFirebaseConfigured || !db) return;
  try {
    const collRef = collection(db, COLLECTION_NAME);
    const existing = await getDocs(collRef);
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const newIds = new Set(articles.map((a) => a.id));

    const batch = writeBatch(db);

    // Delete removed articles
    existing.docs.forEach((docSnap) => {
      if (!newIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // Write / update current articles
    articles.forEach((art) => {
      const docRef = doc(db, COLLECTION_NAME, art.id);
      batch.set(docRef, { ...art }, { merge: true });
    });

    await batch.commit();
  } catch (err) {
    console.warn("Error syncing external articles to Firestore:", err);
  }
}

// Start listener immediately on module load
setupExternalArticlesFirestoreSync();

export function getExternalArticles(): ExternalArticle[] {
  setupExternalArticlesFirestoreSync();
  try {
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
    return [];
  } catch {
    return [];
  }
}

export function saveExternalArticles(articles: ExternalArticle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new CustomEvent("external_articles_updated"));
    // Persist to Firestore asynchronously
    syncToFirestore(articles).catch(() => {});
  } catch (e) {
    console.error("Failed to save external articles:", e);
  }
}

export async function deleteExternalArticle(id: string): Promise<void> {
  const current = getExternalArticles();
  const updated = current.filter((a) => a.id !== id);
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
