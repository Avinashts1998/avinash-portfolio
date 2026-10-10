import { ReactNode } from "react";

export interface TimelineEntry {
  date: string;
  title: string;
  subtitle?: string;
  location?: string;
  description: string;
}

interface TimelineProps {
  items: TimelineEntry[];
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative border-l border-[var(--line)] ml-3 pl-8 space-y-10">
      {items.map((item, idx) => (
        <div key={idx} className="relative group">
          {/* Timeline Connector Dot centered on the left border */}
          <div className="absolute -left-[36px] top-1.5 w-2 h-2 rounded-full border border-[var(--bg)] bg-[var(--muted)] group-hover:bg-[var(--blue)] group-hover:scale-125 transition-all duration-200" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] block">
              {item.date}
            </span>
            <h4 className="text-sm font-sans font-semibold text-[var(--ink)]">
              {item.title}
            </h4>
            {item.subtitle && (
              <div className="text-xs font-mono text-[var(--blue)] font-medium">
                {item.subtitle}
                {item.location && (
                  <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                    {" | "}
                    <span className="text-black dark:text-white font-medium">{item.location}</span>
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed max-w-[580px] pt-1">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
