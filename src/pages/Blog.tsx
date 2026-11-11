import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { dataStore } from "../utils/dataStore";
import { BlogPost, BlogCategory, BlogSortOption } from "../types/blog";
import { getMergedBlogPosts } from "../data/blogPosts";
import BlogFilterBar from "../components/blog/BlogFilterBar";
import BlogCard from "../components/blog/BlogCard";
import ScrollReveal from "../components/layout/ScrollReveal";
import { BookOpen, Sparkles, ArrowRight, Plus, Image as ImageIcon, Type, Layout } from "lucide-react";
import { FieldNote, FieldNoteFilter } from "../types/fieldNotes";
import { fieldNotesService } from "../services/fieldNotesService";
import { FieldNoteCard } from "../components/fieldNotes/FieldNoteCard";
import { FieldNoteGalleryItem } from "../components/fieldNotes/FieldNoteGalleryItem";
import { FieldNoteDetailModal } from "../components/fieldNotes/FieldNoteDetailModal";
import { CreateFieldNoteModal } from "../components/fieldNotes/CreateFieldNoteModal";
import { isAdminAuthenticated } from "../utils/auth";
import ExternalArticlesSidebar from "../components/blog/ExternalArticlesSidebar";
import { getExternalArticles } from "../data/externalArticles";
import { getPreviousPath } from "../utils/navigationHistory";
import { getLenis } from "../hooks/useLenis";

const CATEGORIES: BlogCategory[] = [
  "All Articles",
  "Artificial Intelligence",
  "User Experience",
  "User Interface",
  "My Notes",
];

export default function Blog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [blogsList, setBlogsList] = useState<BlogPost[]>(() =>
    getMergedBlogPosts(dataStore.getBlogs())
  );
  const [activeCategory, setActiveCategory] = useState<BlogCategory>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab") || searchParams.get("category");
      if (tabParam === "notes" || tabParam === "my-notes" || tabParam === "field-notes") {
        return "My Notes";
      }
      const stored = sessionStorage.getItem("portfolio_active_blog_tab");
      if (stored === "My Notes") {
        sessionStorage.removeItem("portfolio_active_blog_tab");
        return "My Notes";
      }
    } catch {}
    return "All Articles";
  });

  // Watch for location.search or session tab changes
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get("tab") || searchParams.get("category");
      if (tabParam === "notes" || tabParam === "my-notes" || tabParam === "field-notes") {
        setActiveCategory("My Notes");
        setNotesSubFilter("all");
      }
      const stored = sessionStorage.getItem("portfolio_active_blog_tab");
      if (stored === "My Notes") {
        sessionStorage.removeItem("portfolio_active_blog_tab");
        setActiveCategory("My Notes");
        setNotesSubFilter("all");
      }
    } catch {}
  }, [location.search]);
  const [activeSort, setActiveSort] = useState<BlogSortOption>("newest");

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const lenis = getLenis();
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.start();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    navigate("/");
  };

  // Field Notes State for "My Notes" tab
  const [fieldNotes, setFieldNotes] = useState<FieldNote[]>(() => fieldNotesService.getNotes());
  const [selectedNote, setSelectedNote] = useState<FieldNote | null>(null);
  const [isNoteDetailOpen, setIsNoteDetailOpen] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [notesSubFilter, setNotesSubFilter] = useState<FieldNoteFilter>("all");
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const [hasExternalArticles, setHasExternalArticles] = useState(
    () => getExternalArticles().length > 0
  );

  // Subscribe to live Field Notes updates
  useEffect(() => {
    const unsubscribe = fieldNotesService.subscribe((notes) => {
      setFieldNotes(notes);
    });

    const checkAuth = () => setIsAdmin(isAdminAuthenticated());
    window.addEventListener("portfolio_admin_auth_changed", checkAuth);

    const checkExternal = () => setHasExternalArticles(getExternalArticles().length > 0);
    window.addEventListener("external_articles_updated", checkExternal);

    const handleSwitchToNotes = () => {
      setActiveCategory("My Notes");
      setNotesSubFilter("all");

      // Smoothly bring the notes section into view if scrolled away
      requestAnimationFrame(() => {
        const el = document.getElementById("page-blog");
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < -80 || rect.top > window.innerHeight) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    };
    window.addEventListener("switch_to_my_notes", handleSwitchToNotes);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_admin_auth_changed", checkAuth);
      window.removeEventListener("external_articles_updated", checkExternal);
      window.removeEventListener("switch_to_my_notes", handleSwitchToNotes);
    };
  }, []);

  // Sync data whenever portfolio_data_update event fires (e.g. from Admin Dashboard or Firebase sync)
  useEffect(() => {
    const handleUpdate = () => {
      setBlogsList(getMergedBlogPosts(dataStore.getBlogs()));
    };

    window.addEventListener("portfolio_data_update", handleUpdate);
    return () => window.removeEventListener("portfolio_data_update", handleUpdate);
  }, []);

  // Sticky subnav tracking: sticks right below navbar when scrolling down
  const [navHeight, setNavHeight] = useState(72);
  const [isFilterStuck, setIsFilterStuck] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateNav = () => {
      const el = document.getElementById("navbar");
      if (el) {
        setNavHeight(el.offsetHeight);
      }
    };
    updateNav();
    window.addEventListener("resize", updateNav);

    const handleScroll = () => {
      if (document.body.classList.contains("field-note-modal-open")) return;
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        const currentNav = document.getElementById("navbar")?.offsetHeight || 72;
        setIsFilterStuck(rect.top <= currentNav - 6);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("resize", updateNav);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle URL hash on initial load (e.g. /blog#ux-of-autonomy-agentic-ai) -> redirect to full frame page
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const match = blogsList.find((b) => b.slug === hash || b.id === hash);
      if (match) {
        navigate(`/blog/${match.slug || match.id}`, { replace: true });
      }
    }
  }, [blogsList, navigate]);

  const isNotesTab = activeCategory === "My Notes" || activeCategory === "Learning & Thinking Notes";

  // Filtered and sorted Field Notes for the "My Notes" tab
  const filteredFieldNotes = useMemo(() => {
    let result = [...fieldNotes];

    if (notesSubFilter === "photos") {
      result = result.filter((n) => n.type === "photo");
    } else if (notesSubFilter === "thoughts") {
      result = result.filter((n) => n.type === "text");
    } else if (notesSubFilter === "design") {
      result = result.filter((n) => n.type === "design");
    }

    if (activeSort === "newest") {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (activeSort === "oldest") {
      result.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    return result;
  }, [fieldNotes, notesSubFilter, activeSort]);


  // Distribute notes into columns for responsive masonry layout
  const notesCols4 = useMemo(() => {
    const cols: FieldNote[][] = [[], [], [], []];
    filteredFieldNotes.forEach((note, i) => cols[i % 4].push(note));
    return cols;
  }, [filteredFieldNotes]);

  const notesCols3 = useMemo(() => {
    const cols: FieldNote[][] = [[], [], []];
    filteredFieldNotes.forEach((note, i) => cols[i % 3].push(note));
    return cols;
  }, [filteredFieldNotes]);

  const notesCols2 = useMemo(() => {
    const cols: FieldNote[][] = [[], []];
    filteredFieldNotes.forEach((note, i) => cols[i % 2].push(note));
    return cols;
  }, [filteredFieldNotes]);

  // Posts filtered by category & sorted
  const bottomPosts = useMemo(() => {
    let result = [...blogsList];

    if (activeCategory !== "All Articles" && activeCategory !== "All") {
      // Filter by specific category
      result = result.filter((p) => {
        if (
          activeCategory === "Artificial Intelligence" &&
          (p.category === "AI" || p.category === "Artificial Intelligence")
        ) {
          return true;
        }
        if (
          activeCategory === "User Experience" &&
          (p.category === "UX" || p.category === "User Experience")
        ) {
          return true;
        }
        if (
          activeCategory === "User Interface" &&
          (p.category === "UI" || p.category === "User Interface")
        ) {
          return true;
        }
        if (
          (activeCategory === "My Notes" || activeCategory === "Learning & Thinking Notes") &&
          (p.category === "My Notes" || p.category === "Learning & Thinking Notes" || p.isNote || p.tags?.some((t) => t.toLowerCase().includes("note") || t.toLowerCase().includes("sketch")))
        ) {
          return true;
        }
        if (p.category === activeCategory) return true;
        if (p.tags && p.tags.some((t) => t.toLowerCase() === activeCategory.toLowerCase())) {
          return true;
        }
        return false;
      });
    }

    // Apply sorting
    if (activeSort === "newest") {
      result.sort((a, b) => b.timestamp - a.timestamp);
    } else if (activeSort === "oldest") {
      result.sort((a, b) => a.timestamp - b.timestamp);
    } else if (activeSort === "popular") {
      result.sort((a, b) => b.views - a.views);
    }

    return result;
  }, [blogsList, activeCategory, activeSort]);

  const totalResultsCount = isNotesTab ? filteredFieldNotes.length : bottomPosts.length;

  return (
    <div id="page-blog" className="space-y-8 -mt-8 sm:-mt-10 pt-2 pb-20">
      {/* SECTION HEADER & STRIPLINE FILTER BAR */}
      <section className="space-y-6 w-full">
        {/* Sticky Stripline Menu (AI, UX, UI, My Notes) + Sort by dropdown */}
        <div
          ref={filterBarRef}
          style={{ top: "var(--navbar-offset, 0px)" }}
          className="sticky z-40 bg-[var(--bg)] w-full py-2.5 -mt-3 sm:-mt-4 mb-2 shadow-none border-none"
        >
          <BlogFilterBar
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            activeSort={activeSort}
            onSelectSort={(sort) => setActiveSort(sort)}
            totalResultsCount={totalResultsCount}
            onBack={handleBack}
          />
        </div>

        {/* 3. CONTENT SECTION: FIELD NOTES OR ARTICLES GRID */}
        <div className="pt-4">
          {isNotesTab ? (
            /* ========================================================
               MY NOTES TAB: LIST ALL CREATED & SAVED FIELD NOTES
               ======================================================== */
            <div className="space-y-6">
              {/* Saved Notes Masonry Display */}
              {filteredFieldNotes.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[var(--line)] space-y-2">
                  <BookOpen size={30} className="mx-auto text-[var(--muted)] opacity-50" />
                  <h3 className="text-sm sm:text-base font-sans font-semibold text-[var(--ink)]">
                    No field notes yet
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto leading-relaxed">
                    Quick thoughts, photographs, sketches, and design observations will appear here once published.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Masonry Layout (Optimized for desktop view with balanced card sizes) */}
                  <div
                    className="hidden lg:grid gap-4.5 sm:gap-5 items-start mx-auto w-full"
                    style={{
                      gridTemplateColumns:
                        filteredFieldNotes.length >= 4
                          ? "repeat(4, minmax(0, 1fr))"
                          : `repeat(${Math.max(1, filteredFieldNotes.length)}, minmax(0, 1fr))`,
                      maxWidth:
                        filteredFieldNotes.length === 1
                          ? "310px"
                          : filteredFieldNotes.length === 2
                          ? "640px"
                          : filteredFieldNotes.length === 3
                          ? "980px"
                          : "1240px",
                    }}
                  >
                    {(filteredFieldNotes.length >= 4
                      ? notesCols4
                      : filteredFieldNotes.length === 3
                      ? notesCols3
                      : filteredFieldNotes.length === 2
                      ? notesCols2
                      : [filteredFieldNotes]
                    ).map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-4.5 sm:gap-5">
                        {col.map((note) => (
                          <FieldNoteCard
                            key={note.id}
                            note={note}
                            onClick={() => {
                              setSelectedNote(note);
                              setIsNoteDetailOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Tablet 2-Column Masonry */}
                  <div className="hidden sm:grid lg:hidden sm:grid-cols-2 gap-4.5 items-start max-w-[720px] mx-auto w-full">
                    {notesCols2.map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-4.5">
                        {col.map((note) => (
                          <FieldNoteCard
                            key={note.id}
                            note={note}
                            onClick={() => {
                              setSelectedNote(note);
                              setIsNoteDetailOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Mobile Gallery View */}
                  <div className="sm:hidden space-y-3.5">
                    {/* Mobile 2-Column Responsive Masonry Layout: Seamlessly arranges mixed portrait & landscape images */}
                    {filteredFieldNotes.length === 0 ? (
                      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[var(--line)] space-y-1.5">
                        <p className="text-xs text-[var(--ink-soft)]">
                          No {notesSubFilter !== "all" ? notesSubFilter : "field"} notes found
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 items-start">
                        {notesCols2.map((col, colIdx) => (
                          <div key={colIdx} className="flex flex-col gap-2.5">
                            {col.map((note) => (
                              <FieldNoteGalleryItem
                                key={note.id}
                                note={note}
                                onClick={() => {
                                  setSelectedNote(note);
                                  setIsNoteDetailOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ========================================================
               DEFAULT ARTICLES GRID (AI, UX, UI, All Articles)
               ======================================================== */
            <>
              {bottomPosts.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[var(--line)] space-y-3">
                  <BookOpen size={32} className="mx-auto text-[var(--muted)] opacity-60" />
                  <h3 className="text-base font-sans font-semibold text-[var(--ink)]">
                    {blogsList.length === 0 ? "No articles published yet" : `No articles found in "${activeCategory}"`}
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                    {blogsList.length === 0
                      ? "New articles and insights will appear here once published."
                      : 'Try selecting "All Articles" or a different category to view articles.'}
                  </p>
                  {blogsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory("All Articles")}
                      className="mt-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[var(--ink)] text-[var(--bg)] cursor-pointer"
                    >
                      View All Articles
                    </button>
                  )}
                </div>
              ) : (
                <div className={`flex flex-col ${hasExternalArticles ? "lg:flex-row items-start justify-between gap-10 xl:gap-14" : ""} w-full`}>
                  {/* Left Side: Article Listing */}
                  <div className={`w-full ${hasExternalArticles ? "lg:w-[65%] xl:w-[67%] max-w-[760px]" : "max-w-[850px]"} flex flex-col`}>
                    {bottomPosts.map((post, idx) => (
                      <ScrollReveal key={post.id} delay={idx * 0.04}>
                        <BlogCard post={post} />
                      </ScrollReveal>
                    ))}
                  </div>

                  {/* Right Side: External Articles & Publications (Medium, LinkedIn) */}
                  {hasExternalArticles && (
                    <div className="w-full lg:w-[35%] xl:w-[33%] shrink-0 pt-10 lg:pt-0 border-t border-[var(--line)] lg:border-t-0">
                      <ExternalArticlesSidebar isAdmin={isAdmin} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4. FIELD NOTE DETAIL READER MODAL */}
      <FieldNoteDetailModal
        note={selectedNote}
        isOpen={isNoteDetailOpen}
        onClose={() => {
          setIsNoteDetailOpen(false);
          setSelectedNote(null);
        }}
        notesList={filteredFieldNotes}
        allNotes={filteredFieldNotes}
        onSelectNote={(note) => setSelectedNote(note)}
      />

      {/* 6. CREATE FIELD NOTE MODAL (Triggerable right from Articles page) */}
      <CreateFieldNoteModal
        isOpen={isCreateNoteModalOpen}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onNoteCreated={() => {
          // Note is successfully stored and visible in the list without abrupt modal flash
        }}
      />
    </div>
  );
}
