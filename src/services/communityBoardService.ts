import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";

export interface CommunityMark {
  id: string;
  emoji: string;
  name: string;
  x: number; // percentage 6% to 94%
  y: number; // percentage 12% to 78%
  createdAt: string;
  isUserAdded?: boolean;
}

const STORAGE_KEY = "portfolio_community_board_marks";
const COLLECTION_NAME = "community_board";

// Empty default marks so the board starts completely clean for user-added emojis
export const DEFAULT_COMMUNITY_MARKS: CommunityMark[] = [];

export const communityBoardService = {
  getMarks(): CommunityMark[] {
    try {
      if (typeof window !== "undefined") {
        // Clear any old legacy mock seeds
        const oldKeyData = localStorage.getItem(STORAGE_KEY);
        if (oldKeyData) {
          const parsed = JSON.parse(oldKeyData);
          if (Array.isArray(parsed)) {
            // Keep only real user-added marks, filter out mock cm-* items
            const userOnly = parsed.filter((m) => m && m.isUserAdded && !m.id?.startsWith("cm-"));
            if (userOnly.length !== parsed.length) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
            }
            return userOnly;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load community marks from localStorage", e);
    }
    return [];
  },

  clearAllMarks(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent("portfolio_community_marks_update", { detail: [] }));
    } catch (e) {
      console.warn("Failed to clear community marks", e);
    }
  },

  saveLocalMarks(marks: CommunityMark[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
      window.dispatchEvent(new CustomEvent("portfolio_community_marks_update", { detail: marks }));
    } catch (e) {
      console.warn("Failed to save community marks to localStorage", e);
    }
  },

  /**
   * Generates a pleasant random position avoiding the bottom center action button
   */
  generateCoordinate(existingMarks: CommunityMark[]): { x: number; y: number } {
    const minX = 7;
    const maxX = 93;
    const minY = 14;
    const maxY = 76;

    // Try multiple attempts to find a balanced position not too crowded and not blocking the center button
    for (let attempt = 0; attempt < 25; attempt++) {
      const candidateX = Math.round(minX + Math.random() * (maxX - minX));
      const candidateY = Math.round(minY + Math.random() * (maxY - minY));

      // Avoid center bottom area where the "Leave your mark +" button sits (x: 40-60, y: 70-95)
      const isNearButton = candidateX > 38 && candidateX < 62 && candidateY > 68;
      if (isNearButton) continue;

      // Check distance against existing items
      const isTooClose = existingMarks.some((m) => {
        const dx = m.x - candidateX;
        const dy = m.y - candidateY;
        return Math.sqrt(dx * dx + dy * dy) < 6;
      });

      if (!isTooClose) {
        return { x: candidateX, y: candidateY };
      }
    }

    // Fallback within safe boundaries
    const fallbackX = Math.round(10 + Math.random() * 80);
    const fallbackY = Math.round(18 + Math.random() * 52);
    return { x: fallbackX, y: fallbackY };
  },

  async addMark(emoji: string, name: string): Promise<CommunityMark> {
    const current = this.getMarks();
    const { x, y } = this.generateCoordinate(current);

    const newMark: CommunityMark = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      emoji: emoji.trim() || "✨",
      name: name.trim() || "Anonymous Visitor",
      x,
      y,
      createdAt: new Date().toISOString(),
      isUserAdded: true,
    };

    const updated = [...current, newMark];
    this.saveLocalMarks(updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, newMark.id), newMark);
      } catch (err) {
        console.error("Failed to sync new community mark to Firestore:", err);
      }
    }

    return newMark;
  },

  async deleteMark(id: string): Promise<void> {
    const current = this.getMarks();
    const updated = current.filter((m) => m.id !== id);
    this.saveLocalMarks(updated);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (err) {
        console.error("Failed to delete mark from Firestore:", err);
      }
    }
  },

  initListener(callback: (marks: CommunityMark[]) => void): () => void {
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent<CommunityMark[]>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      } else {
        callback(this.getMarks());
      }
    };

    window.addEventListener("portfolio_community_marks_update", handleLocal);

    if (!isFirebaseConfigured || !db) {
      callback(this.getMarks());
      return () => {
        window.removeEventListener("portfolio_community_marks_update", handleLocal);
      };
    }

    try {
      const q = query(collection(db, COLLECTION_NAME));
      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreMarks: CommunityMark[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as CommunityMark;
              if (data && !docSnap.id.startsWith("cm-") && data.isUserAdded) {
                firestoreMarks.push({ ...data, id: docSnap.id });
              }
            });

            this.saveLocalMarks(firestoreMarks);
            callback(firestoreMarks);
          } else {
            callback(this.getMarks());
          }
        },
        (error) => {
          console.warn("Firestore community marks snapshot error, using local:", error);
          callback(this.getMarks());
        }
      );

      return () => {
        window.removeEventListener("portfolio_community_marks_update", handleLocal);
        unsubscribeFirestore();
      };
    } catch (e) {
      console.warn("Error setting up Firestore community marks listener:", e);
      callback(this.getMarks());
      return () => {
        window.removeEventListener("portfolio_community_marks_update", handleLocal);
      };
    }
  },
};
