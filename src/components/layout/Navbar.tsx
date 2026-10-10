import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import Icons8AIIcon from "../icons/Icons8AIIcon";
import { motion, AnimatePresence } from "motion/react";
import { useResumeModal } from "../../context/ResumeModalContext";
import { isAdminAuthenticated } from "../../utils/auth";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { DEFAULT_PROFILE_PICTURE } from "../../services/profilePictureService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import AISearchOverlay from "../ai-search/AISearchOverlay";
import { getLenis } from "../../hooks/useLenis";
import FlippableResumeButton from "./FlippableResumeButton";
import { Home, Briefcase, FileText, User } from "lucide-react";

interface NavbarProps {
  isSearchOpen?: boolean;
  setIsSearchOpen?: (val: boolean) => void;
}

export default function Navbar({ isSearchOpen, setIsSearchOpen }: NavbarProps = {}) {
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
  const profileImgUrl = profilePicture?.imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl;

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

  // Check if current route is a project or article reading page
  const isDetailPage =
    location.pathname.startsWith("/project/") ||
    location.pathname.startsWith("/blog/");

  // Sticky header scroll behavior: immediately hides when scrolling down, immediately shows when scrolling up
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDetailNavHidden, setIsDetailNavHidden] = useState(false);

  useEffect(() => {
    // Navbar offset is 0px since header floats at the bottom on desktop
    document.documentElement.style.setProperty("--navbar-offset", "0px");

    // Reset hidden state when route changes
    setIsDetailNavHidden(false);

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const lenis = getLenis();
      const scrollY = lenis ? lenis.scroll : window.scrollY;
      setIsScrolled(scrollY > 8);

      // On the project listing page, always keep the menu and filters visible at the top
      if (showSuggestions || location.pathname === "/projects") {
        setIsDetailNavHidden(false);
        return;
      }

      if (scrollY <= 10) {
        // At or near top of the page: always show navbar
        setIsDetailNavHidden(false);
        window.dispatchEvent(
          new CustomEvent("portfolio_nav_visibility_changed", { detail: { isHidden: false } })
        );
      } else if (scrollY > lastScrollY + 1) {
        // Scrolling down: immediately hide navigation bar
        setIsDetailNavHidden(true);
        window.dispatchEvent(
          new CustomEvent("portfolio_nav_visibility_changed", { detail: { isHidden: true } })
        );
      } else if (scrollY < lastScrollY - 1) {
        // Scrolling back up: immediately show navigation bar
        setIsDetailNavHidden(false);
        window.dispatchEvent(
          new CustomEvent("portfolio_nav_visibility_changed", { detail: { isHidden: false } })
        );
      }

      lastScrollY = scrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, [location.pathname, showSuggestions]);

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
    { name: "Home", path: "/", icon: Home },
    { name: "Projects", path: "/projects", icon: Briefcase },
    { name: "Articles", path: "/blog", icon: FileText },
    { name: "About", path: "/about", icon: User, isProfile: true },
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
    if (!trimmedQuery) {
      setShowSuggestions(false);
      setIsInputFocused(false);
      navigate("/ask", {
        state: { from: location.pathname },
      });
      return;
    }
    
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
        className="sticky top-0 z-[100] border-none shadow-none pointer-events-none"
      >
      <div className={`relative ${showSuggestions ? "z-[100]" : "z-30"} w-full flex items-center justify-center min-[769px]:fixed min-[769px]:bottom-6 min-[769px]:left-1/2 min-[769px]:-translate-x-1/2 min-[769px]:w-auto min-[769px]:z-[100] max-[768px]:sticky max-[768px]:top-0 max-[768px]:w-full max-[768px]:max-w-[1150px] max-[768px]:mx-auto max-[768px]:px-4 max-[768px]:py-3.5 max-[768px]:bg-[var(--bg)]/85 max-[768px]:backdrop-blur-md pointer-events-auto transition-transform duration-300 ease-in-out ${
        isDetailNavHidden && !showSuggestions && location.pathname !== "/projects" ? "min-[769px]:translate-y-28 max-[768px]:-translate-y-full pointer-events-none" : "translate-y-0"
      }`}>
        {/* Main Floating Capsule */}
        <div
          ref={capsuleRef}
          className={`relative flex items-center justify-between p-1.5 2xl:p-2 rounded-full transition-[background-color,border-color,box-shadow,width] duration-200 ease-in-out w-full min-[769px]:w-[700px] 2xl:min-[769px]:w-[760px] backdrop-blur-xl ${
            showSuggestions
              ? "bg-white/70 dark:bg-[#18181b]/70 border border-black/[0.06] dark:border-white/[0.06] shadow-sm"
              : "bg-white/50 dark:bg-[#18181b]/50 border border-black/[0.06] dark:border-white/[0.06] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-1px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]"
          }`}
        >
          
          {/* Left Container: Logo, Separator, and AI Input */}
          <div className="flex items-center pl-2 2xl:pl-2.5 flex-1 min-w-0">
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
                className="h-[22px] sm:h-6 2xl:h-7 w-auto object-contain select-none"
                width="24"
                height="24"
                loading="eager"
                decoding="sync"
              />
            </Link>

            {/* Vertical Separator */}
            <div className={`h-3.5 2xl:h-4 w-[1px] mx-2 sm:mx-2.5 2xl:mx-3 shrink-0 transition-colors duration-150 ${
              showSuggestions ? "bg-neutral-300/50 dark:bg-neutral-700/60" : "bg-neutral-300/50 dark:bg-neutral-700/60"
            }`} />

            {/* AI Search / Communication Input */}
            <form onSubmit={handleSearchSubmit} autoComplete="off" className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[270px] 2xl:max-w-[290px] mr-1.5">
              <button 
                type="submit" 
                className="text-black dark:text-white transition-colors shrink-0 focus:outline-none flex items-center justify-center cursor-pointer"
                aria-label="Submit query to AI"
              >
                <Icons8AIIcon
                  id="ai-sparkle-icon"
                  size={13}
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
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                placeholder="Ask AI about Avinash's works..."
                className={`w-full bg-transparent border-none text-xs sm:text-[13px] focus:outline-none font-sans font-medium h-full py-1 no-focus-outline caret-neutral-900 dark:caret-neutral-100 transition-colors duration-150 ml-[2px] truncate [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden ${
                  showSuggestions
                    ? "text-black dark:text-white placeholder-neutral-600 dark:placeholder-neutral-300"
                    : "text-neutral-900 dark:text-neutral-100 placeholder-neutral-600 dark:placeholder-neutral-300"
                }`}
              />
            </form>
          </div>

          {/* Right Container: Desktop Nav Links (Icons only) and Flippable Resume Button */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 pr-1 sm:pr-1.5">
            {/* Desktop Navigation Links - Icons & Profile */}
            <nav className="hidden min-[769px]:flex items-center gap-2.5 2xl:gap-3 pl-2 pr-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === "/"}
                    onClick={link.path === "/" ? handleLogoClick : undefined}
                    title={link.name}
                    aria-label={link.name}
                    className={({ isActive: isNavLinkActive }) => {
                      const isActive =
                        link.path === "/about"
                          ? isNavLinkActive || location.pathname === "/resume"
                          : isNavLinkActive;
                      return `relative w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] cursor-pointer group ${
                        isActive
                          ? "text-[var(--blue)] dark:text-blue-400 bg-black/[0.06] dark:bg-white/[0.1] shadow-xs"
                          : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      }`;
                    }}
                  >
                    {({ isActive: isNavLinkActive }) => {
                      const isActive =
                        link.path === "/about"
                          ? isNavLinkActive || location.pathname === "/resume"
                          : isNavLinkActive;

                      if (link.isProfile) {
                        return (
                          <div
                            className={`shrink-0 w-[24px] h-[24px] rounded-full overflow-hidden transition-all duration-200 group-hover:scale-105 ${
                              isActive
                                ? "ring-2 ring-[var(--blue)] dark:ring-blue-400 shadow-xs"
                                : "ring-1 ring-black/15 dark:ring-white/20 opacity-90 group-hover:opacity-100"
                            }`}
                          >
                            <img
                              src={profileImgUrl}
                              alt="About Avinash"
                              className="w-full h-full object-cover object-center select-none"
                              loading="eager"
                              decoding="sync"
                            />
                          </div>
                        );
                      }

                      return (
                        <Icon
                          size={18}
                          strokeWidth={2}
                          className="shrink-0 transition-transform duration-150 group-hover:scale-110"
                        />
                      );
                    }}
                  </NavLink>
                );
              })}
            </nav>

            {/* Flippable Resume / Admin Login Button */}
            <FlippableResumeButton onOpenResume={openResume} />
          </div>

          {/* Expanded Suggestions Dropdown with responsive positioning */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                }
                className="flex absolute max-[768px]:top-full max-[768px]:mt-2.5 max-[768px]:max-h-[70vh] max-[768px]:overflow-y-auto min-[769px]:bottom-full min-[769px]:mb-3.5 left-0 right-0 w-full bg-[var(--bg)] border border-[var(--line)] rounded-[20px] shadow-dropdown pt-5 px-5 sm:px-7 pb-0 z-[90] flex-col overflow-hidden"
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
                  <div className="py-3.5 px-7 border-t border-[var(--line)] -mx-7 bg-neutral-50/80 dark:bg-neutral-800/50 rounded-b-[20px] flex items-center">
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

      {/* Subnav portal container for pages like Projects to seamlessly render filters at the top side */}
      <div
        id="navbar-subnav-portal"
        className={`sticky top-0 w-full pointer-events-auto transition-[z-index,opacity] ${
          showSuggestions ? "z-0 pointer-events-none opacity-0" : "z-40 pointer-events-auto opacity-100"
        } ${
          location.pathname === "/projects"
            ? "bg-[var(--bg)]/90 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.04] py-2"
            : ""
        }`}
      />
    </header>
    </>
  );
}
