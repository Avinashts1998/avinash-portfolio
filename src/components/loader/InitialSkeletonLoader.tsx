import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

interface InitialSkeletonLoaderProps {
  onComplete: () => void;
}

export default function InitialSkeletonLoader({ onComplete }: InitialSkeletonLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const minLoadTime = 750; // Minimum time to prevent jarring flicker
    const maxTimeout = 1200; // Safeguard maximum timeout

    const handleReady = () => {
      timer = setTimeout(() => {
        onComplete();
      }, minLoadTime);
    };

    if (document.readyState === "complete") {
      handleReady();
    } else {
      window.addEventListener("load", handleReady, { once: true });
      // Fallback safeguard timeout in case 'load' already fired or stalled
      timer = setTimeout(() => {
        onComplete();
      }, maxTimeout);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", handleReady);
    };
  }, [onComplete]);

  return (
    <motion.div
      id="initial-skeleton-loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 0.35, ease: "easeOut" }}
      className="fixed inset-0 z-[150] bg-[var(--bg)] w-full h-full overflow-y-auto no-scrollbar pointer-events-auto select-none"
      aria-label="Loading page content"
      role="status"
    >
      <div className="min-h-screen flex flex-col justify-between">
        {/* 1. Header / Navbar Skeleton */}
        <header className="sticky top-0 z-30 w-full pt-4 pb-3 bg-[var(--bg)]/90 backdrop-blur-md">
          <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-6">
            <div className="relative flex items-center justify-between p-1.5 rounded-full bg-neutral-900/[0.03] dark:bg-[#18181b] border border-black/[0.05] dark:border-white/10 h-[50px]">
              {/* Left side: Logo & AI Search Bar placeholder */}
              <div className="flex items-center pl-2.5 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-md skeleton-box shrink-0" />
                <div className="h-3.5 w-[1px] mx-3 shrink-0 bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-7 w-44 sm:w-64 rounded-full skeleton-box flex items-center px-3" />
              </div>

              {/* Right side: Nav links & Resume pill */}
              <div className="flex items-center gap-2 pr-1.5 shrink-0">
                <div className="hidden sm:block h-4 w-14 rounded-md skeleton-box mx-1.5" />
                <div className="hidden sm:block h-4 w-12 rounded-md skeleton-box mx-1.5" />
                <div className="h-7 w-20 sm:w-24 rounded-full skeleton-box" />
              </div>
            </div>
          </div>
        </header>

        {/* 2. Main Content Skeleton (Hero + Selected Works) */}
        <main className="flex-1 w-full max-w-[1150px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-16 space-y-16 sm:space-y-20">
          {/* Hero Section Skeleton */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-2">
            {/* Left Column: Avatar, Status, Headline, Bio, Buttons */}
            <div className="lg:col-span-7 space-y-6">
              {/* Avatar + Status Pill */}
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full skeleton-box shrink-0 border border-neutral-200/60 dark:border-zinc-800/60" />
                <div className="space-y-1.5">
                  <div className="h-6 w-36 sm:w-44 rounded-full skeleton-box" />
                  <div className="h-3.5 w-24 rounded-md skeleton-box" />
                </div>
              </div>

              {/* Display Headline */}
              <div className="space-y-2.5 pt-1">
                <div className="h-10 sm:h-12 w-[90%] rounded-xl skeleton-box" />
                <div className="h-10 sm:h-12 w-[65%] rounded-xl skeleton-box" />
              </div>

              {/* Bio description */}
              <div className="space-y-2 pt-1 max-w-xl">
                <div className="h-4 w-full rounded-md skeleton-box" />
                <div className="h-4 w-[92%] rounded-md skeleton-box" />
                <div className="h-4 w-[78%] rounded-md skeleton-box" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="h-11 w-32 sm:w-36 rounded-full skeleton-box" />
                <div className="h-11 w-32 sm:w-36 rounded-full skeleton-box" />
              </div>

              {/* Social / Location pills */}
              <div className="flex items-center gap-2 pt-2">
                <div className="h-8 w-24 rounded-full skeleton-box" />
                <div className="h-8 w-8 rounded-full skeleton-box" />
                <div className="h-8 w-8 rounded-full skeleton-box" />
                <div className="h-8 w-8 rounded-full skeleton-box" />
              </div>
            </div>

            {/* Right Column: Hero Showcase Card Skeleton */}
            <div className="lg:col-span-5 hidden lg:flex justify-center">
              <div className="w-full max-w-[440px] aspect-[4/3] rounded-3xl skeleton-box border border-neutral-200/80 dark:border-zinc-800/80 p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded-md skeleton-box" />
                  <div className="h-4 w-12 rounded-full skeleton-box" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 rounded-lg skeleton-box" />
                  <div className="h-4 w-1/2 rounded-md skeleton-box" />
                </div>
              </div>
            </div>
          </section>

          {/* Selected Works Showcase Grid Skeleton */}
          <section className="space-y-6 pt-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="h-7 w-44 rounded-lg skeleton-box" />
              <div className="h-6 w-20 rounded-full skeleton-box" />
            </div>

            {/* 3-card project grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/2] w-full rounded-2xl skeleton-box border border-neutral-200/80 dark:border-zinc-800/80" />
                  <div className="space-y-1.5 px-1">
                    <div className="h-5 w-3/4 rounded-md skeleton-box" />
                    <div className="h-4 w-1/3 rounded-md skeleton-box" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </motion.div>
  );
}
