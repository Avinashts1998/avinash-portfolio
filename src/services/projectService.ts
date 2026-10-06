import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";
import { dataStore, Project } from "../utils/dataStore";
import { cloudinaryConfig } from "../../config/config-cloud";
import { deleteImageFromCloudinary } from "../utils/cloudinary";
import { deleteProjectDesigningFolder } from "./projectDesigningService";

const COLLECTION_NAME = "projects";

/**
 * Pure function to convert title to slug.
 * Used for Firestore doc ID and Cloudinary folder name.
 */
export function slugify(title: string): string {
  if (!title || typeof title !== "string") return "";
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-")  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, "");   // Collapse leading/trailing hyphens
}

/**
 * Uploads a single image file to Cloudinary.
 */
export async function uploadImageToCloudinary(file: File, folder: string, publicId?: string): Promise<string> {
  const cloudName = cloudinaryConfig.cloudName;
  const uploadPreset = cloudinaryConfig.presetName;

  console.log("[uploadImageToCloudinary] Resolved Cloud Name:", cloudName, "| Preset:", uploadPreset);

  if (!cloudName || !uploadPreset) {
    throw new Error(`Cloudinary configuration missing (cloudName: "${cloudName}", presetName: "${uploadPreset}").`);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`;
  
  // Helper to execute upload request
  const doUpload = async (includeExtraMeta: boolean = true) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset.trim());

    if (includeExtraMeta) {
      if (folder) formData.append("folder", folder);
      if (publicId) formData.append("public_id", publicId);
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const rawMsg = data?.error?.message || `HTTP status ${response.status}`;
      throw new Error(rawMsg);
    }
    return data;
  };

  try {
    console.log(`[Cloudinary Upload] Target URL: ${uploadUrl}, Preset: ${uploadPreset.trim()}`);
    let data;
    try {
      // First attempt: with folder & publicId metadata
      data = await doUpload(true);
    } catch (firstErr: any) {
      console.warn(`[Cloudinary Upload] First attempt failed (${firstErr.message}). Retrying with base parameters...`);
      // Fallback attempt: plain file + upload_preset (works with all unsigned presets)
      data = await doUpload(false);
    }

    const rawUrl = data.secure_url || data.url;

    if (!rawUrl) {
      throw new Error("Cloudinary response did not return a valid image URL.");
    }

    // Append explicit transformation params to avoid scroll jank
    let transformedUrl = rawUrl;
    if (transformedUrl.includes("/upload/")) {
      transformedUrl = transformedUrl.replace("/upload/", "/upload/f_auto,q_auto,c_limit,w_1600/");
    }

    return transformedUrl;
  } catch (err: any) {
    throw new Error(`Cloudinary API Error: ${err?.message || err} [Cloud Name: "${cloudName}", Preset: "${uploadPreset}"].`);
  }
}

/**
 * Uploads thumbnail and gallery images in parallel.
 */
export async function uploadProjectImages(
  slug: string, 
  { thumbnailFile, galleryFiles = [] }: { thumbnailFile: File; galleryFiles?: File[] }
): Promise<{ thumbnail: string; galleryImages: string[] }> {
  const folder = `projects/${slug}`;
  const uploadTasks: Promise<any>[] = [];

  if (thumbnailFile) {
    uploadTasks.push(
      uploadImageToCloudinary(thumbnailFile, folder, "thumbnail")
        .then((url) => ({ type: "thumbnail", index: 0, url }))
        .catch((err) => ({ type: "thumbnail", index: 0, error: err }))
    );
  }

  if (Array.isArray(galleryFiles)) {
    galleryFiles.forEach((file, index) => {
      if (file) {
        const publicId = `gallery-${index + 1}`;
        uploadTasks.push(
          uploadImageToCloudinary(file, folder, publicId)
            .then((url) => ({ type: "gallery", index, url }))
            .catch((err) => ({ type: "gallery", index, error: err }))
        );
      }
    });
  }

  const results = await Promise.all(uploadTasks);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => {
        const fieldName = e.type === "thumbnail" ? "Thumbnail" : `Gallery image #${e.index + 1}`;
        const msg = e.error?.message || String(e.error);
        return `${fieldName}: ${msg}`;
      })
      .join("; ");
    throw new Error(`Failed uploading project images to Cloudinary (${errorMessages})`);
  }

  let thumbnailUrl = "";
  const galleryUrls: string[] = [];

  results.forEach((r) => {
    if (r.type === "thumbnail") {
      thumbnailUrl = r.url;
    } else if (r.type === "gallery") {
      galleryUrls[r.index] = r.url;
    }
  });

  return {
    thumbnail: thumbnailUrl,
    galleryImages: galleryUrls.filter(Boolean),
  };
}

export interface CreateProjectParams {
  title: string;
  productType?: string;
  isFeaturedOnHome?: boolean;
  category?: string;
  description?: string;
  keyContributions?: string[];
  ctaLabel?: "View Case Study" | "View Project" | "View UI Design";
  isNew?: boolean;
  isLive?: boolean;
  showInHomeGrid?: boolean;
  thumbnailFile: File;
  galleryFiles?: File[];
}

export async function uploadProjectImage(file: File, folder: string = "projects"): Promise<string> {
  return uploadImageToCloudinary(file, folder);
}

/**
 * Creates a new project document in Firestore and uploads images to Cloudinary.
 */
export async function createProject(params: CreateProjectParams | Project): Promise<Project> {
  const nowIso = new Date().toISOString();

  // If a direct Project object is passed (e.g. from legacy inline editor)
  if (!("thumbnailFile" in params)) {
    const rawProject = params as Project;
    const slug = rawProject.id || slugify(rawProject.title) || `proj_${Date.now()}`;
    const isShowOnHome = rawProject.homeItem !== undefined
      ? Boolean(rawProject.homeItem)
      : (rawProject.showInHomeGrid !== undefined ? Boolean(rawProject.showInHomeGrid) : true);

    const projectDocData: Project = { 
      ...rawProject, 
      id: slug,
      homeItem: isShowOnHome,
      showInHomeGrid: isShowOnHome,
      isFeaturedOnHome: rawProject.isFeaturedOnHome !== undefined ? Boolean(rawProject.isFeaturedOnHome) : isShowOnHome,
      createdAt: (rawProject as any).createdAt || nowIso,
      updatedAt: nowIso,
    };

    const existingProjects = dataStore.getProjects();
    dataStore.saveProjects(sortProjectsByLatest([projectDocData, ...existingProjects.filter(p => p.id !== slug)]));

    if (isFirebaseConfigured && db) {
      try {
        const projectDocRef = doc(db, COLLECTION_NAME, slug);
        await setDoc(projectDocRef, {
          ...projectDocData,
          createdAt: (rawProject as any).createdAt || nowIso,
          updatedAt: nowIso,
        });
      } catch (err) {
        console.error("Firestore createProject error:", err);
      }
    }
    return projectDocData;
  }

  const {
    title,
    productType = "",
    isFeaturedOnHome = true,
    category = "",
    description = "",
    keyContributions = [],
    ctaLabel = "View Project",
    isNew = false,
    isLive = false,
    showInHomeGrid = true,
    thumbnailFile,
    galleryFiles = [],
  } = params || {};

  // a. Validate required fields
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new Error("Validation Error: Project title is required.");
  }

  if (!thumbnailFile || !(thumbnailFile instanceof File)) {
    throw new Error("Validation Error: Thumbnail image file is required.");
  }

  if (typeof description === "string" && description.length > 250) {
    throw new Error(`Validation Error: Description exceeds 250 characters limit (currently ${description.length} characters).`);
  }

  // b. Generate slug
  const slug = slugify(title);
  if (!slug) {
    throw new Error("Validation Error: Unable to generate a valid slug from the provided project title.");
  }

  // c. Check if doc already exists in local cache or Firestore
  const localConflict = dataStore.getProjects().some((p) => (p.slug || p.id) === slug);
  if (localConflict) {
    throw new Error(`Conflict Error: A project with slug "${slug}" already exists.`);
  }

  if (isFirebaseConfigured && db) {
    try {
      const projectDocRef = doc(db, COLLECTION_NAME, slug);
      const existingDoc = await getDoc(projectDocRef);

      if (existingDoc && existingDoc.exists()) {
        throw new Error(`Conflict Error: A project with slug "${slug}" already exists in Firestore.`);
      }
    } catch (checkErr: any) {
      if (checkErr?.message?.includes("Conflict Error")) {
        throw checkErr;
      }
      // If Firestore is offline, connecting, or unreachable, log warning and proceed
      console.warn("[createProject] Firestore existence check bypassed due to offline/network status:", checkErr?.message || checkErr);
    }
  }

  // d. Upload images in parallel
  let imageUrls;
  try {
    imageUrls = await uploadProjectImages(slug, {
      thumbnailFile,
      galleryFiles,
    });
  } catch (uploadError: any) {
    throw new Error(`Image Upload Failed: ${uploadError.message || uploadError}`);
  }

  const isShowOnHome = params.showInHomeGrid !== undefined
    ? Boolean(params.showInHomeGrid)
    : (params.isFeaturedOnHome !== undefined ? Boolean(params.isFeaturedOnHome) : true);

  // e. Format project object
  const projectDocData: Project = {
    id: slug,
    slug,
    title: title.trim(),
    product: (productType || category || "Project").toLowerCase().replace(/\s+/g, "_"),
    productType,
    isFeaturedOnHome: isShowOnHome,
    heroSection: isShowOnHome,
    category,
    shortDetails: category,
    description: description.trim(),
    details: description.trim(),
    keyContributions: Array.isArray(keyContributions) ? keyContributions : [],
    ctaLabel,
    buttonText: ctaLabel,
    isNew: Boolean(isNew),
    isLive: Boolean(isLive),
    showInHomeGrid: isShowOnHome,
    homeItem: isShowOnHome,
    thumbnail: [imageUrls.thumbnail],
    heroSectionImg: [imageUrls.thumbnail],
    images: imageUrls.galleryImages,
    projectImages: [imageUrls.thumbnail, ...imageUrls.galleryImages].filter(Boolean),
    createdAt: nowIso,
    updatedAt: nowIso,
    month: "July",
    year: "2026",
  };

  // Save to local cache first (sorted so latest project is at index 0)
  const existingProjects = dataStore.getProjects();
  dataStore.saveProjects(sortProjectsByLatest([projectDocData, ...existingProjects.filter(p => p.id !== slug)]));

  // Write to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const projectDocRef = doc(db, COLLECTION_NAME, slug);
      await setDoc(projectDocRef, {
        ...projectDocData,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    } catch (firestoreError: any) {
      console.warn("[createProject] Firestore write warning:", firestoreError);
      if (firestoreError?.code === "permission-denied") {
        throw new Error("Permission Denied: You do not have permission to write to Firestore.");
      }
      // If offline or network glitch, the project has already been saved to local cache (dataStore)
    }
  }

  return projectDocData;
}

// Helper to ensure latest project comes first
export function sortProjectsByLatest(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const getTime = (p: any): number => {
      if (p.createdAt?.toDate && typeof p.createdAt.toDate === "function") {
        return p.createdAt.toDate().getTime();
      }
      if (typeof p.createdAt?.seconds === "number") {
        return p.createdAt.seconds * 1000;
      }
      if (typeof p.createdAt === "number") return p.createdAt;
      if (typeof p.createdAt === "string" && p.createdAt.trim()) {
        const t = new Date(p.createdAt).getTime();
        if (!isNaN(t)) return t;
      }

      if (p.updatedAt?.toDate && typeof p.updatedAt.toDate === "function") {
        return p.updatedAt.toDate().getTime();
      }
      if (typeof p.updatedAt?.seconds === "number") {
        return p.updatedAt.seconds * 1000;
      }
      if (typeof p.updatedAt === "number") return p.updatedAt;
      if (typeof p.updatedAt === "string" && p.updatedAt.trim()) {
        const t = new Date(p.updatedAt).getTime();
        if (!isNaN(t)) return t;
      }

      if (p.id) {
        const match = String(p.id).match(/(\d{10,13})/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > 1000000000) {
            return num < 10000000000 ? num * 1000 : num;
          }
        }
      }

      // Default fallback for user-created items
      return new Date("2025-01-01T00:00:00.000Z").getTime();
    };

    const timeA = getTime(a);
    const timeB = getTime(b);
    if (timeA !== timeB) {
      return timeB - timeA; // Descending: latest first
    }
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

// Helper to retrieve projects arranged for homepage (respects admin custom order for featured projects)
export function getHomeFeaturedProjects(projects: Project[], customOrderIds?: string[]): Project[] {
  const homeEligible = projects.filter((p) => p.homeItem !== false);
  const orderIds = customOrderIds && customOrderIds.length > 0
    ? customOrderIds
    : dataStore.getFeaturedProjectsOrder();

  if (!orderIds || orderIds.length === 0) {
    return sortProjectsByLatest(homeEligible);
  }

  const orderedList: Project[] = [];
  const remaining = [...homeEligible];

  for (const id of orderIds) {
    const idx = remaining.findIndex((p) => p.id === id || p.slug === id);
    if (idx !== -1) {
      orderedList.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
  }

  return [...orderedList, ...sortProjectsByLatest(remaining)];
}

// READ & CRUD HELPER FUNCTIONS
export function getProjectsSync(): Project[] {
  return sortProjectsByLatest(dataStore.getProjects());
}

export async function getAllProjects(): Promise<Project[]> {
  if (isFirebaseConfigured && db) {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      if (!querySnapshot.empty) {
        const projects: Project[] = [];
        querySnapshot.forEach((docSnap) => {
          projects.push({ id: docSnap.id, ...docSnap.data() } as Project);
        });
        const sorted = sortProjectsByLatest(projects);
        dataStore.saveProjects(sorted);
        return sorted;
      }
    } catch (error) {
      console.warn("Firestore getAllProjects error, returning local cache:", error);
    }
  }
  return sortProjectsByLatest(dataStore.getProjects());
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
      }
    } catch (error) {
      console.warn(`Firestore getProjectById error for ID ${id}:`, error);
    }
  }
  const all = dataStore.getProjects();
  return all.find((p) => p.id === id);
}

export async function updateProject(id: string, updatedFields: Partial<Project>): Promise<Project | undefined> {
  const existing = dataStore.getProjects();
  const index = existing.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const nowIso = new Date().toISOString();
  const updatedProject = { 
    ...existing[index], 
    ...updatedFields, 
    id,
    updatedAt: nowIso,
  };
  if (!updatedProject.createdAt) {
    updatedProject.createdAt = nowIso;
  }
  existing[index] = updatedProject;

  dataStore.saveProjects(sortProjectsByLatest(existing));

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, updatedProject, { merge: true });
    } catch (error) {
      console.error("Firestore updateProject error:", error);
    }
  }

  return updatedProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  const existing = dataStore.getProjects();
  const targetProject = existing.find((p) => p.id === id || p.slug === id);
  const filtered = existing.filter((p) => p.id !== id && p.slug !== id);

  dataStore.saveProjects(filtered);

  // Clean up associated Cloudinary images and designing folders
  if (targetProject) {
    try {
      await deleteProjectDesigningFolder(id);
      if (targetProject.slug && targetProject.slug !== id) {
        await deleteProjectDesigningFolder(targetProject.slug);
      }
    } catch (e) {
      console.warn("Could not delete project designing folder:", e);
    }

    const imageUrlsToClean: string[] = [];
    
    if (Array.isArray(targetProject.thumbnail)) {
      imageUrlsToClean.push(...targetProject.thumbnail);
    } else if (typeof targetProject.thumbnail === "string") {
      imageUrlsToClean.push(targetProject.thumbnail);
    }

    if (Array.isArray(targetProject.heroSectionImg)) {
      imageUrlsToClean.push(...targetProject.heroSectionImg);
    } else if (typeof targetProject.heroSectionImg === "string") {
      imageUrlsToClean.push(targetProject.heroSectionImg);
    }

    if (Array.isArray(targetProject.images)) {
      imageUrlsToClean.push(...targetProject.images);
    }

    if (Array.isArray(targetProject.projectImages)) {
      imageUrlsToClean.push(...targetProject.projectImages);
    }

    const slug = targetProject.slug || targetProject.id || slugify(targetProject.title);
    if (slug) {
      const folder = `projects/${slug}`;
      const predictedPublicIds = [
        `${folder}/thumbnail`,
        `${folder}/gallery-1`,
        `${folder}/gallery-2`,
        `${folder}/gallery-3`,
        `${folder}/gallery-4`,
        `${folder}/gallery-5`,
        `portfolio-projects/${slug}/thumbnail`,
      ];
      for (const pId of predictedPublicIds) {
        deleteImageFromCloudinary(pId).catch(() => {});
      }
    }

    for (const imgUrl of imageUrlsToClean) {
      if (imgUrl) {
        deleteImageFromCloudinary(imgUrl).catch(() => {});
      }
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      if (targetProject?.slug && targetProject.slug !== id) {
        await deleteDoc(doc(db, COLLECTION_NAME, targetProject.slug));
      }
    } catch (error) {
      console.error("Firestore deleteProject error:", error);
    }
  }

  return true;
}

export async function seedDefaultProjects(): Promise<void> {
  const defaultProjects = dataStore.getProjects();
  dataStore.saveProjects(defaultProjects);
  if (isFirebaseConfigured && db) {
    try {
      const batch = writeBatch(db);
      for (const proj of defaultProjects) {
        const docRef = doc(db, COLLECTION_NAME, proj.id);
        batch.set(docRef, proj);
      }
      await batch.commit();
    } catch (error) {
      console.error("Error seeding default projects to Firebase:", error);
    }
  }
}

export function subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const collRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const projects: Project[] = [];
          snapshot.forEach((docSnap) => {
            projects.push({ id: docSnap.id, ...docSnap.data() } as Project);
          });
          callback(sortProjectsByLatest(projects));
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn("Firestore project subscription error:", error);
      }
    );
    return unsubscribe;
  }

  const handleUpdate = () => {
    callback(sortProjectsByLatest(dataStore.getProjects()));
  };
  window.addEventListener("portfolio_data_update", handleUpdate);
  return () => window.removeEventListener("portfolio_data_update", handleUpdate);
}

export const projectService = {
  slugify,
  uploadImageToCloudinary,
  uploadProjectImage,
  uploadProjectImages,
  deleteImageFromCloudinary,
  createProject,
  getProjectsSync,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  seedDefaultProjects,
  subscribeToProjects,
};

export default projectService;
