import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Calendar as CalendarIcon, Clock, Globe, ArrowRight, ArrowLeft, 
  Check, CheckCircle2, ChevronLeft, ChevronRight, User, Mail, Briefcase, 
  Link as LinkIcon, MessageSquare, ExternalLink, CalendarPlus, Sparkles,
  CalendarDays, Maximize2, Minimize2
} from "lucide-react";
import { useScrollLock } from "../../hooks/useScrollLock";
import { profilePictureService, DEFAULT_PROFILE_PICTURE } from "../../services/profilePictureService";
import CustomDropdown from "../ui/CustomDropdown";

interface MentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialDuration?: string;
}

export interface MentorshipBooking {
  id: string;
  sessionType: string;
  duration: "30 minutes" | "60 minutes";
  date: string;
  rawDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  name: string;
  email: string;
  role?: string;
  portfolioUrl?: string;
  message?: string;
  status: "waiting" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

const SESSION_TOPICS = [
  "Learn UI/UX Design",
  "Portfolio Review",
  "Career Transition",
  "Case Study Deep-Dive",
  "Design Interview Prep",
  "Resume Review",
  "Resume Preparation",
  "Product Design Roadmap",
  "UI/UX Career Guidance",
  "Product Design Guidance",
  "Design Feedback",
  "Early-stage Startup Idea",
  "Design / Product Strategy",
  "Other"
];

const TIME_SLOTS = [
  "10:30 AM · Morning",
  "3:30 PM · Afternoon",
  "9:30 PM · Evening"
];

const TIMEZONE_OPTIONS = [
  { label: "GST (Dubai, GMT+4)", value: "GST (Dubai, GMT+4)" },
  { label: "IST (India, GMT+5:30)", value: "IST (India, GMT+5:30)" },
  { label: "USA (EST, GMT-4)", value: "USA (EST, GMT-4)" },
  { label: "UK (London, GMT+1)", value: "UK (London, GMT+1)" },
  { label: "Canada (EST, GMT-4)", value: "Canada (EST, GMT-4)" },
  { label: "Europe (CET, GMT+1)", value: "Europe (CET, GMT+1)" },
];

// Helper to calculate end time given start time and duration
function calculateEndTime(startTime: string, duration: "30 minutes" | "60 minutes"): string {
  const cleanTime = startTime.split(" · ")[0];
  const parts = cleanTime.split(" ");
  if (parts.length < 2) return "";
  const [hourStr, minStr] = parts[0].split(":");
  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minStr, 10);
  const ampm = parts[1];

  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const totalMinutes = hour * 60 + minute + (duration === "30 minutes" ? 30 : 60);
  let endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  const endAmpm = endHour >= 12 ? "PM" : "AM";

  let displayHour = endHour % 12;
  if (displayHour === 0) displayHour = 12;
  const displayMinute = endMinute < 10 ? `0${endMinute}` : `${endMinute}`;

  return `${displayHour}:${displayMinute} ${endAmpm}`;
}

export default function MentorshipModal({ isOpen, onClose, initialTopic, initialDuration }: MentorshipModalProps) {
  // Step navigation: 1 = Session, 2 = Details, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Profile image from service
  const [profilePic, setProfilePic] = useState<string>(() => {
    return profilePictureService.getProfilePicture().imageUrl || DEFAULT_PROFILE_PICTURE.imageUrl;
  });

  useEffect(() => {
    const unsub = profilePictureService.initListener((data) => {
      if (data?.imageUrl) setProfilePic(data.imageUrl);
    });
    return () => unsub();
  }, []);

  // Step 1 Selections
  const [selectedTopic, setSelectedTopic] = useState<string>(() => initialTopic || "Choose the topic");
  const [selectedDuration, setSelectedDuration] = useState<string>(() => initialDuration || "Choose the duration");

  useEffect(() => {
    if (isOpen) {
      if (initialTopic) setSelectedTopic(initialTopic);
      if (initialDuration) setSelectedDuration(initialDuration);
    }
  }, [isOpen, initialTopic, initialDuration]);
  
  // Calendar state: default October 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // No pre-selected date
  const [isFullCalendar, setIsFullCalendar] = useState<boolean>(false);
  const [stripStartDay, setStripStartDay] = useState<number>(2); // Default to 2 to show [02, 03, 04, 05, 06, 07] as in reference image

  // Time & Timezone state
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(""); // No pre-selected time
  const [selectedTimezone, setSelectedTimezone] = useState<string>("GST (Dubai, GMT+4)");
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);

  // Step 2 Form Details
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    portfolioUrl: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<MentorshipBooking | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const stripScrollRef = useRef<HTMLDivElement>(null);
  const fullCalendarRef = useRef<HTMLDivElement>(null);
  const calendarToggleBtnRef = useRef<HTMLButtonElement>(null);

  // Lock background scroll when open
  useScrollLock(isOpen);

  // Close timezone dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(e.target as Node)) {
        setIsTimezoneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close popup calendar on outside click
  useEffect(() => {
    if (!isFullCalendar) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        fullCalendarRef.current &&
        !fullCalendarRef.current.contains(e.target as Node) &&
        calendarToggleBtnRef.current &&
        !calendarToggleBtnRef.current.contains(e.target as Node)
      ) {
        setIsFullCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFullCalendar]);

  // Handle ESC key and reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep(1);
        setSelectedTopic("Choose the topic");
        setSelectedDuration("Choose the duration");
        setCurrentYear(2026);
        setCurrentMonthIndex(9);
        setSelectedDay(null);
        setIsFullCalendar(false);
        setStripStartDay(2);
        setSelectedTimeSlot("");
        setSelectedTimezone("GST (Dubai, GMT+4)");
        setFormData({ name: "", email: "", role: "", portfolioUrl: "", message: "" });
        setFormErrors({});
        setConfirmedBooking(null);
      }, 300);
      return () => clearTimeout(timer);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Calendar calculations (Monday - Sunday standard)
  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonthIndex, 1);
    return date.toLocaleString("en-US", { month: "long" });
  }, [currentYear, currentMonthIndex]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  }, [currentYear, currentMonthIndex]);

  // First day of week index: 0 = Mon, 1 = Tue, ..., 6 = Sun
  const firstDayOfWeekIndex = useMemo(() => {
    const jsDay = new Date(currentYear, currentMonthIndex, 1).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, [currentYear, currentMonthIndex]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const handlePrevDateWindow = () => {
    if (isFullCalendar) {
      handlePrevMonth();
    } else if (stripScrollRef.current) {
      const container = stripScrollRef.current;
      if (container.scrollLeft <= 12) {
        handlePrevMonth();
      } else {
        const scrollDist = container.clientWidth * 0.82;
        container.scrollBy({ left: -scrollDist, behavior: "smooth" });
      }
    }
  };

  const handleNextDateWindow = () => {
    if (isFullCalendar) {
      handleNextMonth();
    } else if (stripScrollRef.current) {
      const container = stripScrollRef.current;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 12) {
        handleNextMonth();
      } else {
        const scrollDist = container.clientWidth * 0.82;
        container.scrollBy({ left: scrollDist, behavior: "smooth" });
      }
    }
  };

  const handleSelectDay = (day: number, el?: HTMLElement | null) => {
    setSelectedDay(day);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  // Smooth animated scroll to target date when modal opens or month changes
  useEffect(() => {
    if (isOpen && !isFullCalendar && stripScrollRef.current) {
      const timer = setTimeout(() => {
        const targetDay = selectedDay || 2;
        const targetEl = document.getElementById(`date-strip-day-${targetDay}`);
        if (targetEl && stripScrollRef.current) {
          const container = stripScrollRef.current;
          const targetOffset = targetEl.offsetLeft - container.offsetLeft - 6;
          container.scrollTo({ left: Math.max(0, targetOffset), behavior: "smooth" });
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentMonthIndex, isFullCalendar]);

  // Check if date is available for booking (including Sundays)
  const isDateAvailable = (day: number) => {
    // Current date is Oct 2, 2026. Only disable past days in the current month.
    if (currentYear === 2026 && currentMonthIndex === 9) {
      return day >= 2; // All days from Oct 2 onwards, explicitly including all Sundays (Oct 4, 11, 18, 25)
    }
    // Future months: all days (including Sundays) are available
    return true;
  };

  // Formatted date string for display
  const formattedDate = useMemo(() => {
    if (!selectedDay) return "";
    const date = new Date(currentYear, currentMonthIndex, selectedDay);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [currentYear, currentMonthIndex, selectedDay]);

  const calculatedEndTime = useMemo(() => {
    if (!selectedTimeSlot || !selectedDuration || selectedDuration === "Choose the duration") return "";
    return calculateEndTime(selectedTimeSlot, selectedDuration as "30 minutes" | "60 minutes");
  }, [selectedTimeSlot, selectedDuration]);

  // Step 1 Validation
  const isStep1Valid = Boolean(
    selectedTopic &&
    selectedTopic !== "Choose the topic" &&
    selectedDuration &&
    selectedDuration !== "Choose the duration" &&
    selectedDay !== null &&
    selectedTimeSlot
  );

  const handleContinueToStep2 = () => {
    if (isStep1Valid) {
      setStep(2);
      if (modalRef.current) {
        modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Step 2 Validation & Booking Confirmation
  const validateForm = () => {
    const errors: { name?: string; email?: string } = {};
    if (!formData.name.trim()) {
      errors.name = "Please enter your full name.";
    }
    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const booking: MentorshipBooking = {
      id: `booking_${Date.now()}`,
      sessionType: selectedTopic,
      duration: (selectedDuration === "30 minutes" ? "30 minutes" : "60 minutes") as "30 minutes" | "60 minutes",
      date: formattedDate,
      rawDate: `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`,
      startTime: selectedTimeSlot,
      endTime: calculatedEndTime,
      timezone: selectedTimezone,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role.trim() || undefined,
      portfolioUrl: formData.portfolioUrl.trim() || undefined,
      message: formData.message.trim() || undefined,
      status: "waiting",
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage without fake/sample seeded data
    try {
      const rawStored = localStorage.getItem("portfolio_mentorship_bookings");
      let existingBookings: any[] = [];
      if (rawStored) {
        try {
          const parsed = JSON.parse(rawStored);
          if (Array.isArray(parsed)) {
            existingBookings = parsed.filter((b: any) => {
              if (!b || !b.id) return false;
              const id = String(b.id);
              const email = String(b.email || "").toLowerCase();
              return !id.startsWith("booking_sample") && 
                     !id.includes("sample") && 
                     email !== "sophia.martinez@designhub.io" && 
                     email !== "rohan.p@fintechlab.com" && 
                     email !== "alex.morgan@designstudio.co";
            });
          }
        } catch {
          existingBookings = [];
        }
      }
      localStorage.setItem("portfolio_mentorship_bookings", JSON.stringify([booking, ...existingBookings]));
    } catch {
      // fallback
    }

    // Persist real booking to server API
    try {
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // Dispatch real-time events for immediate Admin Dashboard sync
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("portfolio_booking_created", { detail: booking }));
        window.dispatchEvent(new Event("storage"));
      } catch {
        // ignore
      }
    }

    // High performance smooth dispatch delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    setConfirmedBooking(booking);
    setIsSubmitting(false);
    setStep(3);

    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = (booking: MentorshipBooking) => {
    const title = encodeURIComponent(`1:1 Mentorship: ${booking.sessionType} with Avinash Shajan`);
    const details = encodeURIComponent(
      `1:1 Mentorship Session with Avinash Shajan (Product Designer & Enterprise UX Specialist)\n\n` +
      `Topic: ${booking.sessionType}\n` +
      `Duration: ${booking.duration}\n` +
      `Date & Time: ${booking.date} at ${booking.startTime} – ${booking.endTime} (${booking.timezone})\n` +
      `Mentee: ${booking.name} (${booking.email})\n` +
      (booking.role ? `Role: ${booking.role}\n` : "") +
      (booking.portfolioUrl ? `Portfolio: ${booking.portfolioUrl}\n` : "") +
      (booking.message ? `Notes: ${booking.message}\n` : "") +
      `\nMeeting Link will be shared via Google Meet.`
    );
    const location = encodeURIComponent("Google Meet (link provided in confirmation)");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="mentorship-booking-modal-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6"
        >
          {/* Subtle dim & blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Container: Wide 1040px design matching reference screenshot */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentorship-modal-title"
            className="relative w-full max-w-[1040px] overflow-visible bg-white dark:bg-[#12161c] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.28)] border border-neutral-200/90 dark:border-neutral-800 z-10 flex flex-col"
          >
            {/* Close Button at top-right (matching other modal popups) */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close booking modal"
            >
              <X size={20} />
            </button>

            {/* Modal Body: Wide 2-Column Layout with comfortable vertical breathing space */}
            <div className="p-6 sm:p-7 md:p-8 flex-1 overflow-visible">
              
              {/* SUCCESS VIEW (Step 3) */}
              {step === 3 && confirmedBooking ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center text-center py-8 sm:py-12 max-w-xl mx-auto"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-900/60 shadow-xs"
                  >
                    <Check size={32} strokeWidth={2.5} />
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ink)] mb-2 tracking-tight">
                    You're booked! 🎉
                  </h2>
                  <p className="text-sm text-[var(--ink-soft)] font-sans leading-relaxed mb-6">
                    Your session with Avinash is confirmed.
                  </p>

                  {/* Summary Card */}
                  <div className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 text-left space-y-4 mb-6">
                    <div className="flex items-center justify-between border-b border-neutral-200/70 dark:border-neutral-800 pb-3">
                      <div>
                        <span className="text-xs font-mono text-neutral-400 block">Session</span>
                        <h4 className="text-base font-sans font-bold text-[var(--ink)]">
                          {confirmedBooking.sessionType}
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] text-xs font-mono font-semibold">
                        {confirmedBooking.duration}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
                      <div>
                        <span className="text-xs text-neutral-400 block mb-0.5">Date</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-semibold block">{confirmedBooking.date}</strong>
                      </div>

                      <div>
                        <span className="text-xs text-neutral-400 block mb-0.5">Time & Timezone</span>
                        <strong className="text-[var(--ink)] font-semibold block">
                          {confirmedBooking.startTime} – {confirmedBooking.endTime}
                        </strong>
                        <span className="text-xs text-neutral-500 block">{confirmedBooking.timezone}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Attendee: <strong>{confirmedBooking.name}</strong> ({confirmedBooking.email})</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mb-7 flex items-center justify-center gap-1.5">
                    <Mail size={14} className="text-[var(--blue)]" />
                    <span>Confirmation sent to your email.</span>
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <a
                      href={getGoogleCalendarUrl(confirmedBooking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all group cursor-pointer shadow-sm active:scale-98"
                    >
                      <CalendarPlus size={16} />
                      <span>Add to Google Calendar</span>
                    </a>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs sm:text-sm font-sans font-medium text-[var(--ink)] transition-colors cursor-pointer active:scale-98"
                    >
                      Back to Portfolio
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* 2-COLUMN BOOKING FLOW (Step 1 & Step 2) */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-9 items-start">
                  
                  {/* ──────────────────────────────────────────────────────────
                      LEFT COLUMN (Width ~68% on Desktop): Selection & Inputs
                     ────────────────────────────────────────────────────────── */}
                  <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                    
                    {/* STEP 1 CONTENT */}
                    {step === 1 && (
                      <motion.div
                        key="step-1-left"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-4 sm:space-y-5 pt-1.5 sm:pt-2"
                      >
                        {/* Section Header */}
                        <div>
                          <h2 id="mentorship-modal-title" className="text-xl sm:text-2xl font-sans font-bold text-[var(--ink)] tracking-tight">
                            Book a session with Avinash
                          </h2>
                          <p className="text-xs sm:text-[13px] text-[var(--ink-soft)] font-sans mt-1 leading-relaxed">
                            Choose a topic and find a convenient time that works for you.
                          </p>
                        </div>

                        {/* SECTION 1: What would you like to discuss? */}
                        <div className="space-y-2">
                          <label className="block text-xs sm:text-[13px] font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                            What would you like to discuss?
                          </label>
                          <CustomDropdown
                            variant="form"
                            value={selectedTopic}
                            options={SESSION_TOPICS}
                            onChange={setSelectedTopic}
                            placeholder="Choose the topic"
                            ariaLabel="What would you like to discuss?"
                            triggerClassName={`!bg-[#ebebeb] dark:!bg-[#18181b] border-none !border-0 !rounded-xl !text-xs sm:!text-sm !font-sans !h-11 sm:!h-[46px] shadow-none hover:!bg-[#e2e2e2] dark:hover:!bg-[#222226] ${
                              selectedTopic === "Choose the topic" ? "!text-neutral-400 dark:!text-neutral-500 font-normal" : "!font-medium !text-[var(--ink)]"
                            }`}
                            menuClassName="w-full max-h-72 z-50 shadow-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#18181b] rounded-xl"
                          />
                        </div>

                        {/* SECTION 2: Session duration Dropdown */}
                        <div className="space-y-2">
                          <label className="block text-xs sm:text-[13px] font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                            Session duration
                          </label>
                          <CustomDropdown
                            variant="form"
                            value={selectedDuration}
                            options={["30 minutes", "60 minutes"]}
                            onChange={(val) => setSelectedDuration(val)}
                            placeholder="Choose the duration"
                            ariaLabel="Session duration"
                            triggerClassName={`!bg-[#ebebeb] dark:!bg-[#18181b] border-none !border-0 !rounded-xl !text-xs sm:!text-sm !font-sans !h-11 sm:!h-[46px] shadow-none hover:!bg-[#e2e2e2] dark:hover:!bg-[#222226] ${
                              selectedDuration === "Choose the duration" ? "!text-neutral-400 dark:!text-neutral-500 font-normal" : "!font-medium !text-[var(--ink)]"
                            }`}
                            menuClassName="w-full max-h-72 z-50 shadow-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#18181b] rounded-xl"
                          />
                        </div>

                        {/* SECTION 3 & 4: Date & Time Grid */}
                        <div className="space-y-2 pt-1">
                          <label className="block text-xs sm:text-[13px] font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                            Select a date & time
                          </label>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                            
                            {/* Calendar Card (Left) */}
                            <div className="md:col-span-7 relative bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-2xl p-4 sm:p-4.5 shadow-none transition-all flex flex-col justify-between">
                              {/* POPUP FULL CALENDAR (Opens Above, never below, avoiding any page scrolling) */}
                              <AnimatePresence>
                                {isFullCalendar && (
                                  <motion.div
                                    ref={fullCalendarRef}
                                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute bottom-full left-0 mb-3 w-full bg-white dark:bg-[#151921] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xl z-50"
                                  >
                                    {/* Full Calendar Header */}
                                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80 mb-3">
                                      <h4 className="text-sm sm:text-base font-sans font-bold text-[var(--ink)]">
                                        {monthName} {currentYear}
                                      </h4>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={handlePrevMonth}
                                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                          aria-label="Previous month"
                                        >
                                          <ChevronLeft size={16} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleNextMonth}
                                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                          aria-label="Next month"
                                        >
                                          <ChevronRight size={16} />
                                        </button>
                                        <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />
                                        <button
                                          type="button"
                                          onClick={() => setIsFullCalendar(false)}
                                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                                          aria-label="Close full calendar"
                                          title="Close full calendar"
                                        >
                                          <X size={15} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Days of week */}
                                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                                        <span key={d} className="text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500">
                                          {d}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Calendar Days */}
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                      {Array.from({ length: firstDayOfWeekIndex }).map((_, i) => (
                                        <div key={`offset-${i}`} className="h-8 sm:h-9" />
                                      ))}

                                      {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const available = isDateAvailable(day);
                                        const isSelected = selectedDay === day;

                                        return (
                                          <button
                                            key={`popup-cal-${day}`}
                                            type="button"
                                            disabled={!available}
                                            onClick={() => {
                                              handleSelectDay(day);
                                              setIsFullCalendar(false);
                                            }}
                                            className={`h-8 sm:h-9 rounded-lg sm:rounded-xl text-xs sm:text-[13px] font-sans transition-all duration-150 flex items-center justify-center cursor-pointer border-0 shadow-none ${
                                              isSelected
                                                ? "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold ring-1.5 ring-blue-500/40 scale-105 z-10"
                                                : available
                                                ? "bg-neutral-50 dark:bg-neutral-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 text-neutral-900 dark:text-white font-medium"
                                                : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed pointer-events-none opacity-40 font-normal"
                                            }`}
                                          >
                                            {day}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Calendar Header */}
                              <div className="flex items-center justify-between pb-2 sm:pb-3">
                                <h3 className="text-base sm:text-lg font-sans font-medium text-[var(--ink)] tracking-tight">
                                  {monthName}
                                </h3>

                                <div className="flex items-center gap-1">
                                  {/* Prev Button */}
                                  <button
                                    type="button"
                                    onClick={handlePrevDateWindow}
                                    className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                    aria-label="Previous dates"
                                    title="Previous"
                                  >
                                    <ChevronLeft size={16} />
                                  </button>

                                  {/* Next Button */}
                                  <button
                                    type="button"
                                    onClick={handleNextDateWindow}
                                    className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                    aria-label="Next dates"
                                    title="Next"
                                  >
                                    <ChevronRight size={16} />
                                  </button>

                                  <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

                                  {/* Expand / Collapse Icon Button */}
                                  <button
                                    ref={calendarToggleBtnRef}
                                    type="button"
                                    onClick={() => setIsFullCalendar((prev) => !prev)}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                                      isFullCalendar
                                        ? "bg-[var(--blue)]/10 text-[var(--blue)] font-medium"
                                        : "hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                                    }`}
                                    title={isFullCalendar ? "Close full calendar" : "Expand full calendar above"}
                                    aria-label={isFullCalendar ? "Close full calendar" : "Expand full calendar above"}
                                  >
                                    {isFullCalendar ? (
                                      <Minimize2 size={15} />
                                    ) : (
                                      <CalendarDays size={15} />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Horizontal Animated Date Strip with smooth inertial scrolling & snapping */}
                              <div
                                ref={stripScrollRef}
                                className="flex gap-2 sm:gap-2.5 pt-1.5 pb-1 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x overscroll-x-contain py-1 select-none"
                              >
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                  const day = i + 1;
                                  const available = isDateAvailable(day);
                                  const isSelected = selectedDay === day;
                                  const dateObj = new Date(currentYear, currentMonthIndex, day);
                                  const weekdayShort = dateObj.toLocaleDateString("en-US", { weekday: "short" });

                                  return (
                                    <button
                                      key={`strip-${currentYear}-${currentMonthIndex}-${day}`}
                                      id={`date-strip-day-${day}`}
                                      type="button"
                                      disabled={!available}
                                      onClick={(e) => handleSelectDay(day, e.currentTarget)}
                                      className={`snap-start shrink-0 w-[calc((100%-40px)/6)] sm:w-[calc((100%-50px)/6)] min-w-[50px] sm:min-w-[54px] h-[58px] sm:h-[66px] rounded-xl sm:rounded-2xl py-1.5 px-1 font-sans transition-all duration-200 flex flex-col items-center justify-center border-0 active:scale-95 shadow-none ${
                                        isSelected
                                          ? "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/40 scale-102 z-10 cursor-pointer shadow-none"
                                          : available
                                          ? "bg-white dark:bg-neutral-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 text-neutral-900 dark:text-white font-medium hover:scale-102 cursor-pointer shadow-none"
                                          : "bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-400 dark:text-neutral-500 font-medium cursor-not-allowed opacity-60 shadow-none"
                                      }`}
                                      aria-label={`Select ${weekdayShort}, ${monthName} ${day}`}
                                    >
                                      <span
                                        className={`text-[10px] sm:text-[11px] font-sans font-medium uppercase tracking-wider mb-0.5 transition-colors ${
                                          isSelected
                                            ? "text-blue-600/90 dark:text-blue-300 font-semibold"
                                            : available
                                            ? "text-neutral-500 dark:text-neutral-400"
                                            : "text-neutral-400 dark:text-neutral-500/70"
                                        }`}
                                      >
                                        {weekdayShort}
                                      </span>
                                      <span className="text-sm sm:text-base font-sans font-bold leading-none">
                                        {String(day).padStart(2, "0")}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Two Stacked Dropdowns (Right): Timezone & Time Selection (Exact Diagram: Group 1707480132.png) */}
                            <div className="md:col-span-5 flex flex-col justify-between gap-3 sm:gap-3.5 h-full">
                              {/* 1. Timezone Selection Dropdown (Opens Above) */}
                              <div className="w-full flex-1 flex flex-col">
                                <CustomDropdown
                                  variant="form"
                                  direction="up"
                                  value={selectedTimezone}
                                  options={TIMEZONE_OPTIONS}
                                  onChange={setSelectedTimezone}
                                  placeholder="Select timezone"
                                  ariaLabel="Select timezone"
                                  className="h-full flex-1 flex flex-col"
                                  triggerClassName="!bg-[#ebebeb] dark:!bg-[#18181b] border-none !border-0 !rounded-xl sm:!rounded-2xl !text-xs sm:!text-sm !font-sans !font-medium !text-[var(--ink)] !h-full !min-h-[64px] sm:!min-h-[68px] shadow-none hover:!bg-[#e2e2e2] dark:hover:!bg-[#222226] cursor-pointer px-4 flex-1 flex items-center justify-between"
                                  menuClassName="w-full max-h-64 z-50 shadow-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#18181b] rounded-xl"
                                />
                              </div>

                              {/* 2. Choose Time Dropdown (Opens Above) */}
                              <div className="w-full flex-1 flex flex-col">
                                <CustomDropdown
                                  variant="form"
                                  direction="up"
                                  value={selectedTimeSlot}
                                  options={TIME_SLOTS}
                                  onChange={(val) => setSelectedTimeSlot(val)}
                                  placeholder="Choose the time"
                                  ariaLabel="Choose the time"
                                  className="h-full flex-1 flex flex-col"
                                  triggerClassName={`!bg-[#ebebeb] dark:!bg-[#18181b] border-none !border-0 !rounded-xl sm:!rounded-2xl !text-xs sm:!text-sm !font-sans !h-full !min-h-[64px] sm:!min-h-[68px] shadow-none hover:!bg-[#e2e2e2] dark:hover:!bg-[#222226] cursor-pointer px-4 flex-1 flex items-center justify-between ${
                                    !selectedTimeSlot
                                      ? "!text-neutral-400 dark:!text-neutral-500 font-normal"
                                      : "!font-semibold !text-[var(--ink)]"
                                  }`}
                                  menuClassName="w-full max-h-64 z-50 shadow-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#18181b] rounded-xl"
                                />
                              </div>
                            </div>

                          </div>
                        </div>

                      </motion.div>
                    )}

                    {/* STEP 2 CONTENT */}
                    {step === 2 && (
                      <motion.div
                        key="step-2-left"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-6 pt-1.5 sm:pt-2"
                      >
                        {/* Section Header */}
                        <div>
                          <h2 className="text-2xl sm:text-[28px] font-sans font-bold text-[var(--ink)] tracking-tight">
                            Tell me a little about yourself
                          </h2>
                          <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans mt-1.5 leading-relaxed">
                            This helps me understand what you'd like to get out of the session.
                          </p>
                        </div>

                        {/* Form Inputs */}
                        <div className="space-y-4">
                          {/* Name & Email */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                                Full name <span className="text-[var(--blue)]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => {
                                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                                }}
                                placeholder="Enter your name"
                                className={`w-full px-4 py-2.5 bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none transition-colors shadow-xs ${
                                  formErrors.name
                                    ? "ring-1.5 ring-red-500"
                                    : "focus:ring-1.5 focus:ring-[var(--blue)]"
                                }`}
                              />
                              {formErrors.name && (
                                <p className="text-[11px] text-red-500 font-sans">{formErrors.name}</p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                                Email address <span className="text-[var(--blue)]">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => {
                                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                                }}
                                placeholder="you@example.com"
                                className={`w-full px-4 py-2.5 bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none transition-colors shadow-xs ${
                                  formErrors.email
                                    ? "ring-1.5 ring-red-500"
                                    : "focus:ring-1.5 focus:ring-[var(--blue)]"
                                }`}
                              />
                              {formErrors.email && (
                                <p className="text-[11px] text-red-500 font-sans">{formErrors.email}</p>
                              )}
                            </div>
                          </div>

                          {/* Role & Portfolio */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                                Current role / experience
                              </label>
                              <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                                placeholder="e.g. Product Designer, 3 years"
                                className="w-full px-4 py-2.5 bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:ring-1.5 focus:ring-[var(--blue)] transition-colors shadow-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                                Portfolio / LinkedIn URL
                              </label>
                              <input
                                type="url"
                                value={formData.portfolioUrl}
                                onChange={(e) => setFormData((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:ring-1.5 focus:ring-[var(--blue)] transition-colors shadow-xs"
                              />
                            </div>
                          </div>

                          {/* What would you like help with? */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-sans font-semibold text-neutral-700 dark:text-neutral-300">
                              What would you like help with?
                            </label>
                            <textarea
                              rows={3}
                              value={formData.message}
                              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Tell me briefly what you'd like help with..."
                              className="w-full px-4 py-2.5 bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-xl text-sm font-sans text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:ring-1.5 focus:ring-[var(--blue)] transition-colors resize-none leading-relaxed shadow-xs"
                            />
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">
                              Example: "I'd like feedback on my product design portfolio and advice on transitioning into a Product Designer role."
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* ──────────────────────────────────────────────────────────
                      RIGHT COLUMN (Width ~32% on Desktop): Mentor Profile &
                      Live Session Booking Details (Exact reference layout)
                     ────────────────────────────────────────────────────────── */}
                  <div className="lg:col-span-4">
                    <div className="bg-[#ebebeb] dark:bg-[#18181b] border-0 rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center shadow-xs">
                      
                      {/* Avinash's Profile Image */}
                      <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-white dark:border-neutral-700 shadow-sm mb-3 bg-neutral-200 dark:bg-neutral-800">
                        <img
                          src={profilePic}
                          alt="Avinash Shajan"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Mentor Name & Verified Checkmark */}
                      <div className="flex items-center justify-center gap-1.5">
                        <h3 className="text-lg sm:text-xl font-sans font-bold text-[var(--ink)]">
                          Avinash Shajan
                        </h3>
                        <CheckCircle2 size={17} className="text-blue-500 fill-blue-500 text-white shrink-0" />
                      </div>

                      <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                        Product & Experience Designer
                      </p>

                      {/* Session Booking Details Card (Matching Screenshot Rows) */}
                      <div className="w-full bg-white dark:bg-neutral-900 border-0 rounded-xl p-3.5 sm:p-4 mt-4 space-y-2.5 text-left shadow-xs">
                        
                        {/* Topic Row */}
                        <div className="flex items-start justify-between text-xs sm:text-[13px] font-sans gap-2">
                          <span className="text-neutral-400 font-normal shrink-0">Topic</span>
                          <span className={`text-right truncate ${selectedTopic === "Choose the topic" ? "text-neutral-400 dark:text-neutral-500 font-normal" : "font-semibold text-[var(--ink)]"}`}>
                            {selectedTopic}
                          </span>
                        </div>

                        {/* Duration Row */}
                        <div className="flex items-center justify-between text-xs sm:text-[13px] font-sans pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                          <span className="text-neutral-400 font-normal flex items-center gap-1.5">
                            <Clock size={13} className="text-neutral-400" />
                            <span>Duration</span>
                          </span>
                          <span className={`${selectedDuration === "Choose the duration" ? "text-neutral-400 dark:text-neutral-500 font-normal" : "font-semibold text-[var(--ink)]"}`}>
                            {selectedDuration}
                          </span>
                        </div>

                        {/* Date Row */}
                        <div className="flex items-center justify-between text-xs sm:text-[13px] font-sans pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                          <span className="text-neutral-400 font-normal flex items-center gap-1.5">
                            <CalendarIcon size={13} className="text-neutral-400" />
                            <span>Date</span>
                          </span>
                          <span className={`text-right ${selectedDay ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500 font-normal"}`}>
                            {selectedDay ? formattedDate : "Select date"}
                          </span>
                        </div>

                        {/* Time Row */}
                        <div className="flex items-center justify-between text-xs sm:text-[13px] font-sans pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                          <span className="text-neutral-400 font-normal flex items-center gap-1.5">
                            <Clock size={13} className="text-neutral-400" />
                            <span>Time</span>
                          </span>
                          <span className={`text-right ${selectedTimeSlot ? "font-semibold text-[var(--ink)]" : "text-neutral-400 dark:text-neutral-500 font-normal"}`}>
                            {selectedTimeSlot ? (
                              calculatedEndTime ? (
                                `${selectedTimeSlot.split(" · ")[0]} – ${calculatedEndTime}${selectedTimeSlot.includes(" · ") ? ` · ${selectedTimeSlot.split(" · ")[1]}` : ""}`
                              ) : (
                                selectedTimeSlot
                              )
                            ) : (
                              "Select time"
                            )}
                          </span>
                        </div>

                        {/* Timezone Row */}
                        <div className="flex items-center justify-between text-xs sm:text-[13px] font-sans pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                          <span className="text-neutral-400 font-normal flex items-center gap-1.5">
                            <Globe size={13} className="text-neutral-400" />
                            <span>Timezone</span>
                          </span>
                          <span className="font-semibold text-[var(--ink)] text-right truncate max-w-[130px]">
                            {selectedTimezone}
                          </span>
                        </div>
                      </div>

                      {/* Primary CTA Buttons placed prominently on right sidebar */}
                      <div className="w-full mt-4 sm:mt-5">
                        {step === 1 ? (
                          <button
                            type="button"
                            disabled={!isStep1Valid}
                            onClick={handleContinueToStep2}
                            className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                          >
                            <span>Continue to Details</span>
                            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        ) : step === 2 ? (
                          <div className="space-y-2.5">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleConfirmBooking()}
                              className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                            >
                              {isSubmitting ? (
                                <span>Confirming Session...</span>
                              ) : (
                                <>
                                  <span>Confirm & Book Session</span>
                                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-sans font-medium text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <ArrowLeft size={13} />
                              <span>Back to Session Selection</span>
                            </button>
                          </div>
                        ) : null}
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
