import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, LayoutGroup } from "motion/react";
import { Home, Briefcase, FileText, User } from "lucide-react";
import { getLenis } from "../../hooks/useLenis";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { useProjectNavScroll } from "../../hooks/useProjectNavScroll";
import { DEFAULT_PROFILE_PICTURE } from "../../services/profilePictureService";

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  isProfile?: boolean;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    id: "home",
    name: "Home",
    path: "/",
    icon: Home,
    isActive: (pathname) => pathname === "/" || pathname === "",
  },
  {
    id: "works",
    name: "Works",
    path: "/projects",
    icon: Briefcase,
    isActive: (pathname) => pathname === "/projects" || pathname.startsWith("/project/"),
  },
  {
    id: "articles",
    name: "Articles",
    path: "/blog",
    icon: FileText,
    isActive: (pathname) =>
      pathname === "/blog" || pathname.startsWith("/blog/") || pathname === "/field-notes",
  },
  {
    id: "about",
    name: "About",
    path: "/about",
    icon: User,
    isProfile: true,
    isActive: (pathname) => pathname === "/about" || pathname === "/resume",
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const profilePicture = useProfilePicture();
  const { isMobileNavVisible, isProjectViewPage } = useProjectNavScroll();
  const profileImgUrl = profilePicture?.imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl;

  // Active item determined by current route, default to Home
  const activeItem = navItems.find((item) => item.isActive(location.pathname)) || navItems[0];

  // Scroll to top smoothly if already on the active page
  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    try {
      sessionStorage.removeItem("home_featured_scroll");
    } catch {}

    if (activeItem.id === item.id) {
      e.preventDefault();
      if (window.scrollY < 5) return;
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 0.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className={`fixed left-0 right-0 z-[100] min-[769px]:hidden select-none transform-gpu px-4 flex justify-center transition-all duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isProjectViewPage && !isMobileNavVisible
          ? "pointer-events-none"
          : "pointer-events-auto"
      }`}
      style={{
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <LayoutGroup id="mobile-bottom-nav">
        {/* Sleek Floating Capsule Dock */}
        <div
          className={`relative w-full max-w-[1150px] flex items-center justify-between p-1 rounded-full h-[48px] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.08] transition-all duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform transform-gpu ${
            isProjectViewPage && !isMobileNavVisible
              ? "translate-y-[calc(100%+32px)] opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100 pointer-events-auto"
          }`}
          style={{
            boxShadow:
              "0 10px 28px -4px rgba(0, 0, 0, 0.12), 0 3px 8px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          {navItems.map((item) => {
            const isActive = activeItem.id === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="flex-1 flex items-center justify-center min-w-0"
              >
                <NavLink
                  to={item.path}
                  onClick={(e) => handleItemClick(item, e)}
                  aria-label={item.name}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    ...(item.id === "home" ? { marginLeft: "8px" } : {}),
                    ...(item.id === "about" ? { marginRight: "10px" } : {}),
                  }}
                  className={`relative h-[38px] flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] select-none cursor-pointer transition-colors duration-150 ${
                    isActive ? "px-3.5" : "w-[38px]"
                  } ${item.id === "home" ? "ml-[8px]" : ""} ${item.id === "about" ? "mr-[10px]" : ""}`}
                >
                  {/* Active Sliding Blue Pill Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-bottom-nav-active-pill"
                      className="absolute inset-0 rounded-full bg-[var(--blue)] shadow-xs pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}

                  {/* Symmetrically Padded Content (Equal spacing left and right) */}
                  <div className="relative z-10 flex items-center justify-center gap-1.5 h-full pointer-events-none select-none">
                    {item.isProfile && profileImgUrl ? (
                      <div
                        className={`shrink-0 w-[22px] h-[22px] rounded-full overflow-hidden transition-all duration-150 ${
                          isActive
                            ? "ring-2 ring-white shadow-xs"
                            : "ring-1.5 ring-black/15 dark:ring-white/25 shadow-xs"
                        }`}
                      >
                        <img
                          src={profileImgUrl}
                          alt="Profile"
                          className="w-[22px] h-[22px] object-cover object-center select-none"
                          style={{ width: "22px", height: "22px" }}
                          loading="eager"
                          decoding="sync"
                        />
                      </div>
                    ) : (
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.2 : 1.9}
                        className={`shrink-0 transition-colors duration-150 ${
                          isActive
                            ? "text-white"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                        }`}
                      />
                    )}

                    {/* Clean text label for the active item only */}
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-[13px] font-sans font-medium tracking-tight whitespace-nowrap select-none text-white leading-none"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </div>
                </NavLink>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
