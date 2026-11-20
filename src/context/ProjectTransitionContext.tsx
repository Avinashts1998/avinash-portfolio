import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getOptimizedImageUrl, getVideoPosterUrl } from "../utils/cloudinary";
import { isMediaVideo } from "../utils/mediaUtils";
import { CASE_STUDIES } from "../data/caseStudies";
import { getLuminance } from "../components/admin/ProjectReadingBgColorPicker";
import { getLenis } from "../hooks/useLenis";

export interface CardTransitionProject {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  readingBgColor?: string;
  theme?: "light" | "dark";
}

interface StartCardTransitionParams {
  cardElement: HTMLElement | null;
  project: CardTransitionProject;
  to: string;
  state?: Record<string, any>;
  originRoute?: string;
}

interface StartReverseTransitionParams {
  project: CardTransitionProject;
  performBack: () => void;
  originRoute?: string;
}

interface OriginSnapshot {
  originRoute: string;
  projectId: string;
  title: string;
  subtitle?: string;
  previewImageUrl: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  scrollY: number;
  fromBg: string;
  toBg: string;
  isCardDark: boolean;
  borderRadiusPx: number;
}

interface ActiveTransition {
  direction: "forward" | "reverse";
  phase: "expanding" | "revealing" | "covering" | "collapsing" | "landing";
  originRoute: string;
  projectId: string;
  title: string;
  subtitle?: string;
  previewImageUrl: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  originScrollY: number;
  fromBg: string;
  toBg: string;
  isCardDark: boolean;
  borderRadiusPx: number;
  to: string;
  navState?: Record<string, any>;
}

interface ProjectTransitionContextType {
  startCardTransition: (params: StartCardTransitionParams) => void;
  startReverseTransition: (params: StartReverseTransitionParams) => void;
  hasOriginForProject: (projectId: string, originRoute?: string) => boolean;
  activeCardId: string | null;
  isTransitioning: boolean;
  isForwardHolding: boolean;
  isReversingOut: boolean;
  reverseTargetRoute: string | null;
}

const ProjectTransitionContext = createContext<ProjectTransitionContextType | undefined>(
  undefined
);

function parseRgbLuminance(colorStr: string): number | null {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  const r = Number(match[1]) / 255;
  const g = Number(match[2]) / 255;
  const b = Number(match[3]) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getPreviewUrl(rawThumb?: string): string {
  if (!rawThumb) return "";
  return isMediaVideo(rawThumb)
    ? getVideoPosterUrl(rawThumb, 1000)
    : getOptimizedImageUrl(rawThumb, 1000);
}

function resolveTargetBg(project: CardTransitionProject): string {
  const caseStudyMeta = CASE_STUDIES[project.id] as any;
  const targetReadingBg =
    project.readingBgColor || caseStudyMeta?.readingBgColor || "";

  if (targetReadingBg) return targetReadingBg;
  const targetTheme = project.theme || caseStudyMeta?.theme;
  return targetTheme === "dark" ? "#000000" : "#ffffff";
}

function getLiveHomeCardElement(projectId: string): HTMLElement | null {
  if (typeof document === "undefined" || !projectId) return null;
  const cards = document.querySelectorAll<HTMLElement>("[data-project-card-id]");
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute("data-project-card-id") === projectId) {
      return cards[i];
    }
  }
  return null;
}

export function ProjectTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [transition, setTransition] = useState<ActiveTransition | null>(null);
  const originSnapshotsRef = useRef<Map<string, OriginSnapshot>>(new Map());
  const hasNavigatedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const hasOriginForProject = useCallback((projectId: string, originRoute?: string) => {
    if (originRoute) {
      return originSnapshotsRef.current.has(`${originRoute}::${projectId}`);
    }
    for (const snap of originSnapshotsRef.current.values()) {
      if (snap.projectId === projectId) return true;
    }
    return false;
  }, []);

  const startCardTransition = useCallback(
    ({ cardElement, project, to, state, originRoute }: StartCardTransitionParams) => {
      if (transition) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!cardElement || prefersReducedMotion) {
        navigate(to, { state });
        return;
      }

      clearTimers();
      hasNavigatedRef.current = false;

      const resolvedOriginRoute = originRoute || location.pathname || "/";
      const rect = cardElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(cardElement);
      const parsedRadius = parseFloat(computedStyle.borderTopLeftRadius);
      const borderRadiusPx =
        Number.isFinite(parsedRadius) && parsedRadius > 0
          ? Math.round(parsedRadius)
          : resolvedOriginRoute === "/projects"
          ? 16
          : 20;

      const fromBg =
        computedStyle.backgroundColor &&
        computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" &&
        computedStyle.backgroundColor !== "transparent"
          ? computedStyle.backgroundColor
          : document.documentElement.classList.contains("dark")
          ? "#18181b"
          : "#ebebeb";

      const toBg = resolveTargetBg(project);

      const rgbLum = parseRgbLuminance(fromBg);
      const isCardDark =
        rgbLum !== null
          ? rgbLum < 0.45
          : document.documentElement.classList.contains("dark");

      const previewImageUrl = getPreviewUrl(project.thumbnail);
      const lenis = getLenis();
      const scrollY = lenis ? lenis.scroll : window.scrollY;

      const snapshot: OriginSnapshot = {
        originRoute: resolvedOriginRoute,
        projectId: project.id,
        title: project.title,
        subtitle: project.subtitle,
        previewImageUrl,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        scrollY,
        fromBg,
        toBg,
        isCardDark,
        borderRadiusPx,
      };
      originSnapshotsRef.current.set(`${resolvedOriginRoute}::${project.id}`, snapshot);

      setTransition({
        direction: "forward",
        phase: "expanding",
        originRoute: resolvedOriginRoute,
        projectId: project.id,
        title: project.title,
        subtitle: project.subtitle,
        previewImageUrl,
        rect: snapshot.rect,
        originScrollY: scrollY,
        fromBg,
        toBg,
        isCardDark,
        borderRadiusPx,
        to,
        navState: state,
      });

      // Navigate only once box expansion reaches fullscreen (zero margin flash)
      const navTimer = window.setTimeout(() => {
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigate(to, {
            state: {
              ...(state || {}),
              fromCardExpand: true,
            },
          });
        }
      }, 350);

      const safetyTimer = window.setTimeout(() => {
        setTransition(null);
        hasNavigatedRef.current = false;
      }, 1500);

      timersRef.current.push(navTimer, safetyTimer);
    },
    [transition, navigate, clearTimers, location.pathname]
  );

  const startReverseTransition = useCallback(
    ({ project, performBack, originRoute }: StartReverseTransitionParams) => {
      if (transition) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        performBack();
        return;
      }

      clearTimers();
      hasNavigatedRef.current = false;

      const targetRoute = originRoute || "/";
      const saved = originSnapshotsRef.current.get(`${targetRoute}::${project.id}`);
      const isDarkDoc = document.documentElement.classList.contains("dark");
      const toBg = resolveTargetBg(project);
      const defaultRadius = targetRoute === "/projects" ? 16 : 20;
      const fallbackRect =
        targetRoute === "/projects"
          ? {
              top: Math.round(window.innerHeight * 0.28),
              left: Math.round(window.innerWidth * 0.15),
              width: Math.min(360, Math.round(window.innerWidth * 0.7)),
              height: 240,
            }
          : {
              top: Math.round(window.innerHeight * 0.25),
              left: Math.round(window.innerWidth * 0.1),
              width: Math.round(window.innerWidth * 0.8),
              height: 440,
            };

      const savedScrollRaw =
        typeof sessionStorage !== "undefined" && targetRoute === "/"
          ? sessionStorage.getItem("home_featured_scroll")
          : null;
      const fallbackScrollY = savedScrollRaw ? parseFloat(savedScrollRaw) : 0;

      setTransition({
        direction: "reverse",
        phase: "covering",
        originRoute: targetRoute,
        projectId: project.id,
        title: saved?.title || project.title,
        subtitle: saved?.subtitle || project.subtitle,
        previewImageUrl: saved?.previewImageUrl || getPreviewUrl(project.thumbnail),
        rect: saved?.rect || fallbackRect,
        originScrollY: saved?.scrollY ?? (Number.isFinite(fallbackScrollY) ? fallbackScrollY : 0),
        fromBg: saved?.fromBg || (isDarkDoc ? "#18181b" : "#ebebeb"),
        toBg,
        isCardDark: saved?.isCardDark ?? isDarkDoc,
        borderRadiusPx: saved?.borderRadiusPx ?? defaultRadius,
        to: targetRoute,
      });

      // Let ProjectDetail content slide down cleanly before popping back to origin route
      const navTimer = window.setTimeout(() => {
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          performBack();
        }
      }, 235);

      const safetyTimer = window.setTimeout(() => {
        setTransition(null);
        hasNavigatedRef.current = false;
      }, 1600);

      timersRef.current.push(navTimer, safetyTimer);
    },
    [transition, clearTimers]
  );

  // Forward reveal once /project/:id mounts with synchronous readingBgColor ready
  useEffect(() => {
    if (!transition || transition.direction !== "forward") return;

    const targetPath = transition.to.split("?")[0];
    if (location.pathname === targetPath && transition.phase === "expanding") {
      let cancelled = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          setTransition((prev) =>
            prev && prev.direction === "forward"
              ? { ...prev, phase: "revealing" }
              : null
          );
          const cleanupDelay = window.setTimeout(() => {
            setTransition(null);
            hasNavigatedRef.current = false;
          }, 180);
          timersRef.current.push(cleanupDelay);
        });
      });

      return () => {
        cancelled = true;
      };
    }
  }, [location.pathname, transition]);

  // Reverse collapse: align scroll & measure live card synchronously BEFORE paint via useLayoutEffect
  useLayoutEffect(() => {
    if (!transition || transition.direction !== "reverse") return;

    if (location.pathname === transition.to && transition.phase === "covering") {
      let cancelled = false;

      const targetScrollY = transition.originScrollY;
      const lenis = getLenis();
      if (targetScrollY > 0) {
        window.scrollTo({ top: targetScrollY, left: 0, behavior: "instant" as ScrollBehavior });
        if (document.documentElement) document.documentElement.scrollTop = targetScrollY;
        if (document.body) document.body.scrollTop = targetScrollY;
        if (lenis) {
          lenis.scrollTo(targetScrollY, { immediate: true, force: true, lock: false });
        }
      } else if (transition.to === "/") {
        const el = document.getElementById("selected-works");
        if (el) {
          const topPos = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90);
          window.scrollTo({ top: topPos, left: 0, behavior: "instant" as ScrollBehavior });
          if (lenis) {
            lenis.scrollTo(topPos, { immediate: true, force: true, lock: false });
          }
        }
      }

      const measureAndCollapse = () => {
        if (cancelled) return;

        const cardEl = getLiveHomeCardElement(transition.projectId);
        let liveRect = transition.rect;
        let liveFromBg = transition.fromBg;
        let liveIsCardDark = transition.isCardDark;
        let liveRadiusPx = transition.borderRadiusPx;

        if (cardEl) {
          const r = cardEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            liveRect = {
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
            };
          }
          const cs = window.getComputedStyle(cardEl);
          const parsedR = parseFloat(cs.borderTopLeftRadius);
          if (Number.isFinite(parsedR) && parsedR > 0) {
            liveRadiusPx = Math.round(parsedR);
          }
          if (
            cs.backgroundColor &&
            cs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
            cs.backgroundColor !== "transparent"
          ) {
            liveFromBg = cs.backgroundColor;
            const lum = parseRgbLuminance(liveFromBg);
            if (lum !== null) liveIsCardDark = lum < 0.45;
          }
        }

        setTransition((prev) =>
          prev && prev.direction === "reverse"
            ? {
                ...prev,
                phase: "collapsing",
                rect: liveRect,
                fromBg: liveFromBg,
                isCardDark: liveIsCardDark,
                borderRadiusPx: liveRadiusPx,
              }
            : null
        );

        const finishTimer = window.setTimeout(() => {
          setTransition(null);
          hasNavigatedRef.current = false;
        }, 390);
        timersRef.current.push(finishTimer);
      };

      const initialCard = getLiveHomeCardElement(transition.projectId);
      const initialRect = initialCard?.getBoundingClientRect();
      if (initialCard && initialRect && initialRect.width > 0 && initialRect.height > 0) {
        measureAndCollapse();
        return () => {
          cancelled = true;
        };
      }

      const rafId = requestAnimationFrame(measureAndCollapse);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }
  }, [location.pathname, transition]);

  const isForwardHolding = Boolean(
    transition && transition.direction === "forward" && transition.phase === "expanding"
  );
  const isReversingOut = Boolean(
    transition && transition.direction === "reverse" && transition.phase === "covering"
  );
  const reverseTargetRoute =
    transition && transition.direction === "reverse" ? transition.to : null;
  const shouldHideOriginCard = Boolean(
    transition &&
      transition.originRoute === "/projects" &&
      (transition.direction === "forward" || transition.phase === "collapsing")
  );

  const vw = typeof window !== "undefined" ? window.innerWidth || 1 : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight || 1 : 800;

  const cardClipTarget = (() => {
    if (!transition || typeof window === "undefined") {
      return "inset(0px 0px 0px 0px round 0px)";
    }
    const top = Math.max(0, Math.round(transition.rect.top));
    const left = Math.max(0, Math.round(transition.rect.left));
    const right = Math.max(0, Math.round(vw - (transition.rect.left + transition.rect.width)));
    const bottom = Math.max(0, Math.round(vh - (transition.rect.top + transition.rect.height)));
    return `inset(${top}px ${right}px ${bottom}px ${left}px round ${transition.borderRadiusPx}px)`;
  })();

  const mockupCenterOffset = (() => {
    if (!transition) return { x: 0, y: 0 };
    const cx = transition.rect.left + transition.rect.width / 2;
    const cy = transition.rect.top + transition.rect.height / 2;
    return {
      x: vw / 2 - cx,
      y: vh / 2 - cy,
    };
  })();

  const isProjectsOrigin = transition?.originRoute === "/projects";

  return (
    <ProjectTransitionContext.Provider
      value={{
        startCardTransition,
        startReverseTransition,
        hasOriginForProject,
        activeCardId: shouldHideOriginCard && transition ? transition.projectId : null,
        isTransitioning: Boolean(transition),
        isForwardHolding,
        isReversingOut,
        reverseTargetRoute,
      }}
    >
      {children}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {transition && transition.direction === "forward" && (
              <div
                key="forward-expand"
                id="project-card-expand-overlay"
                aria-hidden="true"
                className="fixed inset-0 z-[260] pointer-events-auto overflow-hidden"
              >
                {/* Gentle depth scrim behind the expanding card */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: transition.phase === "revealing" ? 0 : 1 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="absolute inset-0 bg-black/16 dark:bg-black/42 pointer-events-none"
                />

                {/* GPU-composited card box expanding toward the front */}
                <motion.div
                  initial={{
                    clipPath: cardClipTarget,
                    backgroundColor: transition.fromBg,
                    opacity: isProjectsOrigin ? 1 : 0,
                  }}
                  animate={
                    transition.phase === "revealing"
                      ? {
                          clipPath: "inset(0px 0px 0px 0px round 0px)",
                          backgroundColor: transition.toBg,
                          opacity: 0,
                        }
                      : {
                          clipPath: "inset(0px 0px 0px 0px round 0px)",
                          backgroundColor: transition.toBg,
                          opacity: 1,
                        }
                  }
                  transition={
                    transition.phase === "revealing"
                      ? {
                          opacity: { duration: 0.14, ease: "easeOut" },
                        }
                      : {
                          clipPath: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                          backgroundColor: { duration: 0.28, ease: "easeOut" },
                          opacity: { duration: isProjectsOrigin ? 0 : 0.09, ease: "easeOut" },
                        }
                  }
                  className="fixed inset-0 will-change-[clip-path,opacity,background-color] pointer-events-none"
                >
                  {/* Card thumbnail coming forward smoothly inside the expanding box */}
                  {transition.previewImageUrl && (
                    <motion.div
                      style={{
                        position: "fixed",
                        top: transition.rect.top,
                        left: transition.rect.left,
                        width: transition.rect.width,
                        height: transition.rect.height,
                        padding: isProjectsOrigin ? 18 : 24,
                      }}
                      initial={{
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: isProjectsOrigin ? 1 : 0.85,
                      }}
                      animate={{
                        x: mockupCenterOffset.x,
                        y: mockupCenterOffset.y,
                        scale: 1.08,
                        opacity: 0,
                      }}
                      transition={{
                        x: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        y: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        scale: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.18, delay: 0.14, ease: "easeOut" },
                      }}
                      className="flex items-center justify-center pointer-events-none select-none will-change-transform"
                    >
                      <img
                        src={transition.previewImageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}

            {transition && transition.direction === "reverse" && (
              <div
                key="reverse-collapse"
                id="project-card-collapse-overlay"
                aria-hidden="true"
                className="fixed inset-0 z-[260] pointer-events-auto overflow-hidden"
              >
                {/* Gentle depth scrim only appears once origin page is revealed behind the shrinking box */}
                {transition.phase === "collapsing" && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 bg-black/16 dark:bg-black/42 pointer-events-none"
                  />
                )}

                {/* GPU-composited clip-path collapse smoothly back into card bounds */}
                <motion.div
                  initial={{
                    clipPath: "inset(0px 0px 0px 0px round 0px)",
                    backgroundColor: transition.toBg,
                    opacity: 0,
                  }}
                  animate={
                    transition.phase === "covering"
                      ? {
                          clipPath: "inset(0px 0px 0px 0px round 0px)",
                          backgroundColor: transition.toBg,
                          opacity: 1,
                        }
                      : {
                          clipPath: cardClipTarget,
                          backgroundColor: transition.fromBg,
                          opacity: isProjectsOrigin ? 1 : 0,
                        }
                  }
                  transition={
                    transition.phase === "covering"
                      ? {
                          opacity: { duration: 0.085, delay: 0.14, ease: "easeOut" },
                        }
                      : {
                          clipPath: { duration: 0.37, ease: [0.22, 1, 0.36, 1] },
                          backgroundColor: { duration: 0.28, ease: "easeOut" },
                          opacity: {
                            duration: isProjectsOrigin ? 0 : 0.12,
                            delay: isProjectsOrigin ? 0 : 0.25,
                            ease: "easeOut",
                          },
                        }
                  }
                  className="fixed inset-0 will-change-[clip-path,opacity,background-color] pointer-events-none"
                >
                  {/* Card thumbnail gliding back into exact slot during collapse */}
                  {transition.previewImageUrl && transition.phase === "collapsing" && (
                    <motion.div
                      style={{
                        position: "fixed",
                        top: transition.rect.top,
                        left: transition.rect.left,
                        width: transition.rect.width,
                        height: transition.rect.height,
                        padding: isProjectsOrigin ? 18 : 24,
                      }}
                      initial={{
                        x: mockupCenterOffset.x,
                        y: mockupCenterOffset.y,
                        scale: 1.08,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: isProjectsOrigin ? 1 : 0.85,
                      }}
                      transition={{
                        x: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        y: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        scale: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.22, delay: 0.08, ease: "easeOut" },
                      }}
                      className="flex items-center justify-center pointer-events-none select-none will-change-transform"
                    >
                      <img
                        src={transition.previewImageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </ProjectTransitionContext.Provider>
  );
}

export function useProjectTransition() {
  const ctx = useContext(ProjectTransitionContext);
  if (!ctx) {
    throw new Error(
      "useProjectTransition must be used within ProjectTransitionProvider"
    );
  }
  return ctx;
}
