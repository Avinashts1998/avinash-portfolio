import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";

export interface AboutMoreItem {
  id: string;
  title: string;
  category?: string;
  iconType?: "code" | "speaker" | "heart" | "calendar" | "compass" | "camera" | "sparkles";
  tag?: string;
  location?: string;
  description?: string;
  imageUrl: string;
  isWide?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  order: number;
  updatedAt?: string;
}

export const DEFAULT_ABOUT_MORE_ITEMS: AboutMoreItem[] = [
  {
    id: "more_vibe_coding",
    title: "Vibe coding",
    category: "Rapid Prototyping",
    iconType: "code",
    isWide: true,
    description: "I spend a lot of time turning ideas into quick, tangible experiences. It helps me think through interactions faster, collaborate better with engineers, and push ideas beyond static screens. Some explorations turn into real features. Some become UX experiments that stay with me, evolve, and come back sharper.",
    imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1787048973/hyllpuch85dsg06ch5q5.png",
    order: 0,
  },
  {
    id: "more_thought_leadership",
    title: "Thought leadership",
    category: "Community & Perspectives",
    iconType: "speaker",
    isWide: false,
    description: "I enjoy sharing ideas and perspectives around design, AI, and product thinking beyond the products I create. Through writing, conversations, and community engagement, I believe that expressing how you think is just as valuable as the work you bring to life. I’m curious about how technology is shaping the way we design, solve problems, and build meaningful experiences. Whether it’s a small design observation, an emerging AI trend, or a lesson from a project.",
    imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1787050494/snyfaft76llyyvr5ih3u.jpg",
    order: 1,
  },
  {
    id: "more_giving_back",
    title: "Giving back",
    category: "Mentorship & Impact",
    iconType: "heart",
    isWide: false,
    description: "I actively mentor aspiring designers, contribute to open design discussions, and build tools that help others grow. Giving back keeps me grounded and reminds me how far thoughtful guidance can go early in someone's career.",
    buttonText: "Book a session with Avinash",
    buttonUrl: "https://adplist.org",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    order: 2,
  },
  {
    id: "more_weekends",
    title: "Weekends",
    category: "Side Projects & Crafts",
    iconType: "calendar",
    isWide: true,
    description: "Weekends are reserved for side projects, small builds, experiments, and ideas that start with curiosity and no pressure. It is where I explore freely, break things, and sometimes discover directions that influence my core work.",
    imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1600&auto=format&fit=crop",
    order: 3,
  },
];

const STORAGE_KEY = "portfolio_about_more_items_v8";
const COLLECTION_NAME = "about_more_items";

const THOUGHT_LEADERSHIP_DESC = "I enjoy sharing ideas and perspectives around design, AI, and product thinking beyond the products I create. Through writing, conversations, and community engagement, I believe that expressing how you think is just as valuable as the work you bring to life. I’m curious about how technology is shaping the way we design, solve problems, and build meaningful experiences. Whether it’s a small design observation, an emerging AI trend, or a lesson from a project.";

let listenerInitialized = false;

function initAboutMoreItems() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ABOUT_MORE_ITEMS));
  }
}

export const bitMoreAboutMeService = {
  getItems(): AboutMoreItem[] {
    initAboutMoreItems();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => {
            if (item.id === "more_vibe_coding" && (!item.imageUrl || item.imageUrl.includes("unsplash.com/photo-1555066931-4365d14bab8c"))) {
              return { ...item, imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1787048973/hyllpuch85dsg06ch5q5.png" };
            }
            if (item.id === "more_thought_leadership") {
              return {
                ...item,
                description: THOUGHT_LEADERSHIP_DESC,
                imageUrl: (!item.imageUrl || item.imageUrl.includes("unsplash.com/photo-1475721027785-f74eccf877e2"))
                  ? "https://res.cloudinary.com/p66qxgqe/image/upload/v1787050494/snyfaft76llyyvr5ih3u.jpg"
                  : item.imageUrl,
              };
            }
            return item;
          }).sort((a, b) => a.order - b.order);
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ABOUT_MORE_ITEMS;
  },

  async saveItems(items: AboutMoreItem[]): Promise<boolean> {
    try {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      window.dispatchEvent(new CustomEvent("portfolio_about_more_update", { detail: sorted }));

      if (isFirebaseConfigured && db) {
        try {
          for (const item of sorted) {
            const docRef = doc(db, COLLECTION_NAME, item.id);
            await setDoc(docRef, {
              ...item,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch {
          // Ignore cloud write errors
        }
      }
      return true;
    } catch (e) {
      console.error("Failed to save about more items:", e);
      return false;
    }
  },

  async addItem(itemData: Omit<AboutMoreItem, "id" | "order">): Promise<AboutMoreItem> {
    const current = this.getItems();
    const newId = `more_${Date.now()}`;
    const newItem: AboutMoreItem = {
      ...itemData,
      id: newId,
      order: current.length,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...current, newItem];
    await this.saveItems(updated);
    return newItem;
  },

  async updateItem(id: string, updates: Partial<AboutMoreItem>): Promise<boolean> {
    const current = this.getItems();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return false;

    current[index] = {
      ...current[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.saveItems(current);
  },

  async deleteItem(id: string): Promise<boolean> {
    const current = this.getItems();
    const itemToDelete = current.find((i) => i.id === id);
    const updated = current.filter((i) => i.id !== id);

    if (itemToDelete?.imageUrl && itemToDelete.imageUrl.includes("cloudinary")) {
      deleteImageFromCloudinary(itemToDelete.imageUrl).catch(() => {});
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch {
        // Ignore
      }
    }

    return this.saveItems(updated);
  },

  initListener(callback: (items: AboutMoreItem[]) => void): () => void {
    initAboutMoreItems();
    callback(this.getItems());

    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AboutMoreItem[]>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      } else {
        callback(this.getItems());
      }
    };

    window.addEventListener("portfolio_about_more_update", handleCustomUpdate);
    window.addEventListener("storage", handleCustomUpdate);

    let unsubscribeFirestore: (() => void) | null = null;

    if (isFirebaseConfigured && db && !listenerInitialized) {
      listenerInitialized = true;
      try {
        const colRef = collection(db, COLLECTION_NAME);
        unsubscribeFirestore = onSnapshot(
          colRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudItems: AboutMoreItem[] = [];
              snapshot.forEach((docSnap) => {
                const item = docSnap.data() as AboutMoreItem;
                if (item.id === "more_thought_leadership" && (!item.description || item.description !== THOUGHT_LEADERSHIP_DESC)) {
                  item.description = THOUGHT_LEADERSHIP_DESC;
                  setDoc(doc(db, COLLECTION_NAME, item.id), item, { merge: true }).catch(() => {});
                }
                cloudItems.push(item);
              });
              cloudItems.sort((a, b) => a.order - b.order);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudItems));
              callback(cloudItems);
            } else {
              getDocs(colRef).then((snap) => {
                if (snap.empty) {
                  DEFAULT_ABOUT_MORE_ITEMS.forEach((it) => {
                    setDoc(doc(db, COLLECTION_NAME, it.id), it).catch(() => {});
                  });
                }
              }).catch(() => {});
            }
          },
          () => {}
        );
      } catch {
        // Fallback to local
      }
    }

    return () => {
      window.removeEventListener("portfolio_about_more_update", handleCustomUpdate);
      window.removeEventListener("storage", handleCustomUpdate);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  },
};
