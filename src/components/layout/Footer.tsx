import React from "react";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="w-full py-6 mt-auto border-t border-[var(--line)] bg-[var(--bg)] transition-colors duration-200"
    >
      <div className="max-w-[1150px] mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--muted)]">
        <div>
          <span>&copy; 2026 Avinash Shajan. All rights reserved.</span>
        </div>
        <div className="text-[var(--ink-soft)]">
          Imagined and built using Claude Code & Google AI Studio
        </div>
      </div>
    </footer>
  );
}
