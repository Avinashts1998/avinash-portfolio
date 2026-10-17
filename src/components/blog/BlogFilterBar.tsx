import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BlogCategory, BlogSortOption } from "../../types/blog";

interface BlogFilterBarProps {
  categories: BlogCategory[];
  activeCategory: BlogCategory;
  onSelectCategory: (category: BlogCategory) => void;
  activeSort?: BlogSortOption;
  onSelectSort?: (sort: BlogSortOption) => void;
  totalResultsCount: number;
  onBack?: (e?: React.MouseEvent) => void;
}

export default function BlogFilterBar({
  categories,
  activeCategory,
  onSelectCategory,
  onBack,
}: BlogFilterBarProps) {
  // Separate "My Notes" from the standard article categories
  const notesCategory =
    categories.find(
      (c) => c === "My Notes" || c === "Learning & Thinking Notes"
    ) || "My Notes";

  const articleCategories = categories.filter(
    (c) => c !== "My Notes" && c !== "Learning & Thinking Notes"
  );

  const isNotesActive =
    activeCategory === "My Notes" || activeCategory === "Learning & Thinking Notes";

  return (
    <div className="w-full flex items-center justify-between gap-3 sm:gap-6 border-none shadow-none relative">
      {/* Go Back button to Home (Hidden in mobile view) */}
      <div className="hidden min-[769px]:flex items-center shrink-0">
        <Link
          to="/"
          onClick={onBack}
          className="max-[768px]:hidden h-8 px-3 sm:px-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none whitespace-nowrap shadow-none shrink-0 active:scale-95"
          title="Go back to home page"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          <span className="font-medium">Go Back</span>
        </Link>
      </div>

      {/* 1. Category Navigation Menu (Horizontally scrollable and clipped before right side) */}
      <div className="flex-1 min-w-0 relative overflow-hidden flex items-center ml-0 min-[769px]:ml-[70px]">
        <nav
          className="w-full flex items-center gap-5 sm:gap-7 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-1 pr-4"
          aria-label="Article categories menu"
        >
          {articleCategories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`relative px-1.5 py-2 text-sm sm:text-[15px] font-sans transition-colors duration-150 shrink-0 cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? "text-[var(--blue)] dark:text-blue-400 font-semibold"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 font-medium"
                }`}
              >
                <span>{category}</span>
              </button>
            );
          })}
        </nav>
        {/* Subtle right-edge fade mask so scrolling category items fade out cleanly before the pinned right button */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent" />
      </div>

      {/* 2. Pinned Right Side: "My Notes" item */}
      <div className="shrink-0 flex items-center justify-end pl-1 sm:pl-2">
        <button
          type="button"
          onClick={() => onSelectCategory(notesCategory)}
          className="group relative inline-flex p-[1.5px] rounded-full overflow-hidden transition-all duration-200 shrink-0 cursor-pointer select-none self-center my-auto shadow-none"
        >
          {/* Luminous beam using custom palette: #F05326, #FBD914, #119161, #1D68A2, #4A255B, #91211D */}
          <span
            className="absolute inset-[-150%] animate-strip-light pointer-events-none"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 120deg, #F05326 150deg, #FBD914 190deg, #119161 230deg, #1D68A2 270deg, #9B43C3 310deg, #91211D 340deg, #F05326 360deg)",
            }}
          />
          <span
            className={`relative z-10 px-3.5 sm:px-4.5 py-1.5 rounded-full text-xs sm:text-[13px] font-sans font-semibold transition-colors duration-150 inline-flex items-center justify-center whitespace-nowrap ${
              isNotesActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "bg-[var(--bg)] group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 text-[var(--ink-soft)] group-hover:text-[var(--ink)]"
            }`}
          >
            {notesCategory}
          </span>
        </button>
      </div>
    </div>
  );
}
