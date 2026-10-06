import Timeline, { TimelineEntry } from "../components/ui/Timeline";
import Tag from "../components/ui/Tag";
import ScrollReveal from "../components/layout/ScrollReveal";
import { Download, Briefcase, GraduationCap, Setting as Wrench } from "reicon-react";
import { useResumeModal } from "../context/ResumeModalContext";

export default function Resume() {
  const { openResume } = useResumeModal();
  const workHistory: TimelineEntry[] = [
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

  const educationHistory: TimelineEntry[] = [
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



  return (
    <div id="page-resume" className="space-y-16 py-6">
      {/* Page Header */}
      <section className="space-y-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <ScrollReveal delay={0.1}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--blue)]">
                Curriculum Vitae
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <h1 className="text-4xl md:text-5xl font-hero font-bold tracking-tight leading-tight text-[var(--ink)]">
                My Professional Path
              </h1>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.3} className="shrink-0">
            <button
              type="button"
              onClick={openResume}
              className="group inline-flex items-center justify-center font-medium px-4 py-2 font-mono text-xs uppercase tracking-wider gap-2 rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-all duration-150 cursor-pointer bg-transparent"
            >
              <Download size={14} className="group-hover:translate-y-0.5 transition-transform duration-150" /> View / Download PDF
            </button>
          </ScrollReveal>
        </div>
        <ScrollReveal delay={0.3}>
          <p className="text-[15px] md:text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans font-normal max-w-[640px]">
            Product Designer with 5+ years delivering AI-first, user-centered designs across fintech, SaaS, e-commerce, and enterprise platforms.
          </p>
        </ScrollReveal>
      </section>

      {/* Experience Section */}
      <section className="border-t border-[var(--line)] pt-12 space-y-8">
        <ScrollReveal>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--muted)]">
            <Briefcase size={14} className="text-[var(--blue)]" /> 01 / Work History
          </div>
        </ScrollReveal>
        
        <ScrollReveal delay={0.1}>
          <Timeline items={workHistory} />
        </ScrollReveal>
      </section>

      {/* Education Section */}
      <section className="border-t border-[var(--line)] pt-12 space-y-8">
        <ScrollReveal>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--muted)]">
            <GraduationCap size={14} className="text-[var(--blue)]" /> 02 / Education
          </div>
        </ScrollReveal>
        
        <ScrollReveal delay={0.1}>
          <Timeline items={educationHistory} />
        </ScrollReveal>
      </section>

      {/* Skills Section */}
      <section className="border-t border-[var(--line)] pt-12 space-y-6">
        <ScrollReveal>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--muted)]">
            <Wrench size={14} className="text-[var(--blue)]" /> 03 / Expertise & Skills
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {categorizedSkills.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-serif font-medium text-lg text-[var(--ink)]">
                  {cat.category}
                </h3>
                <p className="text-sm md:text-base text-[var(--ink-soft)] leading-relaxed text-justify">
                  {cat.skills.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
