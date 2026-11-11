import { collection, doc, setDoc, getDocs, onSnapshot, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";

export interface AboutPhoto {
  id: string;
  caption: string;
  imageUrl: string;
  slotIndex: number;
  updatedAt?: string;
}

export const DEFAULT_ABOUT_PHOTOS: AboutPhoto[] = [
  {
    id: "card-1",
    caption: "",
    imageUrl: "",
    slotIndex: 0,
  },
  {
    id: "card-2",
    caption: "Kayaking & Rivers",
    imageUrl: "",
    slotIndex: 1,
  },
  {
    id: "card-3",
    caption: "Avinash • Portrait",
    imageUrl: "",
    slotIndex: 2,
  },
  {
    id: "card-4",
    caption: "Earthy Landscapes",
    imageUrl: "",
    slotIndex: 3,
  },
  {
    id: "card-5",
    caption: "Track & Speed",
    imageUrl: "",
    slotIndex: 4,
  },
];

const STORAGE_KEY = "portfolio_about_more_photos";

let listenerInitialized = false;

function initAboutImages() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ABOUT_PHOTOS));
  }

  if (!listenerInitialized && isFirebaseConfigured && db) {
    listenerInitialized = true;
    try {
      // 1. Listen to the document `settings/more_photos`
      const morePhotosDocRef = doc(db, "settings", "more_photos");
      onSnapshot(
        morePhotosDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            const current = aboutImagesService.getAboutPhotos();
            const updated = current.map((p, idx) => {
              const urlKey = `photo_${idx + 1}_url`;
              const captionKey = `photo_${idx + 1}_caption`;
              return {
                ...p,
                imageUrl: data[urlKey] !== undefined ? data[urlKey] : p.imageUrl,
                caption: data[captionKey] !== undefined ? data[captionKey] : p.caption,
                updatedAt: data.updatedAt,
              };
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event("portfolio_about_images_update"));
          }
        },
        (err) => {
          console.warn("Firestore settings/more_photos listener warning:", err);
        }
      );

      // 2. Also listen to subcollection `settings/more_photos/items`
      try {
        const morePhotosSubRef = collection(db, "settings", "more_photos", "items");
        onSnapshot(
          morePhotosSubRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const items: AboutPhoto[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data() as any;
                items.push({
                  id: docSnap.id,
                  caption: data.caption || "",
                  imageUrl: data.imageUrl || data.url || "",
                  slotIndex: typeof data.slotIndex === "number" ? data.slotIndex : 0,
                  updatedAt: data.updatedAt,
                });
              });
              const merged = DEFAULT_ABOUT_PHOTOS.map((def) => {
                const found = items.find((item) => item.id === def.id || item.slotIndex === def.slotIndex);
                return found ? { ...def, ...found } : def;
              });
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              window.dispatchEvent(new Event("portfolio_about_images_update"));
            }
          },
          (err) => {
            console.warn("Firestore settings/more_photos/items listener warning:", err);
          }
        );
      } catch {}
    } catch (err) {
      console.warn("Could not attach Firestore listeners for settings/more_photos:", err);
    }
  }
}

export const aboutImagesService = {
  getAboutPhotos(): AboutPhoto[] {
    initAboutImages();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AboutPhoto[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return DEFAULT_ABOUT_PHOTOS.map((def) => {
            const found = parsed.find((p) => p.id === def.id || p.slotIndex === def.slotIndex);
            return found ? { ...def, ...found } : def;
          });
        }
      }
      return [...DEFAULT_ABOUT_PHOTOS];
    } catch {
      return [...DEFAULT_ABOUT_PHOTOS];
    }
  },

  async savePhoto(photo: AboutPhoto): Promise<void> {
    const current = this.getAboutPhotos();
    const updated = current.map((item) =>
      item.id === photo.id || item.slotIndex === photo.slotIndex
        ? { ...item, ...photo, updatedAt: new Date().toISOString() }
        : item
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("portfolio_about_images_update"));

    if (isFirebaseConfigured && db) {
      const photoPayload = {
        id: photo.id,
        caption: photo.caption || "",
        imageUrl: photo.imageUrl || "",
        url: photo.imageUrl || "",
        slotIndex: photo.slotIndex,
        updatedAt: new Date().toISOString(),
      };

      try {
        // Save to document `settings/more_photos`
        const settingsDocRef = doc(db, "settings", "more_photos");
        await setDoc(
          settingsDocRef,
          {
            id: "more_photos",
            [`photo_${photo.slotIndex + 1}_url`]: photo.imageUrl || "",
            [`photo_${photo.slotIndex + 1}_caption`]: photo.caption || "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Also save to subcollection `settings/more_photos/items/{photo.id}`
        const morePhotosSubDocRef = doc(db, "settings", "more_photos", "items", photo.id);
        await setDoc(morePhotosSubDocRef, photoPayload, { merge: true });
      } catch (err) {
        console.warn("Could not save photo to Firestore settings/more_photos:", err);
      }
    }
  },

  async saveAllPhotos(photos: AboutPhoto[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    window.dispatchEvent(new Event("portfolio_about_images_update"));

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        const morePhotosSummary: Record<string, any> = {
          id: "more_photos",
          updatedAt: new Date().toISOString(),
        };

        for (const photo of photos) {
          const photoPayload = {
            id: photo.id,
            caption: photo.caption || "",
            imageUrl: photo.imageUrl || "",
            url: photo.imageUrl || "",
            slotIndex: photo.slotIndex,
            updatedAt: new Date().toISOString(),
          };

          morePhotosSummary[`photo_${photo.slotIndex + 1}_url`] = photo.imageUrl || "";
          morePhotosSummary[`photo_${photo.slotIndex + 1}_caption`] = photo.caption || "";

          // `settings/more_photos/items/{id}`
          const subDocRef = doc(db, "settings", "more_photos", "items", photo.id);
          batch.set(subDocRef, photoPayload, { merge: true });
        }

        const settingsDocRef = doc(db, "settings", "more_photos");
        batch.set(settingsDocRef, morePhotosSummary, { merge: true });

        await batch.commit();
      } catch (err) {
        console.warn("Could not batch save photos to Firestore settings/more_photos:", err);
      }
    }
  },

  async uploadPhoto(file: File | Blob, slotIndex: number, caption?: string): Promise<string> {
    const current = this.getAboutPhotos();
    const targetSlot = current.find((p) => p.slotIndex === slotIndex) || current[slotIndex] || DEFAULT_ABOUT_PHOTOS[slotIndex];
    const prevUrl = targetSlot?.imageUrl;

    let uploadedUrl = "";
    try {
      // Direct upload to Cloudinary `profile_images` folder
      const customId = `about_slot_${slotIndex + 1}_${Date.now()}`;
      uploadedUrl = await uploadImageToCloudinary(file, "profile_images", customId);
    } catch (err) {
      console.warn("Cloudinary upload failed, using local DataURL as fallback:", err);
      uploadedUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Clean up previous image from Cloudinary if it was a user upload
    if (prevUrl && prevUrl !== uploadedUrl && !prevUrl.includes("unsplash.com") && !prevUrl.startsWith("data:")) {
      deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Failed to delete previous about photo from Cloudinary:", e));
    }

    const updatedPhoto: AboutPhoto = {
      ...targetSlot,
      imageUrl: uploadedUrl,
      caption: caption !== undefined ? caption : targetSlot.caption,
      updatedAt: new Date().toISOString(),
    };

    // Save directly to Firebase `settings/more_photos` collection
    await this.savePhoto(updatedPhoto);
    return uploadedUrl;
  },

  async removePhoto(id: string): Promise<void> {
    const current = this.getAboutPhotos();
    const targetPhoto = current.find((p) => p.id === id);
    const prevUrl = targetPhoto?.imageUrl;

    // Delete from Cloudinary if hosted on Cloudinary
    if (prevUrl && !prevUrl.includes("unsplash.com") && !prevUrl.startsWith("data:")) {
      await deleteImageFromCloudinary(prevUrl).catch((e) => {
        console.warn("Notice: Cloudinary about photo deletion:", e);
      });
    }

    const updated = current.map((p) => (p.id === id ? { ...p, imageUrl: "", updatedAt: new Date().toISOString() } : p));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("portfolio_about_images_update"));

    if (isFirebaseConfigured && db) {
      try {
        const slotIdx = current.find((p) => p.id === id)?.slotIndex ?? 0;

        const subDocRef = doc(db, "settings", "more_photos", "items", id);
        await setDoc(subDocRef, { imageUrl: "", url: "", updatedAt: new Date().toISOString() }, { merge: true });

        const settingsDocRef = doc(db, "settings", "more_photos");
        await setDoc(
          settingsDocRef,
          {
            [`photo_${slotIdx + 1}_url`]: "",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Could not clear photo in Firestore settings/more_photos:", err);
      }
    }
  },
};
