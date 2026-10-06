import React, { useState } from "react";
import { X } from "reicon-react";

interface KeyContributionsInputProps {
  keyContributions: string[];
  onChange: (keys: string[]) => void;
  maxKeys?: number;
  label?: string;
}

export default function KeyContributionsInput({
  keyContributions = [],
  onChange,
  maxKeys = 10,
  label = "Key Contributions",
}: KeyContributionsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addKey = (rawVal: string) => {
    const trimmed = rawVal.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (keyContributions.length >= maxKeys) return;

    // Avoid duplicate (case insensitive)
    const exists = keyContributions.some(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      onChange([...keyContributions, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKey(inputValue);
    } else if (e.key === "Backspace" && !inputValue && keyContributions.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(keyContributions.slice(0, -1));
    }
  };

  const removeKey = (indexToRemove: number) => {
    onChange(keyContributions.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs tracking-wider uppercase text-[var(--ink-soft)] font-medium block">
          {label} <span className="text-[var(--muted)] lowercase font-normal">(maximum {maxKeys})</span>
        </label>
        <span className="text-[11px] font-mono text-[var(--muted)] font-medium">
          {keyContributions.length}/{maxKeys}
        </span>
      </div>

      {/* Input container box showing pills inside */}
      <div
        className={`w-full min-h-[50px] p-2.5 rounded-xl bg-[var(--card)] border transition-all flex flex-wrap items-center gap-2 cursor-text ${
          keyContributions.length >= maxKeys
            ? "border-[var(--line)] bg-[var(--bg)]/50"
            : "border-[var(--line)] hover:border-[var(--ink-soft)]/40 focus-within:border-[var(--blue)] focus-within:ring-2 focus-within:ring-[var(--blue)]/20"
        }`}
        onClick={(e) => {
          const inputEl = e.currentTarget.querySelector("input");
          if (inputEl) inputEl.focus();
        }}
      >
        {/* Added Tag Pills inside input field */}
        {keyContributions.map((keyItem, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--line)]/70 text-[var(--ink)] font-sans text-xs font-semibold border border-[var(--line)] shadow-2xs group transition-colors hover:bg-[var(--line)]"
          >
            <span>{keyItem}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeKey(index);
              }}
              className="text-[var(--ink-soft)] hover:text-red-500 rounded-full p-0.5 transition-colors cursor-pointer"
              title="Remove tag"
            >
              <X size={13} />
            </button>
          </span>
        ))}

        {/* Text Input inside the box */}
        {keyContributions.length < maxKeys && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                addKey(inputValue);
              }
            }}
            placeholder={
              keyContributions.length === 0
                ? "Type key contribution (e.g. UX Research, UI Design) & press Enter..."
                : "Add another key..."
            }
            className="flex-1 min-w-[160px] bg-transparent border-none outline-none text-xs font-sans text-[var(--ink)] placeholder:text-[var(--muted)] py-1 no-focus-outline"
          />
        )}
      </div>
    </div>
  );
}
