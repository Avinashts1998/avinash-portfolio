import React, { useState, useEffect, useMemo } from "react";
import { Plus, Sparkles, Image as ImageIcon, Type, Layout } from "lucide-react";
import { FieldNote, FieldNoteFilter } from "../types/fieldNotes";
import { fieldNotesService } from "../services/fieldNotesService";
import { FieldNoteCard } from "../components/fieldNotes/FieldNoteCard";
import { FieldNoteDetailModal } from "../components/fieldNotes/FieldNoteDetailModal";
import { CreateFieldNoteModal } from "../components/fieldNotes/CreateFieldNoteModal";
import { isAdminAuthenticated } from "../utils/auth";
import ScrollReveal from "../components/layout/ScrollReveal";

const FILTER_TABS: { key: FieldNoteFilter; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "All" },
  { key: "photos", label: "Photos" },
  { key: "thoughts", label: "Thoughts" },
  { key: "design", label: "Design" },
];

export default function FieldNotes() {
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [activeFilter, setActiveFilter] = useState<FieldNoteFilter>("all");
  const [selectedNote, setSelectedNote] = useState<FieldNote | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());

  useEffect(() => {
    window.scrollTo(0, 0);
    const checkAuth = () => setIsAdmin(isAdminAuthenticated());
    checkAuth();
    window.addEventListener("portfolio_admin_auth_changed", checkAuth);

    const unsubscribe = fieldNotesService.subscribe((updatedNotes) => {
      setNotes(updatedNotes);
    });

    return () => {
      window.removeEventListener("portfolio_admin_auth_changed", checkAuth);
      unsubscribe();
    };
  }, []);

  // Filter notes
  const filteredNotes = useMemo(() => {
    if (activeFilter === "all") return notes;
    if (activeFilter === "photos") return notes.filter((n) => n.type === "photo");
    if (activeFilter === "thoughts") return notes.filter((n) => n.type === "text");
    if (activeFilter === "design") return notes.filter((n) => n.type === "design");
    return notes;
  }, [notes, activeFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: notes.length,
      photos: notes.filter((n) => n.type === "photo").length,
      thoughts: notes.filter((n) => n.type === "text").length,
      design: notes.filter((n) => n.type === "design").length,
    };
  }, [notes]);

  // Distribute notes into columns for responsive masonry layout
  const cols3 = useMemo(() => {
    const cols: FieldNote[][] = [[], [], []];
    filteredNotes.forEach((note, i) => cols[i % 3].push(note));
    return cols;
  }, [filteredNotes]);

  const cols2 = useMemo(() => {
    const cols: FieldNote[][] = [[], []];
    filteredNotes.forEach((note, i) => cols[i % 2].push(note));
    return cols;
  }, [filteredNotes]);

  const handleOpenNote = (note: FieldNote) => {
    setSelectedNote(note);
    setIsDetailModalOpen(true);
  };

  return (
    <div id="page-field-notes" className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans selection:bg-[var(--blue-tint)] selection:text-[var(--blue)]">
      <main className="max-w-[1150px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-28">
        {/* 1. HERO SECTION */}
        <section className="mb-10 sm:mb-14">
          <ScrollReveal delay={0.05}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--line)]">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[var(--ink-soft)] uppercase">
                  <span className="w-2 h-2 rounded-full bg-[var(--blue)]"></span>
                  <span>Personal Digital Notebook</span>
                </div>
                
                <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-[var(--ink)] tracking-tight leading-[1.08]">
                  Field Notes
                </h1>
                
                <p className="font-serif italic text-lg sm:text-xl text-[var(--ink-soft)] leading-relaxed pt-1">
                  “Small thoughts, observations, and things I notice along the way.”
                </p>
              </div>

              {/* Action: Add Note */}
              <div className="shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2 group"
                >
                  <Plus size={15} strokeWidth={2.5} className="transition-transform group-hover:rotate-90 duration-200" />
                  <span>Add a Note</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* 2. FILTER TABS */}
          <ScrollReveal delay={0.1}>
            <div className="pt-6 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilter === tab.key;
                  const count = counts[tab.key];

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFilter(tab.key)}
                      className={`relative px-4 py-2 rounded-full text-xs sm:text-[13px] font-sans font-medium transition-all duration-200 shrink-0 cursor-pointer select-none inline-flex items-center gap-2 ${
                        isActive
                          ? "bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] shadow-xs font-semibold"
                          : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/60 dark:hover:bg-zinc-800/40 border border-transparent"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)]"
                            : "text-[var(--ink-soft)] opacity-70"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:block text-xs font-mono text-[var(--ink-soft)] tracking-wider">
                {filteredNotes.length} {filteredNotes.length === 1 ? "entry" : "entries"}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* 3. RESPONSIVE MASONRY / EDITORIAL GRID */}
        {filteredNotes.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[var(--line)] rounded-3xl bg-[var(--card)]/30 max-w-lg mx-auto p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-[var(--ink-soft)]">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="font-hero font-bold text-lg text-[var(--ink)]">No notes in this category yet</h3>
              <p className="text-xs text-[var(--ink-soft)] font-sans">
                Select another filter or capture the very first observation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Note</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop 3 Columns */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
              {cols3.map((colNotes, colIdx) => (
                <div key={`col3-${colIdx}`} className="space-y-6">
                  {colNotes.map((note) => (
                    <FieldNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleOpenNote(note)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Tablet 2 Columns */}
            <div className="hidden sm:grid lg:hidden sm:grid-cols-2 gap-5 items-start">
              {cols2.map((colNotes, colIdx) => (
                <div key={`col2-${colIdx}`} className="space-y-5">
                  {colNotes.map((note) => (
                    <FieldNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleOpenNote(note)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile 1 Column */}
            <div className="sm:hidden space-y-4">
              {filteredNotes.map((note) => (
                <FieldNoteCard
                  key={note.id}
                  note={note}
                  onClick={() => handleOpenNote(note)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Note Detail Modal */}
      <FieldNoteDetailModal
        note={selectedNote}
        notesList={filteredNotes}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedNote(null);
        }}
        onSelectNote={(note) => setSelectedNote(note)}
      />

      {/* Create Note Modal */}
      <CreateFieldNoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onNoteCreated={(newNote) => {
          setSelectedNote(newNote);
          setIsDetailModalOpen(true);
        }}
        initialType={activeFilter === "photos" ? "photo" : activeFilter === "design" ? "design" : "text"}
      />
    </div>
  );
}
