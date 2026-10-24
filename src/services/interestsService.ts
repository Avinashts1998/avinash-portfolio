import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import about3Dobjects from "../feeders/about_3d_feeders";

export interface InterestItem {
  id: string;
  name: string;
  category?: string;
  imageUrl: string;
  altText?: string;
}

export const DEFAULT_INTEREST_ITEMS: InterestItem[] = about3Dobjects.map((item, idx) => ({
  id: `interest_3d_${idx + 1}`,
  name: item.category,
  category: item.category,
  imageUrl: item.imgUrl,
  altText: item.category
}));

const LOCAL_STORAGE_KEY = "portfolio_interests_data_v6";

class InterestsService {
  private items: InterestItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.items = JSON.parse(saved);
        return;
      }
    } catch {
      // fallback
    }
    this.items = [...DEFAULT_INTEREST_ITEMS];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.items));
      window.dispatchEvent(new Event("portfolio_interests_update"));
    } catch {
      // ignore
    }
  }

  public getItems(): InterestItem[] {
    if (this.items.length === 0) {
      this.items = [...DEFAULT_INTEREST_ITEMS];
    }
    return this.items;
  }

  public async updateItems(newItems: InterestItem[]): Promise<boolean> {
    this.items = newItems;
    this.saveToStorage();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, "site_settings", "interests");
        await setDoc(docRef, { items: newItems, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn("Firestore sync failed for interests:", err);
      }
    }
    return true;
  }

  public initListener(callback: (items: InterestItem[]) => void): () => void {
    const handleLocalUpdate = () => {
      callback(this.getItems());
    };
    window.addEventListener("portfolio_interests_update", handleLocalUpdate);

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "site_settings", "interests");
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items) && data.items.length > 0) {
            this.items = data.items;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.items));
            callback(data.items);
          }
        }
      }, () => {
        // ignore
      });

      return () => {
        unsub();
        window.removeEventListener("portfolio_interests_update", handleLocalUpdate);
      };
    }

    return () => {
      window.removeEventListener("portfolio_interests_update", handleLocalUpdate);
    };
  }
}

export const interestsService = new InterestsService();
