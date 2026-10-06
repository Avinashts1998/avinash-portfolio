import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, FolderGit2 } from "lucide-react";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import { dataStore } from "../../utils/dataStore";
import { projectService, getHomeFeaturedProjects } from "../../services/projectService";

interface ProjectItem {
  id: string;
  title: string;
  category?: string;
  thumbnail?: string | string[];
  year?: string;
  month?: string;
  isLive?: boolean;
  isNew?: boolean;
  [key: string]: any;
}

interface ProjectsGridQuickMenuProps {
  projects?: ProjectItem[];
}

export default function ProjectsGridQuickMenu({ projects: propProjects }: ProjectsGridQuickMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(() => {
    if (propProjects && propProjects.length > 0) return propProjects;
    return dataStore.getProjects();
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjectsList(propProjects);
    }
  }, [propProjects]);

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((updated) => {
      if (updated && updated.length > 0) {
        setProjectsList(updated);
      }
    });

    const handleUpdate = () => {
      const current = dataStore.getProjects();
      if (current && current.length > 0) {
        setProjectsList(current);
      }
    };
    window.addEventListener("portfolio_data_update", handleUpdate);

    return () => {
      unsub();
      window.removeEventListener("portfolio_data_update", handleUpdate);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const active = isHovered || isOpen;
  const springTransition = { type: "spring" as const, stiffness: 350, damping: 22 };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3x3 Grid Dots Icon Button (matches chip background, no border line, white dots with hover spread/contract effect) */}
      <button
        id="projects-quick-grid-trigger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Quick view all projects in grid"
        aria-expanded={isOpen}
        className={`group w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] bg-[#ebebeb] hover:bg-[#dfdfdf] dark:bg-[#ebebeb] flex items-center justify-center p-2.5 transition-all duration-300 shadow-sm shadow-black/[0.02] hover:shadow active:scale-95 cursor-pointer select-none outline-none ${
          isOpen ? "ring-2 ring-[var(--blue)] ring-offset-2 dark:ring-offset-neutral-900 bg-[#dfdfdf]" : ""
        }`}
        title="Quick view all projects"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-5 h-5 sm:w-6 sm:h-6 overflow-visible"
        >
          {/* Top Row */}
          <motion.circle
            cx={22}
            cy={22}
            r={10}
            fill="#ffffff"
            animate={{
              cx: active ? 16 : 22,
              cy: active ? 16 : 22,
              scale: active ? 1.06 : 1,
            }}
            transition={springTransition}
          />
          <motion.circle
            cx={50}
            cy={22}
            r={10}
            fill="#ffffff"
            animate={{
              cx: 50,
              cy: active ? 16 : 22,
              scale: active ? 1.04 : 1,
            }}
            transition={springTransition}
          />
          <motion.circle
            cx={78}
            cy={22}
            r={10}
            fill="#ffffff"
            animate={{
              cx: active ? 84 : 78,
              cy: active ? 16 : 22,
              scale: active ? 1.06 : 1,
            }}
            transition={springTransition}
          />

          {/* Middle Row */}
          <motion.circle
            cx={22}
            cy={50}
            r={10}
            fill="#ffffff"
            animate={{
              cx: active ? 16 : 22,
              cy: 50,
              scale: active ? 1.04 : 1,
            }}
            transition={springTransition}
          />
          <motion.circle
            cx={50}
            cy={50}
            r={10}
            fill="#ffffff"
            animate={{
              scale: active ? 1.15 : 1,
            }}
            transition={springTransition}
          />
          <motion.circle
            cx={78}
            cy={50}
            r={10}
            fill="#ffffff"
            animate={{
              cx: active ? 84 : 78,
              cy: 50,
              scale: active ? 1.04 : 1,
            }}
            transition={springTransition}
          />

          {/* Bottom Row */}
          <motion.circle
            cx={22}
            cy={78}
            r={10}
            fill="#ffffff"
            animate={{
              cx: active ? 16 : 22,
              cy: active ? 84 : 78,
              scale: active ? 1.06 : 1,
            }}
            transition={springTransition}
          />
          <motion.circle
            cx={50}
            cy={78}
            r={10}
            fill="#ffffff"
            animate={{
              cx: 50,
              cy: active ? 84 : 78,
              scale: active ? 1.04 : 1,
            }}
            transition={springTransition}
          />
          <motion.circle
            cx={78}
            cy={78}
            r={10}
            fill="#ffffff"
            animate={{
              cx: active ? 84 : 78,
              cy: active ? 84 : 78,
              scale: active ? 1.06 : 1,
            }}
            transition={springTransition}
          />
        </svg>
      </button>

      {/* Popover Grid Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="projects-quick-grid-popup"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute right-0 top-full mt-2.5 z-50 ${
              projectsList.length === 1
                ? "w-[280px] sm:w-[320px]"
                : projectsList.length === 2
                ? "w-[320px] sm:w-[420px]"
                : "w-[330px] sm:w-[460px] md:w-[520px]"
            } bg-white/95 dark:bg-[#151518]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.08] rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-3.5 sm:p-4 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.07]">
              <h4 className="text-sm font-sans font-semibold text-[var(--ink)] dark:text-neutral-100 tracking-tight">
                All Created Projects
              </h4>

              <Link
                to="/projects"
                onClick={() => setIsOpen(false)}
                className="group/link text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--blue)] dark:text-neutral-400 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <span>Browse All</span>
                <ArrowUpRight
                  size={13}
                  className="transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                />
              </Link>
            </div>

            {/* Scrollable Project Grid */}
            {projectsList.length > 0 ? (
              (() => {
                const displayProjects = getHomeFeaturedProjects(projectsList as any);
                return (
                  <div
                    className={`grid ${
                      displayProjects.length === 1
                        ? "grid-cols-1"
                        : displayProjects.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 sm:grid-cols-3"
                    } gap-2.5 max-h-[380px] overflow-y-auto pr-0.5 select-none custom-scrollbar`}
                  >
                    {displayProjects.map((project) => {
                      const thumb = Array.isArray(project.thumbnail)
                        ? project.thumbnail[0]
                        : project.thumbnail;
                      const optimizedThumb = thumb ? getOptimizedImageUrl(thumb, 400) : "";

                      return (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      onClick={() => setIsOpen(false)}
                      className="group relative flex flex-col p-2 rounded-[14px] bg-neutral-50/80 dark:bg-neutral-900/60 hover:bg-white dark:hover:bg-neutral-800/90 border border-black/[0.04] dark:border-white/[0.05] hover:border-black/10 dark:hover:border-white/15 transition-all duration-200 hover:shadow-sm"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-[16/10] rounded-[10px] overflow-hidden bg-neutral-200/60 dark:bg-neutral-800 mb-2 flex items-center justify-center">
                        {optimizedThumb ? (
                          <img
                            src={optimizedThumb}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-200/70 dark:bg-neutral-800 text-neutral-400">
                            <FolderGit2 size={18} />
                          </div>
                        )}

                        {/* Live Badge */}
                        {project.isLive && (
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="space-y-0.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-sans font-semibold text-[var(--ink)] dark:text-white line-clamp-1 group-hover:text-[var(--blue)] transition-colors">
                          {project.title}
                        </p>
                        <p className="text-[11px] font-sans text-[var(--ink-soft)] dark:text-neutral-400 line-clamp-1">
                          {project.category || project.year || "Design"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })()
        ) : (
              <div className="py-6 text-center text-xs text-neutral-400">
                No projects added yet
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
