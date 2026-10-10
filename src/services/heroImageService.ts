import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadImageToCloudinary } from "../utils/cloudinary";

export interface HeroSectionImageData {
  id: string;
  desktopImage: string;
  mobileImages: string[];
  updatedAt?: string;
}

const COLLECTION_NAME = "hero section image";
const COLLECTION_NAME_ALT = "hero_section_image";
const DOC_ID = "main_hero";
const LOCAL_STORAGE_KEY = "portfolio_hero_section_images";
const CLOUDINARY_FOLDER = "hero_section";

// Default initial fallback images (empty by default to show placeholder until user uploads)
export const defaultHeroImageData: HeroSectionImageData = {
  id: DOC_ID,
  desktopImage: "",
  mobileImages: [],
  updatedAt: new Date().toISOString()
};

// Retrieve hero images synchronously from local storage or defaults
export function getHeroImagesSync(): HeroSectionImageData {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // If parsed contains legacy default images from Fitznow, clear it
      const isLegacyUrl = (url?: string) => url && (url.includes("fitznow") || url.includes("res.cloudinary.com/dwy23iipq/image/upload/v1740212711/samples/product%20designing/hero%20section/"));
      if (isLegacyUrl(parsed.desktopImage) || (parsed.mobileImages && parsed.mobileImages.some((u: string) => isLegacyUrl(u)))) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return defaultHeroImageData;
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  return defaultHeroImageData;
}

// Save locally
function saveLocally(data: HeroSectionImageData) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("portfolio_data_update"));
}

// Fetch hero section image document from Firebase
export async function fetchHeroImages(): Promise<HeroSectionImageData> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as HeroSectionImageData;
        saveLocally(data);
        return data;
      }
      
      // Try alt collection name if first empty
      const docRefAlt = doc(db, COLLECTION_NAME_ALT, DOC_ID);
      const snapAlt = await getDoc(docRefAlt);
      if (snapAlt.exists()) {
        const data = { id: snapAlt.id, ...snapAlt.data() } as HeroSectionImageData;
        saveLocally(data);
        return data;
      }
    } catch (err) {
      console.warn("Firestore fetchHeroImages warning:", err);
    }
  }
  return getHeroImagesSync();
}

// Upload images to Cloudinary in "product designing/hero section" and save links to Firebase "hero section image"
export async function uploadAndSaveHeroImages({
  desktopFile,
  mobileFiles
}: {
  desktopFile?: File | null;
  mobileFiles?: (File | null)[];
}): Promise<HeroSectionImageData> {
  const current = getHeroImagesSync();
  let updatedDesktopImage = current.desktopImage;
  let updatedMobileImages = [...(current.mobileImages || [])];

  // 1. Upload desktop image if provided
  if (desktopFile) {
    const desktopUrl = await uploadImageToCloudinary(desktopFile, CLOUDINARY_FOLDER);
    updatedDesktopImage = desktopUrl;
  }

  // 2. Upload mobile images (for mobile screen, 2 images)
  if (mobileFiles && mobileFiles.length > 0) {
    const newMobileUrls: string[] = [...updatedMobileImages];
    for (let i = 0; i < Math.min(mobileFiles.length, 2); i++) {
      const file = mobileFiles[i];
      if (file) {
        const url = await uploadImageToCloudinary(file, CLOUDINARY_FOLDER);
        newMobileUrls[i] = url;
      }
    }
    updatedMobileImages = newMobileUrls;
  }

  const updatedData: HeroSectionImageData = {
    id: DOC_ID,
    desktopImage: updatedDesktopImage,
    mobileImages: updatedMobileImages,
    updatedAt: new Date().toISOString()
  };

  // Save to local storage
  saveLocally(updatedData);

  // Save link into Firebase collection named "hero section image"
  if (isFirebaseConfigured && db) {
    try {
      const docRefPrimary = doc(db, COLLECTION_NAME, DOC_ID);
      const docRefAlt = doc(db, COLLECTION_NAME_ALT, DOC_ID);

      await setDoc(docRefPrimary, updatedData, { merge: true });
      await setDoc(docRefAlt, updatedData, { merge: true });
      console.log(`Saved hero section image links to Firebase collection "${COLLECTION_NAME}"`);
    } catch (fbErr) {
      console.error(`Failed to write to Firebase collection "${COLLECTION_NAME}":`, fbErr);
    }
  }

  return updatedData;
}

// Real-time listener for "hero section image" collection
export function subscribeToHeroImages(callback: (data: HeroSectionImageData) => void): () => void {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as HeroSectionImageData;
          saveLocally(data);
          callback(data);
        }
      },
      (err) => {
        console.warn("Firestore hero section image listener error:", err);
      }
    );
    return unsub;
  }

  const handleUpdate = () => {
    callback(getHeroImagesSync());
  };
  window.addEventListener("portfolio_data_update", handleUpdate);
  return () => window.removeEventListener("portfolio_data_update", handleUpdate);
}

export const heroImageService = {
  getHeroImagesSync,
  fetchHeroImages,
  uploadAndSaveHeroImages,
  subscribeToHeroImages,
  defaultHeroImageData
};

export default heroImageService;
