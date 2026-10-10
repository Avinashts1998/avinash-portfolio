import { ExternalArticle } from "../types/externalArticle";

const STORAGE_KEY = "portfolio_external_articles";

export const DEFAULT_EXTERNAL_ARTICLES: ExternalArticle[] = [];

export function getExternalArticles(): ExternalArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Purge legacy placeholders & normalize LinkedIn publications to "LinkedIn"
    let changed = false;
    const cleaned = parsed
      .filter((item) => !["ext-1", "ext-2", "ext-3", "ext-4", "ext-5"].includes(item.id))
      .map((item) => {
        if (item.platform === "LinkedIn" && item.publication === "LinkedIn Pulse") {
          changed = true;
          return { ...item, publication: "LinkedIn" };
        }
        return item;
      });
    if (cleaned.length !== parsed.length || changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveExternalArticles(articles: ExternalArticle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new CustomEvent("external_articles_updated"));
  } catch (e) {
    console.error("Failed to save external articles:", e);
  }
}
