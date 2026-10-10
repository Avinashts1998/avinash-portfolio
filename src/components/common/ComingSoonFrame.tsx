import React from "react";
import { Image as ImageIcon, Sparkles } from "reicon-react";

interface ComingSoonFrameProps {
  title?: string;
  subtitle?: string;
  aspectRatio?: string; // e.g., "aspect-video", "aspect-[16/10]", "aspect-square"
  className?: string;
  iconSize?: number;
  compact?: boolean;
}

export default function ComingSoonFrame({
  title = "Coming Soon",
  subtitle = "Image / Case study visual preview under preparation",
  aspectRatio = "aspect-[16/10]",
  className = "",
  iconSize = 28,
  compact = false,
}: ComingSoonFrameProps) {
  if (compact) {
    return (
      <div
        className={`w-full ${aspectRatio} rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)]/80 flex flex-col items-center justify-center p-3 text-center group transition-all duration-300 relative overflow-hidden ${className}`}
      >
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--ink) 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 shrink-0">
          <ImageIcon size={18} />
        </div>
        <span className="text-[11px] font-hero font-semibold text-[var(--ink)] tracking-tight">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${aspectRatio} rounded-2xl border-2 border-dashed border-[var(--line)] hover:border-blue-500/40 bg-gradient-to-b from-[var(--bg)]/90 via-[var(--card)] to-[var(--bg)] p-6 flex flex-col items-center justify-center text-center group transition-all duration-300 relative overflow-hidden shadow-xs ${className}`}
    >
      {/* Background Subtle Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(var(--ink) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Glow highlight */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/15 transition-all" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-[280px]">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all duration-300 shadow-xs">
          <ImageIcon size={iconSize} />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={10} />
          <span>Visual Preview</span>
        </div>

        <h4 className="text-sm sm:text-base font-hero font-bold text-[var(--ink)] tracking-tight">
          {title}
        </h4>

        {subtitle && (
          <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
