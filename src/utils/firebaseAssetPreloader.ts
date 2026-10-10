import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { dataStore, STORAGE_KEYS, isPlaceholderBlog } from "./dataStore";
import { getHeroImagesSync } from "../services/heroImageService";
import { profilePictureService, DEFAULT_PROFILE_PICTURE } from "../services/profilePictureService";
import { DEFAULT_ALMA_MATERS } from "../services/almaMaterService";
import { DEFAULT_ABOUT_MORE_ITEMS } from "../services/bitMoreAboutMeService";
import { DEFAULT_ABOUT_PHOTOS } from "../services/aboutImagesService";
import { DEFAULT_MENTORSHIP_PHOTOS } from "../services/mentorshipPhotosService";
import about3Dobjects from "../feeders/about_3d_feeders";
import { social_icon_feeder, hero_section, utils_icons } from "../feeders/feeder";
import { getOptimizedImageUrl } from "./cloudinary";
import { isPlaceholderNote } from "../services/fieldNotesService";

// In-memory set of URLs that have already been preloaded into cache/GPU
const preloadedUrls = new Set<string>();

// Preload state flags
let isPreloadInitiated = false;
let isPreloadComplete = false;
let preloadPromise: Promise<void> | null = null;

/**
 * Preload a single image URL into browser cache and GPU memory.
 * Note: We do NOT set crossOrigin="anonymous" to avoid CORS cache partitioning issues,
 * ensuring the cached resource is seamlessly reused by standard HTML <img> elements.
 */
export function preloadSingleImage(url: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || typeof url !== "string") {
      resolve(false);
      return;
    }

    const cleanUrl = url.trim();
    if (!cleanUrl || cleanUrl.startsWith("data:")) {
      resolve(false);
      return;
    }

    if (preloadedUrls.has(cleanUrl)) {
      resolve(true);
      return;
    }

    const img = new Image();

    let settled = false;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      preloadedUrls.add(cleanUrl);
      resolve(success);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      if (typeof img.decode === "function") {
        img.decode().then(() => finish(true)).catch(() => finish(true));
      } else {
        finish(true);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };

    img.src = cleanUrl;

    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer);
      finish(true);
    }
  });
}

/**
 * Deep recursive scanner to extract every image URL from any data structure.
 */
export function extractAllImageUrlsFromObject(obj: any, targetSet: Set<string>): void {
  if (!obj) return;

  if (typeof obj === "string") {
    const s = obj.trim();
    if (
      (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) &&
      !s.startsWith("data:") &&
      (s.includes("cloudinary.com") ||
        s.includes("unsplash.com") ||
        s.includes("icons8.com") ||
        s.includes("firebasestorage.googleapis.com") ||
        /\.(webp|png|jpg|jpeg|svg|gif|avif)($|\?)/i.test(s))
    ) {
      targetSet.add(s);
    }
    return;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractAllImageUrlsFromObject(item, targetSet);
    }
    return;
  }

  if (typeof obj === "object") {
    for (const val of Object.values(obj)) {
      extractAllImageUrlsFromObject(val, targetSet);
    }
  }
}

/**
 * Common image widths used across cards, carousels, and hero displays.
 */
const COMMON_IMAGE_WIDTHS = [
  1920, 1600, 1400, 1200, 1000, 800, 700, 600, 450, 400, 350, 300, 240, 200, 120, 60
];

/**
 * Expands Cloudinary URLs to include all responsive sizes used across the applet.
 */
function expandUrlVariants(urls: Set<string>): Set<string> {
  const expanded = new Set<string>();

  urls.forEach((url) => {
    if (!url) return;
    expanded.add(url);

    if (url.includes("res.cloudinary.com")) {
      COMMON_IMAGE_WIDTHS.forEach((w) => {
        try {
          const transformed = getOptimizedImageUrl(url, w);
          if (transformed) expanded.add(transformed);
        } catch {}
      });
    }
  });

  return expanded;
}

/**
 * Pull all data documents from every Firebase collection, cache into localStorage
 * and service stores, and extract every image asset URL.
 */
export async function pullFirebaseCollectionsAndImages(): Promise<string[]> {
  const imageUrls = new Set<string>();

  // 1. Static and feeder assets
  try {
    extractAllImageUrlsFromObject(about3Dobjects, imageUrls);
    extractAllImageUrlsFromObject(social_icon_feeder, imageUrls);
    extractAllImageUrlsFromObject(hero_section, imageUrls);
    extractAllImageUrlsFromObject(utils_icons, imageUrls);
    extractAllImageUrlsFromObject(DEFAULT_ALMA_MATERS, imageUrls);
    extractAllImageUrlsFromObject(DEFAULT_ABOUT_MORE_ITEMS, imageUrls);
    extractAllImageUrlsFromObject(DEFAULT_ABOUT_PHOTOS, imageUrls);
    extractAllImageUrlsFromObject(DEFAULT_MENTORSHIP_PHOTOS, imageUrls);
    extractAllImageUrlsFromObject(DEFAULT_PROFILE_PICTURE, imageUrls);
  } catch (e) {
    console.warn("[Preloader] Error gathering static assets:", e);
  }

  // 2. Local storage cached assets
  try {
    extractAllImageUrlsFromObject(dataStore.getProjects(), imageUrls);
    extractAllImageUrlsFromObject(dataStore.getBlogs(), imageUrls);
    extractAllImageUrlsFromObject(dataStore.getTestimonials(), imageUrls);
    extractAllImageUrlsFromObject(dataStore.getOutsideWorkSettings(), imageUrls);
    extractAllImageUrlsFromObject(getHeroImagesSync(), imageUrls);
    extractAllImageUrlsFromObject(profilePictureService.getProfilePicture(), imageUrls);
  } catch (e) {
    console.warn("[Preloader] Error gathering cached assets:", e);
  }

  // 3. Static critical public assets
  const staticCritical = [
    "/01_herosection.webp",
    "/02_herosection.webp",
    "/fitznow_thumbnail.webp",
    "/crux_thumbnail.webp",
    "/profile_light.jpg",
  ];
  staticCritical.forEach((u) => imageUrls.add(u));

  // 4. Eagerly query and persist all live Firebase collections if configured
  if (isFirebaseConfigured && db) {
    try {
      const tasks: Promise<any>[] = [];

      // A. Projects
      tasks.push(
        getDocs(collection(db, "projects"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(items));
                  localStorage.setItem(STORAGE_KEYS.RAW_PROJECTS, JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_data_update"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // B. Blogs
      tasks.push(
        getDocs(collection(db, "blogs"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                if (!isPlaceholderBlog(data)) {
                  items.push(data);
                  extractAllImageUrlsFromObject(data, imageUrls);
                }
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(items));
                  localStorage.setItem(STORAGE_KEYS.RAW_BLOGS, JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_data_update"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // C. Testimonials
      tasks.push(
        getDocs(collection(db, "testimonials"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(items));
                  localStorage.setItem(STORAGE_KEYS.RAW_TESTIMONIALS, JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_testimonials_updated"));
                  window.dispatchEvent(new Event("portfolio_data_update"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // D. Field Notes
      tasks.push(
        getDocs(collection(db, "field_notes"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                if (!isPlaceholderNote(data)) {
                  items.push(data);
                  extractAllImageUrlsFromObject(data, imageUrls);
                }
              });
              items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_field_notes", JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_field_notes_updated"));
                  window.dispatchEvent(new Event("portfolio_data_update"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // E. Project Designing
      tasks.push(
        getDocs(collection(db, "project designing"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_project_designing", JSON.stringify(items));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // F. Hero Section Images (desktop & mobile)
      tasks.push(
        getDoc(doc(db, "hero section image", "main_hero"))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() };
              extractAllImageUrlsFromObject(data, imageUrls);
              try {
                localStorage.setItem("portfolio_hero_section_images", JSON.stringify(data));
                window.dispatchEvent(new Event("portfolio_data_update"));
              } catch {}
            }
          })
          .catch(() => {})
      );

      // G. Profile Picture
      tasks.push(
        getDoc(doc(db, "profile_pictures", "active_profile"))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() };
              extractAllImageUrlsFromObject(data, imageUrls);
              try {
                localStorage.setItem("portfolio_profile_picture_data", JSON.stringify(data));
                window.dispatchEvent(new Event("portfolio_profile_picture_updated"));
                window.dispatchEvent(new Event("portfolio_data_update"));
              } catch {}
            }
          })
          .catch(() => {})
      );

      // H. Exploration Insights / About Background
      tasks.push(
        getDocs(collection(db, "exploration_insights"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data: any = { id: docSnap.id, ...docSnap.data() };
                if (
                  docSnap.id !== "bg-kanchendzonga-1" &&
                  docSnap.id !== "bg-dolomites-2" &&
                  !data.imageUrl?.includes("images.unsplash.com")
                ) {
                  items.push(data);
                  extractAllImageUrlsFromObject(data, imageUrls);
                }
              });
              if (items.length > 0) {
                try {
                  const cfg = {
                    items,
                    activeId: items[0]?.id || "",
                    blurAmount: 28,
                  };
                  localStorage.setItem("portfolio_about_background_multi_config", JSON.stringify(cfg));
                  window.dispatchEvent(new Event("portfolio_about_background_update"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // I. About More Photos (settings/more_photos & items)
      tasks.push(
        getDoc(doc(db, "settings", "more_photos"))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              extractAllImageUrlsFromObject(data, imageUrls);
            }
          })
          .catch(() => {})
      );

      tasks.push(
        getDocs(collection(db, "settings", "more_photos", "items"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_about_more_photos", JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_about_images_update"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // J. Mentorship Photos
      tasks.push(
        getDocs(collection(db, "mentorship_photos"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_mentorship_photos_data", JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_mentorship_photos_updated"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // K. About More Items (bit_more_about_me / about_more_items)
      tasks.push(
        getDocs(collection(db, "about_more_items"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_about_more_items_v8", JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_about_more_items_updated"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // L. Alma Maters
      tasks.push(
        getDocs(collection(db, "alma_maters"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_alma_maters_data", JSON.stringify(items));
                  window.dispatchEvent(new Event("portfolio_alma_maters_updated"));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // M. Community Board
      tasks.push(
        getDocs(collection(db, "community_board"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              const items: any[] = [];
              snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };
                items.push(data);
                extractAllImageUrlsFromObject(data, imageUrls);
              });
              if (items.length > 0) {
                try {
                  localStorage.setItem("portfolio_community_board_data", JSON.stringify(items));
                } catch {}
              }
            }
          })
          .catch(() => {})
      );

      // N. Settings Outside Work
      tasks.push(
        getDoc(doc(db, "settings", "outside_work"))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              extractAllImageUrlsFromObject(data, imageUrls);
              try {
                localStorage.setItem(STORAGE_KEYS.OUTSIDE_WORK, JSON.stringify(data));
                window.dispatchEvent(new Event("portfolio_data_update"));
              } catch {}
            }
          })
          .catch(() => {})
      );

      // O. Settings Session Booking
      tasks.push(
        getDoc(doc(db, "settings", "session_booking"))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              try {
                localStorage.setItem("portfolio_session_booking_config", JSON.stringify(data));
                window.dispatchEvent(new Event("portfolio_session_config_updated"));
              } catch {}
            }
          })
          .catch(() => {})
      );

      // P. Interests
      tasks.push(
        getDocs(collection(db, "interests"))
          .then((snapshot) => {
            if (!snapshot.empty) {
              snapshot.forEach((docSnap) => {
                extractAllImageUrlsFromObject(docSnap.data(), imageUrls);
              });
            }
          })
          .catch(() => {})
      );

      // Wait for all Firestore queries to resolve concurrently
      await Promise.allSettled(tasks);
    } catch (err) {
      console.warn("[Preloader] Firebase query cycle completed with warnings:", err);
    }
  }

  // 5. Query in-DOM image elements
  if (typeof document !== "undefined") {
    document.querySelectorAll("img").forEach((img) => {
      if (img.src && !img.src.startsWith("data:")) {
        imageUrls.add(img.src);
      }
    });
  }

  // 6. Expand all Cloudinary variants so every width requested across the app is preloaded
  const expanded = expandUrlVariants(imageUrls);
  return Array.from(expanded);
}

/**
 * Concurrently preloads a list of image URLs using an active worker pool (concurrency: 12).
 */
async function preloadImagesWithConcurrency(urls: string[], concurrency = 12): Promise<void> {
  let index = 0;
  const total = urls.length;
  if (total === 0) return;

  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (index < total) {
      const currentUrl = urls[index++];
      if (currentUrl) {
        await preloadSingleImage(currentUrl, 6000);
      }
    }
  });

  await Promise.all(workers);
}

/**
 * Master data fetcher and image preloader.
 * When called on homepage load after the splash screen finishes:
 * 1. Queries and persists all Firebase collections into local stores.
 * 2. Extracts every image across the database and feeders.
 * 3. Preloads and decodes every single image into browser cache/memory so navigation is 100% instant.
 */
export async function startGlobalDataAndAssetPreload(): Promise<void> {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      isPreloadInitiated = true;
      const allUrls = await pullFirebaseCollectionsAndImages();
      const validUrls = allUrls.filter((u) => u && !u.startsWith("data:"));

      if (validUrls.length > 0) {
        await preloadImagesWithConcurrency(validUrls, 12);
      }
      isPreloadComplete = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("portfolio_all_assets_cached", {
          detail: { totalImages: validUrls.length }
        }));
      }
    } catch (err) {
      console.warn("[Preloader] Global preload finished with warning:", err);
    }
  })();

  return preloadPromise;
}

/**
 * Backward compatibility alias for existing callers.
 */
export async function preloadAllDatabaseAssets(): Promise<void> {
  return startGlobalDataAndAssetPreload();
}

/**
 * Check whether the eager preloader has completed.
 */
export function isAllDataAndAssetsCached(): boolean {
  return isPreloadComplete;
}
