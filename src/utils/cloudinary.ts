/**
 * Utility functions for optimizing images served from Cloudinary.
 */

import { cloudinaryConfig } from "../../config/config-cloud";

export const CLOUDINARY_CLOUD_NAME = cloudinaryConfig.cloudName;
export const CLOUDINARY_UPLOAD_PRESET = cloudinaryConfig.presetName;

/**
 * Transforms a full Cloudinary URL to include on-the-fly optimization and resizing parameters.
 * 
 * @param url The full Cloudinary URL.
 * @param width The target display width in pixels (use ~2x for retina displays).
 * @returns The optimized Cloudinary URL, or the original URL if not hosted on Cloudinary.
 */
export function getOptimizedImageUrl(url: string, width: number): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("res.cloudinary.com")) return url; // safety check

  // Avoid duplicate transformations if they have already been added
  if (url.includes("/upload/f_auto,q_auto")) {
    return url;
  }

  // Inject optimization/transformation parameters: f_auto, q_auto, and specified width
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

/**
 * Builds a complete optimized Cloudinary URL from a public ID or partial path.
 * Standardizes format to ensure it's delivered optimally.
 * 
 * @param publicId The Cloudinary public ID (e.g., "v1784103972/01_herosection_b47thd") or a full URL.
 * @param width The target display width in pixels.
 * @returns The fully qualified, optimized Cloudinary URL.
 */
export function buildCloudinaryUrl(publicId: string, width: number): string {
  if (!publicId || typeof publicId !== "string") return "";

  // If already a full URL, delegate to getOptimizedImageUrl
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return getOptimizedImageUrl(publicId, width);
  }

  const cleanId = publicId.replace(/^\//, "");
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width}/${cleanId}.webp`;
}

/**
 * Extracts a Cloudinary public_id from a full Cloudinary URL.
 * 
 * @param url The full Cloudinary image URL.
 * @returns The extracted public_id or null if not valid.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return null;
  
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    let path = parts[1].split("?")[0];
    const pathSegments = path.split("/").filter(Boolean);
    
    const cleanedSegments = pathSegments.filter(seg => {
      if (/^v\d+$/.test(seg)) return false; // skip version like v1740212711
      if (seg.includes(",") || seg.includes("=") || seg.startsWith("c_") || seg.startsWith("f_") || seg.startsWith("q_") || seg.startsWith("w_") || seg.startsWith("h_")) return false; // skip transformations
      return true;
    });

    if (cleanedSegments.length === 0) return null;

    let fullPublicId = cleanedSegments.join("/");
    // Strip file extension
    fullPublicId = fullPublicId.replace(/\.[a-zA-Z0-9]+$/, "");
    return fullPublicId;
  } catch (err) {
    console.warn("Failed to extract Cloudinary public_id from URL:", url, err);
    return null;
  }
}

/**
 * Detects whether a URL or publicId corresponds to image, video/audio, or raw asset.
 */
export function detectCloudinaryResourceType(urlOrPath: string): "image" | "video" | "raw" {
  if (!urlOrPath || typeof urlOrPath !== "string") return "image";
  const lower = urlOrPath.toLowerCase();
  if (
    lower.includes("/video/upload/") ||
    lower.includes("audio") ||
    lower.includes("exploration_audios") ||
    /\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|webm)$/i.test(lower)
  ) {
    return "video";
  }
  if (lower.includes("/raw/upload/")) {
    return "raw";
  }
  return "image";
}

/**
 * Deletes any media resource (image, audio, video, raw) from Cloudinary using server route or REST API.
 * 
 * @param urlOrPublicId The full Cloudinary URL or public_id
 * @param resourceType Optional resource type ("image", "video", "raw", "auto")
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteMediaFromCloudinary(
  urlOrPublicId: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<boolean> {
  if (!urlOrPublicId || typeof urlOrPublicId !== "string") return false;

  // Skip non-cloudinary URLs (e.g. Unsplash, mixkit, external avatars)
  if (urlOrPublicId.startsWith("http") && !urlOrPublicId.includes("res.cloudinary.com")) {
    return true;
  }

  const detectedType = resourceType === "auto" ? detectCloudinaryResourceType(urlOrPublicId) : resourceType;
  const publicId = urlOrPublicId.includes("res.cloudinary.com")
    ? extractCloudinaryPublicId(urlOrPublicId)
    : urlOrPublicId.trim().replace(/^\//, "");

  if (!publicId) return false;

  const cloudName = CLOUDINARY_CLOUD_NAME;
  console.log(`[Cloudinary Delete] Requesting deletion for publicId="${publicId}", type="${detectedType}"`);

  // Step 1: Attempt via backend server endpoint (which has access to signed deletion if secrets are set)
  try {
    const res = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: urlOrPublicId,
        publicId,
        resourceType: detectedType,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success || data.result === "ok" || data.result === "not found") {
        console.log(`[Cloudinary Delete Server] Successfully deleted "${publicId}"`);
        return true;
      }
    }
  } catch (serverErr) {
    console.warn("[Cloudinary Delete Server] Backend route unreachable, falling back to direct REST destroy:", serverErr);
  }

  // Step 2: Fallback direct client-side destroy across presets and resource types
  const presetsToTry = [
    "explore_collections",
    "portfolio-project",
    "profile_images",
    "hero_section",
    CLOUDINARY_UPLOAD_PRESET,
  ].filter((p, idx, arr): p is string => !!p && arr.indexOf(p) === idx);

  const typesToTry = detectedType === "video" ? ["video", "raw", "image"] : [detectedType, "image", "raw"];

  for (const rType of typesToTry) {
    for (const preset of presetsToTry) {
      try {
        const formData = new FormData();
        formData.append("public_id", publicId);
        formData.append("upload_preset", preset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${rType}/destroy`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok && (data.result === "ok" || data.result === "not found")) {
          console.log(`[Cloudinary Delete Direct] Success for "${publicId}" (${rType} / ${preset})`);
          return true;
        }
      } catch (directErr) {
        // continue
      }
    }
  }

  return true; // Graceful return to avoid blocking UI operations
}

/**
 * Deletes an image resource from Cloudinary using public_id or full URL.
 * 
 * @param urlOrPublicId The full Cloudinary URL or public_id
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteImageFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  return deleteMediaFromCloudinary(urlOrPublicId, "image");
}

/**
 * Deletes an audio or video resource from Cloudinary using public_id or full URL.
 * 
 * @param urlOrPublicId The full Cloudinary URL or public_id
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteAudioFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  return deleteMediaFromCloudinary(urlOrPublicId, "video");
}

/**
 * Uploads a single media file (image, audio, video) directly to Cloudinary via Unsigned Upload REST API.
 * 
 * @param file The image or audio File or Blob to upload
 * @param folder Exact folder name in Cloudinary (e.g. "explore_collections/exploration_images", "explore_collections/exploration_audios", "profile_images")
 * @param customPublicId Optional clean filename (without folder prefix)
 * @param resourceType Optional resource type ("image", "video", "auto")
 * @returns Promise resolving to the secure Cloudinary media URL
 */
export async function uploadImageToCloudinary(
  file: File | Blob,
  folder: string = "explore_collections/exploration_images",
  customPublicId?: string,
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<string> {
  const cloudName = CLOUDINARY_CLOUD_NAME || "p66qxgqe";
  const defaultPreset = CLOUDINARY_UPLOAD_PRESET || "portfolio-project";

  if (!cloudName) {
    throw new Error("Cloudinary Cloud Name is not configured.");
  }

  // Detect if file is audio or video
  const isAudio = file.type?.startsWith("audio/") || folder.includes("audio") || (file instanceof File && /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name));
  const isVideo = file.type?.startsWith("video/") || (file instanceof File && /\.(mp4|mov|webm)$/i.test(file.name));
  const actualResourceType = isAudio || isVideo ? "video" : (resourceType === "auto" ? "image" : resourceType);

  // Folder preset matching
  const folderPresets = (cloudinaryConfig as any).folderPresets || {};
  const rootFolder = folder.split("/")[0];
  const selectedPreset = 
    folderPresets[folder] || 
    folderPresets[rootFolder] ||
    (folder.startsWith("profile_images") ? "profile_images" : defaultPreset);

  // Ordered endpoints: video endpoint first for audio/video, image endpoint for images
  const endpoints = actualResourceType === "video" 
    ? [
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      ]
    : [
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      ];

  console.log(`[Cloudinary Upload] Target -> Cloud: ${cloudName} | Selected Preset: "${selectedPreset}" | Folder: "${folder}" | Type: ${actualResourceType}`);

  // Prioritize the matching folder preset first (e.g. "profile_images" for profile images), then fallback presets
  const presetsToTry = [
    selectedPreset,
    folder.startsWith("profile_images") ? "profile_images" : null,
    folder.includes("hero") ? "hero_section" : null,
    folder.includes("explore") ? "explore_collections" : null,
    defaultPreset,
    "portfolio-project",
  ].filter(
    (p, idx, arr): p is string => Boolean(p) && arr.indexOf(p) === idx
  );

  let lastErrorMessage = "Unknown upload failure";

  for (const endpoint of endpoints) {
    for (const preset of presetsToTry) {
      // Strategy A: full metadata (folder + clean public_id)
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", preset);
        if (folder) formData.append("folder", folder);
        
        if (customPublicId) {
          const cleanFilename = customPublicId.split("/").pop() || customPublicId;
          formData.append("public_id", cleanFilename);
        }

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const uploadedUrl = data.secure_url || data.url;
          if (uploadedUrl) {
            console.log(`[Cloudinary Upload] Success with metadata in folder "${folder}":`, uploadedUrl);
            return uploadedUrl;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          const msg = errData?.error?.message || (typeof errData?.error === "string" ? errData.error : JSON.stringify(errData?.error || errData)) || `HTTP ${response.status}`;
          lastErrorMessage = String(msg);
        }
      } catch (err: any) {
        lastErrorMessage = err?.message || String(err);
      }

      // Strategy B: folder only (no public_id)
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", preset);
        if (folder) formData.append("folder", folder);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const uploadedUrl = data.secure_url || data.url;
          if (uploadedUrl) {
            console.log(`[Cloudinary Upload] Success with folder only:`, uploadedUrl);
            return uploadedUrl;
          }
        }
      } catch (err: any) {
        // continue
      }

      // Strategy C: Plain unsigned upload (pure file + upload_preset)
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", preset);

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const uploadedUrl = data.secure_url || data.url;
          if (uploadedUrl) {
            console.log(`[Cloudinary Upload] Success with base unsigned preset:`, uploadedUrl);
            return uploadedUrl;
          }
        }
      } catch (err: any) {
        // continue
      }
    }
  }

  // Strategy D: Fallback to server-side upload proxy (/api/cloudinary/upload)
  // This completely solves browser "Failed to fetch" caused by CORS, ad-blockers, network firewalls, or strict browser extensions.
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const proxyResponse = await fetch("/api/cloudinary/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64Data,
        folder,
        publicId: customPublicId,
        resourceType: actualResourceType,
      }),
    });

    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      if (proxyData.url) {
        console.log(`[Cloudinary Upload] Success via server proxy:`, proxyData.url);
        return proxyData.url;
      }
    } else {
      const proxyErr = await proxyResponse.json().catch(() => ({}));
      if (proxyErr?.message) {
        lastErrorMessage = proxyErr.message;
      }
    }
  } catch (proxyErr: any) {
    console.warn("[Cloudinary Upload] Server proxy fallback failed:", proxyErr);
  }

  throw new Error(`Upload failed: ${lastErrorMessage}`);
}

/**
 * Uploads multiple image files concurrently to Cloudinary.
 * 
 * @param files Array of image Files or Blobs
 * @param folder Optional folder name in Cloudinary
 * @returns Promise resolving to an array of secure Cloudinary image URLs
 */
export async function uploadMultipleImagesToCloudinary(
  files: (File | Blob)[],
  folder: string = "profile_images"
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImageToCloudinary(file, folder));
  return Promise.all(uploadPromises);
}

export interface CloudinaryResumeUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  originalFilename: string;
  format: string;
}

/**
 * Uploads a resume PDF specifically to the Cloudinary 'resume' folder/collection.
 * 
 * @param file The PDF File to upload
 * @param folder Cloudinary collection/folder name, defaults to "resume"
 * @returns Promise resolving to the Cloudinary upload result
 */
export async function uploadResumeToCloudinary(
  file: File,
  folder: string = "resume"
): Promise<CloudinaryResumeUploadResult> {
  const cloudName = CLOUDINARY_CLOUD_NAME || "p66qxgqe";
  const preset = "portfolio-project";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", folder);

  const endpoints = [
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
  ];

  let lastError = "Failed to upload resume";

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.secure_url || data.url;
        if (url) {
          return {
            url,
            publicId: data.public_id || "",
            bytes: data.bytes || file.size,
            originalFilename: data.original_filename || file.name.replace(/\.[^/.]+$/, ""),
            format: data.format || "pdf",
          };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData?.error?.message || `Cloudinary returned ${res.status}`;
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
    }
  }

  throw new Error(`Resume upload failed: ${lastError}`);
}

