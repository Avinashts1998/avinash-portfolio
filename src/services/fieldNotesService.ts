import { doc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";
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
    id: note.id,
    type: note.type,
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

// Auto-purge placeholder notes from localStorage
function purgePreloadedNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((n: FieldNote) => !isPlaceholderNote(n));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.error("Error purging preloaded notes from localStorage", e);
  }
}

// Run cleanup immediately on module load
purgePreloadedNotes();

export const fieldNotesService = {
  getNotes(): FieldNote[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((n: FieldNote) => !isPlaceholderNote(n));
          return cleaned;
        }
      }
      return [];
    } catch (e) {
      console.error("Error reading field notes from localStorage", e);
      return [];
    }
  },

  async addNote(note: Omit<FieldNote, "id" | "createdAt"> & { id?: string }): Promise<FieldNote> {
    const currentNotes = this.getNotes();
    const newNote: FieldNote = {
      ...note,
      id: note.id || `fn-${Date.now()}`,
      createdAt: Date.now(),
    };

    // 1. Sanitize for Firestore write
    const firestoreData = sanitizeFieldNoteForFirestore(newNote);

    // 2. Persist to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, newNote.id);
        await setDoc(docRef, firestoreData);
      } catch (e) {
        console.warn("Could not save note to Firestore, keeping in localStorage", e);
      }
    }

    // 3. Update localStorage cache
    const updatedNotes = [newNote, ...currentNotes];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (e) {
      console.warn("LocalStorage quota error while saving note", e);
    }

    // 4. Notify app
    window.dispatchEvent(new Event("portfolio_field_notes_updated"));
    window.dispatchEvent(new Event("portfolio_data_update"));

    return newNote;
  },

  async updateNote(id: string, updates: Partial<FieldNote>): Promise<FieldNote | null> {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updatedNote: FieldNote = {
      ...notes[index],
      ...updates,
      updatedAt: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, sanitizeFieldNoteForFirestore(updatedNote), { merge: true });
      } catch (e) {
        console.warn("Could not update note in Firestore", e);
      }
    }

    notes[index] = updatedNote;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn("LocalStorage quota error while updating note", e);
    }

    window.dispatchEvent(new Event("portfolio_field_notes_updated"));
    window.dispatchEvent(new Event("portfolio_data_update"));

    return updatedNote;
  },

  async deleteNote(id: string): Promise<boolean> {
    const targetId = String(id).trim();
    const notes = this.getNotes();
    const filtered = notes.filter((n) => String(n.id).trim() !== targetId);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, targetId);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn("Could not delete note from Firestore", e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("LocalStorage quota error while deleting note", e);
    }

    window.dispatchEvent(new Event("portfolio_field_notes_updated"));
    window.dispatchEvent(new Event("portfolio_data_update"));

    return true;
  },

  subscribe(callback: (notes: FieldNote[]) => void): () => void {
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
              const current = fieldNotesService.getNotes();
              callback(current);
              return;
            }

            const notes: FieldNote[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as FieldNote;
              const item = { ...data, id: docSnap.id || data.id };
              if (isPlaceholderNote(item)) {
                // Delete placeholder note document from Firebase so it never returns
                deleteDoc(doc(db, COLLECTION_NAME, docSnap.id)).catch(() => {});
              } else {
                notes.push(item);
              }
            });

            // Sort by date descending
            notes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            } catch {
              // Ignore quota
            }
            callback(notes);
          },
          (err) => {
            console.warn("[Firestore listener warning] (Field Notes):", err);
          }
        );
      } catch (e) {
        console.warn("Could not attach Firestore listener for Field Notes", e);
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
