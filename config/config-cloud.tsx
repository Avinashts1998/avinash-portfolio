const metaEnv = (import.meta as any)?.env || {};

export const cloudinaryConfig = {
  cloudName: metaEnv.VITE_CLOUDINARY_CLOUD_NAME || "p66qxgqe",
  presetName: metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || "portfolio-project",
  // Specific preset names for respective folders (if created in Cloudinary)
  profilePreset: metaEnv.VITE_CLOUDINARY_PRESET_PROFILE || "profile_images",
  heroPreset: metaEnv.VITE_CLOUDINARY_PRESET_HERO || "hero_section",
  projectPreset: metaEnv.VITE_CLOUDINARY_PRESET_PROJECT || metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || "portfolio-project",
  folderPresets: {
    profile_images: metaEnv.VITE_CLOUDINARY_PRESET_PROFILE || "profile_images",
    hero_section: metaEnv.VITE_CLOUDINARY_PRESET_HERO || "hero_section",
    projects: metaEnv.VITE_CLOUDINARY_PRESET_PROJECT || metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || "portfolio-project",
    social_icons: "social_icons",
    utils_icons: "utils_icons",
    explore_collections: metaEnv.VITE_CLOUDINARY_PRESET_EXPLORE || "explore_collections",
    "explore_collections/exploration_images": metaEnv.VITE_CLOUDINARY_PRESET_EXPLORE || "explore_collections",
    "explore_collections/exploration_audios": metaEnv.VITE_CLOUDINARY_PRESET_EXPLORE || "explore_collections",
    exploration_images: metaEnv.VITE_CLOUDINARY_PRESET_EXPLORE || "explore_collections",
    exploration_audios: metaEnv.VITE_CLOUDINARY_PRESET_EXPLORE || "explore_collections",
    resume: metaEnv.VITE_CLOUDINARY_PRESET_PROJECT || metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || "portfolio-project",
  } as Record<string, string>,
} as const;

