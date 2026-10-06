import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Download, Login as LogIn } from "reicon-react";
import Icons8AIIcon from "../icons/Icons8AIIcon";
import { motion, AnimatePresence } from "motion/react";
import { useResumeModal } from "../../context/ResumeModalContext";
import { isAdminAuthenticated } from "../../utils/auth";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import AISearchOverlay from "../ai-search/AISearchOverlay";
import { getLenis } from "../../hooks/useLenis";
import FlippableResumeButton from "./FlippableResumeButton";

interface NavbarProps {
  isSearchOpen?: boolean;
  setIsSearchOpen?: (val: boolean) => void;
}

export default function Navbar({ isSearchOpen, setIsSearchOpen }: NavbarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const capsuleRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { openResume } = useResumeModal();
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const profilePicture = useProfilePicture();

  useEffect(() => {
    const checkAuth = () => {
      setIsAdmin(isAdminAuthenticated());
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("portfolio_data_update", checkAuth);
    window.addEventListener("portfolio_admin_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("portfolio_data_update", checkAuth);
      window.removeEventListener("portfolio_admin_auth_changed", checkAuth);
    };
  }, [location.pathname]);


  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Scroll hide/show behavior for Navbar (Active on Project Detail and Blog Detail pages)
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = React.useRef(0);

  useEffect(() => {
    // Set initial custom property on mount
    document.documentElement.style.setProperty("--navbar-offset", "72px");
    
    const isDetailPage =
      location.pathname.startsWith("/project/") ||
      location.pathname.startsWith("/blog/");

    const handleScroll = () => {
      if (!isDetailPage) {
        setIsVisible(true);
        return;
      }
      const currentScrollY = window.scrollY;
      const lastScrollY = lastScrollYRef.current;
      
      if (currentScrollY > lastScrollY && currentScrollY > 40) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    const isDetailPage =
      location.pathname.startsWith("/project/") ||
      location.pathname.startsWith("/blog/");

    if (!isDetailPage) {
      setIsVisible(true);
      document.documentElement.style.setProperty("--navbar-offset", "72px");
    }
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--navbar-offset",
      isVisible ? "72px" : "0px"
    );
  }, [isVisible]);

  useEffect(() => {
    if (showSuggestions || isOpen) {
      setIsVisible(true);
    }
  }, [showSuggestions, isOpen]);

  // Handle Escape key to close the dropdown/overlay
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSuggestions(false);
        setIsInputFocused(false);
        if (document.activeElement instanceof HTMLInputElement) {
          document.activeElement.blur();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Do not close if click is inside the AI chat modal or AI search overlay
      if (
        target.closest &&
        (target.closest("#ai-chat-modal") || target.closest("#ai-search-overlay"))
      ) {
        return;
      }

      if (capsuleRef.current && !capsuleRef.current.contains(target)) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowSuggestions]);

  const links = [
    { name: "Projects", path: "/projects" },
    { name: "Articles", path: "/blog" },
    { name: "About", path: "/about" },
  ];

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const clean = val.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
    if (
      clean === "admin/login" ||
      clean === "login/admin" ||
      clean === "admin-login" ||
      clean === "admin login" ||
      clean === "login admin"
    ) {
      setQuery("");
      setShowSuggestions(false);
      setIsInputFocused(false);
      navigate(isAdmin ? "/admin" : "/admin-login");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    setShowSuggestions(false);
    setIsInputFocused(false);
    
    const clean = trimmedQuery.toLowerCase().replace(/^\/+|\/+$/g, "");
    if (
      clean === "admin/login" ||
      clean === "login/admin" ||
      clean === "admin-login" ||
      clean === "admin login" ||
      clean === "login admin"
    ) {
      setQuery("");
      navigate(isAdmin ? "/admin" : "/admin-login");
      return;
    }
    
    setQuery("");
    navigate(`/ask?q=${encodeURIComponent(trimmedQuery)}`, {
      state: { from: location.pathname },
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    setIsInputFocused(false);
    setQuery("");
    navigate(`/ask?q=${encodeURIComponent(suggestion)}`, {
      state: { from: location.pathname },
    });
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      if (window.scrollY < 5) return;
      
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <AISearchOverlay
        isOpen={showSuggestions}
        onClose={() => {
          setShowSuggestions(false);
          setIsInputFocused(false);
        }}
      />
      <header
        id="navbar"
        className={`sticky top-0 z-[100] w-full transition-[background-color,backdrop-filter,transform] duration-300 ${
          location.pathname === "/projects" ? "pt-3.5 sm:pt-4 pb-3" : "py-4"
        } ${
          showSuggestions
            ? "bg-transparent backdrop-blur-none"
            : "bg-[var(--bg)]/80 backdrop-blur-md"
        } ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
      >
      <div className={`relative ${showSuggestions ? "z-50" : "z-30"} w-full max-w-[1150px] mx-auto px-4 sm:px-6 flex items-center ${
        location.pathname === "/projects" ? "mb-2.5 sm:mb-3" : ""
      }`}>
        {/* Main Floating Capsule */}
        <div
          ref={capsuleRef}
          className={`relative flex-1 flex items-center justify-between p-1.5 rounded-full transition-[background-color,border-color,box-shadow] duration-200 ease-in-out ${
            showSuggestions
              ? "bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-white/15 shadow-dropdown"
              : "bg-neutral-900/[0.04] dark:bg-[#18181b] border border-black/[0.04] dark:border-white/10 shadow-none"
          }`}
        >
          
          {/* Left Container: Logo, Separator, and AI Input */}
          <div className="flex items-center pl-2 flex-1 min-w-0">
            {/* Logo / Branding */}
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center shrink-0 hover:scale-105 transition-transform duration-200"
              aria-label="Home"
            >
              <img
                id="navbar-logo"
                src="/assets/title-logo/LOGO004.png"
                alt="Avinash Logo"
                className="h-[22px] sm:h-6 w-auto object-contain select-none"
                width="24"
                height="24"
                loading="eager"
                decoding="sync"
              />
            </Link>

            {/* Vertical Separator */}
            <div className={`h-3.5 w-[1px] mx-3 shrink-0 transition-colors duration-150 ${
              showSuggestions ? "bg-neutral-300/50 dark:bg-neutral-700/60" : "bg-neutral-300/50 dark:bg-neutral-700/60"
            }`} />

            {/* AI Search / Communication Input */}
            <form onSubmit={handleSearchSubmit} autoComplete="off" className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
              <button 
                type="submit" 
                className="text-black dark:text-white transition-colors shrink-0 focus:outline-none flex items-center justify-center"
                aria-label="Submit query to AI"
              >
                <Icons8AIIcon
                  id="ai-sparkle-icon"
                  size={12}
                  className="shrink-0 text-black dark:text-white"
                />
              </button>
              <input
                id="navbar-ai-search-input"
                name="navbar_ai_search_query"
                type="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                aria-autocomplete="none"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => {
                  setShowSuggestions(true);
                  setIsInputFocused(true);
                }}
                onBlur={() => {
                  setIsInputFocused(false);
                }}
                placeholder="Ask AI about Avinash's work..."
                className={`w-full bg-transparent border-none text-sm focus:outline-none font-sans font-normal h-full py-1 no-focus-outline caret-neutral-900 dark:caret-neutral-100 transition-colors duration-150 ml-[5px] ${
                  showSuggestions
                    ? "text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-400"
                    : "text-[var(--ink)] placeholder-neutral-400 dark:placeholder-neutral-400"
                }`}
              />
            </form>
          </div>

          {/* Right Container: Desktop Nav Links and Email Pill Button */}
          <div className="hidden min-[769px]:flex items-center gap-3">
            <nav className="flex items-center gap-3 pl-3 pr-0">
              {links.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `nav-link-btn px-3 py-1.5 ${isActive ? "is-active" : ""}`
                  }
                  data-text={link.name}
                >
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* Flippable Resume / Admin Login Button */}
            <FlippableResumeButton onOpenResume={openResume} />
          </div>

          {/* Mobile Menu Toggle Button (inside the capsule on mobile) */}
          <div className="min-[769px]:hidden flex items-center pr-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-1.5 rounded-full transition-all duration-150 focus:outline-none cursor-pointer ${
                showSuggestions
                  ? "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              }`}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Expanded Suggestions Dropdown with full capsule width */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                }
                className="absolute top-full left-0 right-0 mt-3.5 w-full bg-[var(--bg)] border border-[var(--line)] rounded-[20px] shadow-dropdown pt-7 px-8 pb-0 z-[90] flex flex-col overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full w-full">
                  <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase mb-5">
                    Try asking
                  </div>
                  
                  <div className="flex flex-col gap-3.5 pb-5">
                    {[
                      "Why should we hire him for a senior product design role?",
                      "What kind of designer is he and what are his core strengths?",
                      "Can you summarize his experience at Starlfinx Fintech and key contributions?",
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left flex items-start gap-3.5 text-[14px] text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white font-sans font-normal transition-colors duration-150 group cursor-pointer"
                      >
                        <Icons8AIIcon
                          size={13}
                          className="shrink-0 mt-[4px] group-hover:scale-110 transition-transform duration-200 text-black dark:text-white"
                        />
                        <span className="leading-relaxed flex-1">
                          {suggestion}
                        </span>
                      </button>
                    ))}

                    <div
                      className={`grid transition-[grid-template-rows,opacity] ${
                        prefersReducedMotion ? "duration-0" : "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      } ${
                        showMoreSuggestions
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden flex flex-col gap-3.5">
                        {[
                          "Show me his most impactful projects and what he achieved",
                          "How does he approach problem-solving and product thinking?",
                          "What is his experience with AI in design workflows and products?",
                          "How does he collaborate with engineers and product teams?"
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left flex items-start gap-3.5 text-[14px] text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white font-sans font-normal transition-colors duration-150 group cursor-pointer pt-0.5"
                          >
                            <Icons8AIIcon
                              size={13}
                              className="shrink-0 mt-[4px] group-hover:scale-110 transition-transform duration-200 text-black dark:text-white"
                            />
                            <span className="leading-relaxed flex-1">
                              {suggestion}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row - View More */}
                  <div className="py-3.5 px-8 border-t border-[var(--line)] -mx-8 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-b-[20px] flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreSuggestions(!showMoreSuggestions);
                      }}
                      className="flex items-center gap-2 text-[12px] text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white font-sans font-medium transition-colors group cursor-pointer"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-transform duration-300 shrink-0 ${
                          showMoreSuggestions ? "rotate-180" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                      <span>{showMoreSuggestions ? "Show less" : "View more"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Slide-down mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-[var(--bg)] border-b border-[var(--line)]/50 min-[769px]:hidden"
          >
            <nav className="flex flex-col px-6 py-4 gap-1.5">
              {[
                { name: "Home", path: "/" },
                ...links
              ].map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === "/"}
                  className={({ isActive }) =>
                    `nav-link-btn nav-link-btn-mobile px-4 py-2.5 ${isActive ? "is-active" : ""}`
                  }
                  data-text={link.name}
                >
                  <span>{link.name}</span>
                </NavLink>
              ))}
              <div className="mt-2 mx-4 flex flex-col gap-2">
                <FlippableResumeButton
                  onOpenResume={() => {
                    setIsOpen(false);
                    openResume();
                  }}
                  isMobile
                />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subnav portal container for pages like Projects to seamlessly render filters inside the same header */}
      <div
        id="navbar-subnav-portal"
        className={`relative w-full transition-[z-index,opacity] ${
          showSuggestions ? "z-0 pointer-events-none opacity-0" : "z-10 pointer-events-auto opacity-100"
        }`}
      />
    </header>
    </>
  );
}
