/**
 * Utility functions for detecting and handling video, GIF, and image media
 * throughout case studies, project creation, and showcases.
 */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];
const GIF_EXTENSIONS = [".gif"];

/**
 * Checks if a given media URL or filename corresponds to a playable video file.
 */
export function isMediaVideo(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.trim().toLowerCase().split("?")[0].split("#")[0];

  // Check Cloudinary video resource path
  if (cleanUrl.includes("/video/upload/")) {
    return true;
  }

  // Check file extension
  return VIDEO_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
}

/**
 * Checks if a given media URL or filename corresponds to an animated GIF.
 */
export function isMediaGif(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.trim().toLowerCase().split("?")[0].split("#")[0];
  return GIF_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
}

/**
 * Checks if a File object selected from file input or drag-and-drop is a video.
 */
export function isVideoFile(file: File | null | undefined): boolean {
  if (!file) return false;
  if (file.type && file.type.startsWith("video/")) return true;
  const lowerName = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * Checks if a File object is supported for project case studies (images, GIFs, videos).
 */
export function isSupportedMediaFile(file: File | null | undefined): boolean {
  if (!file) return false;
  if (file.type) {
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      return true;
    }
  }
  const lowerName = file.name.toLowerCase();
  return (
    VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext)) ||
    [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"].some((ext) => lowerName.endsWith(ext))
  );
}
