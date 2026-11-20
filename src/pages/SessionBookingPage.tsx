import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, 
  ArrowRight, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Compass, 
  Briefcase, 
  Users, 
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { profilePictureService, DEFAULT_PROFILE_PICTURE } from "../services/profilePictureService";
import { sessionConfigService } from "../services/sessionConfigService";

interface SessionFormat {
  id: string;
  num: string;
  title: string;
  duration: string;
  tag?: string;
  description: string;
  bullets: string[];
  isWide?: boolean;
}

const SESSION_FORMATS: SessionFormat[] = [
  {
    id: "portfolio-review",
    num: "02",
    title: "Portfolio Review",
    duration: "60m",
    description: "Get practical feedback on your portfolio structure, storytelling, presentation, and overall positioning.",
    bullets: [
      "Project hierarchy & narrative critique",
      "Actionable checklist to fix gaps before submitting"
    ]
  },
  {
    id: "career-transition",
    num: "03",
    title: "Career Transition",
    duration: "45m",
    description: "Clarify your next career move, evaluate your skill gaps, and build a focused action plan to level up.",
    bullets: [
      "Skill gap audit against target role expectations",
      "Career trajectory & positioning strategy"
    ]
  },
  {
    id: "case-study-deep-dive",
    num: "04",
    title: "Case Study Deep-Dive",
    duration: "60m",
    description: "Deconstruct your case studies to highlight problem-solving depth, trade-offs, and measurable business impact.",
    bullets: [
      "Story arc restructuring (hook, tension, outcome)",
      "Metrics & business impact framing refinement"
    ]
  },
  {
    id: "design-interview-prep",
    num: "05",
    title: "Design Interview Prep",
    duration: "75m",
    description: "Simulate product design interviews, whiteboard challenges, and past project defenses with real-time feedback.",
    bullets: [
      "Live whiteboard or app critique simulation",
      "Behavioral & technical questioning drill"
    ]
  },
  {
    id: "resume-review",
    num: "06",
    title: "Resume Review",
    duration: "30m",
    description: "Audit your resume for visual hierarchy, ATS clarity, and impact-driven phrasing that catches recruiter attention.",
    bullets: [
      "Impact-driven bullet point rewrites",
      "Visual hierarchy & scanning layout audit"
    ]
  },
  {
    id: "resume-preparation",
    num: "07",
    title: "Resume Preparation",
    duration: "60m",
    description: "Collaboratively write and structure your design resume from scratch around quantifiable accomplishments.",
    bullets: [
      "Core competency mapping",
      "Full resume build with high-converting phrasing"
    ]
  }
];

const WHO_ITS_FOR = [
  {
    num: "01",
    title: "Starting in UI/UX",
    description: "For people who are exploring UI/UX and don't know where to begin."
  },
  {
    num: "02",
    title: "Transitioning into Design",
    description: "For professionals moving from another field into UI/UX or Product Design."
  },
  {
    num: "03",
    title: "Growing as a Designer",
    description: "For designers who want stronger portfolios, case studies, and product thinking."
  },
  {
    num: "04",
    title: "Preparing for Opportunities",
    description: "For designers preparing for interviews, applications, resumes, and career moves."
  }
];

const MENTOR_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
];

export default function SessionBookingPage() {
  const [profilePic, setProfilePic] = useState<string>(() => {
    return profilePictureService.getProfilePicture().imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl;
  });

  useEffect(() => {
    const unsub = profilePictureService.initListener((data) => {
      if (data?.imageUrl) setProfilePic(data.imageUrl);
    });
    return () => unsub();
  }, []);

  // Selected session for booking
  const [selectedSessionId, setSelectedSessionId] = useState<string>("portfolio-review");

  const openBookingFor = (_topic?: string, _durationStr?: string) => {
    sessionConfigService.navigateToBooking();
  };

  const selectedSession = SESSION_FORMATS.find((s) => s.id === selectedSessionId) || SESSION_FORMATS[0];

  return (
    <div className="min-h-screen bg-[#030407] text-white selection:bg-neutral-800 selection:text-white font-sans relative antialiased overflow-x-hidden">
      
      {/* ──────────────────────────────────────────────────────────
          CENTER-ONLY ARCHITECTURAL SQUARE GRID BACKGROUND
          (Reduced line density: 72px squares; visible only in center; surrounding area blacked out like a shadow)
         ────────────────────────────────────────────────────────── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        {/* Crisp Square Grid - 72px spaced (reduced line density) masked to center only */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.055) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            backgroundPosition: "center top",
            maskImage: "radial-gradient(ellipse 55% 45% at 50% 36%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.85) 30%, rgba(0, 0, 0, 0.25) 55%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 55% 45% at 50% 36%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.85) 30%, rgba(0, 0, 0, 0.25) 55%, transparent 75%)",
          }}
        />

        {/* Central subtle ambient light illuminating the center squares */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 40% at 50% 36%, rgba(46, 91, 255, 0.07) 0%, rgba(30, 58, 138, 0.02) 45%, transparent 70%)"
          }}
        />

        {/* Deep surrounding black shadow / heavy radial vignette that blacks out all surrounded areas */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 65% 55% at 50% 36%, transparent 15%, rgba(3, 4, 7, 0.7) 48%, #030407 75%, #030407 100%)"
          }}
        />

        {/* Top shadow gradient behind navigation */}
        <div 
          className="absolute top-0 left-0 right-0 h-36"
          style={{
            background: "linear-gradient(to bottom, #030407 15%, rgba(3, 4, 7, 0.8) 60%, transparent 100%)"
          }}
        />

        {/* Bottom shadow gradient ensuring rest of page smoothly transitions into pure dark */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-64"
          style={{
            background: "linear-gradient(to top, #030407 20%, rgba(3, 4, 7, 0.8) 70%, transparent 100%)"
          }}
        />
      </div>
      
      {/* ──────────────────────────────────────────────────────────
          FLOATING NAVBAR (Aligned to content grid max-w-6xl, increased size)
         ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-5 sm:top-6 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="max-w-6xl mx-auto">
          <div className="w-full bg-[#0e1219]/90 backdrop-blur-md border border-[#1f2635] rounded-2xl sm:rounded-[22px] px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between shadow-2xl pointer-events-auto">
            {/* Cursive Brand Logo */}
            <a 
              href="#hero" 
              className="font-['Caveat',cursive] text-2xl sm:text-[30px] md:text-[32px] font-bold text-white tracking-wide hover:opacity-90 transition-opacity select-none leading-none"
            >
              Avinash Shajan
            </a>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-9 lg:gap-11 text-sm sm:text-[14.5px] font-sans font-medium text-neutral-300">
              <a href="#sessions" className="hover:text-white transition-colors">
                Sessions
              </a>
              <a href="#who-its-for" className="hover:text-white transition-colors">
                Who It's For
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
              <a 
                href="/admin" 
                className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-semibold"
                title="Open Admin Dashboard"
              >
                <span>ADMIN</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#10b981]" />
              </a>
            </div>

            {/* Right CTA */}
            <button
              type="button"
              onClick={() => openBookingFor("UI/UX Career Guidance", "60 minutes")}
              className="px-6 py-2.5 sm:py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-sans font-semibold transition-all shadow-lg shadow-black/30 cursor-pointer active:scale-95"
            >
              Let's Connect
            </button>
          </div>
        </div>
      </nav>

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT AREA (relative z-10 ensures full visibility above background)
         ────────────────────────────────────────────────────────── */}
      <main className="relative z-10">

        {/* ──────────────────────────────────────────────────────────
            HERO SECTION (Exact Match to Screenshot, Aligned with Navbar)
           ────────────────────────────────────────────────────────── */}
        <section id="hero" className="relative z-10 pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Column (Headline, Badge, Description, CTAs) */}
            <div className="lg:col-span-7 space-y-6 relative z-10">
              
              {/* Live Session Badge (Green dot + tracked uppercase text, exact to screenshot) */}
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block shadow-[0_0_8px_#10b981]" />
                <span className="font-mono text-[12px] font-semibold tracking-[0.2em] text-[#d1d5db] uppercase">
                  1:1 DESIGN SESSIONS
                </span>
              </div>

              {/* Giant Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-heading-now text-white tracking-tight leading-[1.1]">
                Grow your career in <br />
                <span className="text-white">UI/UX & Product Design.</span>
              </h1>

              {/* Subhead */}
              <p className="text-base sm:text-[17px] text-neutral-400 font-sans leading-relaxed max-w-xl">
                Get focused, practical guidance on your portfolio, case studies, resume, interviews, and career direction — directly from a product designer.
              </p>

              {/* Action Buttons (Exact to screenshot: Blue rounded button + Dark button) */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => openBookingFor("UI/UX Career Guidance", "60 minutes")}
                  className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-sm sm:text-base font-semibold shadow-xl shadow-black/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Book a Session</span>
                  <ArrowRight size={17} />
                </button>

                <a
                  href="#sessions"
                  className="px-6 py-3.5 rounded-xl bg-[#11141c] hover:bg-[#181d28] border border-[#222a38] text-neutral-300 hover:text-white font-sans text-sm sm:text-base font-medium transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Sessions</span>
                </a>
              </div>

              {/* Micro footnote */}
              <p className="text-xs sm:text-[13px] text-neutral-400 font-sans pt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 inline-block" />
                <span>For designers learning, transitioning, or preparing for their next opportunity.</span>
              </p>
            </div>

          {/* Right Column: "WHO I'VE MENTORED" Card (Exact Match to Screenshot) */}
          <div className="lg:col-span-5">
            <div className="bg-[#10141c] border border-[#1d2432] rounded-[28px] p-6 sm:p-7 md:p-8 shadow-2xl relative">
              <span className="text-[11px] font-mono tracking-[0.22em] uppercase text-neutral-400 font-semibold block mb-5">
                WHO I'VE MENTORED
              </span>

              {/* Avatar Stack with Highlighted 6th Avatar and 20+ Badge */}
              <div className="flex items-center -space-x-3 py-1">
                {MENTOR_AVATARS.map((avatar, idx) => (
                  <div 
                    key={idx} 
                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 ${
                      idx === MENTOR_AVATARS.length - 1 
                        ? "border-[#a3e635] ring-2 ring-[#a3e635]/40 z-10" 
                        : "border-[#10141c]"
                    } bg-neutral-800 shrink-0`}
                  >
                    <img 
                      src={avatar} 
                      alt="Mentee" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#18202c] border-2 border-[#10141c] text-xs font-mono font-bold text-white flex items-center justify-center shrink-0">
                  20+
                </div>
              </div>

              {/* Big Stat */}
              <div className="mt-6">
                <div className="text-5xl sm:text-[54px] font-sans font-bold text-white tracking-tight leading-none">
                  20+
                </div>
                <div className="text-xs sm:text-[13px] text-neutral-400 font-sans mt-2">
                  sessions taken, one to one
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#1c2330] my-6" />

              {/* Sub-stats footer */}
              <div className="space-y-3 text-xs sm:text-[13px] font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-neutral-500 text-[11px] uppercase tracking-wider">DESIGNLAB</span>
                  <span className="text-neutral-300 font-medium">UX Academy mentor</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-neutral-500 text-[11px] uppercase tracking-wider">ADPLIST</span>
                  <span className="text-neutral-300 font-medium">Free 1:1 sessions</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 01: SPECIALIZED 1:1 SESSIONS (Screenshots 2, 3, 4)
         ────────────────────────────────────────────────────────── */}
      <section id="sessions" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#171d26]">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-neutral-500 block mb-2">
            01 / AVAILABLE FORMATS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading-now text-white tracking-tight">
            Specialized 1:1 Sessions
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl mt-3 leading-relaxed">
            Direct, practical guidance calibrated for your specific stage — whether you're breaking in, prepping for interviews, or shaping your promotion path.
          </p>
        </div>

        {/* 01: Learn UI/UX Design (Wide Featured Card, Screenshot 2) */}
        <div className="bg-[#10141a] border border-[#1b222d] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#273243] transition-colors">
          <div className="space-y-2.5 max-w-2xl">
            <span className="text-xs font-mono font-semibold tracking-wider text-neutral-300 uppercase">
              01 / CURRICULUM & MENTORSHIP
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading-now text-white tracking-tight">
              Learn UI/UX Design
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Comprehensive 1:1 path covering foundational design thinking, Figma craft, design systems, and building a job-ready capstone portfolio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openBookingFor("Learn UI/UX Design", "60 minutes")}
            className="shrink-0 px-6 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-sans font-semibold transition-all inline-flex items-center justify-center gap-2 shadow-md shadow-black/30 cursor-pointer active:scale-95"
          >
            <span>Book this session</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* 3-Column Grid of 6 Session Cards (Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {SESSION_FORMATS.map((session) => {
            const isSelected = selectedSessionId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`bg-[#10141a] rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer border ${
                  isSelected 
                    ? "border-neutral-500 ring-1 ring-neutral-500/30 shadow-xl" 
                    : "border-[#1b222d] hover:border-[#273243]"
                }`}
              >
                <div>
                  {/* Top Row: Number & Duration */}
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-4">
                    <span className="font-semibold text-neutral-400">{session.num}</span>
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Clock size={12} />
                      <span>{session.duration}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-lg sm:text-xl font-heading-now text-white tracking-tight mb-2.5">
                    {session.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-neutral-400 font-sans leading-relaxed mb-6">
                    {session.description}
                  </p>

                  {/* Bullets */}
                  <div className="space-y-2 border-t border-[#1b222d] pt-4 mb-6">
                    {session.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-xs font-sans text-neutral-300">
                        <Check size={14} className="text-neutral-300 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Card CTA */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSessionId(session.id);
                    openBookingFor(session.title, session.duration);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-[13px] font-sans font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                    isSelected
                      ? "bg-neutral-800 hover:bg-neutral-700 text-white shadow-md shadow-black/25"
                      : "bg-[#141a23] hover:bg-[#1c2432] text-neutral-300 border border-[#202836]"
                  }`}
                >
                  <span>{isSelected ? "Session Selected" : "Book this session"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* 08: Product Design Roadmap (Wide Strategy Deep-Dive Card, Screenshot 4) */}
        <div className="mt-6 bg-[#10141a] border border-[#1b222d] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden hover:border-[#273243] transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-semibold text-neutral-400 uppercase">
                  08 · ⏱ 60m Comprehensive
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold tracking-wider uppercase">
                  STRATEGY DEEP-DIVE
                </span>
                <span className="text-xs font-sans text-neutral-500 ml-auto hidden sm:inline">
                  Includes 90-Day Execution Matrix
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-heading-now text-white tracking-tight">
                Product Design Roadmap
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
                Build a custom 6-month growth plan across systems, product thinking, visual craft, and leadership.
              </p>

              {/* Dual Column Checkmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                <div className="flex items-start gap-2 text-xs font-sans text-neutral-300">
                  <Check size={14} className="text-neutral-300 shrink-0 mt-0.5" />
                  <span>Competency spider audit (craft, research, business, communication)</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-sans text-neutral-300">
                  <Check size={14} className="text-neutral-300 shrink-0 mt-0.5" />
                  <span>Curated reading, project prompts, and tooling guidance</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-sans text-neutral-300">
                  <Check size={14} className="text-neutral-300 shrink-0 mt-0.5" />
                  <span>Quarterly execution tracker template</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openBookingFor("Product Design Roadmap", "60 minutes")}
              className="shrink-0 px-6 py-3 rounded-full bg-[#141a23] hover:bg-[#1c2432] border border-[#202836] text-white text-xs sm:text-sm font-sans font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Book this session</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Sticky Floating Bottom Bar (Screenshot 4) */}
        <div className="mt-8 bg-[#10141a]/95 backdrop-blur-md border border-[#1e2634] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                SESSION SELECTED & PREPARED
              </span>
              <span className="text-sm font-sans font-bold text-white">
                {selectedSession.title} ({selectedSession.duration})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <span className="text-xs text-neutral-400 hidden md:inline">
              Ready for booking details flow
            </span>
            <button
              type="button"
              onClick={() => openBookingFor(selectedSession.title, selectedSession.duration)}
              className="px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-sans font-semibold transition-all inline-flex items-center gap-2 shadow-md shadow-black/30 cursor-pointer active:scale-95 w-full sm:w-auto justify-center"
            >
              <span>Proceed with this session</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 02: WHO THESE SESSIONS ARE FOR (Screenshot 5)
         ────────────────────────────────────────────────────────── */}
      <section id="who-its-for" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#171d26]">
        <div className="mb-10 sm:mb-12">
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-neutral-500 block mb-2">
            02 / WHO THESE SESSIONS ARE FOR
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading-now text-white tracking-tight">
            Wherever you are in <br className="hidden sm:inline" />
            your design journey.
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl mt-3 leading-relaxed">
            Every session is structured around your specific context. No standardized lectures — just focused, 1:1 guidance meeting you at your current inflection point.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHO_ITS_FOR.map((item) => (
            <div
              key={item.num}
              className="bg-[#10141a] border border-[#1b222d] rounded-2xl p-6 flex flex-col justify-between hover:border-[#273243] transition-colors"
            >
              <div>
                <span className="text-xs font-mono font-bold text-neutral-500 block mb-4">
                  {item.num}
                </span>
                <h4 className="text-base sm:text-lg font-heading-now text-white tracking-tight mb-2">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-[13px] text-neutral-400 font-sans leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mentorship Principles Card (Screenshot 6) */}
        <div className="mt-8 bg-[#10141a] border border-[#1b222d] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8 border-b border-[#1b222d]">
            <div className="lg:col-span-7 space-y-1.5">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 font-semibold block">
                MENTORSHIP PRINCIPLES
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading-now text-white tracking-tight">
                How we make every 1:1 hour count.
              </h3>
            </div>

            <div className="lg:col-span-5 text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Sessions are deliberate, transparent, and direct. You leave with concrete momentum, not vague encouragement.
            </div>
          </div>

          {/* 4 Bullet Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-sans font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <span>Practical feedback</span>
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Direct, actionable critiques on your real work rather than high-level theory.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-sans font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <span>Clear next steps</span>
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                A concrete punch list of what to revise, rewrite, or build next.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-sans font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <span>Real-world design perspective</span>
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Calibrated directly against actual hiring manager and team expectations.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-sans font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                <span>Personalized guidance</span>
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Tailored 1:1 advice shaped around your specific background and targets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 03: ABOUT THE MENTOR (Screenshots 7 & 8)
         ────────────────────────────────────────────────────────── */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#171d26]">
        <div className="mb-10 sm:mb-12">
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-neutral-500 block mb-2">
            03 / ABOUT THE MENTOR
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading-now text-white tracking-tight">
            Design conversations that <br className="hidden sm:inline" />
            move your career forward.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Portrait */}
          <div className="lg:col-span-5">
            <div className="bg-[#10141a] border border-[#1b222d] rounded-3xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 uppercase tracking-wider px-1 pb-3">
                <span>MENTOR PORTRAIT</span>
                <span>4:5 Aspect</span>
              </div>

              {/* Portrait Image Frame */}
              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700/60 shadow-inner group">
                <img
                  src={profilePic}
                  alt="Avinash Shajan"
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />

                {/* Subtle Name Tag at bottom */}
                <div className="absolute bottom-3 left-3 right-3 bg-[#10141a]/90 backdrop-blur-md border border-neutral-700/50 rounded-xl px-3.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white font-sans">Avinash Shajan</span>
                    <CheckCircle2 size={13} className="text-white fill-white text-white shrink-0" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Design Mentor</span>
                </div>
              </div>

              {/* Below photo label */}
              <div className="pt-3.5 text-center text-xs text-neutral-400 font-sans flex items-center justify-center gap-2">
                <span>Personal Mentorship</span>
                <span className="text-neutral-600">·</span>
                <span>Active Industry Practitioner</span>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Checklist */}
          <div className="lg:col-span-7 space-y-6 pt-2">
            <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
              I am a UI/UX and Product Designer working on real-world digital products. Having navigated the realities of shipping production software and evaluating design portfolios, I know how difficult it can be to get straightforward, candid feedback in this industry.
            </p>

            <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
              I host these 1:1 sessions to help designers break through plateau points — whether that means transforming a case study from a generic process template into an impactful narrative, sharpening visual craft, or preparing for high-stakes design interviews.
            </p>

            {/* Practical guidance checkmark */}
            <div className="bg-[#10141a] border border-[#1b222d] rounded-2xl p-5 space-y-2 mt-6">
              <div className="flex items-center gap-2 text-sm sm:text-base font-sans font-bold text-white">
                <CheckCircle2 size={18} className="text-neutral-300 shrink-0" />
                <span>Focus on practical, actionable design guidance</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed pl-6.5">
                Zero generic platitudes. Every critique is specific, prioritized, and focused on what hiring teams look for.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => openBookingFor("UI/UX Career Guidance", "60 minutes")}
                className="px-7 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-sm sm:text-base font-semibold shadow-lg shadow-black/30 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Let's talk design</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION: OPEN DISCUSSION (Screenshot 9)
         ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-[#171d26]">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-neutral-400 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
          <span>OPEN DISCUSSION</span>
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-[68px] font-heading-now text-white tracking-tight leading-[1.1]">
          Not sure what <br />
          you need yet?
        </h2>

        <p className="text-base sm:text-xl text-neutral-400 font-sans mt-5 max-w-2xl mx-auto leading-relaxed">
          Tell me where you are in your design journey and we can figure out the right direction together.
        </p>

        <div className="pt-8">
          <button
            type="button"
            onClick={() => openBookingFor("Other", "60 minutes")}
            className="px-8 sm:px-10 py-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-base sm:text-lg font-semibold shadow-2xl shadow-black/40 transition-all inline-flex items-center gap-2.5 cursor-pointer active:scale-95"
          >
            <span>Book a Session</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <p className="text-xs text-neutral-500 font-sans mt-5">
          Direct 1:1 conversation · No pressure · Tailored guidance
        </p>
      </section>
      </main>

      {/* ──────────────────────────────────────────────────────────
          PAGE FOOTER
         ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#171d26] py-8 text-center text-xs text-neutral-500 font-sans">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Avinash Shajan · Mentorship by Design · 1:1 UI/UX & Product Design Sessions</span>
          </div>
          <div>
            <span>Google Meet & Calendar Synced · Confirmed via Email</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
