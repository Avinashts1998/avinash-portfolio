import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Home, Briefcase, FileText } from "lucide-react";
import { getLenis } from "../../hooks/useLenis";
import { useProfilePicture } from "../../hooks/useProfilePicture";
import { DEFAULT_PROFILE_PICTURE } from "../../services/profilePictureService";

interface NavItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  isProfile?: boolean;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    id: "home",
    name: "Home",
    path: "/",
    icon: Home,
    isActive: (pathname) => pathname === "/",
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
    isProfile: true,
    isActive: (pathname) => pathname === "/about" || pathname === "/resume",
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const profilePicture = useProfilePicture();
  const profileImgUrl = profilePicture?.imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl;

  // Active item determined by current route, default to Home
  const activeItem = navItems.find((item) => item.isActive(location.pathname)) || navItems[0];

  // Scroll to top smoothly if already on the active page
  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    if (activeItem.id === item.id) {
      e.preventDefault();
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 1.2,
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
      className="fixed left-1/2 -translate-x-1/2 z-40 min-[769px]:hidden select-none pointer-events-auto translate-y-0"
      style={{
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Navigation container matching reference image */}
      <div
        className="relative flex items-center p-1 rounded-full w-[calc(100vw-36px)] max-w-[320px] h-[52px] bg-white dark:bg-[#15171e] border border-black/[0.06] dark:border-white/[0.08] transition-colors duration-200"
        style={{
          boxShadow:
            "0 6px 20px -3px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        }}
      >
        {navItems.map((item) => {
          const isActive = activeItem.id === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="relative flex-1 h-full flex items-center justify-center rounded-full min-w-0"
            >
              <NavLink
                to={item.path}
                onClick={(e) => handleItemClick(item, e)}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className="relative w-full h-full flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2"
              >
                {/* Active Theme Color Pill Container */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active-pill"
                    className="absolute inset-0 rounded-full bg-[var(--blue)] shadow-xs pointer-events-none"
                    style={{ backgroundColor: "var(--blue)" }}
                    transition={{
                      type: "tween",
                      duration: 0.25,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                  />
                )}

                {/* Content Inside Item (Icon / Profile Picture & Label) */}
                <div className="relative z-10 flex items-center justify-center px-1 py-1.5 w-full h-full">
                  {item.isProfile ? (
                    <div
                      className={`shrink-0 w-[24px] h-[24px] rounded-full overflow-hidden transition-all duration-200 ${
                        isActive
                          ? "ring-2 ring-white shadow-xs"
                          : "ring-1 ring-black/10 dark:ring-white/20 opacity-90 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={profileImgUrl}
                        alt="Profile"
                        className="w-full h-full object-cover object-center select-none"
                        loading="eager"
                        decoding="sync"
                      />
                    </div>
                  ) : Icon ? (
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.2 : 1.85}
                      className={`shrink-0 transition-colors duration-200 ${
                        isActive
                          ? "text-white"
                          : "text-[#7D8797] dark:text-[#8E98A8] hover:text-[var(--blue)] dark:hover:text-white"
                      }`}
                    />
                  ) : null}

                  {/* Expanding Text Label for Active Item Only */}
                  <motion.span
                    initial={false}
                    animate={{
                      width: isActive ? "auto" : 0,
                      opacity: isActive ? 1 : 0,
                      marginLeft: isActive ? 6 : 0,
                    }}
                    transition={{
                      duration: 0.25,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    className="inline-block text-white text-[12px] font-sans font-medium tracking-tight whitespace-nowrap overflow-hidden select-none"
                  >
                    {item.name}
                  </motion.span>
                </div>
              </NavLink>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
