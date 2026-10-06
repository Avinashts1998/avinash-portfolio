import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";

export interface MentorshipPhoto {
  id: string;
  slotIndex: number;
  label: string;
  imageUrl: string;
  altText: string;
  updatedAt?: string;
}

export const DEFAULT_MENTORSHIP_PHOTOS: MentorshipPhoto[] = [
  {
    id: "photo_1",
    slotIndex: 0,
    label: "Photo 1 (Left / Back)",
    imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786949321/profile_images/mentorship_photo_1_1786949321997.jpg",
    altText: "Mentoring session whiteboard workshop",
  },
  {
    id: "photo_2",
    slotIndex: 1,
    label: "Photo 2 (Right / Front)",
    imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786949337/profile_images/mentorship_photo_2_1786949337805.jpg",
    altText: "Speaking on stage presentation",
  },
];

const STORAGE_KEY = "portfolio_mentorship_photos_data";
const COLLECTION_NAME = "mentorship_photos";
const ACTIVE_CONFIG_DOC = "active_config";

let listenerInitialized = false;

function initMentorshipPhotos() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MENTORSHIP_PHOTOS));
  }

  if (!listenerInitialized && isFirebaseConfigured && db) {
    listenerInitialized = true;
    try {
      // 1. Real-time collection listener for `mentorship_photos`
      const colRef = collection(db, COLLECTION_NAME);
      onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const currentPhotos = mentorshipPhotosService.getMentorshipPhotos();
            const docsData: Record<string, any> = {};
            snapshot.forEach((docSnap) => {
              docsData[docSnap.id] = docSnap.data();
            });

            // Handle active_config document if present
            const activeConfig = docsData[ACTIVE_CONFIG_DOC];
            
            const updated = currentPhotos.map((def, idx) => {
              const specificDoc = docsData[`photo_${idx + 1}`] || docsData[def.id];
              const slotUrl = activeConfig?.[`photo_${idx + 1}_url`] || specificDoc?.imageUrl || specificDoc?.url;
              const slotAlt = activeConfig?.[`photo_${idx + 1}_alt`] || specificDoc?.altText || specificDoc?.alt;
              const updatedAt = activeConfig?.updatedAt || specificDoc?.updatedAt;

              return {
                ...def,
                imageUrl: slotUrl !== undefined && slotUrl !== "" ? slotUrl : (slotUrl === "" ? "" : def.imageUrl),
                altText: slotAlt || def.altText,
                updatedAt: updatedAt || def.updatedAt,
              };
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent("portfolio_mentorship_photos_update", { detail: updated }));
          }
        },
        (err) => {
          console.warn("Firestore mentorship_photos listener notice:", err);
        }
      );
    } catch (err) {
      console.warn("Could not attach Firestore listener for mentorship_photos:", err);
    }
  }
}

export const mentorshipPhotosService = {
  /**
   * Returns current cached mentorship photos
   */
  getMentorshipPhotos(): MentorshipPhoto[] {
    initMentorshipPhotos();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MentorshipPhoto[];
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return DEFAULT_MENTORSHIP_PHOTOS.map((def, idx) => {
            const found = parsed.find((p) => p.slotIndex === idx || p.id === def.id);
            return found ? { ...def, ...found } : def;
          });
        }
      }
      return [...DEFAULT_MENTORSHIP_PHOTOS];
    } catch {
      return [...DEFAULT_MENTORSHIP_PHOTOS];
    }
  },

  /**
   * Listen to real-time updates for mentorship photos
   */
  initListener(callback?: (photos: MentorshipPhoto[]) => void): () => void {
    initMentorshipPhotos();

    const handler = (e: any) => {
      const detail = e.detail || this.getMentorshipPhotos();
      if (callback) callback(detail);
    };

    window.addEventListener("portfolio_mentorship_photos_update", handler);
    if (callback) callback(this.getMentorshipPhotos());

    return () => {
      window.removeEventListener("portfolio_mentorship_photos_update", handler);
    };
  },

  /**
   * Upload image to Cloudinary (profile_images folder) and update Firestore mentorship_photos
   */
  async uploadMentorshipPhoto(slotIndex: number, file: File): Promise<string> {
    const currentPhotos = this.getMentorshipPhotos();
    const prevUrl = currentPhotos[slotIndex]?.imageUrl;

    const customPublicId = `mentorship_photo_${slotIndex + 1}_${Date.now()}`;
    
    // 1. Upload to Cloudinary under folder "profile_images"
    const uploadedUrl = await uploadImageToCloudinary(file, "profile_images", customPublicId);
    if (!uploadedUrl) {
      throw new Error("Failed to upload image to Cloudinary.");
    }

    // Clean up previous image from Cloudinary if it was a user upload
    if (prevUrl && prevUrl !== uploadedUrl && !prevUrl.includes("unsplash.com")) {
      deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Failed to delete old mentorship photo from Cloudinary:", e));
    }

    const updatedPhotos = [...currentPhotos];
    const targetSlot = updatedPhotos[slotIndex] || {
      id: `photo_${slotIndex + 1}`,
      slotIndex,
      label: `Photo ${slotIndex + 1}`,
      imageUrl: "",
      altText: "Mentorship photo",
    };

    targetSlot.imageUrl = uploadedUrl;
    targetSlot.updatedAt = new Date().toISOString();
    updatedPhotos[slotIndex] = targetSlot;

    // 2. Update local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    window.dispatchEvent(new CustomEvent("portfolio_mentorship_photos_update", { detail: updatedPhotos }));

    // 3. Update Firestore `mentorship_photos` collection
    if (isFirebaseConfigured && db) {
      try {
        const slotDocId = `photo_${slotIndex + 1}`;
        const slotDocRef = doc(db, COLLECTION_NAME, slotDocId);
        await setDoc(slotDocRef, {
          id: slotDocId,
          slotIndex,
          imageUrl: uploadedUrl,
          altText: targetSlot.altText || `Mentorship photo ${slotIndex + 1}`,
          updatedAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        }, { merge: true });

        // Also merge into active_config for atomic combined reads
        const configDocRef = doc(db, COLLECTION_NAME, ACTIVE_CONFIG_DOC);
        await setDoc(configDocRef, {
          [`photo_${slotIndex + 1}_url`]: uploadedUrl,
          updatedAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync mentorship photo to Firestore mentorship_photos:", err);
      }
    }

    return uploadedUrl;
  },

  /**
   * Delete a mentorship photo (resets to default fallback and deletes from Cloudinary)
   */
  async deleteMentorshipPhoto(slotIndex: number): Promise<void> {
    const currentPhotos = this.getMentorshipPhotos();
    const prevUrl = currentPhotos[slotIndex]?.imageUrl;

    // 1. Delete previous custom image from Cloudinary
    if (prevUrl && !prevUrl.includes("unsplash.com")) {
      await deleteImageFromCloudinary(prevUrl).catch((e) => {
        console.warn("Notice: Cloudinary mentorship photo deletion:", e);
      });
    }

    const updatedPhotos = [...currentPhotos];
    const def = DEFAULT_MENTORSHIP_PHOTOS[slotIndex];

    if (updatedPhotos[slotIndex]) {
      updatedPhotos[slotIndex] = {
        ...updatedPhotos[slotIndex],
        imageUrl: def ? def.imageUrl : "",
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. Local cache update
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    window.dispatchEvent(new CustomEvent("portfolio_mentorship_photos_update", { detail: updatedPhotos }));

    // 3. Firestore collection deletion/reset
    if (isFirebaseConfigured && db) {
      try {
        const slotDocId = `photo_${slotIndex + 1}`;
        const slotDocRef = doc(db, COLLECTION_NAME, slotDocId);
        await deleteDoc(slotDocRef);

        const configDocRef = doc(db, COLLECTION_NAME, ACTIVE_CONFIG_DOC);
        await setDoc(configDocRef, {
          [`photo_${slotIndex + 1}_url`]: def ? def.imageUrl : "",
          updatedAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.error("Failed to delete mentorship photo from Firestore mentorship_photos:", err);
        throw err;
      }
    }
  },
};
