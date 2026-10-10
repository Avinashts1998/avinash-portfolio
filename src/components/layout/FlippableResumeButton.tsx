import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Download, LogIn, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/auth";

interface FlippableResumeButtonProps {
  onOpenResume: () => void;
  className?: string;
  isMobile?: boolean;
}

export default function FlippableResumeButton({
  onOpenResume,
  className = "",
  isMobile = false,
}: FlippableResumeButtonProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdTriggeredRef = useRef(false);
  const pressStartTimeRef = useRef(0);

  // Sync admin authentication state
  useEffect(() => {
    const handleAuthChange = () => {
      setIsAdmin(isAdminAuthenticated());
    };
    window.addEventListener("portfolio_data_update", handleAuthChange);
    window.addEventListener("portfolio_admin_auth_changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("portfolio_data_update", handleAuthChange);
      window.removeEventListener("portfolio_admin_auth_changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsPressing(false);
    setHoldProgress(0);
  };

  const startHold = () => {
    clearHold();
    holdTriggeredRef.current = false;
    pressStartTimeRef.current = Date.now();
    setIsPressing(true);
    setHoldProgress(0);

    const HOLD_DURATION = 600; // ms
    const INTERVAL = 30; // ms update

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / HOLD_DURATION) * 100));
      setHoldProgress(progress);
      if (elapsed >= HOLD_DURATION) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, INTERVAL);

    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      setIsFlipped((prev) => !prev);
      setIsPressing(false);
      setHoldProgress(0);

      // Gentle haptic feedback if supported
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        try {
          window.navigator.vibrate(40);
        } catch (_) {
          // ignore
        }
      }
    }, HOLD_DURATION);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    const wasHoldTriggered = holdTriggeredRef.current;
    clearHold();

    // If hold was triggered to flip the card, don't execute button click action
    if (wasHoldTriggered) {
      return;
    }

    // Quick click action
    if (!isFlipped) {
      onOpenResume();
    } else {
      navigate(isAdmin ? "/admin" : "/admin-login");
    }
  };

  const handlePointerCancel = () => {
    clearHold();
  };

  return (
    <div
      className={`relative inline-block select-none shrink-0 transition-[width,height] duration-300 ease-out ${
        isMobile
          ? "w-full h-[48px]"
          : `${isFlipped ? "w-[110px] sm:w-[132px] 2xl:w-[148px]" : "w-[82px] sm:w-[106px] 2xl:w-[120px]"} h-[32px] sm:h-[38px] 2xl:h-[42px]`
      } ${className}`}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isPressing ? 0.94 : 1,
        }}
        transition={{
          rotateY: { duration: 0.7, ease: [0.25, 1, 0.35, 1] },
          scale: { duration: 0.2, ease: "easeOut" },
        }}
        onPointerDown={startHold}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        role="button"
        tabIndex={0}
        aria-label={
          isFlipped
            ? isAdmin
              ? "Admin Console (Press and hold to flip back to Resume)"
              : "Admin Login (Press and hold to flip back to Resume)"
            : "Resume (Press and hold to flip to Admin Login)"
        }
        title={
          isFlipped
            ? isAdmin
              ? "Admin Console • Press & hold to flip back"
              : "Admin Login • Press & hold to flip back"
            : "Resume • Press & hold to flip"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isFlipped) {
              onOpenResume();
            } else {
              navigate(isAdmin ? "/admin" : "/admin-login");
            }
          }
        }}
      >
        {/* FRONT SIDE: Resume Button */}
        <div
          className={`absolute inset-0 w-full h-full rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white flex items-center justify-center gap-1 sm:gap-1.5 2xl:gap-2 group px-2 sm:px-3.5 2xl:px-4 text-xs sm:text-[13px] 2xl:text-[14px] font-sans font-medium transition-colors duration-200 shadow-xs overflow-hidden ${
            isMobile ? "text-sm" : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            marginLeft: "5px",
            paddingLeft: "7px",
          }}
        >
          <Download
            size={13}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 shrink-0 group-hover:translate-y-0.5 transition-transform duration-200"
          />
          <span className="tracking-tight whitespace-nowrap">Resume</span>

          {/* Hold progress charge-up indicator */}
          {isPressing && !isFlipped && (
            <motion.div
              className="absolute inset-0 bg-white/20 pointer-events-none origin-left"
              style={{ width: `${holdProgress}%` }}
              transition={{ duration: 0.05 }}
            />
          )}
        </div>

        {/* BACK SIDE: Admin Login Button */}
        <div
          className={`absolute inset-0 w-full h-full rounded-full bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 flex items-center justify-center gap-1 sm:gap-2 group px-2 sm:px-4 2xl:px-5.5 text-xs sm:text-[13px] 2xl:text-[14px] font-sans font-medium transition-colors duration-200 shadow-none border border-neutral-700/60 dark:border-neutral-300 overflow-hidden ${
            isMobile ? "text-sm" : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {isAdmin ? (
            <ShieldCheck size={13} className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          ) : (
            <LogIn size={13} className="w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 text-[var(--ink)] dark:text-neutral-300 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" />
          )}
          <span className="tracking-tight whitespace-nowrap">
            <span className="hidden sm:inline">{isAdmin ? "Admin Console" : "Admin Login"}</span>
            <span className="sm:hidden">{isAdmin ? "Admin" : "Login"}</span>
          </span>

          {/* Hold progress charge-up indicator when flipping back */}
          {isPressing && isFlipped && (
            <motion.div
              className="absolute inset-0 bg-white/20 dark:bg-black/20 pointer-events-none origin-left"
              style={{ width: `${holdProgress}%` }}
              transition={{ duration: 0.05 }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
