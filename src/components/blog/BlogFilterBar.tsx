import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BlogCategory, BlogSortOption } from "../../types/blog";
import CustomDropdown, { DropdownOption } from "../ui/CustomDropdown";

interface BlogFilterBarProps {
  categories: BlogCategory[];
  activeCategory: BlogCategory;
  onSelectCategory: (category: BlogCategory) => void;
  activeSort: BlogSortOption;
  onSelectSort: (sort: BlogSortOption) => void;
  totalResultsCount: number;
  onBack?: (e?: React.MouseEvent) => void;
}

const SORT_OPTIONS: DropdownOption<BlogSortOption>[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Popular" },
];

export default function BlogFilterBar({
  categories,
  activeCategory,
  onSelectCategory,
  activeSort,
  onSelectSort,
  onBack,
}: BlogFilterBarProps) {
  return (
    <div className="w-full flex items-center justify-between gap-3 sm:gap-6 border-none shadow-none">
      {/* Go Back button to Home */}
      <div className="flex items-center shrink-0">
        <Link
          to="/"
          onClick={onBack}
          className="h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none whitespace-nowrap shadow-none shrink-0 active:scale-95"
          title="Go back to home page"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          <span>Go Back</span>
        </Link>
      </div>

      {/* 1. Category Navigation Menu */}
      <nav
        className="flex-1 flex items-center gap-5 sm:gap-7 md:gap-9 overflow-x-auto no-scrollbar"
        aria-label="Article categories menu"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const isNotes = category === "My Notes" || category === "Learning & Thinking Notes";

          if (isNotes) {
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
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
                  className={`relative z-10 px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-[13px] font-sans font-semibold transition-colors duration-150 inline-flex items-center justify-center ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      : "bg-[var(--bg)] group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 text-[var(--ink-soft)] group-hover:text-[var(--ink)]"
                  }`}
                >
                  {category}
                </span>
              </button>
            );
          }

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`relative px-1.5 py-3 text-sm sm:text-[15px] font-sans transition-colors duration-150 shrink-0 cursor-pointer select-none ${
                isActive
                  ? "text-[var(--blue)] dark:text-blue-400 font-semibold"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              <span>{category}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[var(--blue)] dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 2. Sort Filter Dropdown */}
      <div className="flex items-center justify-end shrink-0 py-1">
        <CustomDropdown<BlogSortOption>
          id="blog-sort-dropdown"
          menuId="blog-sort-menu"
          variant="pill"
          value={activeSort}
          options={SORT_OPTIONS}
          onChange={onSelectSort}
          align="right"
          ariaLabel="Sort articles by date or popularity"
          triggerClassName="!h-auto !min-h-0 !py-1.5 !px-3.5 !rounded-full !normal-case !font-sans !tracking-normal text-xs sm:text-[13px] !font-medium shrink-0 !leading-normal border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-neutral-800/70 hover:border-[var(--blue)] transition-all"
          menuClassName="w-44 sm:w-48 max-h-80 no-scrollbar !rounded-2xl"
        />
      </div>
    </div>
  );
}
