import React from "react";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="w-full pt-6 pb-24 sm:pb-28 mt-auto border-t border-[var(--line)] bg-[var(--bg)] transition-colors duration-200"
    >
      <div className="max-w-[1150px] 2xl:max-w-[1360px] min-[1900px]:max-w-[1440px] mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 2xl:pl-8 2xl:pr-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs 2xl:text-[13px] font-mono text-[var(--muted)]">
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
