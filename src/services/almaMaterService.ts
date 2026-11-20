import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";

export interface AlmaMater {
  id: string;
  name: string;
  shortName?: string;
  degree: string;
  period: string;
  location: string;
  description?: string;
  imageUrl: string;
  logoUrl?: string;
  websiteUrl?: string;
  order: number;
  updatedAt?: string;
}

export const DEFAULT_ALMA_MATERS: AlmaMater[] = [
  {
    id: "alma_niat",
    name: "NxtWave Institute of Advanced Technologies (NIAT)",
    shortName: "NIAT Hyderabad",
    degree: "Full-Stack Development & Product Design (MERN)",
    period: "2020 — 2021",
    location: "Hyderabad, India",
    description: "Intensive training across software technology, interface systems, research, AI, product development, and design thinking, self-specialized in discipline, building a strong foundation in interaction design and problem-solving, before shifting toward product design and UX research. The multidisciplinary foundation is what drives how I approach every product problem today.",
    imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786963485/culzpezdj8j0wny4gzky.webp",
    logoUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786969034/wmje2s275fijjuggjelv.png",
    order: 0,
  },
  {
    id: "alma_kannur",
    name: "Kannur University",
    shortName: "Kannur University",
    degree: "Bachelor's Degree",
    period: "2016 — 2020",
    location: "Kerala, India",
    description: "Years that built the foundation. Discipline, work ethic, and a deep respect for collaboration and teamwork became an important part of the journey. My education at Kannur University gave me a strong academic foundation while shaping the mindset, adaptability, and problem-solving approach I rely on every day.",
    imageUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786963889/uyaflr1wcn2ymk2ktrvp.jpg",
    logoUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786969035/xjhwjaczpdsy5y1bfrvp.png",
    order: 1,
  },
];

const STORAGE_KEY = "portfolio_alma_maters_data";
const COLLECTION_NAME = "alma_maters";

let listenerInitialized = false;

function initAlmaMaters() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ALMA_MATERS));
  } else {
    try {
      const parsed = JSON.parse(stored) as AlmaMater[];
      let changed = false;
      const updated = parsed.map((item) => {
        if (item.id === "alma_niat") {
          let itemChanged = false;
          let name = item.name;
          let imageUrl = item.imageUrl;
          let logoUrl = item.logoUrl;
          let description = item.description;
          const targetName = "NxtWave Institute of Advanced Technologies (NIAT)";
          const targetDesc = "Intensive training across software technology, interface systems, research, AI, product development, and design thinking, self-specialized in discipline, building a strong foundation in interaction design and problem-solving, before shifting toward product design and UX research. The multidisciplinary foundation is what drives how I approach every product problem today.";
          const targetLogo = "https://res.cloudinary.com/p66qxgqe/image/upload/v1786969034/wmje2s275fijjuggjelv.png";
          
          if (item.name !== targetName) {
            name = targetName;
            itemChanged = true;
          }
          if (item.imageUrl.includes("unsplash.com") || !item.imageUrl.includes("culzpezdj8j0wny4gzky")) {
            imageUrl = "https://res.cloudinary.com/p66qxgqe/image/upload/v1786963485/culzpezdj8j0wny4gzky.webp";
            itemChanged = true;
          }
          if (!item.logoUrl || item.logoUrl.includes("unsplash.com") || item.logoUrl !== targetLogo) {
            logoUrl = targetLogo;
            itemChanged = true;
          }
          if (item.description !== targetDesc) {
            description = targetDesc;
            itemChanged = true;
          }
          if (itemChanged) {
            changed = true;
            return { ...item, name, imageUrl, logoUrl, description };
          }
        }
        if (item.id === "alma_kannur") {
          let itemChanged = false;
          let degree = item.degree;
          let imageUrl = item.imageUrl;
          let logoUrl = item.logoUrl;
          let description = item.description;
          let shortName = item.shortName;
          const targetLogo = "https://res.cloudinary.com/p66qxgqe/image/upload/v1786969035/xjhwjaczpdsy5y1bfrvp.png";
          const targetDesc = "Years that built the foundation. Discipline, work ethic, and a deep respect for collaboration and teamwork became an important part of the journey. My education at Kannur University gave me a strong academic foundation while shaping the mindset, adaptability, and problem-solving approach I rely on every day.";
          const targetShortName = "Kannur University";

          if (item.shortName !== targetShortName) {
            shortName = targetShortName;
            itemChanged = true;
          }
          if (item.degree === "Bachelor of Commerce (B.Com)") {
            degree = "Bachelor's Degree";
            itemChanged = true;
          }
          if (item.imageUrl.includes("unsplash.com") || !item.imageUrl.includes("uyaflr1wcn2ymk2ktrvp")) {
            imageUrl = "https://res.cloudinary.com/p66qxgqe/image/upload/v1786963889/uyaflr1wcn2ymk2ktrvp.jpg";
            itemChanged = true;
          }
          if (!item.logoUrl || item.logoUrl.includes("unsplash.com") || item.logoUrl !== targetLogo) {
            logoUrl = targetLogo;
            itemChanged = true;
          }
          if (item.description !== targetDesc) {
            description = targetDesc;
            itemChanged = true;
          }
          if (itemChanged) {
            changed = true;
            return { ...item, degree, imageUrl, logoUrl, description, shortName };
          }
        }
        return item;
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  if (!listenerInitialized && isFirebaseConfigured && db) {
    listenerInitialized = true;
    try {
      const colRef = collection(db, COLLECTION_NAME);
      onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: AlmaMater[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as any;
              fetched.push({
                id: docSnap.id,
                name: data.name || "",
                shortName: data.shortName || "",
                degree: data.degree || "",
                period: data.period || "",
                location: data.location || "",
                description: data.description || "",
                imageUrl: data.imageUrl || "",
                logoUrl: data.logoUrl || "",
                websiteUrl: data.websiteUrl || "",
                order: typeof data.order === "number" ? data.order : 0,
                updatedAt: data.updatedAt || "",
              });
            });

            fetched.sort((a, b) => a.order - b.order);

            if (fetched.length > 0) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fetched));
              window.dispatchEvent(new CustomEvent("portfolio_alma_maters_update", { detail: fetched }));
            }
          }
        },
        (err) => {
          console.warn("Firestore alma_maters listener notice:", err);
        }
      );
    } catch (err) {
      console.warn("Could not attach Firestore listener for alma_maters:", err);
    }
  }
}

export const almaMaterService = {
  getAlmaMaters(): AlmaMater[] {
    initAlmaMaters();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AlmaMater[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.order - b.order);
        }
      }
      return [...DEFAULT_ALMA_MATERS];
    } catch {
      return [...DEFAULT_ALMA_MATERS];
    }
  },

  initListener(callback?: (items: AlmaMater[]) => void): () => void {
    initAlmaMaters();

    const handler = (e: any) => {
      const detail = e.detail || this.getAlmaMaters();
      if (callback) callback(detail);
    };

    window.addEventListener("portfolio_alma_maters_update", handler);
    if (callback) callback(this.getAlmaMaters());

    return () => {
      window.removeEventListener("portfolio_alma_maters_update", handler);
    };
  },

  async saveAlmaMaters(items: AlmaMater[]): Promise<void> {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent("portfolio_alma_maters_update", { detail: sorted }));

    if (isFirebaseConfigured && db) {
      try {
        for (const item of sorted) {
          const docRef = doc(db, COLLECTION_NAME, item.id);
          await setDoc(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch (err) {
        console.warn("Error persisting alma_maters to Firestore:", err);
      }
    }
  },

  async updateAlmaMater(id: string, updates: Partial<AlmaMater>): Promise<void> {
    const items = this.getAlmaMaters();
    const index = items.findIndex((it) => it.id === id);
    if (index === -1) return;

    const target = items[index];
    const updatedItem: AlmaMater = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updatedItem;
    await this.saveAlmaMaters(items);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, updatedItem, { merge: true });
      } catch (err) {
        console.warn(`Error updating alma_mater ${id} in Firestore:`, err);
      }
    }
  },

  async uploadCampusImage(id: string, file: File): Promise<string> {
    const items = this.getAlmaMaters();
    const target = items.find((it) => it.id === id);
    const prevUrl = target?.imageUrl;

    const customPublicId = `alma_campus_${id}_${Date.now()}`;
    const uploadedUrl = await uploadImageToCloudinary(file, "profile_images", customPublicId);

    if (prevUrl && prevUrl !== uploadedUrl && !prevUrl.includes("unsplash.com")) {
      deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Notice: Cloudinary deletion:", e));
    }

    if (target) {
      await this.updateAlmaMater(id, { imageUrl: uploadedUrl });
    }

    return uploadedUrl;
  },

  async uploadLogoImage(id: string, file: File): Promise<string> {
    const items = this.getAlmaMaters();
    const target = items.find((it) => it.id === id);
    const prevUrl = target?.logoUrl;

    const customPublicId = `alma_logo_${id}_${Date.now()}`;
    const uploadedUrl = await uploadImageToCloudinary(file, "profile_images", customPublicId);

    if (prevUrl && prevUrl !== uploadedUrl && !prevUrl.includes("unsplash.com")) {
      deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Notice: Cloudinary deletion:", e));
    }

    if (target) {
      await this.updateAlmaMater(id, { logoUrl: uploadedUrl });
    }

    return uploadedUrl;
  },

  async deleteAlmaMater(id: string): Promise<void> {
    const items = this.getAlmaMaters();
    const target = items.find((it) => it.id === id);

    if (target) {
      if (target.imageUrl && !target.imageUrl.includes("unsplash.com")) {
        deleteImageFromCloudinary(target.imageUrl).catch(() => {});
      }
      if (target.logoUrl && !target.logoUrl.includes("unsplash.com")) {
        deleteImageFromCloudinary(target.logoUrl).catch(() => {});
      }
    }

    const filtered = items.filter((it) => it.id !== id);
    await this.saveAlmaMaters(filtered);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn(`Error deleting alma_mater ${id} from Firestore:`, err);
      }
    }
  },
};
