import React from "react";
import { Layers, Sparkles, Compass } from "lucide-react";
import ScrollReveal from "../layout/ScrollReveal";

interface CardData {
  id: string;
  headline: string;
  paragraph: string;
  icon: "layers" | "systems" | "sparkles" | "compass";
}

function SystemsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="5" rx="1.5" />
      <rect x="2" y="16" width="5" height="5" rx="1.5" />
      <rect x="9.5" y="16" width="5" height="5" rx="1.5" />
      <rect x="17" y="16" width="5" height="5" rx="1.5" />
      <path d="M12 8v4" />
      <path d="M4.5 12h15" />
      <path d="M4.5 12v4" />
      <path d="M12 12v4" />
      <path d="M19.5 12v4" />
    </svg>
  );
}

const CARDS: CardData[] = [
  {
    id: "enterprise",
    headline: "Simplify enterprise complexity",
    paragraph:
      "Sophisticated software made obvious to use. Six years inside the edge cases, constraints, and high-stakes flows.",
    icon: "layers",
  },
  {
    id: "systems",
    headline: "Think systems at scale",
    paragraph:
      "Patterns that scale. Decisions that hold up across the whole product, not just the screen in review.",
    icon: "systems",
  },
  {
    id: "ai",
    headline: "Thoughtful AI integration",
    paragraph:
      "Intelligence woven into the workflow, not bolted on top. Less effort for users, more impact per decision.",
    icon: "sparkles",
  },
  {
    id: "execution",
    headline: "Ship ambiguity into outcomes",
    paragraph:
      "Unclear brief in. Shipped product out. Scope, tradeoffs, and decisions owned end-to-end.",
    icon: "compass",
  },
];

export default function WhatIBringScrollTrigger() {
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Section Header */}
      <ScrollReveal delay={0.1} className="max-w-[720px] space-y-3">
        <h2 className="text-[2.2rem] md:text-[2.9rem] lg:text-[3.5rem] font-hero font-bold tracking-tight leading-[1.1] text-[var(--ink)]">
          What I <span className="text-[var(--blue)]">bring</span>
        </h2>
        <p className="text-[15px] md:text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans font-normal max-w-[640px]">
          A research-driven approach that connects user needs, business goals, and design decisions to create intuitive, scalable, and impactful product experiences.
        </p>
      </ScrollReveal>

      {/* 2x2 Cards Grid matching reference design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
        {CARDS.map((card, index) => (
          <ScrollReveal key={card.id} delay={0.05 * (index + 1)}>
            <div className="group relative h-full bg-[#ebebeb] dark:bg-[#18181b] rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 lg:p-6.5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col justify-start">
              {/* Icon Container */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-neutral-800/90 border border-black/[0.06] dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 mb-3.5 sm:mb-4 group-hover:scale-105 transition-transform duration-300 shrink-0 shadow-2xs">
                {card.icon === "layers" && (
                  <Layers size={18} strokeWidth={1.8} className="text-neutral-800 dark:text-neutral-200" />
                )}
                {card.icon === "systems" && (
                  <SystemsIcon className="w-[18px] h-[18px] text-neutral-800 dark:text-neutral-200" />
                )}
                {card.icon === "sparkles" && (
                  <Sparkles size={18} strokeWidth={1.8} className="text-neutral-800 dark:text-neutral-200" />
                )}
                {card.icon === "compass" && (
                  <Compass size={18} strokeWidth={1.8} className="text-neutral-800 dark:text-neutral-200" />
                )}
              </div>

              {/* Headline */}
              <h3 className="text-lg sm:text-[19px] md:text-xl font-sans font-bold tracking-tight text-[var(--ink)] leading-[1.25] mb-2 sm:mb-2.5">
                {card.headline}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-[13px] md:text-[13.5px] text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
                {card.paragraph}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
