import { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  variant?: "brand" | "accent" | "success" | "neutral";
  className?: string;
  key?: string | number;
}

export default function Tag({ children, variant = "neutral", className = "", ...props }: TagProps) {
  const styles = {
    brand: "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20",
    accent: "bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20",
    success: "bg-brand-secondary/10 text-brand-secondary dark:bg-brand-secondary/20",
    neutral: "bg-bg-tertiary text-text-secondary border border-border-custom",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${styles[variant]} transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
