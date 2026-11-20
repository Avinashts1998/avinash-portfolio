import { BlogPost } from "../types/blog";
import { BlogItem } from "../utils/dataStore";

export const initialBlogPosts: BlogPost[] = [];

export function getMergedBlogPosts(customBlogs: BlogItem[] = []): BlogPost[] {
  if (!customBlogs || customBlogs.length === 0) {
    return [];
  }

  // Convert customBlogs into BlogPost structure
  return customBlogs.map((b, idx) => {
    // Map explicit category or badges to standard categories if matching, else fallback
    const rawCategory = b.category || (b.badge && b.badge[0]) || "AI";
    let category: BlogPost["category"] = "AI";
    const lower = rawCategory.toLowerCase();
    if (lower.includes("ux") || lower.includes("research") || lower.includes("user experience")) category = "UX";
    else if (lower.includes("ui") || lower.includes("visual") || lower.includes("user interface")) category = "UI";
    else if (lower.includes("case") || lower.includes("study")) category = "Case Study";
    else if (lower.includes("system") || lower.includes("design system")) category = "Design Systems";
    else if (lower.includes("note") || lower.includes("thinking") || lower.includes("learning")) category = "Learning & Thinking Notes";
    else if (lower.includes("ai") || lower.includes("agent") || lower.includes("intelligence") || lower.includes("machine")) category = "AI";

    const parsedTime = Date.parse(b.date);
    const validTimestamp = isNaN(parsedTime) ? Date.now() - idx * 86400000 : parsedTime;

    return {
      id: b.id || `custom-blog-${idx}`,
      title: b.Title,
      slug: b.Title ? b.Title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : `blog-${idx}`,
      excerpt: b.description || "An in-depth article exploring modern design, technology, and user experience.",
      body: b.description || "Detailed article content written by Avinash Shajan.",
      category,
      tags: b.badge && b.badge.length > 0 ? b.badge : ["Product Design", category],
      coverPhoto: b.cover_photo || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80",
      date: b.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      timestamp: validTimestamp,
      readTime: "5 min read",
      views: 0,
      featured: idx === 0,
      author: {
        name: "Avinash Shajan",
        role: "Lead Product Designer",
        avatar: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789628365/profile_images/dp_1789628364803.jpg",
      },
    };
  });
}
