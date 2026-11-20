import { doc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { FieldNote } from "../types/fieldNotes";

const STORAGE_KEY = "portfolio_field_notes";
const COLLECTION_NAME = "field_notes";

export const DEFAULT_FIELD_NOTES: FieldNote[] = [];

const PLACEHOLDER_NOTE_IDS = new Set([
  "fn-note-1",
  "fn-note-2",
  "fn-note-3",
  "fn-1",
  "fn-2",
  "fn-3",
  "fn-4",
  "fn-5",
  "fn-6",
  "fn-7",
  "fn-8",
  "fn-9",
  "fn-10",
]);

const PLACEHOLDER_NOTE_TITLES = new Set([
  "systems thinking & delayed feedback",
  "design tokens & mathematical typography",
  "affordances vs signifiers in spatial ui",
]);

export function isPlaceholderNote(note: any): boolean {
  if (!note) return false;
  if (note.id && PLACEHOLDER_NOTE_IDS.has(note.id)) return true;
  if (typeof note.id === "string" && (note.id.startsWith("mock-") || note.id.startsWith("sample-") || note.id.startsWith("fn-note-"))) return true;
  if (note.title && PLACEHOLDER_NOTE_TITLES.has(note.title.trim().toLowerCase())) return true;
  return false;
}

// Helper to sanitize note objects for Firestore (removes any undefined properties which Firestore rejects)
function sanitizeFieldNoteForFirestore(note: FieldNote): Record<string, any> {
  const clean: Record<string, any> = {
    id: String(note.id),
    type: note.type || "photo",
    content: note.content || "",
    date: note.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    createdAt: typeof note.createdAt === "number" ? note.createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  if (typeof note.title === "string" && note.title.trim()) {
    clean.title = note.title.trim();
  }

  if (typeof note.location === "string" && note.location.trim()) {
    clean.location = note.location.trim();
  }

  if (typeof note.imageUrl === "string" && note.imageUrl.trim()) {
    clean.imageUrl = note.imageUrl.trim();
  }

  if (Array.isArray(note.tags) && note.tags.length > 0) {
    clean.tags = note.tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim());
  }

  if (typeof note.aspectRatio === "string" && note.aspectRatio.trim()) {
    clean.aspectRatio = note.aspectRatio.trim();
  }

  return clean;
}

// In-memory cache for ultra-fast, sync-safe reads
let memoryCache: FieldNote[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((n: FieldNote) => !isPlaceholderNote(n));
      }
    }
  } catch (e) {
    console.warn("[fieldNotesService] Error initializing memory cache from localStorage", e);
  }
  return [];
})();

function persistToLocalStorage(notes: FieldNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn("[fieldNotesService] LocalStorage quota limit reached, relying on in-memory & Firestore", e);
  }
}

export const fieldNotesService = {
  getNotes(): FieldNote[] {
    if (memoryCache && memoryCache.length > 0) {
      return [...memoryCache];
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryCache = parsed.filter((n: FieldNote) => !isPlaceholderNote(n));
          return [...memoryCache];
        }
      }
    } catch (e) {
      console.error("[fieldNotesService] Error reading field notes from localStorage", e);
    }
    return [];
  },

  async addNote(note: Omit<FieldNote, "id" | "createdAt"> & { id?: string }): Promise<FieldNote> {
    const newNote: FieldNote = {
      ...note,
      id: note.id || `fn-${Date.now()}`,
      createdAt: Date.now(),
    };

    // 1. Immediately update in-memory cache so UI updates synchronously
    memoryCache = [newNote, ...memoryCache.filter((n) => n.id !== newNote.id)];
    persistToLocalStorage(memoryCache);

    // 2. Sanitize for Firestore write
    const firestoreData = sanitizeFieldNoteForFirestore(newNote);

    // 3. Persist to Firestore field_notes collection (no signing required)
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, newNote.id);
        await setDoc(docRef, firestoreData);
        console.log(`[fieldNotesService] Successfully persisted note to Firestore (${COLLECTION_NAME}/${newNote.id})`);
      } catch (e: any) {
        console.error("[fieldNotesService] Could not save note to Firestore:", e);
      }
    }

    // 4. Broadcast changes across all components and windows
    window.dispatchEvent(new Event("portfolio_field_notes_updated"));
    window.dispatchEvent(new Event("portfolio_data_update"));

    return newNote;
  },

  async updateNote(id: string, updates: Partial<FieldNote>): Promise<FieldNote | null> {
    const index = memoryCache.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updatedNote: FieldNote = {
      ...memoryCache[index],
      ...updates,
      updatedAt: Date.now(),
    };

    memoryCache[index] = updatedNote;
    persistToLocalStorage(memoryCache);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, sanitizeFieldNoteForFirestore(updatedNote), { merge: true });
      } catch (e) {
        console.warn("[fieldNotesService] Could not update note in Firestore", e);
      }
    }

    window.dispatchEvent(new Event("portfolio_field_notes_updated"));
    window.dispatchEvent(new Event("portfolio_data_update"));

    return updatedNote;
  },

  async deleteNote(id: string): Promise<boolean> {
    const targetId = String(id).trim();
    memoryCache = memoryCache.filter((n) => String(n.id).trim() !== targetId);
    persistToLocalStorage(memoryCache);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, targetId);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn("[fieldNotesService] Could not delete note from Firestore", e);
      }
    }

    window.dispatchEvent(new Event("portfolio_field_notes_updated"));
    window.dispatchEvent(new Event("portfolio_data_update"));

    return true;
  },

  subscribe(callback: (notes: FieldNote[]) => void): () => void {
    // Deliver current memory state immediately
    callback(this.getNotes());

    const handleUpdate = () => {
      callback(this.getNotes());
    };

    window.addEventListener("portfolio_field_notes_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    let unsubscribeFirestore: (() => void) | null = null;
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, COLLECTION_NAME);
        unsubscribeFirestore = onSnapshot(
          colRef,
          (snapshot) => {
            if (snapshot.empty) {
              // If snapshot is empty but we have local memory notes, sync them up
              if (memoryCache.length > 0) {
                memoryCache.forEach((n) => {
                  setDoc(doc(db, COLLECTION_NAME, n.id), sanitizeFieldNoteForFirestore(n)).catch(() => {});
                });
                callback([...memoryCache]);
              } else {
                callback([]);
              }
              return;
            }

            const firestoreNotes: FieldNote[] = [];
            const deletedDocIds = new Set<string>();

            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as FieldNote;
              const item = { ...data, id: docSnap.id || data.id };
              if (isPlaceholderNote(item)) {
                if (!deletedDocIds.has(docSnap.id)) {
                  deletedDocIds.add(docSnap.id);
                  deleteDoc(doc(db, COLLECTION_NAME, docSnap.id)).catch(() => {});
                }
              } else {
                firestoreNotes.push(item);
              }
            });

            // Merge any local notes not yet reflected in this snapshot
            const firestoreIds = new Set(firestoreNotes.map((n) => n.id));
            const unsyncedLocals = memoryCache.filter((n) => !firestoreIds.has(n.id) && !isPlaceholderNote(n));

            const combined = [...unsyncedLocals, ...firestoreNotes];
            combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            // Guard against redundant re-render waves if data hasn't changed
            const isSameAsMemory =
              memoryCache.length === combined.length &&
              memoryCache.every(
                (item, idx) =>
                  item.id === combined[idx]?.id &&
                  item.imageUrl === combined[idx]?.imageUrl &&
                  item.content === combined[idx]?.content &&
                  item.title === combined[idx]?.title
              );

            if (!isSameAsMemory) {
              memoryCache = combined;
              persistToLocalStorage(combined);
              callback([...combined]);
            }
          },
          (err) => {
            console.warn("[fieldNotesService] Firestore snapshot error (using memory cache):", err);
            callback([...memoryCache]);
          }
        );
      } catch (e) {
        console.warn("[fieldNotesService] Could not attach Firestore listener", e);
      }
    }

    return () => {
      window.removeEventListener("portfolio_field_notes_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  },
};
