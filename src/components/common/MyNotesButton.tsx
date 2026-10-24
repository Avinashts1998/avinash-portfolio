import React from "react";
import { Link } from "react-router-dom";

interface MyNotesButtonProps {
  className?: string;
  innerClassName?: string;
  innerStyle?: React.CSSProperties;
  size?: "sm" | "md" | "lg";
}

export const MyNotesButton: React.FC<MyNotesButtonProps> = ({
  className = "",
  innerClassName = "",
  innerStyle,
  size = "md",
}) => {
  const handleClick = () => {
    try {
      sessionStorage.setItem("portfolio_active_blog_tab", "My Notes");
    } catch {}
  };

  const paddingClass =
    size === "sm"
      ? "px-3.5 sm:px-4 py-1.5 text-xs sm:text-[13px]"
      : size === "lg"
      ? "px-6 sm:px-7 2xl:px-8 py-3 2xl:py-3.5 text-sm md:text-[15px] 2xl:text-base"
      : "px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-[13px] md:text-sm";

  return (
    <Link
      to="/blog?tab=notes"
      onClick={handleClick}
      className={`group relative inline-flex p-[1.5px] rounded-full overflow-hidden transition-all duration-300 shrink-0 cursor-pointer select-none shadow-none hover:scale-[1.03] active:scale-95 ${className}`}
      title="Quick access to My Notes"
      aria-label="Quick access to My Notes"
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
        style={innerStyle}
        className={`relative z-10 ${paddingClass} ${innerClassName} rounded-full font-sans font-semibold transition-colors duration-150 inline-flex items-center justify-center whitespace-nowrap bg-[var(--bg)] group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 text-[var(--ink-soft)] group-hover:text-[var(--ink)]`}
      >
        My Notes
      </span>
    </Link>
  );
};

export default MyNotesButton;
