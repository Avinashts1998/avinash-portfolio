export type ExternalPlatform =
  | "Medium"
  | "LinkedIn"
  | "Substack"
  | "Dev.io"
  | "Dev.to"
  | "Reddit"
  | string;

export const PORTAL_ICONS: Record<string, string> = {
  Substack: "https://res.cloudinary.com/p66qxgqe/image/upload/v1792392411/mw0ulidqquntxz5smnmz.png",
  "Dev.io": "https://res.cloudinary.com/p66qxgqe/image/upload/v1792393063/td1ndfxsrlnepjzhw1fa.jpg",
  "Dev.to": "https://res.cloudinary.com/p66qxgqe/image/upload/v1792393063/td1ndfxsrlnepjzhw1fa.jpg",
  Reddit: "https://res.cloudinary.com/p66qxgqe/image/upload/v1792393024/rxte8iwuolopxjcgshjs.jpg",
  Medium: "https://res.cloudinary.com/p66qxgqe/image/upload/v1790675748/pailt5wgsvujldpjhsl0.png",
  LinkedIn: "https://res.cloudinary.com/p66qxgqe/image/upload/v1785159955/hbzwr4eeotny0cvxzyop.svg",
};

export function getPortalIconUrl(platform: string): string {
  const norm = (platform || "").trim().toLowerCase();
  if (norm.includes("substack")) return PORTAL_ICONS.Substack;
  if (norm.includes("dev.io") || norm.includes("dev.to") || norm === "dev") return PORTAL_ICONS["Dev.io"];
  if (norm.includes("reddit")) return PORTAL_ICONS.Reddit;
  if (norm.includes("linkedin")) return PORTAL_ICONS.LinkedIn;
  return PORTAL_ICONS.Medium;
}

export interface ExternalArticle {
  id: string;
  title: string;
  excerpt?: string;
  platform: ExternalPlatform;
  publication?: string;
  author: {
    name: string;
    avatar?: string;
    handle?: string;
  };
  publishedDate: string;
  readTime: string;
  url: string;
  clapsOrLikes?: number;
  featured?: boolean;
  topic?: string;
  createdAt: number;
}
