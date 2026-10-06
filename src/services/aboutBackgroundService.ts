import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { 
  uploadImageToCloudinary, 
  deleteMediaFromCloudinary, 
  deleteImageFromCloudinary, 
  deleteAudioFromCloudinary 
} from "../utils/cloudinary";

export interface BackgroundItem {
  id: string;
  imageUrl: string;
  title: string;
  location: string;
  authorName: string;
  authorAvatar?: string;
  audioUrl?: string;
  audioLabel?: string;
  blurAmount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AboutBackgroundMultiConfig {
  items: BackgroundItem[];
  activeId: string;
  blurAmount: number;
}

// Cloudinary Folder Constants matching user structure
export const CLOUDINARY_EXPLORATION_IMAGES_FOLDER = "explore_collections/exploration_images";
export const CLOUDINARY_EXPLORATION_AUDIOS_FOLDER = "explore_collections/exploration_audios";

// Firestore Collection Name
export const FIRESTORE_EXPLORATION_INSIGHTS_COLLECTION = "exploration_insights";

export const DEFAULT_BACKGROUND_ITEMS: BackgroundItem[] = [];

export const DEFAULT_ABOUT_BACKGROUND_MULTI: AboutBackgroundMultiConfig = {
  items: [],
  activeId: "",
  blurAmount: 28,
};

const STORAGE_KEY = "portfolio_about_background_multi_config";

let listenerInitialized = false;

function initAboutBackgroundMulti() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ABOUT_BACKGROUND_MULTI));
  } else {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed?.items)) {
        // Filter out legacy unsplash mock items
        const realItems = parsed.items.filter(
          (it: any) =>
            it &&
            it.id !== "bg-kanchendzonga-1" &&
            it.id !== "bg-dolomites-2" &&
            !it.imageUrl?.includes("images.unsplash.com")
        );
        if (realItems.length !== parsed.items.length) {
          const cleanedConfig: AboutBackgroundMultiConfig = {
            items: realItems,
            activeId: realItems[0]?.id || "",
            blurAmount: parsed.blurAmount || 28,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedConfig));
        }
      }
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ABOUT_BACKGROUND_MULTI));
    }
  }

  if (!listenerInitialized && isFirebaseConfigured && db) {
    listenerInitialized = true;
    try {
      // Listen to exploration_insights collection in Firestore
      const insightsColRef = collection(db, FIRESTORE_EXPLORATION_INSIGHTS_COLLECTION);
      onSnapshot(
        insightsColRef,
        (snapshot) => {
          if (snapshot.empty) {
            const emptyConfig: AboutBackgroundMultiConfig = {
              items: [],
              activeId: "",
              blurAmount: 28,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyConfig));
            window.dispatchEvent(new Event("portfolio_about_background_update"));
          } else {
            const fetchedItems: BackgroundItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as any;
              // Ignore any mock items
              if (
                docSnap.id === "bg-kanchendzonga-1" ||
                docSnap.id === "bg-dolomites-2" ||
                data.imageUrl?.includes("images.unsplash.com")
              ) {
                return;
              }
              fetchedItems.push({
                id: docSnap.id,
                imageUrl: data.imageUrl || "",
                title: data.title || "",
                location: data.location || "",
                authorName: data.authorName || "Avinash Shajan",
                authorAvatar: data.authorAvatar || "",
                audioUrl: data.audioUrl || "",
                audioLabel: data.audioLabel || "",
                blurAmount: typeof data.blurAmount === "number" ? data.blurAmount : 28,
                isActive: !!data.isActive,
                createdAt: data.createdAt || "",
                updatedAt: data.updatedAt || "",
              });
            });

            if (fetchedItems.length === 0) {
              const emptyConfig: AboutBackgroundMultiConfig = {
                items: [],
                activeId: "",
                blurAmount: 28,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyConfig));
              window.dispatchEvent(new Event("portfolio_about_background_update"));
              return;
            }

            // Sort deterministically by createdAt to preserve exact scene order
            fetchedItems.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });

            const activeItem = fetchedItems.find((it) => it.isActive) || fetchedItems[0];
            const merged: AboutBackgroundMultiConfig = {
              items: fetchedItems,
              activeId: activeItem?.id || "",
              blurAmount: activeItem?.blurAmount || 28,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            window.dispatchEvent(new Event("portfolio_about_background_update"));
          }
        },
        (err) => {
          console.warn("Firestore exploration_insights listener warning:", err);
        }
      );
    } catch (err) {
      console.warn("Could not attach listener for exploration_insights:", err);
    }
  }
}

export const aboutBackgroundService = {
  getMultiConfig(): AboutBackgroundMultiConfig {
    initAboutBackgroundMulti();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
          const realItems = parsed.items.filter(
            (it: any) =>
              it &&
              it.id !== "bg-kanchendzonga-1" &&
              it.id !== "bg-dolomites-2" &&
              !it.imageUrl?.includes("images.unsplash.com")
          );
          return {
            items: realItems,
            activeId: parsed.activeId || (realItems[0]?.id ?? ""),
            blurAmount: typeof parsed.blurAmount === "number" ? parsed.blurAmount : 28,
          };
        }
      }
      return { ...DEFAULT_ABOUT_BACKGROUND_MULTI };
    } catch {
      return { ...DEFAULT_ABOUT_BACKGROUND_MULTI };
    }
  },

  getActiveBackground(): BackgroundItem | null {
    const config = this.getMultiConfig();
    if (!config.items || config.items.length === 0) return null;
    const found = config.items.find((item) => item.id === config.activeId || item.isActive);
    return found || config.items[0] || null;
  },

  getAllBackgrounds(): BackgroundItem[] {
    return this.getMultiConfig().items;
  },

  saveMultiConfigLocal(config: AboutBackgroundMultiConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("portfolio_about_background_update"));
  },

  async saveMultiConfig(config: Partial<AboutBackgroundMultiConfig>): Promise<AboutBackgroundMultiConfig> {
    const current = this.getMultiConfig();
    const updated: AboutBackgroundMultiConfig = {
      ...current,
      ...config,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("portfolio_about_background_update"));

    if (isFirebaseConfigured && db) {
      try {
        if (updated.items && updated.items.length > 0) {
          const batch = writeBatch(db);
          const timestamp = new Date().toISOString();

          // Write each item into exploration_insights collection
          for (const item of updated.items) {
            const docRef = doc(db, FIRESTORE_EXPLORATION_INSIGHTS_COLLECTION, item.id);
            batch.set(
              docRef,
              {
                id: item.id,
                imageUrl: item.imageUrl || "",
                title: item.title || "",
                location: item.location || "",
                authorName: item.authorName || "Avinash Shajan",
                authorAvatar: item.authorAvatar || "",
                audioUrl: item.audioUrl || "",
                audioLabel: item.audioLabel || "",
                blurAmount: item.blurAmount || updated.blurAmount || 28,
                isActive: item.id === updated.activeId || !!item.isActive,
                updatedAt: timestamp,
                createdAt: item.createdAt || timestamp,
              },
              { merge: true }
            );
          }

          await batch.commit();
          console.log("[Firestore] Successfully synced all scenes to exploration_insights collection");
        }
      } catch (err) {
        console.warn("Could not save to Firestore exploration_insights collection:", err);
      }
    }

    return updated;
  },

  async setActiveBackground(id: string): Promise<void> {
    const current = this.getMultiConfig();
    const updatedItems = current.items.map((item) => ({
      ...item,
      isActive: item.id === id,
    }));
    await this.saveMultiConfig({
      items: updatedItems,
      activeId: id,
    });
  },

  async addBackgroundItem(item: Partial<BackgroundItem>, baseConfig?: AboutBackgroundMultiConfig): Promise<BackgroundItem> {
    const current = baseConfig || this.getMultiConfig();
    const timestamp = new Date().toISOString();
    const newItem: BackgroundItem = {
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      imageUrl: item.imageUrl || "",
      title: item.title || "",
      location: item.location || "",
      authorName: item.authorName || "Avinash Shajan",
      authorAvatar: item.authorAvatar || "",
      audioUrl: item.audioUrl || "",
      audioLabel: item.audioLabel || "Audio recorded from the view point",
      blurAmount: item.blurAmount || 28,
      isActive: current.items.length === 0,
      createdAt: item.createdAt || timestamp,
      updatedAt: timestamp,
      ...item,
    };

    const nextItems = [...current.items, newItem];
    const nextActiveId = current.items.length === 0 ? newItem.id : current.activeId;

    await this.saveMultiConfig({
      ...current,
      items: nextItems,
      activeId: nextActiveId,
    });

    return newItem;
  },

  async updateBackgroundItem(id: string, updates: Partial<BackgroundItem>, baseConfig?: AboutBackgroundMultiConfig): Promise<void> {
    const current = baseConfig || this.getMultiConfig();
    const nextItems = current.items.map((item) => {
      if (item.id === id) {
        return { 
          ...item, 
          ...updates, 
          updatedAt: new Date().toISOString() 
        };
      }
      return item;
    });

    await this.saveMultiConfig({ ...current, items: nextItems });

    // Directly update Firestore document as well
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, FIRESTORE_EXPLORATION_INSIGHTS_COLLECTION, id);
        await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn(`Error updating insight ${id} in Firestore:`, err);
      }
    }
  },

  async deleteBackgroundItem(id: string): Promise<void> {
    const current = this.getMultiConfig();
    const itemToDelete = current.items.find((item) => item.id === id);

    // Clean up uploaded image and audio from Cloudinary
    if (itemToDelete) {
      if (itemToDelete.imageUrl) {
        deleteImageFromCloudinary(itemToDelete.imageUrl).catch((err) => {
          console.warn(`Failed to delete Cloudinary image for scene ${id}:`, err);
        });
      }
      if (itemToDelete.audioUrl) {
        deleteAudioFromCloudinary(itemToDelete.audioUrl).catch((err) => {
          console.warn(`Failed to delete Cloudinary audio for scene ${id}:`, err);
        });
      }
    }

    const nextItems = current.items.filter((item) => item.id !== id);
    let nextActiveId = current.activeId;

    if (current.activeId === id) {
      nextActiveId = nextItems[0]?.id || "";
      if (nextItems[0]) {
        nextItems[0].isActive = true;
      }
    }

    await this.saveMultiConfig({
      items: nextItems,
      activeId: nextActiveId,
    });

    // Delete document from Firestore exploration_insights collection
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, FIRESTORE_EXPLORATION_INSIGHTS_COLLECTION, id);
        await deleteDoc(docRef);
        console.log(`[Firestore] Deleted document ${id} from exploration_insights`);
      } catch (err) {
        console.warn(`Error deleting insight ${id} from Firestore:`, err);
      }
    }
  },

  async deleteAllBackgroundItems(): Promise<void> {
    const current = this.getMultiConfig();

    // Clean up all images and audios from Cloudinary
    for (const item of current.items) {
      if (item.imageUrl) {
        deleteImageFromCloudinary(item.imageUrl).catch(() => {});
      }
      if (item.audioUrl) {
        deleteAudioFromCloudinary(item.audioUrl).catch(() => {});
      }
    }

    const emptyConfig: AboutBackgroundMultiConfig = {
      items: [],
      activeId: "",
      blurAmount: 28,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyConfig));
    window.dispatchEvent(new Event("portfolio_about_background_update"));

    // Delete all docs in Firestore exploration_insights
    if (isFirebaseConfigured && db) {
      try {
        const insightsColRef = collection(db, FIRESTORE_EXPLORATION_INSIGHTS_COLLECTION);
        const snapshot = await getDocs(insightsColRef);
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        console.log("[Firestore] Deleted all documents in exploration_insights collection");
      } catch (err) {
        console.warn("Error deleting all insights in Firestore:", err);
      }
    }
  },

  async deleteUploadedImage(imageUrl: string): Promise<boolean> {
    if (!imageUrl) return false;
    return await deleteImageFromCloudinary(imageUrl);
  },

  async deleteUploadedAudio(audioUrl: string): Promise<boolean> {
    if (!audioUrl) return false;
    return await deleteAudioFromCloudinary(audioUrl);
  },

  async restoreDefaults(): Promise<AboutBackgroundMultiConfig> {
    return await this.saveMultiConfig(DEFAULT_ABOUT_BACKGROUND_MULTI);
  },

  /**
   * Uploads an exploration background image strictly to Cloudinary:
   * Folder path: explore_collections/exploration_images
   */
  async uploadBackgroundImage(file: File | Blob): Promise<string> {
    try {
      const customId = `img_${Date.now()}`;
      const uploadedUrl = await uploadImageToCloudinary(
        file, 
        CLOUDINARY_EXPLORATION_IMAGES_FOLDER, 
        customId, 
        "image"
      );
      return uploadedUrl;
    } catch (err) {
      console.error("Cloudinary upload to explore_collections/exploration_images failed:", err);
      throw err;
    }
  },

  /**
   * Uploads an exploration ambient audio file strictly to Cloudinary:
   * Folder path: explore_collections/exploration_audios
   */
  async uploadAudioFile(file: File | Blob): Promise<string> {
    try {
      const customId = `audio_${Date.now()}`;
      const uploadedUrl = await uploadImageToCloudinary(
        file, 
        CLOUDINARY_EXPLORATION_AUDIOS_FOLDER, 
        customId, 
        "video"
      );
      return uploadedUrl;
    } catch (err: any) {
      console.warn("Cloudinary upload for audio failed, attempting local data URL fallback:", err);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            resolve("");
          }
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });
    }
  },
};
