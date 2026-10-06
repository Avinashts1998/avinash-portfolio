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

// Pre-seeded marks matching the aesthetic and density in the user's reference image
export const DEFAULT_COMMUNITY_MARKS: CommunityMark[] = [
  { id: "cm-1", emoji: "💎", name: "Elena V.", x: 24, y: 38, createdAt: "2026-08-01T10:00:00Z" },
  { id: "cm-2", emoji: "🦋", name: "David Kim", x: 28, y: 22, createdAt: "2026-08-02T11:00:00Z" },
  { id: "cm-3", emoji: "🐣", name: "Aarav", x: 36, y: 18, createdAt: "2026-08-03T12:00:00Z" },
  { id: "cm-4", emoji: "💯", name: "Sarah Chen", x: 25, y: 53, createdAt: "2026-08-04T13:00:00Z" },
  { id: "cm-5", emoji: "🐣", name: "Lucas", x: 31, y: 46, createdAt: "2026-08-05T14:00:00Z" },
  { id: "cm-6", emoji: "🍀", name: "Sophie M.", x: 36, y: 45, createdAt: "2026-08-06T15:00:00Z" },
  { id: "cm-7", emoji: "💎", name: "Alex R.", x: 42, y: 38, createdAt: "2026-08-07T16:00:00Z" },
  { id: "cm-8", emoji: "❤️", name: "Maya Patel", x: 46, y: 36, createdAt: "2026-08-08T17:00:00Z" },
  { id: "cm-9", emoji: "🔥", name: "Liam O'Connor", x: 44, y: 52, createdAt: "2026-08-09T18:00:00Z" },
  { id: "cm-10", emoji: "🔥", name: "Marcus W.", x: 48, y: 48, createdAt: "2026-08-10T19:00:00Z" },
  { id: "cm-11", emoji: "🔥", name: "Hannah", x: 59, y: 37, createdAt: "2026-08-11T20:00:00Z" },
  { id: "cm-12", emoji: "✨", name: "Oliver", x: 64, y: 36, createdAt: "2026-08-12T21:00:00Z" },
  { id: "cm-13", emoji: "👏", name: "Priya Nair", x: 69, y: 34, createdAt: "2026-08-13T22:00:00Z" },
  { id: "cm-14", emoji: "🌷", name: "Chloe Dupont", x: 76, y: 41, createdAt: "2026-08-14T23:00:00Z" },
  { id: "cm-15", emoji: "🥳", name: "Zack B.", x: 75, y: 49, createdAt: "2026-08-15T09:00:00Z" },
  { id: "cm-16", emoji: "❤️", name: "Emily Tran", x: 66, y: 50, createdAt: "2026-08-16T10:00:00Z" },
  { id: "cm-17", emoji: "✨", name: "Noah", x: 71, y: 54, createdAt: "2026-08-17T11:00:00Z" },
  { id: "cm-18", emoji: "🌸", name: "Yuki Tanaka", x: 62, y: 57, createdAt: "2026-08-18T12:00:00Z" },
  { id: "cm-19", emoji: "🥳", name: "Benjamin", x: 68, y: 58, createdAt: "2026-08-19T13:00:00Z" },
  { id: "cm-20", emoji: "❤️", name: "Mia Santos", x: 72, y: 62, createdAt: "2026-08-20T14:00:00Z" },
  { id: "cm-21", emoji: "🏆", name: "Daniel Craig", x: 58, y: 49, createdAt: "2026-08-21T15:00:00Z" },
  { id: "cm-22", emoji: "💯", name: "Jason Lee", x: 54, y: 56, createdAt: "2026-08-22T16:00:00Z" },
  { id: "cm-23", emoji: "🌹", name: "Rose", x: 46, y: 61, createdAt: "2026-06-14T17:00:00Z" },
  { id: "cm-24", emoji: "🍀", name: "Sean", x: 49, y: 64, createdAt: "2026-08-24T18:00:00Z" },
  { id: "cm-25", emoji: "🏆", name: "Victor H.", x: 38, y: 64, createdAt: "2026-08-25T19:00:00Z" },
  { id: "cm-26", emoji: "🌸", name: "Grace K.", x: 33, y: 58, createdAt: "2026-08-26T20:00:00Z" },
  { id: "cm-27", emoji: "🤗", name: "Leo", x: 28, y: 58, createdAt: "2026-08-27T21:00:00Z" },
  { id: "cm-28", emoji: "🔥", name: "Nate Brooks", x: 20, y: 62, createdAt: "2026-08-28T22:00:00Z" },
  { id: "cm-29", emoji: "🤩", name: "Jordan P.", x: 20, y: 52, createdAt: "2026-08-29T23:00:00Z" },
];

export const communityBoardService = {
  getMarks(): CommunityMark[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load community marks from localStorage", e);
    }
    return DEFAULT_COMMUNITY_MARKS;
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
              firestoreMarks.push({ ...data, id: docSnap.id });
            });

            // Merge with DEFAULT_COMMUNITY_MARKS if needed so board stays populated
            const combinedMap = new Map<string, CommunityMark>();
            DEFAULT_COMMUNITY_MARKS.forEach((m) => combinedMap.set(m.id, m));
            firestoreMarks.forEach((m) => combinedMap.set(m.id, m));
            const merged = Array.from(combinedMap.values());

            this.saveLocalMarks(merged);
            callback(merged);
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
