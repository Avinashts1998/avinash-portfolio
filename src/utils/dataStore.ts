import { defaultProjectDesigningFolders } from "../services/projectDesigningService";
import { isFirebaseConfigured, db } from "./firebase";
import { collection, onSnapshot, doc, getDocs, writeBatch, setDoc, deleteDoc } from "firebase/firestore";

export const STORAGE_KEYS = {
  PROJECTS: "portfolio_admin_projects",
  BLOGS: "portfolio_admin_blogs",
  TESTIMONIALS: "portfolio_admin_testimonials",
  OUTSIDE_WORK: "portfolio_admin_outside_work",
  FEATURED_PROJECTS_ORDER: "portfolio_featured_projects_order",
  RAW_PROJECTS: "portfolio_raw_projects",
  RAW_BLOGS: "portfolio_raw_blogs",
  RAW_TESTIMONIALS: "portfolio_raw_testimonials",
};

const defaultProjects: Project[] = [
  {
    id: "fvdfv",
    slug: "fvdfv",
    title: "fvdfv",
    product: "mobile_app",
    productType: "Mobile App",
    homeItem: true,
    showInHomeGrid: true,
    isFeaturedOnHome: true,
    heroSection: true,
    category: "E-commerce",
    shortDetails: "E-commerce",
    details: "fvdfvdfv",
    description: "fvdfvdfv",
    keyContributions: ["dfvdfv", "dfvdfvd", "dvdv"],
    ctaLabel: "View Project",
    buttonText: "View Project",
    isNew: false,
    isLive: false,
    thumbnail: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789629243/projects/fvdfv/thumbnail.png"
    ],
    heroSectionImg: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789629243/projects/fvdfv/thumbnail.png"
    ],
    images: [],
    projectImages: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789629243/projects/fvdfv/thumbnail.png"
    ],
    month: "July",
    year: "2026",
    createdAt: "2026-09-17T07:14:00.741Z",
    updatedAt: "2026-09-17T07:14:00.741Z"
  },
  {
    id: "test-new",
    slug: "test-new",
    title: "test new",
    product: "website",
    productType: "Website",
    homeItem: true,
    showInHomeGrid: true,
    isFeaturedOnHome: true,
    heroSection: true,
    category: "",
    shortDetails: "",
    details: "Lead Product Designer, Adobe Connect. 6+ years of shipping complex systems, AI-powered collaboration tools, and 0-1 products with impactful experiences globally.",
    description: "Lead Product Designer, Adobe Connect. 6+ years of shipping complex systems, AI-powered collaboration tools, and 0-1 products with impactful experiences globally.",
    keyContributions: [],
    ctaLabel: "View UI Design",
    buttonText: "View UI Design",
    isNew: true,
    isLive: true,
    thumbnail: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789552206/projects/test-new/thumbnail.png"
    ],
    heroSectionImg: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789552206/projects/test-new/thumbnail.png"
    ],
    images: [],
    projectImages: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789552206/projects/test-new/thumbnail.png"
    ],
    month: "July",
    year: "2026",
    createdAt: "2026-09-16T09:50:01.334Z",
    updatedAt: "2026-09-16T09:50:01.334Z"
  },
  {
    id: "test",
    slug: "test",
    title: "test",
    product: "design_system",
    productType: "Design System",
    homeItem: true,
    showInHomeGrid: true,
    isFeaturedOnHome: true,
    heroSection: true,
    category: "E-commerce",
    shortDetails: "E-commerce",
    details: "Lead Product Designer, Adobe Connect. 6+ years of shipping complex systems, AI-powered collaboration tools, and 0-1 products with impactful experiences globally.",
    description: "Lead Product Designer, Adobe Connect. 6+ years of shipping complex systems, AI-powered collaboration tools, and 0-1 products with impactful experiences globally.",
    keyContributions: ["new", "test", "care", "beauty"],
    ctaLabel: "View UI Design",
    buttonText: "View UI Design",
    isNew: true,
    isLive: false,
    thumbnail: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789550775/projects/test/thumbnail.jpg"
    ],
    heroSectionImg: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789550775/projects/test/thumbnail.jpg"
    ],
    images: [],
    projectImages: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789550775/projects/test/thumbnail.jpg"
    ],
    month: "July",
    year: "2026",
    createdAt: "2026-09-16T09:26:10.960Z",
    updatedAt: "2026-09-16T09:26:10.960Z"
  },
  {
    id: "mnbmhj",
    slug: "mnbmhj",
    title: "mnbmhj",
    product: "web_application",
    productType: "Web Application",
    homeItem: true,
    showInHomeGrid: true,
    isFeaturedOnHome: true,
    heroSection: true,
    category: "FinTech",
    shortDetails: "FinTech",
    details: "",
    description: "",
    keyContributions: [],
    ctaLabel: "View Project",
    buttonText: "View Project",
    isNew: true,
    isLive: true,
    thumbnail: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789477043/projects/mnbmhj/thumbnail.jpg"
    ],
    heroSectionImg: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789477043/projects/mnbmhj/thumbnail.jpg"
    ],
    images: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789477042/projects/mnbmhj/gallery-1.webp"
    ],
    projectImages: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789477043/projects/mnbmhj/thumbnail.jpg",
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789477042/projects/mnbmhj/gallery-1.webp"
    ],
    month: "July",
    year: "2026",
    createdAt: "2026-09-15T12:57:17.193Z",
    updatedAt: "2026-09-15T12:57:17.193Z"
  },
  {
    id: "new-project",
    slug: "new-project",
    title: "New Project",
    product: "website",
    productType: "Website",
    homeItem: true,
    showInHomeGrid: true,
    isFeaturedOnHome: true,
    heroSection: true,
    category: "E-commerce",
    shortDetails: "E-commerce",
    details: "Weekends are reserved for side projects, small builds, experiments, and ideas that start with curiosity and no pressure. It is where I explore freely, break things, and sometimes discover directions that influence my core work.",
    description: "Weekends are reserved for side projects, small builds, experiments, and ideas that start with curiosity and no pressure. It is where I explore freely, break things, and sometimes discover directions that influence my core work.",
    keyContributions: ["new poject"],
    ctaLabel: "View Project",
    buttonText: "View Project",
    isNew: true,
    isLive: true,
    thumbnail: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474213/projects/new-project/thumbnail.jpg"
    ],
    heroSectionImg: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474213/projects/new-project/thumbnail.jpg"
    ],
    images: [],
    projectImages: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474213/projects/new-project/thumbnail.jpg"
    ],
    month: "July",
    year: "2026",
    createdAt: "2026-09-15T12:10:10.807Z",
    updatedAt: "2026-09-15T12:15:40.042Z"
  },
  {
    id: "alter-ego-project",
    slug: "alter-ego-project",
    title: "Alter Ego Project",
    product: "web_application",
    productType: "Web Application",
    homeItem: true,
    showInHomeGrid: true,
    isFeaturedOnHome: true,
    heroSection: true,
    category: "FinTech",
    shortDetails: "FinTech",
    details: "Weekends are reserved for side projects, small builds, experiments, and ideas that start with curiosity and no pressure. It is where I explore freely, break things, and sometimes discover directions that influence my core work.Weekends are reserved.",
    description: "Weekends are reserved for side projects, small builds, experiments, and ideas that start with curiosity and no pressure. It is where I explore freely, break things, and sometimes discover directions that influence my core work.Weekends are reserved.",
    ctaLabel: "View Case Study",
    buttonText: "View Case Study",
    isNew: true,
    isLive: true,
    thumbnail: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/thumbnail.webp"
    ],
    heroSectionImg: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/thumbnail.webp"
    ],
    images: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/gallery-1.webp",
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/gallery-2.webp",
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/gallery-3.webp"
    ],
    projectImages: [
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/thumbnail.webp",
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/gallery-1.webp",
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/gallery-2.webp",
      "https://res.cloudinary.com/p66qxgqe/image/upload/f_auto,q_auto,c_limit,w_1600/v1789474063/projects/alter-ego-project/gallery-3.webp"
    ],
    keyContributions: ["0-1 Product", "Design Systems"],
    month: "July",
    year: "2026",
    createdAt: "2026-09-15T12:07:39.924Z",
    updatedAt: "2026-09-15T12:07:39.924Z"
  }
];

const defaultBlogs: BlogItem[] = [];

const PLACEHOLDER_BLOG_IDS = new Set([
  "1",
  "blog-1",
  "blog-2",
  "blog-3",
  "blog-4",
  "blog-5",
  "blog-6",
  "blog-7",
  "blog-8",
  "blog-9",
]);

const PLACEHOLDER_BLOG_TITLES = new Set([
  "the ux of autonomy: applying classic nielsen heuristics to agentic ai",
  "designing for scale: building resilient multi-platform design systems",
  "designing for scale: building enterprise design systems",
  "0-to-1 product architecture: scaling real-time canvas for 10m users",
  "cognitive load & calm computing: designing stress-free fintech interfaces",
  "micro-interactions that matter: crafting spatial feedback with motion and sound",
  "i tested the 5 best ai tools for ui design with the same prompt",
  "the architecture of modern smooth scroll containers in react",
  "ux research methods that thrive in the automation era",
  "reimagining checkout conversion: an e-commerce case study",
]);

export function isPlaceholderBlog(item: any): boolean {
  if (!item) return false;
  if (item.id && PLACEHOLDER_BLOG_IDS.has(item.id)) return true;
  if (typeof item.id === "string" && item.id.startsWith("blog-")) return true;
  if (item.Title && PLACEHOLDER_BLOG_TITLES.has(item.Title.trim().toLowerCase())) return true;
  if (item.title && PLACEHOLDER_BLOG_TITLES.has(item.title.trim().toLowerCase())) return true;
  return false;
}

export function purgePlaceholderBlogs() {
  try {
    [STORAGE_KEYS.BLOGS, STORAGE_KEYS.RAW_BLOGS, "portfolio_blogs"].forEach((k) => {
      const stored = localStorage.getItem(k);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((b) => !isPlaceholderBlog(b));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(k, JSON.stringify(cleaned));
          }
        }
      }
    });
  } catch (e) {
    console.error("Error purging placeholder blogs", e);
  }
}

// Run cleanup immediately on module load
purgePlaceholderBlogs();

const defaultTestimonials: Testimonial[] = [
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

export interface Project {
  id: string;
  slug?: string;
  title: string;
  product: string;
  productType?: string;
  homeItem: boolean;
  showInHomeGrid?: boolean;
  category: string;
  description: string;
  shortDetails?: string;
  details?: string;
  button?: string;
  ctaLabel?: string;
  buttonText?: string;
  isNew: boolean;
  isLive: boolean;
  heroSection: boolean;
  isFeaturedOnHome?: boolean;
  heroSectionImg: string[];
  thumbnail: string[];
  images: string[];
  projectImages?: string[];
  keyContributions?: string[];
  tags?: string[];
  link?: string;
  createdAt?: any;
  updatedAt?: any;
  month?: string;
  year?: string;
}

export interface BlogItem {
  id: string;
  Title: string;
  description?: string;
  date: string;
  badge: string[];
  cover_photo: string;
  readTime?: string;
  category?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  position: string;
  company?: string;
  quote?: string;
  ImgUrl: string;
  linkedInUrl: string;
  createdAt?: string;
  status?: "approved" | "pending";
}

export interface OutsideWorkSettings {
  MyImage01: string;
  MyImage02: string;
  MyImage03: string;
  additionalPhotos?: string[];
}

const defaultOutsideWork: OutsideWorkSettings = {
  MyImage01: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786949390/profile_images/outside_work_myimage01_1786949390459.jpg",
  MyImage02: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786949399/profile_images/outside_work_myimage02_1786949399979.jpg",
  MyImage03: "https://res.cloudinary.com/p66qxgqe/image/upload/v1786949409/profile_images/outside_work_myimage03_1786949409083.jpg",
  additionalPhotos: []
};

// Helper to save documents to Firebase (used during seeding)
async function saveToFirebase(collectionName: string, items: any[]) {
  if (!isFirebaseConfigured || !db) return;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
    }
    await batch.commit();
    console.log(`Successfully seeded ${items.length} items to Firebase collection "${collectionName}"`);
  } catch (error) {
    console.error(`Error seeding to Firebase collection "${collectionName}":`, error);
  }
}

// Helper to deeply sanitize documents for Firestore (removes undefined values which cause WriteBatch to throw)
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter((v) => v !== undefined);
  }
  const clean: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

// Helper to fully sync local data state to Firebase (handles additions, updates, and deletions)
async function syncCollectionToFirebase(collectionName: string, items: any[]) {
  if (!isFirebaseConfigured || !db) return;
  try {
    const collRef = collection(db, collectionName);
    const snapshot = await getDocs(collRef);
    const existingIds = snapshot.docs.map(d => d.id);
    const newIds = new Set(items.map(item => item && item.id).filter(Boolean));

    const batch = writeBatch(db);

    // Delete elements that are no longer present
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        batch.delete(doc(db, collectionName, id));
      }
    }

    // Upsert existing and new elements safely with sanitization
    for (const item of items) {
      if (!item || !item.id) continue;
      const cleanItem = sanitizeForFirestore(item);
      batch.set(doc(db, collectionName, String(item.id)), cleanItem);
    }

    await batch.commit();
    console.log(`Successfully synced collection "${collectionName}" to Firebase.`);
  } catch (error) {
    console.error(`Error syncing collection "${collectionName}" to Firebase:`, error);
  }
}

// Function to delete all documents in a specified Firebase collection
export async function clearFirebaseCollection(collectionName: string) {
  if (!isFirebaseConfigured || !db) return;
  try {
    const collRef = collection(db, collectionName);
    const snapshot = await getDocs(collRef);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, collectionName, docSnap.id));
    });
    await batch.commit();
    console.log(`Successfully cleared all documents from Firebase collection "${collectionName}".`);
  } catch (error) {
    console.error(`Error clearing Firebase collection "${collectionName}":`, error);
  }
}

async function purgeLegacyFromFirebase() {
  // Retain all project records in Firebase
}

let firebaseListenersSetup = false;

function setupFirebaseListeners() {
  if (firebaseListenersSetup || !isFirebaseConfigured || !db) return;
  firebaseListenersSetup = true;

  purgeLegacyFromFirebase();

  const collectionsToSync = [
    { name: "projects", key: STORAGE_KEYS.PROJECTS },
    { name: "blogs", key: STORAGE_KEYS.BLOGS },
    { name: "testimonials", key: STORAGE_KEYS.TESTIMONIALS },
    { name: "project designing", key: "portfolio_project_designing" },
  ];

  collectionsToSync.forEach(({ name, key }) => {
    const collRef = collection(db, name);
    onSnapshot(
      collRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, do NOT wipe local data!
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const cleaned = name === "blogs" ? parsed.filter((b) => !isPlaceholderBlog(b)) : parsed;
                if (cleaned.length > 0) {
                  syncCollectionToFirebase(name, cleaned);
                  return;
                }
              }
            } catch {}
          }
          if (name === "projects" && defaultProjects.length > 0) {
            localStorage.setItem(key, JSON.stringify(defaultProjects));
            syncCollectionToFirebase("projects", defaultProjects);
            window.dispatchEvent(new Event("portfolio_data_update"));
            return;
          }
          localStorage.setItem(key, JSON.stringify([]));
          window.dispatchEvent(new Event("portfolio_data_update"));
          return;
        }

        const items: any[] = [];
        snapshot.forEach((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() };
          if (name === "blogs" && isPlaceholderBlog(item)) {
            // Delete placeholder document from Firebase
            deleteDoc(doc(db, "blogs", docSnap.id)).catch(() => {});
          } else {
            items.push(item);
          }
        });

        const filtered = name === "projects" ? items.filter((item) => item && item.id) : items;

        // Preserve any freshly created local items that haven't reached Firestore yet
        let finalItems = filtered;
        try {
          const storedLocal = localStorage.getItem(key);
          if (storedLocal) {
            const parsedLocal = JSON.parse(storedLocal);
            if (Array.isArray(parsedLocal)) {
              const remoteIds = new Set(filtered.map((it: any) => it && it.id));
              const pendingLocal = parsedLocal.filter((localIt: any) => 
                localIt && localIt.id && !remoteIds.has(localIt.id) && (name !== "blogs" || !isPlaceholderBlog(localIt))
              );
              if (pendingLocal.length > 0) {
                finalItems = [...filtered, ...pendingLocal];
                // Sync pending local items to Firebase
                syncCollectionToFirebase(name, finalItems);
              }
            }
          }
        } catch {}

        // Update LocalStorage caching state and trigger live app re-renders
        localStorage.setItem(key, JSON.stringify(finalItems));
        window.dispatchEvent(new Event("portfolio_data_update"));
      },
      (error) => {
        console.warn(`Firebase snapshot listener error for "${name}":`, error.message || error);
      }
    );
  });

  // Specifically listen to document `settings/outside_work`
  try {
    const outsideWorkDocRef = doc(db, "settings", "outside_work");
    onSnapshot(
      outsideWorkDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          const cleanData: OutsideWorkSettings = {
            MyImage01: data.MyImage01 || "",
            MyImage02: data.MyImage02 || "",
            MyImage03: data.MyImage03 || "",
            additionalPhotos: Array.isArray(data.additionalPhotos) ? data.additionalPhotos : [],
          };
          localStorage.setItem(STORAGE_KEYS.OUTSIDE_WORK, JSON.stringify(cleanData));
          window.dispatchEvent(new Event("portfolio_data_update"));
        }
      },
      (err) => {
        console.warn("Firestore settings/outside_work listener warning:", err);
      }
    );
  } catch (err) {
    console.warn("Could not attach listener for settings/outside_work:", err);
  }

  // Specifically listen to document `settings/featured_projects_order`
  try {
    const featuredOrderDocRef = doc(db, "settings", "featured_projects_order");
    onSnapshot(
      featuredOrderDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          if (Array.isArray(data.order)) {
            localStorage.setItem(STORAGE_KEYS.FEATURED_PROJECTS_ORDER, JSON.stringify(data.order));
            window.dispatchEvent(new Event("portfolio_data_update"));
          }
        }
      },
      (err) => {
        console.warn("Firestore settings/featured_projects_order listener warning:", err);
      }
    );
  } catch (err) {
    console.warn("Could not attach listener for settings/featured_projects_order:", err);
  }
}

// Initialize default data helper
function initialize() {
  purgePlaceholderBlogs();

  const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (storedProjects === null) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(defaultProjects));
    localStorage.setItem(STORAGE_KEYS.RAW_PROJECTS, JSON.stringify(defaultProjects));
  }

  // Also clean old legacy key if present
  localStorage.removeItem("portfolio_projects");

  const storedBlogs = localStorage.getItem(STORAGE_KEYS.BLOGS);
  if (storedBlogs === null) {
    localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RAW_BLOGS, JSON.stringify([]));
  }

  const storedTestimonials = localStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
  if (storedTestimonials === null) {
    localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(defaultTestimonials));
    localStorage.setItem(STORAGE_KEYS.RAW_TESTIMONIALS, JSON.stringify(defaultTestimonials));
  }

  // Set up Firebase real-time sync listeners in the background
  setupFirebaseListeners();
}

export const dataStore = {
  getProjects(): Project[] {
    initialize();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((item: any) => item && item.id).map((p, idx) => {
            if (!p.createdAt) {
              return { ...p, createdAt: new Date(Date.now() - idx * 1000).toISOString() };
            }
            return p;
          });
          if (valid.length > 0) {
            return valid;
          }
        }
      }
      return defaultProjects;
    } catch {
      return defaultProjects;
    }
  },

  saveProjects(projects: Project[]) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    localStorage.setItem(STORAGE_KEYS.RAW_PROJECTS, JSON.stringify(projects));
    window.dispatchEvent(new Event("portfolio_data_update"));
    if (isFirebaseConfigured && db) {
      syncCollectionToFirebase("projects", projects);
    }
  },

  getBlogs(): BlogItem[] {
    initialize();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BLOGS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((b) => !isPlaceholderBlog(b));
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  async saveBlogs(blogs: BlogItem[]) {
    localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(blogs));
    localStorage.setItem(STORAGE_KEYS.RAW_BLOGS, JSON.stringify(blogs));
    window.dispatchEvent(new Event("portfolio_data_update"));
    if (isFirebaseConfigured && db) {
      await syncCollectionToFirebase("blogs", blogs);
    }
  },

  getTestimonials(): Testimonial[] {
    initialize();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveTestimonials(testimonials: Testimonial[]) {
    localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(testimonials));
    localStorage.setItem(STORAGE_KEYS.RAW_TESTIMONIALS, JSON.stringify(testimonials));
    window.dispatchEvent(new Event("portfolio_data_update"));
    if (isFirebaseConfigured && db) {
      syncCollectionToFirebase("testimonials", testimonials);
    }
  },

  getOutsideWorkSettings(): OutsideWorkSettings {
    initialize();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OUTSIDE_WORK);
      if (!stored) return defaultOutsideWork;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const found = parsed.find((item: any) => item.id === "outside_work");
        return found ? { ...defaultOutsideWork, ...found } : defaultOutsideWork;
      }
      return { ...defaultOutsideWork, ...parsed };
    } catch {
      return defaultOutsideWork;
    }
  },

  saveOutsideWorkSettings(settings: OutsideWorkSettings) {
    localStorage.setItem(STORAGE_KEYS.OUTSIDE_WORK, JSON.stringify(settings));
    window.dispatchEvent(new Event("portfolio_data_update"));
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "settings", "outside_work");
      setDoc(docRef, { id: "outside_work", ...settings, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => {
        console.warn("Could not save settings/outside_work to Firestore:", err);
      });
    }
  },

  getFeaturedProjectsOrder(): string[] {
    initialize();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FEATURED_PROJECTS_ORDER);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {
      return [];
    }
    return [];
  },

  saveFeaturedProjectsOrder(order: string[]) {
    localStorage.setItem(STORAGE_KEYS.FEATURED_PROJECTS_ORDER, JSON.stringify(order));
    window.dispatchEvent(new Event("portfolio_data_update"));
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "settings", "featured_projects_order");
      setDoc(docRef, { id: "featured_projects_order", order, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => {
        console.warn("Could not save settings/featured_projects_order to Firestore:", err);
      });
    }
  },

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(defaultProjects));
    localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(defaultBlogs));
    localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(defaultTestimonials));
    localStorage.setItem("portfolio_project_designing", JSON.stringify(defaultProjectDesigningFolders));
    window.dispatchEvent(new Event("portfolio_data_update"));
  }
};
