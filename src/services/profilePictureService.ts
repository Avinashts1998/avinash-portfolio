import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";

export interface ProfilePictureData {
  id: string;
  imageUrl: string;
  updatedAt?: string;
  caption?: string;
}

const STORAGE_KEY = "portfolio_profile_picture_data";
const COLLECTION_NAME = "profile_pictures";
const ACTIVE_DOC_ID = "active_profile";

export const DEFAULT_PROFILE_PICTURE: ProfilePictureData = {
  id: ACTIVE_DOC_ID,
  imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
  caption: "Profile Picture",
  updatedAt: "2026-09-17T06:59:15.384Z",
};

let listenerInitialized = false;

export const profilePictureService = {
  /**
   * Get currently cached profile picture data from localStorage
   */
  getProfilePicture(): ProfilePictureData {
    if (typeof window === "undefined") return DEFAULT_PROFILE_PICTURE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.imageUrl) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored profile picture:", e);
    }
    return DEFAULT_PROFILE_PICTURE;
  },

  /**
   * Initialize Firestore real-time listener for profile picture
   */
  initListener(callback?: (data: ProfilePictureData | null) => void): () => void {
    if (typeof window === "undefined") return () => {};

    if (!isFirebaseConfigured || !db) {
      if (callback) callback(this.getProfilePicture());
      return () => {};
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, ACTIVE_DOC_ID);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            const profileData: ProfilePictureData = {
              id: docSnap.id,
              imageUrl: data.imageUrl || "",
              caption: data.caption || "Profile Picture",
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
            window.dispatchEvent(new CustomEvent("portfolio_profile_picture_update", { detail: profileData }));
            if (callback) callback(profileData);
          } else {
            localStorage.removeItem(STORAGE_KEY);
            window.dispatchEvent(new CustomEvent("portfolio_profile_picture_update", { detail: null }));
            if (callback) callback(null);
          }
        },
        (err) => {
          console.warn("Firestore profile picture listener notice:", err);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Failed to initialize profile picture listener:", err);
      return () => {};
    }
  },

  /**
   * Upload and set profile picture (Cloudinary + Firestore)
   */
  async uploadProfilePicture(file: File): Promise<string> {
    const prevData = this.getProfilePicture();
    const prevUrl = prevData?.imageUrl;

    // 1. Upload to Cloudinary (folder: profile_images)
    const customId = `dp_${Date.now()}`;
    const uploadedUrl = await uploadImageToCloudinary(file, "profile_images", customId);
    if (!uploadedUrl) {
      throw new Error("Failed to upload profile photo to Cloudinary.");
    }

    // Clean up previous image from Cloudinary if it existed
    if (prevUrl && prevUrl !== uploadedUrl && !prevUrl.includes("unsplash.com")) {
      deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Failed to delete previous DP from Cloudinary:", e));
    }

    const newProfileData: ProfilePictureData = {
      id: ACTIVE_DOC_ID,
      imageUrl: uploadedUrl,
      caption: "Profile Picture",
      updatedAt: new Date().toISOString(),
    };

    // 2. Local cache update
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfileData));
    window.dispatchEvent(new CustomEvent("portfolio_profile_picture_update", { detail: newProfileData }));

    // 3. Firestore update
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, ACTIVE_DOC_ID);
        await setDoc(docRef, {
          imageUrl: uploadedUrl,
          caption: "Profile Picture",
          updatedAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        }, { merge: true });

        // Also save to a historical subcollection or collection record
        const logDocRef = doc(collection(db, COLLECTION_NAME));
        await setDoc(logDocRef, {
          imageUrl: uploadedUrl,
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to save profile picture to Firestore:", err);
      }
    }

    return uploadedUrl;
  },

  /**
   * Delete the active profile picture from Firestore, Cloudinary, and localStorage
   */
  async deleteProfilePicture(): Promise<void> {
    const prevData = this.getProfilePicture();
    const prevUrl = prevData?.imageUrl;

    // 1. Delete from Cloudinary if hosted on Cloudinary
    if (prevUrl && !prevUrl.includes("unsplash.com")) {
      await deleteImageFromCloudinary(prevUrl).catch((e) => {
        console.warn("Notice: Cloudinary profile picture deletion:", e);
      });
    }

    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("portfolio_profile_picture_update", { detail: null }));

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, ACTIVE_DOC_ID);
        await deleteDoc(docRef);
      } catch (err) {
        console.error("Failed to delete profile picture from Firestore:", err);
        throw err;
      }
    }
  },
};
