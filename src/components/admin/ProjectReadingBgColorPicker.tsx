import React, { useState, useEffect } from "react";
import { Check, Palette, RotateCcw, Sparkles } from "lucide-react";

interface ProjectReadingBgColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

// Preset colors explicitly requested by user: White, Black, and EFEFF0
const READING_BG_PRESETS = [
  { id: "white", color: "#FFFFFF", label: "White", desc: "Default clean white" },
  { id: "black", color: "#000000", label: "Black", desc: "Deep immersive dark" },
  { id: "efeff0", color: "#EFEFF0", label: "#EFEFF0", desc: "Soft neutral off-white" },
];

/**
 * Calculates perceived luminance of a hex color (0 to 1) to determine appropriate text contrast
 */
export function getLuminance(hexColor: string): number {
  if (!hexColor) return 1;
  const hex = hexColor.replace("#", "").trim();
  if (hex.length !== 3 && hex.length !== 6) return 1;
  
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  // Standard relative luminance formula
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export default function ProjectReadingBgColorPicker({
  value = "",
  onChange,
  className = "",
}: ProjectReadingBgColorPickerProps) {
  // Normalize current color
  const activeColor = value ? (value.startsWith("#") ? value.toUpperCase() : `#${value}`.toUpperCase()) : "#FFFFFF";
  
  // Local state for hex input text to allow typing
  const [hexInput, setHexInput] = useState<string>(activeColor.replace("#", ""));

  useEffect(() => {
    if (value) {
      setHexInput(value.replace("#", "").toUpperCase());
    } else {
      setHexInput("FFFFFF");
    }
  }, [value]);

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cleanVal = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6).toUpperCase();
    setHexInput(cleanVal);

    if (cleanVal.length === 3 || cleanVal.length === 6) {
      onChange(`#${cleanVal}`);
    }
  };

  const handleNativeColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.value.toUpperCase();
    setHexInput(picked.replace("#", ""));
    onChange(picked);
  };

  const isLight = getLuminance(activeColor) >= 0.55;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
            <Palette size={13} className="text-blue-600 dark:text-blue-400" />
            <span>Project Reading Page Background</span>
          </h4>
          <p className="text-[11px] text-[var(--ink-soft)] font-sans mt-0.5">
            Choose the reading page background color or enter a custom hexcode.
          </p>
        </div>

        {value && value.toUpperCase() !== "#FFFFFF" && (
          <button
            type="button"
            onClick={() => {
              onChange("#FFFFFF");
              setHexInput("FFFFFF");
            }}
            className="text-[11px] font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset to default white"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Preset Swatches Row */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold block">
          Default Options
        </label>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {READING_BG_PRESETS.map((preset) => {
            const isSelected = activeColor === preset.color.toUpperCase();
            const isPresetLight = getLuminance(preset.color) >= 0.55;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.color);
                  setHexInput(preset.color.replace("#", ""));
                }}
                className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group text-center ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/40 shadow-xs scale-[1.02]"
                    : "border-black/10 dark:border-white/10 hover:border-blue-500/40 hover:scale-[1.01]"
                }`}
                style={{ backgroundColor: preset.color }}
              >
                {/* Active Check Indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shadow-xs transition-transform ${
                    isPresetLight ? "bg-black/10 text-black" : "bg-white/20 text-white"
                  } ${isSelected ? "scale-100" : "opacity-0 group-hover:opacity-40"}`}
                >
                  <Check size={12} strokeWidth={2.8} />
                </div>

                <div className="space-y-0.5">
                  <span
                    className={`block text-xs font-sans font-bold leading-tight ${
                      isPresetLight ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {preset.label}
                  </span>
                  <span
                    className={`block text-[10px] font-mono leading-none opacity-75 ${
                      isPresetLight ? "text-neutral-600" : "text-neutral-300"
                    }`}
                  >
                    {preset.color}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker & Hex Code Input */}
      <div className="pt-2 border-t border-[var(--line)]/60 space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold block">
          Custom Hexcode & Color Picker
        </label>
        
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Visual Picker Swatch with Native Color Wheel Trigger */}
          <div
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-black/15 dark:border-white/20 shadow-xs shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:scale-105 transition-transform"
            style={{ backgroundColor: activeColor }}
            title="Click to open color palette wheel"
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isLight ? "bg-black/15 text-black" : "bg-white/25 text-white"
              }`}
            >
              <Palette size={12} strokeWidth={2.5} />
            </div>

            <input
              type="color"
              value={activeColor.length === 7 ? activeColor : "#FFFFFF"}
              onChange={handleNativeColorPick}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              aria-label="Pick custom background color"
            />
          </div>

          {/* Hexcode Text Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-soft)] font-mono text-xs">
              #
            </div>
            <input
              type="text"
              maxLength={6}
              value={hexInput}
              onChange={handleHexInputChange}
              placeholder="EFEFF0"
              className="w-full h-11 sm:h-12 pl-7 pr-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm font-mono font-medium text-[var(--ink)] placeholder-[var(--ink-soft)]/50 uppercase transition-all outline-none"
            />
          </div>

          {/* Quick Apply Indicator */}
          <div
            className="h-11 sm:h-12 px-3 rounded-xl border border-[var(--line)] flex items-center justify-center gap-1.5 text-xs font-mono font-semibold shrink-0"
            style={{ backgroundColor: activeColor, color: isLight ? "#0b0b0c" : "#ffffff" }}
          >
            <span>{activeColor}</span>
          </div>
        </div>
      </div>

      {/* Live Reading Page Preview Banner */}
      <div
        className="p-3 sm:p-3.5 rounded-xl border border-black/10 dark:border-white/10 transition-colors shadow-2xs space-y-1"
        style={{ backgroundColor: activeColor }}
      >
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-semibold opacity-70"
          style={{ color: isLight ? "#46464b" : "#a1a1aa" }}
        >
          <span className="flex items-center gap-1">
            <Sparkles size={11} />
            <span>Reading Page Live Preview</span>
          </span>
          <span>{isLight ? "Light Mode Contrast" : "Dark Mode Contrast"}</span>
        </div>
        <p
          className="text-sm font-sans font-bold tracking-tight leading-snug"
          style={{ color: isLight ? "#0b0b0c" : "#f4f4f5" }}
        >
          Smart Soil | UIUX Design - Agriculture Product
        </p>
        <p
          className="text-xs font-sans leading-relaxed line-clamp-1 opacity-80"
          style={{ color: isLight ? "#46464b" : "#d4d4d8" }}
        >
          Sample description text showing dynamic contrast on {activeColor} background.
        </p>
      </div>
    </div>
  );
}
