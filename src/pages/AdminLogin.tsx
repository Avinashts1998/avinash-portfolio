import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, CheckCircle as CheckCircle2 } from "reicon-react";
import { motion } from "motion/react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../utils/firebase";
import { setAdminSession, isAdminAuthenticated } from "../utils/auth";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // If already authenticated via session storage, directly go to admin dashboard
  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailInput = username.trim();

    const adminEmail = ((import.meta as any)?.env?.VITE_ADMIN_EMAIL || "avinashts1122@gmail.com").toLowerCase().trim();
    const adminPassword = (import.meta as any)?.env?.VITE_ADMIN_PASSWORD || "Avinash@1234";

    if (isFirebaseConfigured && auth) {
      try {
        // Attempt Firebase Authentication
        const userCred = await signInWithEmailAndPassword(auth, emailInput, password);
        setAdminSession(userCred.user.email || emailInput);
        setIsLoading(false);
        navigate("/admin");
        return;
      } catch (fbError: any) {
        console.warn("Firebase Auth error:", fbError.code, fbError.message);

        // If user not found and logging in with configured credentials, automatically create the user account in Firebase Auth
        if (
          (fbError.code === "auth/user-not-found" || fbError.code === "auth/invalid-credential") &&
          emailInput.toLowerCase().trim() === adminEmail &&
          password === adminPassword
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, emailInput, password);
            setAdminSession(newCred.user.email || emailInput);
            setIsLoading(false);
            navigate("/admin");
            return;
          } catch (createErr: any) {
            console.warn("Firebase user auto-registration attempt failed:", createErr);
            // Fallback to local admin auth if user creation fails
            setAdminSession(emailInput);
            setIsLoading(false);
            navigate("/admin");
            return;
          }
        }

        // Handle specific Firebase error messages
        if (fbError.code === "auth/invalid-credential" || fbError.code === "auth/wrong-password") {
          setError("Invalid email address or password. Please try again.");
        } else if (fbError.code === "auth/user-not-found") {
          setError("No account found with this email address in Firebase Authentication.");
        } else if (fbError.code === "auth/too-many-requests") {
          setError("Too many failed attempts. Please try again later.");
        } else if (fbError.code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else {
          setError(fbError.message || "Authentication failed. Please check your credentials.");
        }
        setIsLoading(false);
        return;
      }
    }

    // Fallback when Firebase Auth is not configured locally
    setTimeout(() => {
      if (
        emailInput.toLowerCase().trim() === adminEmail &&
        password === adminPassword
      ) {
        setAdminSession(emailInput);
        setIsLoading(false);
        navigate("/admin");
      } else {
        setError("Invalid email address or password. Please try again.");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div 
      id="admin-login-page" 
      className="h-screen h-[100dvh] w-full flex items-center justify-center bg-[var(--bg)] p-6 sm:p-10 relative font-sans overflow-hidden"
    >
      {/* Subtle Floating Back Button */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 text-xs font-sans font-medium tracking-wide text-[var(--ink)] bg-transparent hover:bg-[#e8e8eb] dark:hover:bg-[#202024] px-4 py-2.5 border border-[var(--line)] rounded-[6px] transition-all duration-150 cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
          <span>Back to site</span>
        </button>
      </div>

      {/* Centered White Card strictly matching the reference style */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[720px] bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none rounded-[24px] p-8 sm:p-10 md:p-12 relative z-10 text-left"
      >
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-4">
          <h1 className="text-[19px] sm:text-[20px] font-hero font-bold text-[var(--ink)] tracking-tight leading-tight mb-2">
            Console Access
          </h1>
          <p className="text-[13px] text-[var(--ink-soft)] font-sans font-normal leading-normal max-w-[280px]">
            Enter your credentials to access the admin console.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--line)] my-4 w-full"></div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Error box */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium"
            >
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Username field */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[13px] font-sans font-semibold text-[var(--ink)]">
              Username
            </label>
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="michael.owen@gmail.com"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0b0b0c] border border-[var(--line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/20 focus:border-[var(--blue)] text-[13.5px] text-[var(--ink)] placeholder-[var(--muted)] placeholder:font-normal font-sans transition-all duration-200"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[13px] font-sans font-semibold text-[var(--ink)]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0b0b0c] border border-[var(--line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/20 focus:border-[var(--blue)] text-[13.5px] text-[var(--ink)] placeholder-[var(--muted)] placeholder:font-normal font-sans transition-all duration-200"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center text-left pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[15px] h-[15px] rounded-[4px] border-[var(--line)] text-[var(--blue)] bg-white dark:bg-[#0b0b0c] accent-[var(--blue)] focus:ring-[var(--blue)] focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-[13px] font-sans font-semibold text-[var(--ink)]">
                Remember Me
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-[14px] font-sans font-semibold rounded-none shadow-[0_2px_8px_rgba(36,68,240,0.12)] hover:shadow-[0_4px_12px_rgba(36,68,240,0.2)] active:scale-[0.985] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

