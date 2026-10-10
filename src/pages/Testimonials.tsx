import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getPreviousPath } from "../utils/navigationHistory";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  MessageSquare 
} from "lucide-react";
import ScrollReveal from "../components/layout/ScrollReveal";
import TestimonialCard from "../components/ui/TestimonialCard";
import { testimonialService } from "../services/testimonialService";
import { dataStore, Testimonial } from "../utils/dataStore";

export default function Testimonials() {
  const navigate = useNavigate();
  const location = useLocation();
  const [testimonialsList, setTestimonialsList] = useState<Testimonial[]>(() => 
    testimonialService.getTestimonials()
  );

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
    } else {
      navigate("/#testimonials");
    }
  };

  useEffect(() => {
    // Subscribe to live testimonial updates (Firestore + local state)
    const unsub = testimonialService.subscribeToTestimonials((updated) => {
      if (updated) {
        setTestimonialsList(updated);
      }
    });

    const handleUpdate = () => {
      setTestimonialsList(testimonialService.getTestimonials());
    };

    window.addEventListener("portfolio_data_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      if (unsub) unsub();
      window.removeEventListener("portfolio_data_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Map to TestimonialCard format
  const allTestimonials = useMemo(() => {
    return (testimonialsList || []).map((t) => ({
      id: t.id,
      photo: t.ImgUrl || "",
      name: t.name || "",
      role: t.position || "",
      company: t.company || "",
      linkedinUrl: t.linkedInUrl || "",
      quote: t.quote || "",
      createdAt: t.createdAt,
    }));
  }, [testimonialsList]);

  return (
    <div id="page-testimonials" className="space-y-8 sm:space-y-10 pt-1 sm:pt-2 pb-20 max-w-7xl mx-auto">
      {/* Top Navigation: Go Back button */}
      <div className="flex items-center pt-0">
        <button 
          onClick={handleBack}
          className="h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-medium flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none shrink-0 shadow-xs active:scale-95"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          <span className="font-medium">Go Back</span>
        </button>
      </div>

      {/* Header Section */}
      <section className="space-y-4">
        <ScrollReveal delay={0.05} className="space-y-3 sm:space-y-4">
          <div className="space-y-3 max-w-[820px]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] text-[var(--ink)]">
              Words from leaders, peers & <span className="text-[var(--blue)]">collaborators.</span>
            </h1>
            <p className="text-[15px] md:text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans font-normal max-w-[780px]">
              Direct accounts from engineering managers, founders, and cross-functional partners detailing our collaborative work, problem-solving mindset, and design execution.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Testimonials List */}
      <section className="flex flex-col gap-6 sm:gap-8">
        {allTestimonials.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)]/40 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[var(--ink)] flex items-center justify-center">
              <MessageSquare size={22} />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-sans font-medium text-[var(--ink-soft)]">
                No testimonials have been published yet.
              </p>
              <Link
                to="/submit-testimonial"
                className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-[var(--blue)] hover:underline"
              >
                <span>Be the first to share a recommendation</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ) : (
          allTestimonials.map((t, idx) => (
            <ScrollReveal key={t.id || t.name + "_" + idx} delay={Math.min(idx * 0.05, 0.3)}>
              <TestimonialCard
                photo={t.photo}
                name={t.name}
                role={t.role}
                company={t.company}
                linkedinUrl={t.linkedinUrl}
                quote={t.quote}
              />
            </ScrollReveal>
          ))
        )}
      </section>

      {/* Bottom CTA Banner */}
      {allTestimonials.length > 0 && (
        <section className="pt-6">
          <div className="p-8 sm:p-10 rounded-2xl border border-[var(--line)] bg-[var(--card)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-lg sm:text-xl font-sans font-bold text-[var(--ink)]">
                Have we worked together?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
                If you've collaborated with Avinash, experienced his product design approach, or worked alongside him, share your endorsement.
              </p>
            </div>
            <Link
              to="/submit-testimonial"
              className="px-6 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-medium transition-all shadow-xs shrink-0 w-fit cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span>Add Your Testimonial</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
