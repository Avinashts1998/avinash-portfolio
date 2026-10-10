import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { uploadResumeToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";

export interface ResumeDocument {
  id: string;
  name: string;
  url: string;
  publicId?: string;
  size: number;
  uploadedAt: string;
  isPrimary: boolean;
  source: "cloudinary" | "local";
  cloudinaryFolder?: string;
}

export const DEFAULT_RESUME: ResumeDocument = {
  id: "resume_1789543891729",
  name: "Avinash_Shajan_UX_Designer_Resume.pdf",
  url: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789543892/resume/zxyn7nbrxkabayqoprak.pdf",
  publicId: "resume/zxyn7nbrxkabayqoprak",
  size: 1999467,
  uploadedAt: "2026-09-16T07:31:31.729Z",
  isPrimary: true,
  source: "cloudinary",
  cloudinaryFolder: "resume",
};

const RESUMES_STORAGE_KEY = "portfolio_uploaded_resumes";
const PRIMARY_RESUME_STORAGE_KEY = "portfolio_primary_resume";
const COLLECTION_NAME = "resumes";
const SETTINGS_COLLECTION = "resume_settings";
const SETTINGS_DOC_ID = "active_primary";

export const resumeService = {
  /**
   * Get currently stored resumes from localStorage
   */
  getResumes(): ResumeDocument[] {
    if (typeof window === "undefined") return [DEFAULT_RESUME];
    try {
      const stored = localStorage.getItem(RESUMES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse stored resumes:", e);
    }
    return [DEFAULT_RESUME];
  },

  /**
   * Get current primary resume
   */
  getPrimaryResume(): ResumeDocument {
    if (typeof window === "undefined") return DEFAULT_RESUME;
    try {
      const primaryStored = localStorage.getItem(PRIMARY_RESUME_STORAGE_KEY);
      if (primaryStored) {
        const parsed = JSON.parse(primaryStored);
        if (parsed && parsed.url) return parsed;
      }
      const list = this.getResumes();
      const primary = list.find((r) => r.isPrimary);
      if (primary) return primary;
      if (list.length > 0) return list[0];
    } catch (e) {
      console.warn("Failed to parse primary resume:", e);
    }
    return DEFAULT_RESUME;
  },

  /**
   * Initialize Firestore real-time listener for resume list & primary selection
   */
  initListener(callback?: (resumes: ResumeDocument[], primary: ResumeDocument) => void): () => void {
    if (typeof window === "undefined") return () => {};

    // Notify immediately with cached data
    const initialList = this.getResumes();
    const initialPrimary = this.getPrimaryResume();
    if (callback) callback(initialList, initialPrimary);

    if (!isFirebaseConfigured || !db) {
      return () => {};
    }

    try {
      const resumesColRef = collection(db, COLLECTION_NAME);
      const unsubscribe = onSnapshot(
        resumesColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ResumeDocument[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as any;
              // Skip corrupted records (such as accidentally uploaded small HTML files)
              if (data.size && data.size < 10000 && String(data.url).includes("raw/upload")) {
                return;
              }
              list.push({
                id: docSnap.id,
                name: data.name || "Avinash_Shajan_UX_Designer_Resume.pdf",
                url: data.url || "",
                publicId: data.publicId || "",
                size: data.size || 0,
                uploadedAt: data.uploadedAt || new Date().toISOString(),
                isPrimary: Boolean(data.isPrimary),
                source: data.source || "cloudinary",
                cloudinaryFolder: data.cloudinaryFolder || "resume",
              });
            });

            // Sort newest first
            list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

            // Ensure at least one primary
            let primary = list.find((r) => r.isPrimary);
            if (!primary && list.length > 0) {
              primary = list[0];
              primary.isPrimary = true;
            } else if (!primary) {
              primary = DEFAULT_RESUME;
            }

            localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(list));
            localStorage.setItem(PRIMARY_RESUME_STORAGE_KEY, JSON.stringify(primary));

            window.dispatchEvent(
              new CustomEvent("portfolio_resume_updated", {
                detail: { resumes: list, primary },
              })
            );

            if (callback) callback(list, primary);
          } else {
            // No docs in Firestore yet, maintain default
            const fallbackList = [DEFAULT_RESUME];
            localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(fallbackList));
            localStorage.setItem(PRIMARY_RESUME_STORAGE_KEY, JSON.stringify(DEFAULT_RESUME));
            if (callback) callback(fallbackList, DEFAULT_RESUME);
          }
        },
        (err) => {
          console.warn("Firestore resumes listener notice:", err);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Failed to initialize resume listener:", err);
      return () => {};
    }
  },

  /**
   * Helper to construct safe download URL that handles Cloudinary access rules and server fallback
   */
  getResumeDownloadUrl(resume: ResumeDocument, inline: boolean = false): string {
    const params = new URLSearchParams();
    if (resume.url) params.append("url", resume.url);
    if (resume.publicId) params.append("publicId", resume.publicId);
    if (resume.name) params.append("name", resume.name);
    if (resume.id) params.append("id", resume.id);
    if (inline) params.append("inline", "1");
    return `/api/resume/download?${params.toString()}`;
  },

  /**
   * Helper to construct safe inline preview URL that opens cleanly in browser tab
   */
  getResumePreviewUrl(resume: ResumeDocument): string {
    return this.getResumeDownloadUrl(resume, true);
  },

  /**
   * Helper to get visual thumbnail of page 1 directly from Cloudinary
   */
  getResumeThumbnailUrl(resume: ResumeDocument): string | null {
    if (resume.publicId) {
      const cloudName = "p66qxgqe";
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,q_auto/pg_1/${resume.publicId}.jpg`;
    }
    if (resume.url && resume.url.includes("cloudinary.com")) {
      const parts = resume.url.split("/upload/");
      if (parts.length === 2) {
        const afterUpload = parts[1].replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
        const cloudMatch = resume.url.match(/res\.cloudinary\.com\/([^/]+)/);
        const cloudName = cloudMatch ? cloudMatch[1] : "p66qxgqe";
        return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,q_auto/pg_1/${afterUpload}.jpg`;
      }
    }
    return null;
  },

  /**
   * Upload resume to Cloudinary collection 'resume' and store in Firestore/localStorage
   */
  async uploadResume(file: File, setAsPrimary: boolean = true): Promise<ResumeDocument> {
    // 1. Upload to Cloudinary collection 'resume'
    const uploadResult = await uploadResumeToCloudinary(file, "resume");

    const newDocId = `resume_${Date.now()}`;
    const newResume: ResumeDocument = {
      id: newDocId,
      name: file.name || "Avinash_Shajan_Product_Designer_Resume.pdf",
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      size: uploadResult.bytes || file.size,
      uploadedAt: new Date().toISOString(),
      isPrimary: setAsPrimary,
      source: "cloudinary",
      cloudinaryFolder: "resume",
    };

    // 2. Cache binary copy on server storage for instant, restriction-free downloads
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const fileBase64 = await base64Promise;

      await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newDocId,
          name: newResume.name,
          publicId: uploadResult.publicId,
          fileBase64,
        }),
      }).catch((e) => console.warn("[Resume Cache] Server backup warning:", e));
    } catch (cacheErr) {
      console.warn("[Resume Cache] Could not cache file on server:", cacheErr);
    }

    // 3. Update local state
    const currentList = this.getResumes().map((item) => {
      if (setAsPrimary) {
        return { ...item, isPrimary: false };
      }
      return item;
    });

    const updatedList = [newResume, ...currentList.filter((r) => r.id !== newDocId)];
    const primary = setAsPrimary ? newResume : this.getPrimaryResume();

    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(PRIMARY_RESUME_STORAGE_KEY, JSON.stringify(primary));

    window.dispatchEvent(
      new CustomEvent("portfolio_resume_updated", {
        detail: { resumes: updatedList, primary },
      })
    );

    // 4. Persist to Firestore
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        if (setAsPrimary) {
          // Unset any previous primary
          currentList.forEach((r) => {
            if (r.id !== "default-local-resume") {
              const docRef = doc(db, COLLECTION_NAME, r.id);
              batch.set(docRef, { ...r, isPrimary: false }, { merge: true });
            }
          });
        }

        const newDocRef = doc(db, COLLECTION_NAME, newDocId);
        batch.set(newDocRef, newResume);

        // Update settings doc
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        batch.set(
          settingsRef,
          {
            activeResumeId: primary.id,
            activeResumeUrl: primary.url,
            activeResumeName: primary.name,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        await batch.commit();
      } catch (err) {
        console.warn("Could not sync uploaded resume to Firestore:", err);
      }
    }

    return newResume;
  },

  /**
   * Set a specific resume as the active primary resume
   */
  async setPrimaryResume(id: string): Promise<ResumeDocument | null> {
    const list = this.getResumes();
    let targetResume: ResumeDocument | null = null;

    const updatedList = list.map((item) => {
      if (item.id === id) {
        targetResume = { ...item, isPrimary: true };
        return targetResume;
      }
      return { ...item, isPrimary: false };
    });

    if (!targetResume) return null;

    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(PRIMARY_RESUME_STORAGE_KEY, JSON.stringify(targetResume));

    window.dispatchEvent(
      new CustomEvent("portfolio_resume_updated", {
        detail: { resumes: updatedList, primary: targetResume },
      })
    );

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        updatedList.forEach((r) => {
          if (r.id !== "default-local-resume") {
            const docRef = doc(db, COLLECTION_NAME, r.id);
            batch.set(docRef, { isPrimary: r.id === id }, { merge: true });
          }
        });

        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        batch.set(
          settingsRef,
          {
            activeResumeId: targetResume.id,
            activeResumeUrl: targetResume.url,
            activeResumeName: targetResume.name,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        await batch.commit();
      } catch (err) {
        console.warn("Could not sync primary resume to Firestore:", err);
      }
    }

    return targetResume;
  },

  /**
   * Delete a resume from Cloudinary and Firestore
   */
  async deleteResume(id: string): Promise<void> {
    const list = this.getResumes();
    const itemToDelete = list.find((r) => r.id === id);
    if (!itemToDelete) return;

    // Cannot delete the fallback default
    if (itemToDelete.id === "default-local-resume") {
      throw new Error("Default system resume cannot be removed.");
    }

    // 1. Delete from Cloudinary if stored there
    if (itemToDelete.publicId || (itemToDelete.url && itemToDelete.url.includes("cloudinary.com"))) {
      try {
        await deleteImageFromCloudinary(itemToDelete.publicId || itemToDelete.url);
      } catch (err) {
        console.warn("Failed to delete resume asset from Cloudinary:", err);
      }
    }

    // 2. Remove from local state
    const filteredList = list.filter((r) => r.id !== id);
    let newPrimary = this.getPrimaryResume();
    if (itemToDelete.isPrimary) {
      newPrimary = filteredList.length > 0 ? { ...filteredList[0], isPrimary: true } : DEFAULT_RESUME;
      if (filteredList.length > 0) {
        filteredList[0].isPrimary = true;
      } else {
        filteredList.push(DEFAULT_RESUME);
      }
    }

    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(filteredList));
    localStorage.setItem(PRIMARY_RESUME_STORAGE_KEY, JSON.stringify(newPrimary));

    window.dispatchEvent(
      new CustomEvent("portfolio_resume_updated", {
        detail: { resumes: filteredList, primary: newPrimary },
      })
    );

    // 3. Delete from Firestore
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);

        if (itemToDelete.isPrimary) {
          const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
          await setDoc(
            settingsRef,
            {
              activeResumeId: newPrimary.id,
              activeResumeUrl: newPrimary.url,
              activeResumeName: newPrimary.name,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn("Could not delete resume from Firestore:", err);
      }
    }
  },

  /**
   * Helper to download any resume file as a clean attachment with all records intact
   */
  async downloadResumeFile(resume: ResumeDocument): Promise<void> {
    const filename = (resume.name || "Avinash_Shajan_UX_Designer_Resume.pdf").endsWith(".pdf")
      ? resume.name || "Avinash_Shajan_UX_Designer_Resume.pdf"
      : `${resume.name || "Avinash_Shajan_UX_Designer_Resume"}.pdf`;
    const downloadEndpoint = this.getResumeDownloadUrl(resume, false);

    try {
      const res = await fetch(downloadEndpoint);
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size < 50000) throw new Error("Downloaded file is smaller than expected full resume");

      // Verify that the blob actually starts with %PDF-
      const sliceText = await blob.slice(0, 5).text();
      if (!sliceText.startsWith("%PDF-")) {
        throw new Error("Downloaded data is not a valid PDF document");
      }

      const objectUrl = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up after browser completes saving to disk
      setTimeout(() => {
        try {
          if (a.parentNode) document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
        } catch {}
      }, 60000);
    } catch (err) {
      console.warn("Direct blob download notice, executing native download fallback:", err);
      // Trigger native browser download directly via endpoint
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadEndpoint;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          if (a.parentNode) document.body.removeChild(a);
        } catch {}
      }, 5000);
    }
  },
};
