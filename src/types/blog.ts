export type BlogCategory =
  | "All Articles"
  | "Artificial Intelligence"
  | "User Experience"
  | "User Interface"
  | "My Notes"
  | "Learning & Thinking Notes"
  | "All"
  | "AI"
  | "UX"
  | "UI"
  | "Case Study"
  | "Design Systems";

export type BlogSortOption = "newest" | "oldest" | "popular";

export interface BlogAuthor {
  name: string;
  avatar?: string;
  role?: string;
}

export interface NotePhoto {
  url: string;
  caption?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: string;
  category: "AI" | "UX" | "UI" | "Case Study" | "Design Systems" | "Learning & Thinking Notes" | "My Notes";
  tags: string[];
  coverPhoto: string;
  date: string;
  timestamp: number; // For reliable sorting (Date.parse)
  readTime: string;
  views: number; // For sorting by Popular
  featured: boolean; // Shown in top carousel
  author: BlogAuthor;
  notePhotos?: (string | NotePhoto)[]; // Photos of handwritten notes, sketches, whiteboard diagrams
  isNote?: boolean; // Whether this is an authentic learning/thinking note
}
