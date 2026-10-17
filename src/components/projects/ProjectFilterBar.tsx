import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import CustomDropdown from "../ui/CustomDropdown";

export interface ProjectFilterBarProps {
  categoryOptions?: string[];
  categories?: string[];
  selectedCategory?: string;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedType?: string;
  typeOptions?: string[];
  onSelectType?: (type: string) => void;
  isFiltered?: boolean;
  onResetFilters?: () => void;
  totalResultsCount?: number;
  onBack?: (e?: React.MouseEvent) => void;
  hideFilters?: boolean;
  hideBackButton?: boolean;
}

export default function ProjectFilterBar({
  categoryOptions,
  categories,
  selectedCategory,
  activeCategory,
  onSelectCategory = () => {},
  selectedType = "All Types",
  typeOptions = ["All Types"],
  onSelectType = () => {},
  isFiltered = false,
  onResetFilters,
  onBack,
  hideFilters = false,
  hideBackButton = false,
}: ProjectFilterBarProps) {
  const effectiveCategory = selectedCategory || activeCategory || "All Categories";
  const effectiveCategoryOptions = categoryOptions || categories || ["All Categories"];

  return (
    <div className="w-full flex items-center justify-between gap-3 sm:gap-6 border-none shadow-none">
      {/* Go Back button to Home (Shown in desktop view, hidden in mobile view) */}
      {!hideBackButton && (
        <div className="hidden min-[769px]:flex items-center shrink-0">
          <Link
            to="/"
            onClick={onBack}
            className="h-8 px-3 sm:px-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-200/90 dark:border-white/10 select-none whitespace-nowrap shadow-xs shrink-0 active:scale-95"
            title="Go back to home page"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            <span className="font-medium">Go Back</span>
          </Link>
        </div>
      )}

      {/* Right Side: Reset Action + Category Filter Dropdown + Type Filter Dropdown */}
      {!hideFilters && (
        <div className="flex items-center justify-end shrink-0 py-1 gap-2 sm:gap-2.5 ml-auto">
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset Filters"
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Category Filter Dropdown */}
          <CustomDropdown<string>
            id="project-category-dropdown"
            menuId="project-category-menu"
            variant="pill"
            value={effectiveCategory}
            options={effectiveCategoryOptions}
            onChange={onSelectCategory}
            align="right"
            ariaLabel="Filter projects by category"
            triggerClassName="!h-auto !min-h-0 !py-1.5 !px-3.5 !rounded-full !normal-case !font-sans !tracking-normal text-xs sm:text-[13px] !font-medium shrink-0 !leading-normal border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-neutral-800/70 hover:border-[var(--blue)] transition-all"
            menuClassName="w-56 max-h-80 no-scrollbar !rounded-2xl"
          />

          {/* Type Filter Dropdown */}
          <CustomDropdown<string>
            id="project-type-dropdown"
            menuId="project-type-menu"
            variant="pill"
            value={selectedType}
            options={typeOptions}
            onChange={onSelectType}
            align="right"
            ariaLabel="Filter projects by type"
            triggerClassName="!h-auto !min-h-0 !py-1.5 !px-3.5 !rounded-full !normal-case !font-sans !tracking-normal text-xs sm:text-[13px] !font-medium shrink-0 !leading-normal border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-neutral-800/70 hover:border-[var(--blue)] transition-all"
            menuClassName="w-48 max-h-80 no-scrollbar !rounded-2xl"
          />
        </div>
      )}
    </div>
  );
}
