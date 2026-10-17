import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import Icons8AIIcon from "../icons/Icons8AIIcon";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { useResumeModal } from "../../context/ResumeModalContext";
import { isAdminAuthenticated } from "../../utils/auth";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { DEFAULT_PROFILE_PICTURE } from "../../services/profilePictureService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import AISearchOverlay from "../ai-search/AISearchOverlay";
import { getLenis } from "../../hooks/useLenis";
import { useProjectNavScroll } from "../../hooks/useProjectNavScroll";
import FlippableResumeButton from "./FlippableResumeButton";
import { Home, Briefcase, FileText, User, ArrowRight, ArrowLeft, ArrowUp, ChevronDown, RotateCcw, Filter } from "lucide-react";
import { getPreviousPath } from "../../utils/navigationHistory";
import CustomDropdown from "../ui/CustomDropdown";
import { PRODUCT_TYPE_OPTIONS, CATEGORY_OPTIONS } from "../admin/CreateProjectModal";

interface NavbarProps {
  isSearchOpen?: boolean;
  setIsSearchOpen?: (val: boolean) => void;
}

export default function Navbar({ isSearchOpen, setIsSearchOpen }: NavbarProps = {}) {
  const { isMobileNavVisible, isProjectViewPage, isArticleOrProjectPage } = useProjectNavScroll();
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

  const canGoBack = location.pathname !== "/";
  const isHomePage = location.pathname === "/";
  const isProjectDetailPage = location.pathname.startsWith("/project/");
  const isProjectsPage = location.pathname === "/projects";
  const isBlogPage = location.pathname.startsWith("/blog");
  const isBlogDetailPage = location.pathname.startsWith("/blog/");

  // Filter type and category states
  const [selectedType, setSelectedType] = useState<string>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("type") || "All Types";
    } catch {
      return "All Types";
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("category") || "All Categories";
    } catch {
      return "All Categories";
    }
  });

  // Listen to filter changes broadcasted across the app
  useEffect(() => {
    const handleFilterUpdate = (e: any) => {
      if (e.detail?.type !== undefined) setSelectedType(e.detail.type);
      if (e.detail?.category !== undefined) setSelectedCategory(e.detail.category);
    };
    window.addEventListener("portfolio_filter_update", handleFilterUpdate);
    return () => window.removeEventListener("portfolio_filter_update", handleFilterUpdate);
  }, []);

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    window.dispatchEvent(
      new CustomEvent("portfolio_filter_update", {
        detail: { type: newType, category: selectedCategory }
      })
    );
    if (location.pathname !== "/projects") {
      navigate(`/projects?type=${encodeURIComponent(newType)}&category=${encodeURIComponent(selectedCategory)}`);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    window.dispatchEvent(
      new CustomEvent("portfolio_filter_update", {
        detail: { type: selectedType, category: newCat }
      })
    );
    if (location.pathname !== "/projects") {
      navigate(`/projects?type=${encodeURIComponent(selectedType)}&category=${encodeURIComponent(newCat)}`);
    }
  };

  const handleResetFilters = () => {
    setSelectedType("All Types");
    setSelectedCategory("All Categories");
    window.dispatchEvent(
      new CustomEvent("portfolio_filter_update", {
        detail: { type: "All Types", category: "All Categories" }
      })
    );
  };

  const isFiltered = selectedType !== "All Types" || selectedCategory !== "All Categories";

  const typeOptions = ["All Types", ...PRODUCT_TYPE_OPTIONS, "Desktop Software"];
  const categoryOptions = ["All Categories", ...CATEGORY_OPTIONS, "Desktop Software", "Web Platform", "IoT & Smart Home", "Automotive & Mobility", "Enterprise & SaaS"];

  const handleBack = () => {
    const currentPath = location.pathname;
    const prevPath = getPreviousPath();
    if (prevPath && prevPath !== currentPath) {
      navigate(-1);
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          navigate(prevPath);
        }
      }, 120);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (currentPath !== "/") {
      navigate("/");
    } else {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, { duration: 0.65 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

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

  // Sticky header & bottom floating capsule scroll behavior
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollYRef = React.useRef(0);

  // Reset visibility when route changes
  useEffect(() => {
    setIsNavVisible(true);
    lastScrollYRef.current = Math.max(0, window.scrollY);
    const navEl = document.getElementById("navbar");
    const isMobile = window.innerWidth <= 768;
    const offset = isMobile && navEl ? `${navEl.offsetHeight}px` : "0px";
    document.documentElement.style.setProperty("--navbar-offset", offset);
  }, [location.pathname]);

  useEffect(() => {
    // Dynamic navbar offset for subnav alignment
    const updateNavbarOffset = () => {
      const isMobile = window.innerWidth <= 768;
      const navEl = document.getElementById("navbar");
      const offset = isMobile && navEl ? `${navEl.offsetHeight}px` : "0px";
      document.documentElement.style.setProperty("--navbar-offset", offset);
    };
    updateNavbarOffset();

    let accumulatedDelta = 0;
    let lastDirection = 0; // 1 = scrolling down, -1 = scrolling up

    const handleScroll = () => {
      const lenis = getLenis();
      const scrollY = Math.max(0, lenis ? lenis.scroll : window.scrollY);
      setIsScrolled(scrollY > 8);

      if (showSuggestions || isInputFocused) {
        setIsNavVisible(true);
        accumulatedDelta = 0;
        lastScrollYRef.current = scrollY;
        return;
      }

      // Always show when near the very top of the page
      if (scrollY <= 30) {
        setIsNavVisible(true);
        accumulatedDelta = 0;
        lastScrollYRef.current = scrollY;
        return;
      }

      // Always show when reaching the bottom of the page
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      if (winHeight + scrollY >= docHeight - 60) {
        setIsNavVisible(true);
        accumulatedDelta = 0;
        lastScrollYRef.current = scrollY;
        return;
      }

      const diff = scrollY - lastScrollYRef.current;
      const currentDirection = diff > 0 ? 1 : diff < 0 ? -1 : 0;

      // Reset accumulated distance if scroll direction changes
      if (currentDirection !== 0 && currentDirection !== lastDirection) {
        accumulatedDelta = 0;
        lastDirection = currentDirection;
      }

      accumulatedDelta += diff;

      // When user starts scrolling DOWN: hide AI header smoothly
      if (accumulatedDelta > 10 || (isArticleOrProjectPage && diff > 1.5 && accumulatedDelta > 2)) {
        setIsNavVisible(false);
      } 
      // When user scrolls UP: immediately bring AI header back into view
      else if (accumulatedDelta < -6 || (isArticleOrProjectPage && (diff < -1 || accumulatedDelta < -1))) {
        setIsNavVisible(true);
      }

      lastScrollYRef.current = scrollY;
    };

    // If mouse moves near the bottom edge of the screen on desktop, reveal the navbar
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth > 768 && e.clientY >= window.innerHeight - 80) {
        setIsNavVisible(true);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("lenis-scroll", handleScroll, { passive: true });
    window.addEventListener("lenis-ready", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", updateNavbarOffset);

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("lenis-scroll", handleScroll);
      window.removeEventListener("lenis-ready", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateNavbarOffset);
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, [location.pathname, showSuggestions, isInputFocused]);

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
    { name: "Works", path: "/projects", icon: Briefcase },
    { name: "Articles", path: "/blog", icon: FileText },
    { name: "About", path: "/about", icon: User, isProfile: true },
  ];

  const isLinkActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/projects") {
      return location.pathname === "/projects" || location.pathname.startsWith("/project/");
    }
    if (path === "/blog") {
      return (
        location.pathname === "/blog" ||
        location.pathname.startsWith("/blog/") ||
        location.pathname === "/field-notes"
      );
    }
    if (path === "/about") {
      return location.pathname === "/about" || location.pathname === "/resume";
    }
    return location.pathname === path;
  };

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

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    try {
      sessionStorage.removeItem("home_featured_scroll");
    } catch {}

    if (isLinkActive(path)) {
      e.preventDefault();
      if (window.scrollY < 5) return;
      
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 0.65,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    handleNavClick("/", e);
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
      {/* Consistent Desktop Top Bar: Hidden on Home, Projects, Blog & Article detail, About, and Project Detail pages which have their own in-page headers */}
      {!isHomePage && !isProjectDetailPage && !isProjectsPage && !isBlogPage && location.pathname !== "/about" && (
        <div
          id="navbar-desktop-topbar"
          className="hidden min-[769px]:block fixed top-0 left-0 right-0 w-full z-40 bg-[var(--bg)]/90 backdrop-blur-xl transition-all"
        >
          <div className="w-full max-w-[1150px] 2xl:max-w-[1360px] min-[1900px]:max-w-[1440px] mx-auto px-4 sm:px-6 2xl:px-8 h-[64px] flex items-center justify-between pointer-events-auto">
            {/* Left Side: Back Button (Removed on /projects page) */}
            {!isProjectsPage && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go Back"
                title="Go Back"
                className="flex items-center gap-1.5 sm:gap-2 h-8 px-3 sm:px-3.5 rounded-full bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-100 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 pointer-events-auto cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] shrink-0 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2] group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs sm:text-[13px] font-medium">Back</span>
              </button>
            )}

            {/* Right Side: Filters (Only on /projects page) or Page Actions Slot */}
            <div id="desktop-topbar-actions" className="flex items-center gap-2 ml-auto">
              {location.pathname === "/projects" && (
                <>
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      title="Reset Filters"
                      className="h-9 px-3 rounded-full text-[12px] font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  )}

                  {/* Type Dropdown */}
                  <div className="w-auto shrink-0">
                    <CustomDropdown
                      id="topbar-desktop-filter-type"
                      value={selectedType}
                      options={typeOptions}
                      onChange={handleTypeChange}
                      variant="compact"
                      align="right"
                      direction="down"
                      ariaLabel="Filter by Type"
                      className="!w-auto shrink-0"
                      triggerClassName="h-9 !py-1 !px-3 !rounded-full !bg-white/90 dark:!bg-[#18181b]/90 !backdrop-blur-xl !border !border-black/10 dark:!border-white/15 !text-[13px] font-medium !shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-between gap-2 cursor-pointer hover:border-black/20 dark:hover:border-white/30 transition-all"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="w-auto shrink-0">
                    <CustomDropdown
                      id="topbar-desktop-filter-category"
                      value={selectedCategory}
                      options={categoryOptions}
                      onChange={handleCategoryChange}
                      variant="compact"
                      align="right"
                      direction="down"
                      ariaLabel="Filter by Category"
                      className="!w-auto shrink-0"
                      triggerClassName="h-9 !py-1 !px-3 !rounded-full !bg-white/90 dark:!bg-[#18181b]/90 !backdrop-blur-xl !border !border-black/10 dark:!border-white/15 !text-[13px] font-medium !shadow-[0_2px_6px_rgba(0,0,0,0.03)] flex items-center justify-between gap-2 cursor-pointer hover:border-black/20 dark:hover:border-white/30 transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <header
        id="navbar"
        className={`max-[768px]:fixed max-[768px]:top-0 max-[768px]:left-0 max-[768px]:right-0 max-[768px]:w-full z-[100] max-[768px]:bg-[var(--bg)]/95 max-[768px]:backdrop-blur-xl border-none shadow-none min-[769px]:pointer-events-none max-[768px]:pointer-events-auto transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isArticleOrProjectPage && !isMobileNavVisible && !showSuggestions && !isInputFocused
            ? "max-[768px]:-translate-y-full max-[768px]:pointer-events-none"
            : "max-[768px]:translate-y-0"
        }`}
      >
      <div className={`relative ${showSuggestions ? "z-[100]" : "z-30"} w-full flex items-center justify-center gap-2 sm:gap-2.5 min-[769px]:fixed min-[769px]:bottom-6 min-[769px]:left-1/2 min-[769px]:-translate-x-1/2 min-[769px]:w-auto min-[769px]:z-[100] max-[768px]:w-full max-[768px]:max-w-[1150px] max-[768px]:mx-auto max-[768px]:px-4 max-[768px]:py-2.5 sm:max-[768px]:py-3 max-[768px]:pointer-events-auto transition-all duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform transform-gpu ${
        isArticleOrProjectPage
          ? isMobileNavVisible || showSuggestions || isInputFocused
            ? "max-[768px]:translate-y-0 max-[768px]:opacity-100 max-[768px]:pointer-events-auto"
            : "max-[768px]:-translate-y-full max-[768px]:opacity-0 max-[768px]:pointer-events-none"
          : "max-[768px]:translate-y-0"
      } ${
        isNavVisible
          ? "min-[769px]:translate-y-0 min-[769px]:pointer-events-auto"
          : "min-[769px]:translate-y-[calc(100%+32px)] min-[769px]:pointer-events-none"
      }`}>
        {/* Outer Left Side: Round button with left arrow to go back (Mobile only, hidden on Home page) */}
        {!isHomePage && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go Back"
            title="Go Back"
            className="max-[768px]:flex min-[769px]:hidden w-[46px] h-[46px] rounded-full items-center justify-center bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-100 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 pointer-events-auto cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] shrink-0"
          >
            <ArrowLeft className="w-[19px] h-[19px] sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Main Floating Capsule */}
        <div
          ref={capsuleRef}
          className={`relative h-[46px] sm:h-[52px] 2xl:h-[56px] flex items-center justify-between p-1.5 2xl:p-2 rounded-full transition-[background-color,border-color,box-shadow] duration-200 ease-out flex-1 min-w-0 min-[769px]:flex-initial min-[769px]:w-[740px] 2xl:min-[769px]:w-[800px] backdrop-blur-xl transform-gpu pointer-events-auto bg-white/90 dark:bg-[#18181b]/90 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]`}
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
            <div className={`h-3.5 2xl:h-4 w-[1px] mx-1.5 sm:mx-2.5 2xl:mx-3 shrink-0 transition-colors duration-150 ${
              showSuggestions ? "bg-neutral-300/50 dark:bg-neutral-700/60" : "bg-neutral-300/50 dark:bg-neutral-700/60"
            }`} />

            {/* AI Search / Communication Input */}
            <form
              onSubmit={handleSearchSubmit}
              autoComplete="off"
              className={`relative flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 max-[768px]:max-w-none min-[769px]:max-w-[270px] 2xl:max-w-[290px] mr-1 sm:mr-1.5 h-[32px] sm:h-[34px] rounded-full pl-2 sm:pl-[9px] pr-1.5 sm:pr-[7px] transition-all duration-200 ease-out border-0 border-none outline-none ring-0 ${
                isInputFocused || showSuggestions
                  ? "bg-black/[0.04] dark:bg-white/[0.08]"
                  : "bg-transparent"
              }`}
            >
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
                enterKeyHint="send"
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
                  if (e.key === "Enter" && query.trim()) {
                    handleSearchSubmit(e);
                  }
                }}
                placeholder="Ask AI about Avinash's works..."
                className={`flex-1 min-w-0 bg-transparent border-none text-[11px] min-[390px]:text-[12px] sm:text-[13px] focus:outline-none font-sans font-medium h-full no-focus-outline caret-neutral-900 dark:caret-neutral-100 transition-colors duration-150 px-0.5 sm:px-1 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden ${
                  showSuggestions
                    ? "text-black dark:text-white placeholder-neutral-600 dark:placeholder-neutral-300"
                    : "text-neutral-900 dark:text-neutral-100 placeholder-neutral-600 dark:placeholder-neutral-300"
                }`}
              />

              {/* Arrow button visible at right to send text to AI: arrow towards top, hidden in mobile view */}
              {(isInputFocused || showSuggestions || query.trim().length > 0) && (
                <button
                  type="submit"
                  onMouseDown={(e) => {
                    // Prevent input blur before click registers
                    e.preventDefault();
                  }}
                  disabled={!query.trim()}
                  title={query.trim() ? "Send question to AI" : "Type a question to send"}
                  aria-label="Send question to AI"
                  className={`hidden min-[769px]:flex ml-auto shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    query.trim().length > 0
                      ? "w-[22px] h-[22px] bg-[#2444f0] text-white hover:bg-[#1a35c8] dark:bg-[#4278ff] dark:hover:bg-[#2e65ff] hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      : "w-[22px] h-[22px] bg-[#2444f0] text-white opacity-45 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp size={12} strokeWidth={2.5} />
                </button>
              )}
            </form>
          </div>

          {/* Right Container: Desktop Nav Links (Icons only) and Flippable Resume Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 pr-1 sm:pr-1.5">
            {/* Desktop Navigation Links - Active menu shows name, inactive shows only icon with buttery-smooth sliding pill */}
            <LayoutGroup id="desktop-navbar">
              <nav className="hidden min-[769px]:flex items-center gap-1 pl-1 pr-1 isolate relative">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.path);

                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end={link.path === "/"}
                      onClick={(e) => handleNavClick(link.path, e)}
                      title={link.name}
                      aria-label={link.name}
                      className={`relative min-w-[36px] h-[36px] px-2.5 rounded-full flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 cursor-pointer select-none group transition-colors duration-150 ${
                        isActive
                          ? "text-neutral-950 dark:text-white"
                          : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Active Sliding Pill Indicator - minimal subtle bg, borderless, non-overshooting tween */}
                      {isActive && (
                        <motion.div
                          layoutId="desktop-navbar-active-pill"
                          className="absolute inset-0 rounded-full bg-black/[0.05] dark:bg-white/[0.08] pointer-events-none"
                          style={{ borderRadius: 9999 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : {
                                  type: "tween",
                                  duration: 0.25,
                                  ease: [0.25, 1, 0.5, 1],
                                }
                          }
                        />
                      )}

                      <div className="relative z-10 flex items-center justify-center h-full pointer-events-none select-none">
                        {link.isProfile ? (
                          <div className={`shrink-0 w-[26px] h-[26px] rounded-full overflow-hidden transition-all duration-150 ${
                            isActive
                              ? "ring-1.5 ring-neutral-900/25 dark:ring-white/40 shadow-xs"
                              : "ring-1 ring-black/10 dark:ring-white/20 opacity-90 group-hover:opacity-100 shadow-xs"
                          }`}>
                            <img
                              src={profileImgUrl}
                              alt="About Avinash"
                              className="w-full h-full object-cover object-center select-none"
                              loading="eager"
                              decoding="sync"
                            />
                          </div>
                        ) : (
                          <Icon
                            size={15}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className="shrink-0 transition-colors duration-150"
                          />
                        )}

                        {/* Menu Name: Displayed only for active menu item, buttery smooth transition */}
                        <motion.span
                          initial={false}
                          animate={{
                            width: isActive ? "auto" : 0,
                            opacity: isActive ? 1 : 0,
                            marginLeft: isActive ? 6 : 0,
                          }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : {
                                  duration: 0.24,
                                  ease: [0.25, 1, 0.5, 1],
                                }
                          }
                          className="inline-block text-[13px] font-sans font-medium tracking-tight whitespace-nowrap overflow-hidden select-none"
                        >
                          {link.name}
                        </motion.span>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </LayoutGroup>

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

      {/* Subnav portal container */}
      <div id="navbar-subnav-portal" className="hidden" />
    </header>
    {/* Layout spacers to ensure content begins cleanly below the fixed top navbar without overlapping */}
    <div
      id="navbar-mobile-spacer"
      className="hidden max-[768px]:block h-[64px] shrink-0 pointer-events-none select-none"
      aria-hidden="true"
    />
    {!isHomePage && !isProjectDetailPage && (
      <div
        id="navbar-desktop-spacer"
        className="hidden min-[769px]:block h-[64px] shrink-0 pointer-events-none select-none"
        aria-hidden="true"
      />
    )}
    </>
  );
}
