import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  className?: string;
}

export default function Card({ children, hoverable = true, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none rounded-2xl p-6 overflow-hidden transition-all duration-300 ${
        hoverable ? "hover:shadow-md hover:border-[var(--blue)]/30 hover:translate-y-[-2px]" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
