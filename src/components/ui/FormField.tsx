import React from "react";

interface FormFieldProps {
  label: string;
  id: string;
  type?: "text" | "email" | "textarea";
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rows?: number;
}

export default function FormField({
  label,
  id,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  rows = 4,
}: FormFieldProps) {
  const inputClasses = "w-full px-4 py-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-sans text-[var(--ink)] placeholder-[var(--muted)] hover:border-[var(--ink-soft)] focus:border-[var(--blue)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)] transition-all duration-200 shadow-sm";

  return (
    <div className="space-y-1.5 w-full">
      <label
        htmlFor={id}
        className="block text-[10px] font-mono uppercase tracking-widest text-[var(--ink-soft)] font-semibold select-none"
      >
        {label} {required && <span className="text-[var(--blue)]">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          name={id}
          rows={rows}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${inputClasses} resize-none`}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={inputClasses}
        />
      )}
    </div>
  );
}
