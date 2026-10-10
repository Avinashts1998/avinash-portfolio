import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, Check } from "reicon-react";

export interface DropdownOption<T = string> {
  label: string;
  value: T;
}

export interface CustomDropdownProps<T = string> {
  id?: string;
  menuId?: string;
  label?: string;
  value: T;
  options: (DropdownOption<T> | string)[];
  placeholder?: string;
  onChange: (val: T) => void;
  variant?: "pill" | "form" | "compact";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  align?: "left" | "right";
  direction?: "up" | "down" | "auto";
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
}

export function CustomDropdown<T extends string = string>({
  id,
  menuId,
  label,
  value,
  options,
  placeholder = "Select an option",
  onChange,
  variant = "form",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  disabled = false,
  align = "left",
  direction = "down",
  ariaLabel,
  size = "md",
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const shouldReduceMotion = useReducedMotion();

  // Normalize options into DropdownOption<T> objects
  const normalizedOptions: DropdownOption<T>[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt as T } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value || placeholder;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Adjust focus when keyboard navigating through options
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex, isOpen]);

  // Isolate scroll so scrolling inside the dropdown never scrolls the background page
  useEffect(() => {
    if (!isOpen) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = menuEl;
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1;

      // Prevent page scroll chaining when hitting top or bottom boundary
      if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = menuEl;
      const isScrollable = scrollHeight > clientHeight;
      if (!isScrollable) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    menuEl.addEventListener("wheel", handleWheel, { passive: false });
    menuEl.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      menuEl.removeEventListener("wheel", handleWheel);
      menuEl.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      const currentIdx = normalizedOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % normalizedOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + normalizedOptions.length) % normalizedOptions.length
      );
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        onChange(normalizedOptions[highlightedIndex].value);
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  // Base styles per variant
  const getTriggerStyles = () => {
    if (variant === "pill") {
      return `h-10 px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all duration-300 flex items-center justify-between gap-2.5 text-xs font-medium tracking-wider uppercase text-[var(--ink)] cursor-pointer select-none outline-none focus:ring-2 focus:ring-[var(--blue)]/30 font-mono ${triggerClassName}`;
    }

    if (variant === "compact") {
      return `px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)] transition-all flex items-center justify-between gap-2 text-xs font-medium text-[var(--ink)] cursor-pointer select-none outline-none focus:ring-2 focus:ring-[var(--blue)]/30 ${triggerClassName}`;
    }

    // Default form variant
    const sizeClasses =
      size === "sm"
        ? "px-3.5 py-2 text-xs rounded-xl"
        : size === "lg"
        ? "px-4 py-3.5 text-base rounded-xl"
        : "px-4 py-2.5 text-sm rounded-xl";

    const hasTriggerBorderOverride = triggerClassName.includes("border-none") || triggerClassName.includes("border-0");
    const borderClasses = hasTriggerBorderOverride
      ? ""
      : `border ${
          isOpen
            ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/20"
            : "border-[var(--line)] hover:border-[var(--ink-soft)]/40"
        }`;

    return `w-full ${sizeClasses} bg-[var(--bg)] ${borderClasses} text-sans text-[var(--ink)] font-normal flex items-center justify-between transition-all duration-200 cursor-pointer select-none outline-none focus:ring-2 focus:ring-[var(--blue)]/30 focus:border-[var(--blue)] ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${triggerClassName}`;
  };

  const getMenuStyles = () => {
    const alignment = align === "right" ? "right-0" : "left-0";
    const width = variant === "pill" ? "w-56" : "w-full min-w-[180px]";
    const hasMenuBorderOverride = menuClassName.includes("border-none") || menuClassName.includes("border-0");
    const borderClasses = hasMenuBorderOverride ? "" : "border border-[var(--line)]";
    const verticalPos = direction === "up" ? "bottom-full mb-2" : "top-full mt-2";

    return `absolute ${verticalPos} ${alignment} ${width} bg-[var(--card)] ${borderClasses} rounded-2xl shadow-dropdown p-1.5 z-50 outline-none max-h-64 overflow-y-auto overscroll-contain touch-pan-y no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${menuClassName}`;
  };

  return (
    <div id={id} className={`relative ${variant === "pill" ? "inline-block shrink-0" : "w-full"} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              const currentIdx = normalizedOptions.findIndex((opt) => opt.value === value);
              setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
            }
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || "Select option"}
        className={getTriggerStyles()}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={variant === "pill" ? 13 : 15}
          className={`text-[var(--ink-soft)] shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            ref={menuRef}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : (direction === "up" ? 8 : -8), scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : (direction === "up" ? 8 : -8), scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className={getMenuStyles()}
            style={{ overscrollBehavior: "contain", scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleDropdownKeyDown}
          >
            {normalizedOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${opt.value}-${idx}`}
                  ref={(el) => (optionRefs.current[idx] = el)}
                  role="option"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between transition-colors cursor-pointer select-none font-normal ${
                    isSelected
                      ? "bg-[var(--blue)]/10 text-[var(--blue)] font-medium"
                      : isHighlighted
                      ? "bg-[var(--line)]/50 text-[var(--ink)]"
                      : "text-[var(--ink)] hover:bg-[var(--line)]/40"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-[var(--blue)] shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomDropdown;
