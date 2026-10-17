export type ExternalPlatform = "Medium" | "LinkedIn" | "Substack" | "Dev.to";

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
