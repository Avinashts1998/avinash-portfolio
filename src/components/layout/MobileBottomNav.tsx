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
        {/* Sleek Compact Floating Capsule Dock matching user reference design */}
        <div
          className={`relative w-auto max-w-max mx-auto flex items-center gap-1.5 p-1.5 rounded-full h-[48px] sm:h-[50px] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform transform-gpu touch-manipulation ${
            isProjectViewPage && !isMobileNavVisible
              ? "translate-y-[calc(100%+32px)] opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100 pointer-events-auto"
          }`}
          style={{
            boxShadow:
              "0 12px 36px -4px rgba(0, 0, 0, 0.14), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
          }}
        >
          {navItems.map((item) => {
            const isActive = activeItem.id === item.id;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={(e) => handleItemClick(item, e)}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className="relative flex items-center justify-center outline-none select-none cursor-pointer touch-manipulation"
              >
                {isActive ? (
                  <motion.div
                    layoutId="mobile-nav-active-pill"
                    className="relative flex items-center gap-2 h-[38px] sm:h-[40px] px-3.5 sm:px-4 rounded-full bg-[#2563eb] dark:bg-[#3b82f6] text-white shadow-sm shadow-blue-500/25 pointer-events-none"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                      mass: 0.8,
                    }}
                  >
                    {item.isProfile && profileImgUrl ? (
                      <div className="shrink-0 w-[20px] h-[20px] rounded-full overflow-hidden ring-1.5 ring-white shadow-xs">
                        <img
                          src={profileImgUrl}
                          alt="Profile"
                          className="w-[20px] h-[20px] object-cover object-center select-none"
                          loading="eager"
                        />
                      </div>
                    ) : (
                      <Icon size={17} strokeWidth={2.2} className="shrink-0 text-white" />
                    )}
                    <span className="text-[13px] font-sans font-medium tracking-tight text-white leading-none whitespace-nowrap">
                      {item.name}
                    </span>
                  </motion.div>
                ) : (
                  <div className="w-[38px] h-[38px] sm:w-[40px] sm:h-[40px] rounded-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200">
                    {item.isProfile && profileImgUrl ? (
                      <div className="w-[22px] h-[22px] rounded-full overflow-hidden ring-1.5 ring-black/15 dark:ring-white/25 shadow-xs">
                        <img
                          src={profileImgUrl}
                          alt="Profile"
                          className="w-[22px] h-[22px] object-cover object-center select-none"
                          loading="eager"
                        />
                      </div>
                    ) : (
                      <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
