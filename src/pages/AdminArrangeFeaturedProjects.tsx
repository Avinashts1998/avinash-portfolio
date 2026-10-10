import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GripVertical,
  RotateCcw,
  Check,
  FolderGit2,
  ExternalLink,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { dataStore, Project } from "../utils/dataStore";
import { sortProjectsByLatest } from "../services/projectService";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import { isAdminAuthenticated } from "../utils/auth";

export default function AdminArrangeFeaturedProjects() {
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  const [featuredSlots, setFeaturedSlots] = useState<Project[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize data
  useEffect(() => {
    const projects = dataStore.getProjects();
    const savedOrder = dataStore.getFeaturedProjectsOrder();
    const homeEligible = projects.filter((p) => p.homeItem !== false);

    let initialSlots: Project[] = [];
    if (savedOrder && savedOrder.length > 0) {
      const remaining = [...homeEligible];
      for (const id of savedOrder) {
        const foundIdx = remaining.findIndex((p) => p.id === id || p.slug === id);
        if (foundIdx !== -1) {
          initialSlots.push(remaining[foundIdx]);
          remaining.splice(foundIdx, 1);
        }
      }
      const sortedRemaining = sortProjectsByLatest(remaining);
      while (initialSlots.length < 5 && sortedRemaining.length > 0) {
        initialSlots.push(sortedRemaining.shift()!);
      }
    } else {
      initialSlots = sortProjectsByLatest(homeEligible).slice(0, 5);
    }

    setFeaturedSlots(initialSlots);
  }, []);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...featuredSlots];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);

    setFeaturedSlots(updated);
    setHasUnsavedChanges(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Reset to chronological order
  const handleResetToDefault = () => {
    const projects = dataStore.getProjects();
    const homeEligible = projects.filter((p) => p.homeItem !== false);
    const sorted = sortProjectsByLatest(homeEligible).slice(0, 5);
    setFeaturedSlots(sorted);
    setHasUnsavedChanges(true);
    showToast("Reset arrangement to latest chronological order.");
  };

  // Save the arrangement
  const handleSave = () => {
    const orderIds = featuredSlots.map((p) => p.id);
    dataStore.saveFeaturedProjectsOrder(orderIds);
    setIsSavedRecently(true);
    setHasUnsavedChanges(false);
    showToast("Featured projects arrangement saved successfully!");
    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2500);
  };

  // Render a Full-Width Slot Card (Slots 0, 3, 4)
  const renderFullSlotCard = (index: number, slotLabel: string) => {
    const project = featuredSlots[index];
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index && draggedIndex !== index;

    if (!project) {
      return (
        <div
          key={`empty-${index}`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className="w-full h-32 rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--card)]/40 p-6 flex items-center justify-between text-[var(--muted)]"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-semibold flex items-center justify-center">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-sans font-medium text-[var(--ink)]">{slotLabel}</p>
              <p className="text-xs text-[var(--muted)]">Drag a project here</p>
            </div>
          </div>
        </div>
      );
    }

    const thumb = Array.isArray(project.thumbnail) ? project.thumbnail[0] : project.thumbnail;
    const optimizedThumb = thumb ? getOptimizedImageUrl(thumb, 800) : "";

    return (
      <div
        key={project.id || `slot-${index}`}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={`group relative rounded-3xl p-5 sm:p-6 border transition-all duration-200 bg-[var(--card)] shadow-xs ${
          isDragging
            ? "opacity-40 scale-[0.99] ring-2 ring-[var(--blue)] border-transparent"
            : isDragOver
            ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/40 bg-[var(--blue)]/5 scale-[1.005]"
            : "border-[var(--line)] hover:border-[var(--ink-soft)]/40 hover:shadow-md"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 min-w-0 flex-1">
          {/* Slot Number & Drag Handle */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-semibold flex items-center justify-center shadow-2xs">
              {index + 1}
            </span>
            <div
              className="text-[var(--muted)] hover:text-[var(--ink)] cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-[var(--line)]/50 transition-colors"
              title="Drag to reorder slot"
            >
              <GripVertical size={18} />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="relative w-full sm:w-60 md:w-72 aspect-[16/10] rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--line)] shrink-0 flex items-center justify-center group-hover:border-[var(--blue)]/30 transition-colors">
            {optimizedThumb ? (
              <img
                src={optimizedThumb}
                alt={project.title}
                className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="text-[var(--muted)] flex flex-col items-center justify-center gap-2">
                <FolderGit2 size={24} />
                <span className="text-xs font-mono">No Image Available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-lg sm:text-xl font-sans font-semibold text-[var(--ink)] truncate" title={project.title}>
              {project.title}
            </h3>

            <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans line-clamp-2 leading-relaxed">
              {project.description || "No description specified for this case study."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render a Half-Width Slot Card (Slots 1, 2)
  const renderHalfSlotCard = (index: number, slotLabel: string) => {
    const project = featuredSlots[index];
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index && draggedIndex !== index;

    if (!project) {
      return (
        <div
          key={`empty-${index}`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className="w-full h-64 rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--card)]/40 p-6 flex flex-col items-center justify-center text-center gap-2 text-[var(--muted)]"
        >
          <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-semibold flex items-center justify-center">
            {index + 1}
          </span>
          <p className="text-sm font-sans font-medium text-[var(--ink)]">{slotLabel}</p>
          <p className="text-xs text-[var(--muted)]">Drag a project here</p>
        </div>
      );
    }

    const thumb = Array.isArray(project.thumbnail) ? project.thumbnail[0] : project.thumbnail;
    const optimizedThumb = thumb ? getOptimizedImageUrl(thumb, 600) : "";

    return (
      <div
        key={project.id || `slot-${index}`}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        className={`group relative rounded-3xl p-5 sm:p-6 border transition-all duration-200 bg-[var(--card)] shadow-xs flex flex-col justify-between gap-4 ${
          isDragging
            ? "opacity-40 scale-[0.99] ring-2 ring-[var(--blue)] border-transparent"
            : isDragOver
            ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/40 bg-[var(--blue)]/5 scale-[1.005]"
            : "border-[var(--line)] hover:border-[var(--ink-soft)]/40 hover:shadow-md"
        }`}
      >
        {/* Card Header: Slot badge & Drag handle */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--line)]/60">
          <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-semibold flex items-center justify-center shadow-2xs">
            {index + 1}
          </span>

          <div
            className="text-[var(--muted)] hover:text-[var(--ink)] cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-[var(--line)]/50 transition-colors"
            title="Drag to reorder slot"
          >
            <GripVertical size={18} />
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center group-hover:border-[var(--blue)]/30 transition-colors">
          {optimizedThumb ? (
            <img
              src={optimizedThumb}
              alt={project.title}
              className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="text-[var(--muted)] flex flex-col items-center justify-center gap-2">
              <FolderGit2 size={24} />
              <span className="text-xs font-mono">No Image Available</span>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-sans font-semibold text-[var(--ink)] truncate" title={project.title}>
            {project.title}
          </h3>
          <p className="text-xs text-[var(--ink-soft)] font-sans line-clamp-2 leading-relaxed">
            {project.description || "No description available."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-8 px-4 sm:px-6 lg:px-8 w-full max-w-[1200px] mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[110] bg-[var(--card)] border border-[var(--line)] shadow-dropdown px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-sans font-medium animate-in fade-in slide-in-from-top-4">
          <Sparkles size={16} className="text-[var(--blue)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[var(--ink)] font-sans text-xs sm:text-[13px] font-medium flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent select-none whitespace-nowrap shadow-xs active:scale-95 shrink-0"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            <span className="font-medium">Back to Admin</span>
          </Link>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-medium bg-[var(--card)] hover:bg-[var(--line)]/50 text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--line)] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Open live homepage in a new tab"
          >
            <ExternalLink size={13} />
            <span>Preview Homepage</span>
          </Link>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-[var(--line)]/50 border border-[var(--line)] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Reset to newest chronological order"
          >
            <RotateCcw size={13} />
            <span>Reset to Chronological</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-sans font-semibold text-white transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-sm ${
              isSavedRecently
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-[var(--blue)] hover:bg-[var(--blue-hover)] active:scale-98"
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check size={15} strokeWidth={2.5} />
                <span>Arrangement Saved!</span>
              </>
            ) : (
              <>
                <Check size={15} strokeWidth={2.5} />
                <span>Save Arrangement</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page Title & Intro Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[var(--blue)]/10 text-[var(--blue)]">
            <LayoutGrid size={20} />
          </span>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-[var(--ink)] tracking-tight">
            Arrange Featured Projects
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-3xl leading-relaxed">
          The homepage displays 5 featured projects. Drag and drop cards to reorder which case studies fill each slot.
        </p>
      </div>

      {/* Main Spacious Grid Showcase */}
      <div className="space-y-6">
        {/* Row 1: Slot 1 (Full Width Hero Showcase) */}
        <div>
          {renderFullSlotCard(0, "Slot 1 · Top Hero Showcase")}
        </div>

        {/* Row 2: Slot 2 & Slot 3 (Two-Column Grid) */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderHalfSlotCard(1, "Slot 2 · Grid Left")}
            {renderHalfSlotCard(2, "Slot 3 · Grid Right")}
          </div>
        </div>

        {/* Row 3: Slot 4 (Full Width Middle Showcase) */}
        <div>
          {renderFullSlotCard(3, "Slot 4 · Middle Showcase")}
        </div>

        {/* Row 4: Slot 5 (Full Width Bottom Showcase) */}
        <div>
          {renderFullSlotCard(4, "Slot 5 · Final Showcase")}
        </div>
      </div>
    </div>
  );
}
