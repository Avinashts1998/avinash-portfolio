import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Lenis from "lenis";
import { resumeService, ResumeDocument, DEFAULT_RESUME } from "../../services/resumeService";
import { 
  X, 
  Download, 
  Envelope as Mail, 
  Link as Linkedin, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  Setting as Wrench, 
  ArrowUpRight,
  Phone
} from "reicon-react";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResumeModal({ isOpen, onClose }: ResumeModalProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [primaryResume, setPrimaryResume] = useState<ResumeDocument>(() => resumeService.getPrimaryResume());
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Real-time listener for primary resume updates
  useEffect(() => {
    const unsubscribe = resumeService.initListener((_, primary) => {
      if (primary) {
        setPrimaryResume(primary);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await resumeService.downloadResumeFile(primaryResume);
    } finally {
      setIsDownloading(false);
    }
  };

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle smooth scroll using Lenis for the modal scrollable area
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;

    const prefersReducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotionMedia.matches) return;

    const lenis = new Lenis({
      wrapper: scrollContainerRef.current,
      content: scrollContainerRef.current,
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.75,
      virtualScroll: (data) => {
        const maxDelta = 60;
        if (Math.abs(data.deltaY) > maxDelta) {
          data.deltaY =
            Math.sign(data.deltaY) *
            (maxDelta + Math.sqrt(Math.abs(data.deltaY) - maxDelta) * 2);
        }
        return true;
      },
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isOpen]);

  // Data
  const workHistory = [
    {
      date: "Nov 2025 — Present",
      title: "UX Designer",
      subtitle: "Starlfinx Fintech Technology EST",
      location: "Onsite - Dubai, United Arab Emirates",
      description: "Worked on end-to-end product design for a core Fintech Ecosystem during Phase 2 onsite in Dubai. Redesigned onboarding/device setup flows to reduce first-time user friction by 50% and task completion time by 30%. Redesigned the homepage with a customizable widget system, increasing user engagement by 35%. Lifted Retention by 20%, Conversion by 30%, and designed scalable design systems that reduced design and development effort by 35%.",
    },
    {
      date: "Jul 2025 — Nov 2025",
      title: "UX Designer",
      subtitle: "Starlfinx Fintech Technology PVT Ltd",
      location: "Chennai, India",
      description: "Delivered end-to-end product design for a Fintech Ecosystem during Phase 1 in Chennai. Conducted market research and mapped user journeys to reduce workflow friction by 40%. Collaborated with stakeholders to prioritize MVP features, reducing development scope by 30% and eliminating scope ambiguity.",
    },
    {
      date: "May 2024 — Jan 2025",
      title: "Software Engineer",
      subtitle: "Metric Tree Labs Pvt Ltd",
      location: "Kochi, India",
      description: "Collaborated with Product, Design, and Engineering teams to build user-facing web applications. Reduced UI inconsistencies and design-to-dev rework by 30% by developing pixel-perfect, consistent frontend interfaces with reusable components.",
    },
    {
      date: "Feb 2022 — Mar 2024",
      title: "Full-Stack Developer",
      subtitle: "TechWyse IT Solutions Pvt Ltd",
      location: "Kochi, India",
      description: "Developed and maintained web applications across the product lifecycle. Worked on frontend implementation, state management, and component optimization, boosting performance by 25% and reducing re-renders. Integrated CRM modules through RESTful APIs.",
    },
  ];

  const educationHistory = [
    {
      date: "2020 — 2021",
      title: "Full-Stack Development (MERN Stack)",
      subtitle: "NIAT, NxtWave of Innovation in Advanced Technologies",
      description: "Intensive training in full-stack engineering and user interfaces. Specializations in HTML, CSS, JavaScript, React, Figma, UI/UX Design, Product Design, Web Design, and Mobile App Design.",
    },
    {
      date: "2016 — 2020",
      title: "Bachelor of Commerce (B.Com)",
      subtitle: "Kannur University",
      description: "Specialized in Consumer Psychology, Consumer Behaviour, Accounting, Human Psychology, Business Strategy, Critical Thinking, and Problem Solving.",
    },
  ];

  const categorizedSkills = [
    {
      category: "Product Design",
      skills: [
        "Product Thinking", "UX Strategy", "End-to-End Product Design", "User Experience Design",
        "User Research", "Interaction Design", "Information Architecture", "User Flows",
        "Journey Maps", "Wireframes", "Prototyping", "Workshop Facilitation", "Design Systems",
        "Component Libraries", "User-Centered Design", "Design Critiques", "Product Discovery",
        "Usability Testing", "Evaluative Research", "A/B Testing", "Experimentation",
        "Data-Driven Design", "Metrics-driven Design", "Feature Discovery", "Product Analytics",
        "Visual Design", "Visual Hierarchy", "Responsive Design", "Accessibility",
        "Design-to-Development Handoff", "Design Validation", "Heuristic Evaluation",
        "Acceptance Criteria", "Design Ops"
      ]
    },
    {
      category: "Tools",
      skills: [
        "Figma", "FigJam", "Adobe XD", "Miro", "Maze", "Jira", "Confluence", "Notion",
        "Google Analytics (GA4)", "Hotjar", "Microsoft Clarity", "Mixpanel", "Firebase Analytics",
        "Zeplin", "Figma Dev Mode", "ChatGPT", "Claude", "Gemini", "Perplexity", "Figma AI"
      ]
    },
    {
      category: "Domains",
      skills: [
        "FinTech", "SaaS", "Enterprise UX", "Enterprise Applications", "AI & Generative AI Products",
        "B2B & B2C Platforms", "E-commerce", "Mobile Platforms", "Digital Payments",
        "Banking & Financial Services", "Real-time Collaboration", "Growth Design",
        "Conversion Optimization"
      ]
    },
    {
      category: "Leadership",
      skills: [
        "Product Strategy", "Feature Prioritization", "Roadmap Planning", "Sprint Planning",
        "Release Alignment", "Technical Feasibility", "Stakeholder Management",
        "Cross-functional Collaboration", "Mentorship", "Agile / Scrum", "Design Sprints",
        "Design Reviews", "Cross-timezone Collaboration"
      ]
    }
  ];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const animationSettings = prefersReducedMotion
    ? {
        overlay: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } },
        card: { initial: { scale: 1, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
      }
    : {
        overlay: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.22, ease: "easeOut" as const } },
        card: { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }, transition: { duration: 0.22, ease: "easeOut" as const } }
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...animationSettings.overlay}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md overflow-hidden"
          id="resume-modal-overlay"
        >
          <motion.div
            {...animationSettings.card}
            ref={cardRef}
            className="relative w-full max-w-[1150px] max-h-[92vh] bg-white dark:bg-neutral-950 rounded-2xl shadow-lg border border-neutral-200/50 dark:border-neutral-800/50 flex flex-col overflow-hidden"
            id="resume-modal-card"
          >
            {/* Sticky Header inside Card */}
            <div className="sticky top-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60 px-6 sm:px-8 py-4 flex items-center justify-between z-20 shrink-0">
              <motion.button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all duration-300 cursor-pointer text-xs sm:text-sm font-sans font-medium normal-case tracking-normal"
                aria-label="Close modal"
                whileHover="hover"
                whileTap={{ scale: 0.96 }}
              >
                <motion.span
                  className="inline-flex"
                  variants={{
                    initial: { rotate: 0 },
                    hover: { rotate: 90, scale: 1.1 }
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <X size={15} />
                </motion.span>
                <span>Close</span>
              </motion.button>
              
              <motion.a
                href={resumeService.getResumeDownloadUrl(primaryResume)}
                download={primaryResume.name}
                onClick={handleDownloadClick}
                className="group inline-flex items-center gap-2 px-5 py-2 bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-medium normal-case tracking-normal rounded-full shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
                whileTap={{ scale: 0.96 }}
                aria-label={`Download resume PDF: ${primaryResume.name}`}
              >
                <Download size={14} className={`shrink-0 ${isDownloading ? "animate-bounce" : "group-hover:translate-y-0.5 transition-transform duration-150"}`} />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </motion.a>
            </div>

            {/* Document body scroll */}
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto px-6 sm:px-14 py-8 sm:py-12 space-y-8 select-text text-neutral-800 dark:text-neutral-200"
            >
              {/* Profile / Header */}
              <div className="text-center space-y-3 pb-2">
                <h1 className="text-3xl sm:text-4xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
                  Avinash Shajan
                </h1>
                
                <p className="text-xs sm:text-sm font-sans font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Product Designer | Enterprise Fintech UX | AI-first Design
                </p>

                {/* Contact row */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1.5 text-xs sm:text-[13px] font-sans text-neutral-600 dark:text-neutral-400">
                  <a 
                    href="https://wa.me/917559082108" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 hover:text-[var(--blue)] dark:hover:text-[var(--blue)] transition-colors group"
                  >
                    <Phone size={13} className="text-[var(--blue)] shrink-0" />
                    <span className="underline decoration-neutral-200 dark:decoration-neutral-800 group-hover:decoration-[var(--blue)] underline-offset-4 font-medium">
                      +91 7559082108
                    </span>
                  </a>

                  <a 
                    href="mailto:avinashts1122@gmail.com" 
                    className="flex items-center gap-1.5 hover:text-[var(--blue)] dark:hover:text-[var(--blue)] transition-colors group"
                  >
                    <Mail size={13} className="text-[var(--blue)] shrink-0" />
                    <span className="underline decoration-neutral-200 dark:decoration-neutral-800 group-hover:decoration-[var(--blue)] underline-offset-4 font-medium">
                      avinashts1122@gmail.com
                    </span>
                  </a>

                  <a 
                    href="https://www.linkedin.com/in/avinash-shajan-169b631aa/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 hover:text-[var(--blue)] dark:hover:text-[var(--blue)] transition-colors group"
                  >
                    <Linkedin size={13} className="text-[var(--blue)] shrink-0" />
                    <span className="underline decoration-neutral-200 dark:decoration-neutral-800 group-hover:decoration-[var(--blue)] underline-offset-4 font-medium">
                      linkedin.com/in/avinashshajan
                    </span>
                  </a>

                  <a 
                    href="https://avinashshajan.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 hover:text-[var(--blue)] dark:hover:text-[var(--blue)] transition-colors group"
                  >
                    <Globe size={13} className="text-[var(--blue)] shrink-0" />
                    <span className="underline decoration-neutral-200 dark:decoration-neutral-800 group-hover:decoration-[var(--blue)] underline-offset-4 font-medium">
                      avinashshajan.com
                    </span>
                  </a>
                </div>

                <p className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 pt-1">
                  Based in Dubai, UAE
                </p>
              </div>

              {/* PROFESSIONAL SUMMARY */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-2">
                  <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Professional Summary
                  </h2>
                  <Link 
                    to="/" 
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-sans font-medium text-[var(--blue)] hover:underline"
                  >
                    <span>View Portfolio</span>
                    <ArrowUpRight size={11} />
                  </Link>
                </div>
                <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300 font-sans text-justify">
                  Product Designer with <strong>5+</strong> years delivering AI-first, user-centered designs across fintech, SaaS, e-commerce, and enterprise platforms. Currently designing a Dubai-based (Onsite Projects) fintech ecosystem, delivering end-to-end product design across product strategy, feature prioritization, design systems, and developer handoff. Consistent record of data-driven, measurable impact: 50% reduction in onboarding friction, 35% uplift in engagement, 45% reduction in payment drop-offs. Skilled in cross-functional collaboration with Product and Engineering teams, shaping user stories and acceptance criteria, driving sprint planning and release alignment while balancing technical feasibility with conversion optimization. NIAT Hyderabad alumnus with deep expertise in enterprise UX, B2B and B2C Product Design, Full-Stack Development and generative AI-assisted workflows.
                </p>
              </div>

              {/* EXPERIENCE */}
              <div className="space-y-4">
                <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 pb-2">
                  <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Experience
                  </h2>
                </div>
                <div className="space-y-6">
                  {workHistory.map((job, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-[13.5px] sm:text-[14px] text-neutral-900 dark:text-white font-sans">
                          {job.title} <span className="font-normal text-neutral-500 dark:text-neutral-400">at {job.subtitle}</span>
                          {(job as any).location && (
                            <span className="font-normal text-neutral-400 dark:text-neutral-500">
                              {" | "}
                              <span className="text-black dark:text-white font-medium">
                                {(job as any).location}
                              </span>
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 sm:text-right shrink-0">
                          {job.date}
                        </span>
                      </div>
                      <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans">
                        {job.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXPERTISE & SKILLS */}
              <div className="space-y-4">
                <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 pb-2">
                  <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Skills
                  </h2>
                </div>
                <div className="space-y-4 pt-1">
                  {categorizedSkills.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <h3 className="font-bold text-[13px] sm:text-[13.5px] text-neutral-900 dark:text-white font-sans">
                        {cat.category}
                      </h3>
                      <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans text-justify">
                        {cat.skills.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDUCATION */}
              <div className="space-y-4">
                <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 pb-2">
                  <h2 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Education
                  </h2>
                </div>
                <div className="space-y-5">
                  {educationHistory.map((edu, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-[13.5px] sm:text-[14px] text-neutral-900 dark:text-white font-sans">
                          {edu.title}
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 sm:text-right shrink-0">
                          {edu.date}
                        </span>
                      </div>
                      <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-sans">
                        {edu.subtitle} &mdash; {edu.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
