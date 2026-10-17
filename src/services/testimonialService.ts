import { isFirebaseConfigured, db } from "../utils/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot, 
  query,
  orderBy 
} from "firebase/firestore";
import { dataStore, Testimonial } from "../utils/dataStore";

export interface PublicTestimonialInput {
  name: string;
  position: string;
  company: string;
  quote: string;
  ImgUrl?: string;
  linkedInUrl?: string;
  email?: string;
  relationship?: string;
}

const COLLECTION_NAME = "testimonials";

export const initialDefaultTestimonials: Testimonial[] = [
  {
    id: "T_subith_subair",
    name: "Subith Subair",
    position: "Director Of Engineering",
    company: "Starlfinx Fintech EST - Dubai",
    quote: "Working with Avinash has been a great experience. He approaches every product challenge from the user's perspective, combining strong product thinking, creativity, and attention to detail to deliver intuitive, user-centered solutions. His analytical mindset and collaborative approach make him a valuable Product Designer, and any team would benefit from having him.",
    ImgUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1784958046/eclipqr3elwuuhz9jwm4.webp",
    linkedInUrl: "https://www.linkedin.com/in/subithsubair/",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "approved"
  },
  {
    id: "T_muhammed_fayis",
    name: "Muhammed Fayis",
    position: "Senior Fullstack Engineer",
    company: "Starlfinx Fintech EST - Dubai",
    quote: "I've had the pleasure of working with Avinash Shajan, and he's a designer who seamlessly bridges design and development. He combines strong UX thinking with practical, implementation-ready solutions, always focusing on creating intuitive user experiences. Collaborative, detail-oriented, and open to feedback, he consistently strives to build better products. Any team would be lucky to have him.",
    ImgUrl: "https://res.cloudinary.com/p66qxgqe/image/upload/v1784958046/x10noqpftpmbupldbtrf.webp",
    linkedInUrl: "https://www.linkedin.com/in/muhammed-fayis-0b4457223/",
    createdAt: "2026-01-02T00:00:00.000Z",
    status: "approved"
  }
];

export const testimonialService = {
  getTestimonials(): Testimonial[] {
    const list = dataStore.getTestimonials();
    if (!Array.isArray(list)) return [];
    return this.sortTestimonials(list);
  },

  sortTestimonials(list: Testimonial[]): Testimonial[] {
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  },

  getPublicSubmitUrl(): string {
    if (typeof window === "undefined") return "/submit-testimonial";
    const origin = window.location.origin;
    return `${origin}/submit-testimonial`;
  },

  getWhatsAppShareUrl(customMessage?: string): string {
    const url = this.getPublicSubmitUrl();
    const defaultMsg = `Hey! I'd really love and appreciate if you could share a brief recommendation or testimonial about our collaboration on my portfolio website:\n\n${url}`;
    const message = customMessage || defaultMsg;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  },

  async copyPublicSubmitUrl(): Promise<boolean> {
    const url = this.getPublicSubmitUrl();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch {
      // Fallback
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  },

  /**
   * Real-time subscription to Firebase Firestore testimonials collection
   */
  subscribeToTestimonials(callback: (testimonials: Testimonial[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      callback(this.getTestimonials());
      const handler = () => callback(this.getTestimonials());
      window.addEventListener("portfolio_data_update", handler);
      return () => window.removeEventListener("portfolio_data_update", handler);
    }

    try {
      const collRef = collection(db, COLLECTION_NAME);
      const unsubscribe = onSnapshot(
        collRef,
        (snapshot) => {
          if (snapshot.empty) {
            localStorage.setItem("portfolio_admin_testimonials", JSON.stringify([]));
            localStorage.setItem("portfolio_raw_testimonials", JSON.stringify([]));
            callback([]);
            return;
          }

          const items: Testimonial[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              name: data.name || "",
              position: data.position || "",
              company: data.company || "",
              quote: data.quote || "",
              ImgUrl: data.ImgUrl || "",
              linkedInUrl: data.linkedInUrl || "",
              createdAt: data.createdAt || new Date().toISOString(),
              status: data.status || "approved",
            });
          });

          const sorted = this.sortTestimonials(items);
          localStorage.setItem("portfolio_admin_testimonials", JSON.stringify(sorted));
          localStorage.setItem("portfolio_raw_testimonials", JSON.stringify(sorted));
          callback(sorted);
        },
        (error) => {
          console.warn("Firestore testimonial snapshot error:", error);
          callback(this.getTestimonials());
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Could not setup Firestore testimonial subscription:", err);
      callback(this.getTestimonials());
      return () => {};
    }
  },

  /**
   * Submit a public testimonial from an external user / peer.
   * Directly persists to Firebase Firestore and local store.
   */
  async submitPublicTestimonial(data: PublicTestimonialInput): Promise<Testimonial> {
    const newId = "T_" + Date.now().toString() + "_" + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();
    
    const newTestimonial: Testimonial = {
      id: newId,
      name: data.name.trim(),
      position: data.position.trim(),
      company: data.company.trim(),
      quote: data.quote.trim(),
      ImgUrl: data.ImgUrl?.trim() || "",
      linkedInUrl: data.linkedInUrl?.trim() || "",
      createdAt: nowIso,
      status: "approved",
    };

    // 1. Write to Firestore document if configured
    let firestoreSaved = false;
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, newId);
        await setDoc(docRef, newTestimonial);
        firestoreSaved = true;
        console.log("Successfully wrote new testimonial directly to Firestore:", newId);
      } catch (err: any) {
        console.warn("Could not write testimonial directly to Firestore (permissions or network):", err);
        // If it's a permission error, we still persist to local store and trigger state updates
        // so the user's testimonial submission is not lost.
        if (err?.code !== "permission-denied" && !err?.message?.includes("permission")) {
          // If unexpected connection failure, log warning
          console.error("Firestore submission issue:", err);
        }
      }
    }

    // 2. Update local state cache
    const existing = this.getTestimonials();
    const updated = this.sortTestimonials([newTestimonial, ...existing.filter((t) => t.id !== newId)]);
    dataStore.saveTestimonials(updated);

    // 3. Add notification for admin
    try {
      const savedNotifs = localStorage.getItem("portfolio_admin_notifications");
      let notifs: any[] = [];
      if (savedNotifs) {
        try { notifs = JSON.parse(savedNotifs); } catch {}
      }
      notifs.unshift({
        id: "notif_" + Date.now(),
        title: "New Testimonial Received",
        message: `${data.name.trim()} (${data.position.trim()}${data.company ? `, ${data.company.trim()}` : ""}) submitted a new testimonial!`,
        timestamp: "Just now",
        read: false,
        type: "success"
      });
      localStorage.setItem("portfolio_admin_notifications", JSON.stringify(notifs));
    } catch {}

    // Dispatch update event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("portfolio_data_update"));
    }

    return newTestimonial;
  },

  /**
   * Save or update a testimonial from Admin
   */
  async saveTestimonial(item: Testimonial): Promise<void> {
    const existing = this.getTestimonials();
    const index = existing.findIndex(t => t.id === item.id);
    let updated: Testimonial[];
    if (index > -1) {
      updated = [...existing];
      updated[index] = { ...item, createdAt: item.createdAt || existing[index].createdAt || new Date().toISOString() };
    } else {
      updated = [{ ...item, createdAt: item.createdAt || new Date().toISOString() }, ...existing];
    }
    const sorted = this.sortTestimonials(updated);
    dataStore.saveTestimonials(sorted);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, item.id);
        await setDoc(docRef, item, { merge: true });
      } catch (err) {
        console.warn("Could not save testimonial to Firestore:", err);
      }
    }
  },

  /**
   * Delete a testimonial from Admin and Firestore
   */
  async deleteTestimonial(id: string): Promise<void> {
    const existing = this.getTestimonials();
    const updated = existing.filter(t => t.id !== id);
    dataStore.saveTestimonials(updated);

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn("Could not delete testimonial from Firestore:", err);
      }
    }
  }
};
