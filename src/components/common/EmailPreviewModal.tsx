import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, CheckCircle, ExternalLink } from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  subject: string;
  htmlContent: string;
  previewUrl?: string;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  email,
  subject,
  htmlContent,
  previewUrl,
}: EmailPreviewModalProps) {
  useScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] z-10"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between bg-neutral-50/80 dark:bg-zinc-850/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--blue-tint)] text-[var(--blue)] flex items-center justify-center shrink-0">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle size={11} /> Sent
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono truncate">
                      To: {email}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--ink)] truncate mt-0.5">
                    {subject}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-medium text-[var(--blue)] hover:bg-[var(--blue-tint)] rounded-md flex items-center gap-1 transition-colors"
                  >
                    <span>Inbox View</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-neutral-200 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Email Body Iframe / Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100 dark:bg-zinc-950">
              <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden max-w-[600px] mx-auto text-neutral-900">
                <iframe
                  title="Confirmation Email Preview"
                  srcDoc={htmlContent}
                  className="w-full h-[450px] sm:h-[500px] border-none"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-between text-xs text-[var(--muted)] bg-neutral-50/50 dark:bg-zinc-850/50">
              <span>This email was dispatched via portfolio subscription service.</span>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
