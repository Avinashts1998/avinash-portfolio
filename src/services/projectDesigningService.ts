import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";

export interface ProjectDesigningFolder {
  id: string;
  projectId: string;
  projectName: string;
  cloudinaryFolder: string;
  category?: string;
  thumbnail: string[];
  heroSectionImg?: string[];
  projectImages: string[];
  updatedAt?: string;
}

const COLLECTION_NAME = "project designing";
const COLLECTION_NAME_ALT = "project_designing";
const LOCAL_STORAGE_KEY = "portfolio_project_designing";

// Initial seed default data for project designing folders
export const defaultProjectDesigningFolders: ProjectDesigningFolder[] = [];

// Local synchronous retriever
export function getProjectDesigningFoldersSync(): ProjectDesigningFolder[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }
  return [];
}

// Save locally
function saveLocally(folders: ProjectDesigningFolder[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(folders));
  window.dispatchEvent(new Event("portfolio_data_update"));
}

// Seed all project designing folders into Firebase Firestore collections
export async function seedProjectDesigningFolders(): Promise<void> {
  saveLocally(defaultProjectDesigningFolders);

  if (isFirebaseConfigured && db) {
    try {
      const batchPrimary = writeBatch(db);
      const batchAlt = writeBatch(db);

      for (const folder of defaultProjectDesigningFolders) {
        const refPrimary = doc(db, COLLECTION_NAME, folder.id);
        const refAlt = doc(db, COLLECTION_NAME_ALT, folder.id);

        batchPrimary.set(refPrimary, folder, { merge: true });
        batchAlt.set(refAlt, folder, { merge: true });
      }

      await batchPrimary.commit();
      await batchAlt.commit();
      console.log(`Successfully seeded "${COLLECTION_NAME}" and "${COLLECTION_NAME_ALT}" collections in Firebase!`);
    } catch (error) {
      console.error("Failed to seed project designing collection to Firebase:", error);
    }
  }
}

// Get all project designing folders
export async function getAllProjectDesigningFolders(): Promise<ProjectDesigningFolder[]> {
  if (isFirebaseConfigured && db) {
    try {
      const querySnap = await getDocs(collection(db, COLLECTION_NAME));
      if (!querySnap.empty) {
        const folders: ProjectDesigningFolder[] = [];
        querySnap.forEach((docSnap) => {
          folders.push({ id: docSnap.id, ...docSnap.data() } as ProjectDesigningFolder);
        });
        saveLocally(folders);
        return folders;
      }
    } catch (error) {
      console.warn("Firestore getAllProjectDesigningFolders error:", error);
    }
  }
  return getProjectDesigningFoldersSync();
}

// Create or update a project designing folder
export async function saveProjectDesigningFolder(folder: ProjectDesigningFolder): Promise<void> {
  const current = getProjectDesigningFoldersSync();
  const index = current.findIndex((f) => f.id === folder.id);
  if (index > -1) {
    current[index] = folder;
  } else {
    current.push(folder);
  }
  saveLocally(current);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, folder.id);
      const docRefAlt = doc(db, COLLECTION_NAME_ALT, folder.id);
      await setDoc(docRef, folder, { merge: true });
      await setDoc(docRefAlt, folder, { merge: true });
    } catch (error) {
      console.error("Firestore saveProjectDesigningFolder error:", error);
    }
  }
}

// Delete a project folder
export async function deleteProjectDesigningFolder(id: string): Promise<void> {
  const current = getProjectDesigningFoldersSync().filter((f) => f.id !== id);
  saveLocally(current);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await deleteDoc(doc(db, COLLECTION_NAME_ALT, id));
    } catch (error) {
      console.error("Firestore deleteProjectDesigningFolder error:", error);
    }
  }
}

// Real-time listener for "project designing" collection
export function subscribeToProjectDesigningFolders(callback: (folders: ProjectDesigningFolder[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const collRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const folders: ProjectDesigningFolder[] = [];
          snapshot.forEach((docSnap) => {
            folders.push({ id: docSnap.id, ...docSnap.data() } as ProjectDesigningFolder);
          });
          callback(folders);
        }
      },
      (error) => {
        console.warn("Firestore project designing listener warning:", error);
      }
    );
    return unsubscribe;
  }

  const handleUpdate = () => {
    callback(getProjectDesigningFoldersSync());
  };
  window.addEventListener("portfolio_data_update", handleUpdate);
  return () => window.removeEventListener("portfolio_data_update", handleUpdate);
}

export const projectDesigningService = {
  getProjectDesigningFoldersSync,
  getAllProjectDesigningFolders,
  saveProjectDesigningFolder,
  deleteProjectDesigningFolder,
  seedProjectDesigningFolders,
  subscribeToProjectDesigningFolders,
};

export default projectDesigningService;
