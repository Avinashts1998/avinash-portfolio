import React from "react";
import { Check, Palette } from "lucide-react";

interface ProjectTileColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

// 4 curated preset colors (1st is Default, followed by 3 popular tones)
const PRESET_COLORS = [
  { id: "default", color: "", label: "Default" },
  { id: "navy", color: "#0f172a", label: "Navy" },
  { id: "indigo", color: "#1e1b4b", label: "Indigo" },
  { id: "emerald", color: "#064e3b", label: "Emerald" },
];

export default function ProjectTileColorPicker({
  value = "",
  onChange,
  className = "",
}: ProjectTileColorPickerProps) {
  const normalizedValue = (value || "").toLowerCase();
  const isPreset = PRESET_COLORS.some((p) => p.color.toLowerCase() === normalizedValue);
  const isCustom = Boolean(value && !isPreset);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    onChange(newColor);
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xs space-y-3.5 ${className}`}>
      {/* Headline */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
          Pick tile color
        </h4>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* 5 Squares in a single horizontal row */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Square 1: Default Neutral Color */}
        <button
          type="button"
          onClick={() => onChange("")}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center transition-all cursor-pointer overflow-hidden group ${
            !value
              ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/40 shadow-xs"
              : "border-[var(--line)] hover:border-[var(--ink-soft)]/50"
          }`}
          title="Default color"
        >
          <div className="absolute inset-0 bg-[#ebebeb] dark:bg-[#18181b]" />
          {!value && (
            <div className="relative z-10 w-5 h-5 rounded-full bg-black/60 dark:bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Check size={13} className="text-white" strokeWidth={3} />
            </div>
          )}
        </button>

        {/* Squares 2, 3, 4: Presets */}
        {PRESET_COLORS.slice(1).map((preset) => {
          const isSelected = normalizedValue === preset.color.toLowerCase();
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.color)}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center transition-all cursor-pointer overflow-hidden group ${
                isSelected
                  ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/40 shadow-xs scale-[1.02]"
                  : "border-black/10 dark:border-white/10 hover:border-[var(--ink-soft)]/50 hover:scale-[1.02]"
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.label}
            >
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Check size={13} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}

        {/* Square 5: Custom Color Picker */}
        <div
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center transition-all cursor-pointer overflow-hidden group ${
            isCustom
              ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/40 shadow-xs scale-[1.02]"
              : "border-[var(--line)] hover:border-[var(--ink-soft)]/50 bg-[var(--bg)] hover:scale-[1.02]"
          }`}
          style={{
            backgroundColor: isCustom ? value : undefined,
          }}
          title="Choose custom color"
        >
          {isCustom ? (
            <div className="w-5 h-5 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center pointer-events-none z-0">
              <Check size={13} className="text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-[var(--ink-soft)] group-hover:text-[var(--ink)] transition-colors pointer-events-none z-0">
              <Palette size={19} strokeWidth={2} />
            </div>
          )}

          {/* Transparent native color input covering the square */}
          <input
            type="color"
            value={value && value.startsWith("#") ? value : "#1e293b"}
            onChange={handleCustomColorChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            title="Pick custom color"
          />
        </div>
      </div>
    </div>
  );
}
