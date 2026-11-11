import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
      ? "pl-3.5 pr-4 py-1.5 text-xs sm:text-[13px]"
      : size === "lg"
      ? "pl-5 pr-6 py-3 text-sm md:text-[15px] 2xl:text-base"
      : "pl-4 pr-5 py-2 sm:py-2.5 text-xs sm:text-[13px] md:text-sm";

  return (
    <Link
      to="/blog?tab=notes"
      onClick={handleClick}
      className={`group relative inline-flex p-[1.5px] rounded-full overflow-hidden transition-all duration-300 shrink-0 cursor-pointer select-none shadow-none active:scale-95 ${className}`}
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
        className={`relative z-10 overflow-hidden ${paddingClass} ${innerClassName} rounded-full font-sans font-semibold inline-flex items-center justify-center whitespace-nowrap bg-[var(--bg)] transition-colors duration-400`}
      >
        {/* Expanding Circle Layer originating from the left dot position */}
        <span
          aria-hidden="true"
          className="absolute left-[14px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--blue)] dark:bg-white pointer-events-none transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[65] group-hover:duration-[800ms] group-hover:ease-[cubic-bezier(0.35,0.05,0.2,1)] will-change-transform"
        />

        {/* Content layer */}
        <div className="relative z-10 flex items-center gap-1.5 text-[var(--ink)] transition-colors duration-400 group-hover:text-white dark:group-hover:text-[#18181b] group-hover:delay-100">
          <span className="w-2 h-2 rounded-full opacity-0 shrink-0 pointer-events-none" aria-hidden="true" />
          <span className="whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.35,0.05,0.2,1)] group-hover:-translate-x-3">
            My Notes
          </span>
        </div>

        {/* Bolder Arrow positioned absolutely on the right */}
        <span
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white dark:text-[#18181b] transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:delay-250"
        >
          <ArrowRight size={13} strokeWidth={2.8} className="shrink-0" />
        </span>
      </span>
    </Link>
  );
};

export default MyNotesButton;
