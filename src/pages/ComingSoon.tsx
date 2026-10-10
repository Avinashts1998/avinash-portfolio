import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Check, 
  Loader2, 
  Mail, 
  Sparkles, 
  ExternalLink,
  Eye,
  CheckCircle2
} from "lucide-react";
import { subscriptionService, SubscribeResponse } from "../services/subscriptionService";
import EmailPreviewModal from "../components/common/EmailPreviewModal";

export default function ComingSoon() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [subscriptionResult, setSubscriptionResult] = useState<SubscribeResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await subscriptionService.subscribe(email, "coming_soon_page");
      if (res.success) {
        setSubscriptionResult(res);
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || "Unable to subscribe at this moment.");
      }
    } catch (err: any) {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setEmail("");
    setErrorMessage("");
    setSubscriptionResult(null);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-between py-8 sm:py-12 relative overflow-hidden">
      {/* Top back navigation */}
      <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-6 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none whitespace-nowrap shadow-xs active:scale-95 shrink-0"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          <span className="font-medium">Go Back</span>
        </button>
      </div>

      {/* Main Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative z-10 my-auto">
        {/* Subtle Radial Glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] bg-neutral-500/[0.04] dark:bg-neutral-400/[0.03] rounded-full blur-3xl pointer-events-none" 
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl mx-auto flex flex-col items-center"
        >
          {/* Giant Clean Modern Heading */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-sans font-semibold tracking-tight text-neutral-400 dark:text-zinc-500 select-none leading-none mb-6 sm:mb-8">
            Coming Soon
          </h1>

          {/* Subheading with highlighted 'Subscribe' keyword */}
          <p className="text-base sm:text-lg md:text-xl text-[var(--ink-soft)] max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
            I'm working on it. Ready for something new?{" "}
            <span className="text-[var(--blue)] font-semibold">Subscribe</span> to get the latest updates when it goes live.
          </p>

          {/* Form / Success State */}
          <div className="w-full max-w-[480px]">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="subscribe-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col items-center w-full"
                >
                  {/* Rounded Pill Container with full-width rounded input */}
                  <div className="relative w-full flex items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Please enter your email address"
                      disabled={isLoading}
                      required
                      className="w-full h-12 sm:h-14 pl-5 sm:pl-6 pr-32 sm:pr-36 rounded-full bg-neutral-100/95 dark:bg-zinc-850/95 border border-neutral-200/80 dark:border-white/10 text-sm sm:text-[14.5px] text-[var(--ink)] placeholder:text-neutral-400 dark:placeholder:text-zinc-500 font-sans shadow-xs outline-none focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/40 transition-all"
                      style={{ borderRadius: "9999px" }}
                    />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="absolute right-1.5 sm:right-2 h-9 sm:h-10 px-5 sm:px-7 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-[13px] font-semibold tracking-wide transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Subscribe</span>
                      )}
                    </button>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-rose-500 mt-2.5 font-medium"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                </motion.form>
              ) : (
                <motion.div
                  key="subscribe-success"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="w-full py-3.5 px-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm sm:text-base font-medium text-center shadow-xs"
                >
                  You are subscribed.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Subtle Footer Note */}
      <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-6 text-center text-xs text-[var(--muted)] pt-6">
        <span>No spam. Only high-signal product design & craft updates.</span>
      </div>

      {/* Email Preview Modal */}
      {subscriptionResult && (
        <EmailPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          email={subscriptionResult.email}
          subject={subscriptionResult.emailSubject || "You're subscribed! Welcome to Avinash's Design Updates 🎉"}
          htmlContent={subscriptionResult.emailHtml || ""}
          previewUrl={subscriptionResult.previewUrl}
        />
      )}
    </div>
  );
}
