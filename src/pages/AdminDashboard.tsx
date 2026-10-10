import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Plus, Edit, Trash2, Logout as LogOut, Folder as FolderGit2, 
  FileText, Users, Eye, CheckCircle, AlertTriangle, X, Upload, Loader as Loader2, CloudUpload, Image as ImageIcon, Home,
  Refresh as RefreshCw, ArrowRight, ArrowLeft, Settings, Bell, BellOff, Check, ShieldAlert, Envelope as Mail, InfoCircle as Info, Clock, Check as CheckCheck, User, UserEdit as UserCog,
  Palette, Sparkles, RotateLeft as RotateCcw, Paintbrush, Text as Type, AddSquare as Square, Layers, Layout
} from "reicon-react";
import { Compass, Camera, GraduationCap, School, MapPin, Copy, ExternalLink, MessageSquare, Code2, Megaphone, Heart, Calendar, Download, LayoutGrid, ArrowUpDown, GripVertical, Tag, BookOpen, Globe, CalendarCheck, Search, Link2, Phone, Video, MessageCircle } from "lucide-react";
import { testimonialService } from "../services/testimonialService";
import { dataStore, Project, BlogItem, Testimonial, OutsideWorkSettings } from "../utils/dataStore";
import { aboutImagesService, AboutPhoto } from "../services/aboutImagesService";
import { aboutBackgroundService } from "../services/aboutBackgroundService";
import { profilePictureService, ProfilePictureData } from "../services/profilePictureService";
import { mentorshipPhotosService, MentorshipPhoto, DEFAULT_MENTORSHIP_PHOTOS } from "../services/mentorshipPhotosService";
import { almaMaterService, AlmaMater, DEFAULT_ALMA_MATERS } from "../services/almaMaterService";
import { bitMoreAboutMeService, AboutMoreItem, DEFAULT_ABOUT_MORE_ITEMS } from "../services/bitMoreAboutMeService";
import { 
  PortfolioCustomization, 
  COLOR_PRESETS, 
  getCustomizationSettings, 
  saveCustomizationSettings, 
  resetCustomizationSettings, 
  applyCustomizationToDOM 
} from "../utils/customizationStore";
import { getOptimizedImageUrl, uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";
import { projectService, sortProjectsByLatest } from "../services/projectService";
import { projectDesigningService } from "../services/projectDesigningService";
import { signOut } from "firebase/auth";
import { isFirebaseConfigured, auth } from "../utils/firebase";
import { isAdminAuthenticated, clearAdminSession } from "../utils/auth";
import CreateProjectModal from "../components/admin/CreateProjectModal";
import KeyContributionsInput from "../components/admin/KeyContributionsInput";
import ImageCropModal from "../components/admin/ImageCropModal";
import { resumeService, ResumeDocument, DEFAULT_RESUME } from "../services/resumeService";
import { AdminResumeModal } from "../components/admin/AdminResumeModal";
import TestimonialFormPreviewModal from "../components/admin/TestimonialFormPreviewModal";
import ScrollReveal from "../components/layout/ScrollReveal";
import PageWrapper from "../components/layout/PageWrapper";
import CustomDropdown, { DropdownOption } from "../components/ui/CustomDropdown";
import { utils_icons } from "../feeders/feeder";
import { getLenis } from "../hooks/useLenis";
import { FieldNote } from "../types/fieldNotes";
import { fieldNotesService } from "../services/fieldNotesService";
import { CreateFieldNoteModal } from "../components/fieldNotes/CreateFieldNoteModal";
import { ExternalArticle, ExternalPlatform } from "../types/externalArticle";
import { getExternalArticles, saveExternalArticles } from "../data/externalArticles";
import AddExternalArticleModal, { extractTitleFromUrl } from "../components/blog/AddExternalArticleModal";
import { sessionConfigService, SessionConfig } from "../services/sessionConfigService";
import { sessionBookingFirebaseService, SessionBookingRecord, safeParseDate } from "../services/sessionBookingFirebaseService";
type ActiveTab = "projects" | "blogs" | "field-notes" | "testimonials" | "sessions" | "session-config" | "settings" | "notifications" | "customization";

export interface MentorshipBooking {
  id: string;
  sessionType: string;
  sessionName?: string;
  sessionId?: string;
  duration: string;
  date: string;
  rawDate?: string;
  startTime: string;
  endTime?: string;
  timezone?: string;
  timeFormat?: string;
  name: string;
  email: string;
  phone?: string;
  mobileNumber?: string;
  phoneNumber?: string;
  contactNumber?: string;
  role?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  message?: string;
  status: "waiting" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  source?: string;
  // External form submission fields
  chooseTopic?: string;
  topic?: string;
  track?: string;
  sessionDuration?: string;
  fullName?: string;
  emailAddress?: string;
  currentRole?: string;
  helpWith?: string;
  time?: string;
  [key: string]: any;
}

export function sanitizeBookingRecord(b: any): MentorshipBooking {
  let date = b.date;
  let startTime = b.startTime || b.time || "";

  if (!date || String(date).toLowerCase().includes("invalid date") || typeof date !== "string") {
    const parsed = safeParseDate(b.rawDate) || safeParseDate(b.createdAt) || new Date();
    date = parsed.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (!startTime || startTime === "Scheduled") {
    const parsed = safeParseDate(b.rawDate) || safeParseDate(b.createdAt);
    if (parsed && (parsed.getHours() !== 0 || parsed.getMinutes() !== 0)) {
      startTime = parsed.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      startTime = "Flexible / TBD";
    }
  }

  if (startTime && /^\d{1,2}:\d{2}$/.test(startTime.trim())) {
    const [h, m] = startTime.trim().split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    startTime = `${hour12}:${m < 10 ? `0${m}` : m} ${period}`;
  }

  const timezone = b.timezone || (b.timeFormat ? `${b.timeFormat}` : "GST (Dubai, GMT+4)");

  const phone = String(
    b.mobileNumber ||
    b.phone ||
    b.phoneNumber ||
    b.contactNumber ||
    b.mobile ||
    b.phone_number ||
    b.mobile_number ||
    b.contact ||
    b.whatsapp ||
    ""
  ).trim();

  const sessionName = String(
    b.sessionName ||
    b.session_name ||
    b.chooseTopic ||
    b.sessionType ||
    b.session_type ||
    b.topic ||
    b.track ||
    b.title ||
    ""
  ).trim();

  const rawStatus = String(b.status || "").toLowerCase().trim();
  let status: "waiting" | "confirmed" | "completed" | "cancelled" = "waiting";
  if (rawStatus === "confirmed") {
    status = "confirmed";
  } else if (rawStatus === "completed") {
    status = "completed";
  } else if (rawStatus === "cancelled") {
    status = "cancelled";
  } else {
    status = "waiting";
  }

  return {
    ...b,
    status,
    sessionName: sessionName || b.sessionType || "1:1 Mentorship Session",
    sessionType: sessionName || b.sessionType || "1:1 Mentorship Session",
    sessionId: b.sessionId || b.session_id || "",
    date,
    startTime,
    timezone,
    phone: phone || undefined,
    mobileNumber: phone || undefined,
    phoneNumber: phone || undefined,
    contactNumber: phone || undefined,
  };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

const SESSION_STATUS_OPTIONS: DropdownOption<"waiting" | "confirmed" | "completed" | "cancelled">[] = [
  { label: "Waiting", value: "waiting" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function AdminSessionBookingCard({
  session,
  onUpdateStatus,
  onDelete,
  onCopyInfo,
  isCopied,
  googleCalendarUrl,
}: {
  key?: React.Key;
  session: MentorshipBooking;
  onUpdateStatus: (id: string, newStatus: "waiting" | "confirmed" | "completed" | "cancelled") => void;
  onDelete: (id: string, name?: string) => void;
  onCopyInfo: (session: MentorshipBooking) => void;
  isCopied: boolean;
  googleCalendarUrl: string;
}) {
  const statusStyles: Record<string, string> = {
    waiting: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    completed: "bg-blue-500/10 text-neutral-800 dark:text-neutral-200 border-blue-500/20",
    cancelled: "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20",
  };

  const s = sanitizeBookingRecord(session);
  const menteeName = s.name || s.fullName || "Guest Mentee";
  const menteeEmail = s.email || s.emailAddress || "";
  const menteePhone = s.mobileNumber || s.phone || s.phoneNumber || s.contactNumber || "";
  const menteeRole = s.role || s.currentRole || "";
  const profileLink = s.portfolioUrl || s.linkedInUrl || "";
  const topicTitle = s.sessionName || s.sessionType || s.chooseTopic || s.topic || s.track || "Mentorship Session";
  const sessionDuration = s.duration || s.sessionDuration || "60 minutes";
  const scheduledDate = s.date;
  const scheduledTime = s.startTime;
  const scheduledTimezone = s.timezone || "GST (Dubai, GMT+4)";
  const discussionNote = s.message || s.helpWith || "";
  const isFromExternalDb = s.source === "external_website" || Boolean(s.chooseTopic || s.fullName || s.helpWith);

  const initials = menteeName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "M";

  return (
    <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-[var(--blue)]/40 transition-all duration-200 space-y-4">
      {/* Top Header: Mentee Profile & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Mentee Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-[var(--line)] flex items-center justify-center text-[var(--blue)] font-sans font-bold text-sm shrink-0 shadow-2xs">
            {initials}
          </div>

          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-sans font-semibold text-[var(--ink)] tracking-tight">
              {menteeName}
            </h4>

            {menteeRole && (
              <p className="text-xs text-[var(--ink-soft)] font-sans truncate mt-0.5">
                {menteeRole}
              </p>
            )}
          </div>
        </div>

        {/* Status Dropdown & Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap self-start sm:self-center">
          {/* Status Dropdown Pill (Prominent status indicator & selector) */}
          <CustomDropdown<"waiting" | "confirmed" | "completed" | "cancelled">
            variant="pill"
            value={session.status || "waiting"}
            options={SESSION_STATUS_OPTIONS}
            onChange={(val) => onUpdateStatus(session.id, val)}
            align="right"
            ariaLabel="Update booking status"
            triggerClassName={`!h-9 sm:!h-10 !px-3.5 sm:!px-4 !normal-case !font-sans !tracking-normal text-xs sm:text-[13px] !font-semibold shrink-0 shadow-xs border-1.5 transition-all ${
              session.status === "confirmed"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-700 hover:bg-emerald-100"
                : session.status === "waiting" || !session.status
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-400 dark:border-amber-700 hover:bg-amber-100"
                : session.status === "completed"
                ? "bg-blue-50 dark:bg-neutral-800 text-blue-700 dark:text-blue-400 border-blue-400 dark:border-blue-700 hover:bg-blue-100"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700"
            }`}
            menuClassName="w-44 shadow-dropdown no-scrollbar"
          />

          {/* Action Icon Buttons - Enhanced prominence */}
          <div className="flex items-center gap-1.5 border-l border-[var(--line)] pl-2.5">
            <button
              type="button"
              onClick={() => onCopyInfo(session)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg)] hover:bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--blue)]/60 hover:text-[var(--blue)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Copy session details"
              aria-label="Copy session details"
            >
              {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>

            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg)] hover:bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--blue)]/60 hover:text-[var(--blue)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Add to Google Calendar"
              aria-label="Add to Google Calendar"
            >
              <Calendar size={16} />
            </a>

            <button
              type="button"
              onClick={() => onDelete(session.id, menteeName)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/90 dark:border-red-900/60 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Delete session"
              aria-label="Delete session"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Session Highlight Banner: Scheduled Date, Time & Duration */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[var(--blue)] shrink-0 shadow-2xs">
            <CalendarCheck size={16} />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] block font-medium">
              Scheduled Date & Time
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-sans text-[var(--ink)]">
              <span className="font-semibold">{scheduledDate}</span>
              <span className="text-[var(--ink-soft)] font-mono">•</span>
              <span className="font-mono font-semibold text-[var(--blue)] flex items-center gap-1">
                <Clock size={12} className="inline" />
                {scheduledTime}
                {s.endTime ? ` – ${s.endTime}` : ""}
              </span>
              {scheduledTimezone && (
                <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase px-1.5 py-0.5 rounded bg-[var(--bg)] border border-[var(--line)]">
                  {scheduledTimezone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--line)] font-mono text-xs text-[var(--ink-soft)] font-medium shadow-2xs flex items-center gap-1.5">
            <Clock size={13} className="text-[var(--ink-soft)]" />
            <span>{sessionDuration}</span>
          </span>
        </div>
      </div>

      {/* Topic & Direct Contact Channels */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {/* Session Topic Pill (Before the email) */}
        {topicTitle && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[var(--blue-tint)] dark:bg-neutral-800 border border-[var(--blue)]/20 text-xs font-sans font-medium text-[var(--blue)] shadow-2xs">
            <span>{topicTitle}</span>
          </span>
        )}

        {menteeEmail && (
          <a
            href={`mailto:${menteeEmail}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--line)] text-xs font-sans text-[var(--ink)] hover:text-[var(--blue)] hover:border-[var(--blue)]/40 transition-colors shadow-2xs"
            title="Email mentee"
          >
            <Mail size={13} className="text-[var(--ink-soft)]" />
            <span>{menteeEmail}</span>
          </a>
        )}

        {menteePhone ? (
          <a
            href={`tel:${menteePhone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300 hover:border-emerald-500/40 transition-colors shadow-2xs"
            title="Call mentee"
          >
            <Phone size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>{menteePhone}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-xs font-mono text-[var(--ink-soft)] opacity-70">
            <Phone size={13} className="opacity-40" />
            <span>No phone</span>
          </span>
        )}

        {profileLink && (
          <a
            href={profileLink.startsWith("http") ? profileLink : `https://${profileLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--line)] text-xs font-sans text-[var(--blue)] hover:bg-neutral-500/10 hover:border-[var(--blue)]/40 transition-colors shadow-2xs ml-auto sm:ml-0"
            title="Open Portfolio or LinkedIn profile"
          >
            <ExternalLink size={13} />
            <span>Portfolio / LinkedIn</span>
          </a>
        )}
      </div>

      {/* Discussion Notes / Agenda */}
      {discussionNote && (
        <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-xs font-sans space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
            <MessageSquare size={13} className="text-[var(--blue)]" />
            <span>Agenda & Discussion Notes</span>
          </div>
          <p className="text-[var(--ink)] leading-relaxed whitespace-pre-wrap pl-3.5 border-l-2 border-[var(--blue)]/40 font-sans text-xs sm:text-[13px]">
            {discussionNote}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [activeTab, setActiveTab] = useState<ActiveTab>("projects");
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Stop Lenis page-level smooth scroll while inside Admin Dashboard so the inner panel scrolls natively
  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.stop();
    }
    return () => {
      if (lenis) {
        lenis.start();
      }
    };
  }, []);

  // When switching active tab, smoothly reset the content panel scroll to top
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  // When scrolling mouse wheel over the sticky left navigation sidebar, delegate scroll to right content panel
  const handleSidebarWheel = (e: React.WheelEvent) => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop += e.deltaY;
    }
  };
  
  // Data lists state
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [outsideWorkSettings, setOutsideWorkSettings] = useState<OutsideWorkSettings>(() => dataStore.getOutsideWorkSettings());
  const [isUploadingSettingsImg, setIsUploadingSettingsImg] = useState<{ [key: string]: boolean }>({});

  // Helper to identify and scrub fake/sample seeded bookings
  const isFakeBooking = (b: any): boolean => {
    if (!b || typeof b !== "object") return true;
    const id = String(b.id || "");
    const email = String(b.email || "").toLowerCase();
    const name = String(b.name || "").toLowerCase();
    if (id.startsWith("booking_sample") || id.includes("sample")) return true;
    if (
      email === "sophia.martinez@designhub.io" || 
      email === "rohan.p@fintechlab.com" || 
      email === "alex.morgan@designstudio.co"
    ) return true;
    if (
      name.includes("sophia martinez") || 
      name.includes("rohan patel") || 
      name.includes("alex morgan")
    ) return true;
    return false;
  };

  // Booked Mentorship Sessions State (Only real user bookings, NO fake data)
  const [bookedSessions, setBookedSessions] = useState<MentorshipBooking[]>(() => {
    try {
      const fbCached = sessionBookingFirebaseService.getCachedBookings();
      const stored = localStorage.getItem("portfolio_mentorship_bookings");
      let localList: any[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localList = parsed.filter((b) => !isFakeBooking(b));
        }
      }
      const combined = [...fbCached.filter((b) => !isFakeBooking(b))];
      for (const item of localList) {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item);
        }
      }
      combined.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      return combined.map(sanitizeBookingRecord);
    } catch {
      return [];
    }
  });

  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<"all" | "waiting" | "confirmed" | "completed" | "cancelled">("all");
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [copiedBookingPageUrl, setCopiedBookingPageUrl] = useState(false);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);

  // Sync bookedSessions to localStorage (clean real data only)
  useEffect(() => {
    try {
      const realOnly = bookedSessions.filter((b) => !isFakeBooking(b));
      localStorage.setItem("portfolio_mentorship_bookings", JSON.stringify(realOnly));
    } catch {
      // ignore
    }
  }, [bookedSessions]);

  // Load and bidirectionally sync with server-persisted real bookings
  useEffect(() => {
    let isMounted = true;
    const syncServerBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const serverBookings: MentorshipBooking[] = await res.json();
          if (Array.isArray(serverBookings) && isMounted) {
            const realServer = serverBookings.filter((b) => !isFakeBooking(b));
            setBookedSessions((prev) => {
              const prevReal = prev.filter((b) => !isFakeBooking(b));
              const combined = [...prevReal];
              for (const p of realServer) {
                if (!combined.some((c) => c.id === p.id)) {
                  combined.push(p);
                }
              }
              combined.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              });
              try {
                localStorage.setItem("portfolio_mentorship_bookings", JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {
        // fallback
      }
    };
    syncServerBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time listener for Firebase Firestore collection "session_bookings" and local storage
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const stored = localStorage.getItem("portfolio_mentorship_bookings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const realOnly = parsed.filter((b) => !isFakeBooking(b));
            setBookedSessions((prev) => {
              const combined = [...realOnly];
              for (const p of prev) {
                if (!combined.some((c) => c.id === p.id) && !isFakeBooking(p)) {
                  combined.push(p);
                }
              }
              return combined;
            });
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("portfolio_booking_created", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    // Direct real-time listener for Firestore collection "session_bookings"
    const unsubFirebase = sessionBookingFirebaseService.initListener((firebaseBookings) => {
      if (Array.isArray(firebaseBookings)) {
        const real = firebaseBookings.filter((b) => !isFakeBooking(b)).map(sanitizeBookingRecord);
        setBookedSessions((prev) => {
          // Merge Firestore session_bookings with local records, prioritizing Firestore
          const combined = [...real];
          for (const p of prev) {
            if (!combined.some((c) => c.id === p.id) && !isFakeBooking(p)) {
              combined.push(p);
            }
          }
          combined.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          return combined;
        });
      }
    });

    return () => {
      window.removeEventListener("portfolio_booking_created", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
      unsubFirebase();
    };
  }, []);

  const handleRefreshSessions = async () => {
    setIsRefreshingSessions(true);
    try {
      const fbList = await sessionBookingFirebaseService.fetchBookings();
      const real = fbList.filter((b) => !isFakeBooking(b));
      setBookedSessions((prev) => {
        const combined = [...real];
        for (const p of prev) {
          if (!combined.some((c) => c.id === p.id) && !isFakeBooking(p)) {
            combined.push(p);
          }
        }
        combined.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        return combined;
      });
      showToast(`Synced ${real.length} session(s) from Firebase session_bookings!`);
    } catch (err: any) {
      showToast("Notice: Could not refresh from Firebase: " + (err?.message || "Error"), "error");
    } finally {
      setIsRefreshingSessions(false);
    }
  };

  const handleCopyBookingPageUrl = () => {
    const url = `${window.location.origin}/session-booking`;
    navigator.clipboard.writeText(url);
    setCopiedBookingPageUrl(true);
    setTimeout(() => setCopiedBookingPageUrl(false), 2500);
  };

  // Session Booking Website Destination URL configuration
  const [sessionBookingConfig, setSessionBookingConfig] = useState<SessionConfig>(() => sessionConfigService.getConfig());
  const [bookingUrlInput, setBookingUrlInput] = useState<string>(() => sessionConfigService.getConfig().bookingUrl);
  const [meetUrlInput, setMeetUrlInput] = useState<string>(() => sessionConfigService.getConfig().meetUrl || "https://meet.google.com/new");
  const [communityUrlInput, setCommunityUrlInput] = useState<string>(() => sessionConfigService.getConfig().communityUrl || "https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v");
  const [openInNewTabInput, setOpenInNewTabInput] = useState<boolean>(() => sessionConfigService.getConfig().openInNewTab);
  const [isSavingBookingUrl, setIsSavingBookingUrl] = useState<boolean>(false);
  const [hasSavedBookingUrl, setHasSavedBookingUrl] = useState<boolean>(false);

  useEffect(() => {
    const unsub = sessionConfigService.initListener((cfg) => {
      setSessionBookingConfig(cfg);
      setBookingUrlInput(cfg.bookingUrl);
      if (cfg.meetUrl) setMeetUrlInput(cfg.meetUrl);
      if (cfg.communityUrl) setCommunityUrlInput(cfg.communityUrl);
      setOpenInNewTabInput(cfg.openInNewTab);
    });
    return unsub;
  }, []);

  const handleSaveBookingUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingBookingUrl(true);
    try {
      const updated = await sessionConfigService.saveConfig({
        bookingUrl: bookingUrlInput.trim(),
        meetUrl: meetUrlInput.trim() || "https://meet.google.com/new",
        communityUrl: communityUrlInput.trim() || "https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v",
        openInNewTab: openInNewTabInput,
      });
      setSessionBookingConfig(updated);
      setBookingUrlInput(updated.bookingUrl);
      setMeetUrlInput(updated.meetUrl || "https://meet.google.com/new");
      setCommunityUrlInput(updated.communityUrl || "https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v");
      setHasSavedBookingUrl(true);
      showToast("Session & meeting links updated successfully!");
      setTimeout(() => setHasSavedBookingUrl(false), 3000);
    } catch (err: any) {
      showToast("Failed to save configuration: " + (err?.message || "Error"), "error");
    } finally {
      setIsSavingBookingUrl(false);
    }
  };

  const handleResetBookingUrl = async () => {
    const defaultUrl = "https://adplist.org";
    setBookingUrlInput(defaultUrl);
    setMeetUrlInput("https://meet.google.com/new");
    setCommunityUrlInput("https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v");
    setOpenInNewTabInput(true);
    await sessionConfigService.saveConfig({
      bookingUrl: defaultUrl,
      meetUrl: "https://meet.google.com/new",
      communityUrl: "https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v",
      openInNewTab: true,
    });
    showToast("Reset to default session configuration");
  };

  const handleUpdateSessionStatus = async (
    id: string,
    newStatus: "waiting" | "confirmed" | "completed" | "cancelled"
  ) => {
    const currentSession = bookedSessions.find((s) => s.id === id);
    const prevStatus = currentSession?.status;

    setBookedSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );

    // Sync to Firestore session_bookings collection
    sessionBookingFirebaseService.updateBookingStatus(id, newStatus).catch(() => {});

    // Sync to local storage
    try {
      const stored = localStorage.getItem("portfolio_mentorship_bookings");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const updated = list.map((b: any) => (b.id === id ? { ...b, status: newStatus } : b));
          localStorage.setItem("portfolio_mentorship_bookings", JSON.stringify(updated));
        }
      }
    } catch {}

    // Send confirmation email when switched to confirmed!
    if (newStatus === "confirmed" && prevStatus !== "confirmed") {
      try {
        const targetBooking = currentSession
          ? sanitizeBookingRecord({
              ...currentSession,
              status: "confirmed",
              meetLink: currentSession.meetLink || sessionBookingConfig.meetUrl || "https://meet.google.com/new",
            })
          : {
              id,
              status: "confirmed",
              meetLink: sessionBookingConfig.meetUrl || "https://meet.google.com/new",
            };

        showToast("Session confirmed! Sending confirmation email...", "success");

        const resp = await fetch("/api/bookings/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetBooking),
        });
        const resData = await resp.json();
        if (resData.success) {
          const menteeEmail = (targetBooking as any).email || (targetBooking as any).emailAddress || "mentee";
          showToast(`Session confirmed! Confirmation email sent to ${menteeEmail} and Avinash.`, "success");
        } else {
          showToast("Session confirmed! Confirmation email queued.", "success");
        }
      } catch (emailErr: any) {
        console.warn("Could not dispatch confirmation email:", emailErr);
        showToast("Session status updated to Confirmed", "success");
      }
    } else {
      const statusLabel =
        newStatus === "waiting"
          ? "Waiting"
          : newStatus === "confirmed"
          ? "Confirmed"
          : newStatus === "completed"
          ? "Completed"
          : "Cancelled";
      showToast(`Status updated to ${statusLabel}`);
    }

    try {
      fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {});
    } catch {}
  };

  // Delete Session Confirmation State
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const handleDeleteSession = (id: string, name?: string) => {
    const booking = bookedSessions.find((s) => s.id === id);
    const menteeName = name || booking?.name || booking?.fullName || "Mentee";
    setSessionToDelete({ id, name: menteeName });
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const { id, name } = sessionToDelete;
    setIsDeletingSession(true);
    try {
      // 1. Optimistic removal from state
      setBookedSessions((prev) => prev.filter((s) => s.id !== id));
      // 2. Remove from local storage
      try {
        const stored = localStorage.getItem("portfolio_mentorship_bookings");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const filtered = list.filter((b: any) => b.id !== id);
            localStorage.setItem("portfolio_mentorship_bookings", JSON.stringify(filtered));
          }
        }
      } catch {}
      // 3. Delete from Firestore session_bookings
      await sessionBookingFirebaseService.deleteBooking(id);
      // 4. Delete from server API
      fetch(`/api/bookings/${id}`, { method: "DELETE" }).catch(() => {});
      showToast(`Session booking for "${name}" deleted`);
    } catch (err: any) {
      showToast("Failed to delete session: " + (err?.message || err), "error");
    } finally {
      setIsDeletingSession(false);
      setSessionToDelete(null);
    }
  };

  const handleCopySessionInfo = (session: MentorshipBooking) => {
    const s = sanitizeBookingRecord(session);
    const menteeName = s.name || s.fullName || "Guest Mentee";
    const menteeEmail = s.email || s.emailAddress || "";
    const menteePhone = s.mobileNumber || s.phone || s.phoneNumber || s.contactNumber || "";
    const topic = s.sessionName || s.sessionType || s.chooseTopic || s.topic || s.track || "1:1 Mentorship Session";
    const dur = s.duration || s.sessionDuration || "60 minutes";
    const role = s.role || s.currentRole || "N/A";
    const link = s.portfolioUrl || s.linkedInUrl || "N/A";
    const notes = s.message || s.helpWith || "N/A";
    const timeStr = `${s.date} at ${s.startTime}${s.endTime ? ` – ${s.endTime}` : ""}${s.timezone ? ` (${s.timezone})` : ""}`;
    const text = `1:1 Mentorship Session\nTopic: ${topic}\nDuration: ${dur}\nDate & Time: ${timeStr}\nMentee: ${menteeName} (${menteeEmail}${menteePhone ? `, Phone: ${menteePhone}` : ""})\nRole: ${role}\nPortfolio / LinkedIn: ${link}\nDiscussion Agenda / Help: ${notes}`;
    navigator.clipboard.writeText(text);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  const getSessionGoogleCalendarUrl = (session: MentorshipBooking) => {
    const s = sanitizeBookingRecord(session);
    const menteeName = s.name || s.fullName || "Guest Mentee";
    const menteeEmail = s.email || s.emailAddress || "";
    const menteePhone = s.mobileNumber || s.phone || s.phoneNumber || s.contactNumber || "";
    const topic = s.sessionName || s.sessionType || s.chooseTopic || s.topic || s.track || "1:1 Mentorship Session";
    const dur = s.duration || s.sessionDuration || "60 minutes";
    const role = s.role || s.currentRole;
    const link = s.portfolioUrl || s.linkedInUrl;
    const notes = s.message || s.helpWith;
    const timeStr = `${s.date} at ${s.startTime}${s.endTime ? ` – ${s.endTime}` : ""}${s.timezone ? ` (${s.timezone})` : ""}`;

    const title = encodeURIComponent(`1:1 Mentorship: ${topic} with Avinash Shajan`);
    const details = encodeURIComponent(
      `Topic: ${topic}\n` +
      `Duration: ${dur}\n` +
      `Date & Time: ${timeStr}\n` +
      `Mentee: ${menteeName} (${menteeEmail})\n` +
      (menteePhone ? `Mobile: ${menteePhone}\n` : "") +
      (role ? `Role: ${role}\n` : "") +
      (link ? `Portfolio: ${link}\n` : "") +
      (notes ? `Notes / Help: ${notes}\n` : "")
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  };
  
  // Profile Picture (DP) State (Synced with Firebase profile_pictures collection)
  const [profilePicture, setProfilePicture] = useState<ProfilePictureData | null>(() => profilePictureService.getProfilePicture());
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  // Resume Section State (Synced with Cloudinary 'resume' collection and Firestore)
  const [resumes, setResumes] = useState<ResumeDocument[]>(() => resumeService.getResumes());
  const [primaryResume, setPrimaryResume] = useState<ResumeDocument>(() => resumeService.getPrimaryResume());
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isQuickUploadingResume, setIsQuickUploadingResume] = useState(false);
  const quickResumeInputRef = useRef<HTMLInputElement>(null);

  // About Page Polaroid Stack Photos (Synced with Firebase my_images collection)
  const [aboutPhotos, setAboutPhotos] = useState<AboutPhoto[]>(() => aboutImagesService.getAboutPhotos());
  const [isUploadingAboutPhoto, setIsUploadingAboutPhoto] = useState<{ [slotIndex: number]: boolean }>({});
  const aboutSlot0Ref = useRef<HTMLInputElement>(null);
  const aboutSlot1Ref = useRef<HTMLInputElement>(null);
  const aboutSlot2Ref = useRef<HTMLInputElement>(null);
  const aboutSlot3Ref = useRef<HTMLInputElement>(null);
  const aboutSlot4Ref = useRef<HTMLInputElement>(null);
  const aboutPhotoInputRefs = [aboutSlot0Ref, aboutSlot1Ref, aboutSlot2Ref, aboutSlot3Ref, aboutSlot4Ref];

  // Mentorship Card Photos (Synced with Firebase mentorship_photos collection & Cloudinary profile_images)
  const [mentorshipPhotos, setMentorshipPhotos] = useState<MentorshipPhoto[]>(() => mentorshipPhotosService.getMentorshipPhotos());
  const [isUploadingMentorshipPhoto, setIsUploadingMentorshipPhoto] = useState<{ [slotIndex: number]: boolean }>({});
  const mentorshipSlot0Ref = useRef<HTMLInputElement>(null);
  const mentorshipSlot1Ref = useRef<HTMLInputElement>(null);
  const mentorshipPhotoInputRefs = [mentorshipSlot0Ref, mentorshipSlot1Ref];

  // Alma Maters (Education Institutions Showcase - synced with Firestore & Cloudinary profile_images)
  const [almaMaters, setAlmaMaters] = useState<AlmaMater[]>(() => almaMaterService.getAlmaMaters());
  const [isUploadingAlmaCampus, setIsUploadingAlmaCampus] = useState<{ [id: string]: boolean }>({});
  const [isUploadingAlmaLogo, setIsUploadingAlmaLogo] = useState<{ [id: string]: boolean }>({});
  const almaCampusInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});
  const almaLogoInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});

  // A Bit More About Me Cards (4 Cards - synced with Firestore & Cloudinary profile_images)
  const [aboutMoreItems, setAboutMoreItems] = useState<AboutMoreItem[]>(() => bitMoreAboutMeService.getItems());
  const [isUploadingAboutMoreImg, setIsUploadingAboutMoreImg] = useState<{ [id: string]: boolean }>({});
  const aboutMoreFileInputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("portfolio_admin_notifications");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: "n1",
        title: "Database Synced",
        message: "Portfolio data storage active with clean environment.",
        timestamp: "Just now",
        read: false,
        type: "success"
      },
      {
        id: "n2",
        title: "Session Authenticated",
        message: "Admin session initialized successfully.",
        timestamp: "Today at 10:00 AM",
        read: true,
        type: "info"
      }
    ];
  });

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const saved = localStorage.getItem("portfolio_notification_prefs");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      emailInquiries: true,
      securityAlerts: true,
      projectUpdates: true,
      browserNotifications: false,
    };
  });

  const saveNotifications = (newList: NotificationItem[]) => {
    setNotifications(newList);
    localStorage.setItem("portfolio_admin_notifications", JSON.stringify(newList));
  };

  const saveNotificationPrefs = (newPrefs: typeof notificationPrefs) => {
    setNotificationPrefs(newPrefs);
    localStorage.setItem("portfolio_notification_prefs", JSON.stringify(newPrefs));
    showToast("Notification settings updated!");
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    showToast("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    showToast("Notification removed");
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
    showToast("All notifications cleared");
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Customization State & Handlers
  const [customization, setCustomization] = useState<PortfolioCustomization>(() => getCustomizationSettings());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setCustomization(e.detail);
      } else {
        setCustomization(getCustomizationSettings());
      }
    };
    window.addEventListener("portfolio_customization_update", handleUpdate);
    return () => window.removeEventListener("portfolio_customization_update", handleUpdate);
  }, []);

  // Sync Profile Picture (DP) from Firestore & custom events
  useEffect(() => {
    const unsubscribe = profilePictureService.initListener((data) => {
      setProfilePicture(data);
    });

    const handlePicUpdate = (e: any) => {
      if (e?.detail !== undefined) {
        setProfilePicture(e.detail);
      } else {
        setProfilePicture(profilePictureService.getProfilePicture());
      }
    };

    window.addEventListener("portfolio_profile_picture_update", handlePicUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_profile_picture_update", handlePicUpdate);
    };
  }, []);

  // Sync Resumes & Primary Resume from Firestore / localStorage
  useEffect(() => {
    const unsubscribe = resumeService.initListener((list, primary) => {
      setResumes(list);
      setPrimaryResume(primary);
    });

    const handleResumeUpdate = (e: any) => {
      if (e?.detail) {
        if (e.detail.resumes) setResumes(e.detail.resumes);
        if (e.detail.primary) setPrimaryResume(e.detail.primary);
      } else {
        setResumes(resumeService.getResumes());
        setPrimaryResume(resumeService.getPrimaryResume());
      }
    };

    window.addEventListener("portfolio_resume_updated", handleResumeUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_resume_updated", handleResumeUpdate);
    };
  }, []);

  // Sync Mentorship Photos from Firestore mentorship_photos collection & custom events
  useEffect(() => {
    const unsubscribe = mentorshipPhotosService.initListener((photos) => {
      setMentorshipPhotos(photos);
    });

    const handleMentorshipUpdate = (e: any) => {
      if (e?.detail) {
        setMentorshipPhotos(e.detail);
      } else {
        setMentorshipPhotos(mentorshipPhotosService.getMentorshipPhotos());
      }
    };

    window.addEventListener("portfolio_mentorship_photos_update", handleMentorshipUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_mentorship_photos_update", handleMentorshipUpdate);
    };
  }, []);

  // Sync Alma Maters from Firestore alma_maters collection & custom events
  useEffect(() => {
    const unsubscribe = almaMaterService.initListener((items) => {
      setAlmaMaters(items);
    });

    const handleAlmaUpdate = (e: any) => {
      if (e?.detail) {
        setAlmaMaters(e.detail);
      } else {
        setAlmaMaters(almaMaterService.getAlmaMaters());
      }
    };

    window.addEventListener("portfolio_alma_maters_update", handleAlmaUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_alma_maters_update", handleAlmaUpdate);
    };
  }, []);

  // Sync A Bit More About Me Items from Firestore about_more_items collection & custom events
  useEffect(() => {
    const unsubscribe = bitMoreAboutMeService.initListener((items) => {
      setAboutMoreItems(items);
    });

    const handleAboutMoreUpdate = (e: any) => {
      if (e?.detail) {
        setAboutMoreItems(e.detail);
      } else {
        setAboutMoreItems(bitMoreAboutMeService.getItems());
      }
    };

    window.addEventListener("portfolio_about_more_update", handleAboutMoreUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_about_more_update", handleAboutMoreUpdate);
    };
  }, []);

  const handleProfilePicFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImageSrc(reader.result?.toString() || "");
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);

    if (e.target) e.target.value = "";
  };

  const handleCropUploadComplete = async (croppedFile: File) => {
    setIsUploadingProfilePic(true);
    try {
      await profilePictureService.uploadProfilePicture(croppedFile);
      const updated = profilePictureService.getProfilePicture();
      setProfilePicture(updated);
      showToast("Cropped profile picture saved & synced!");
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload cropped profile picture: " + msg, "error");
    } finally {
      setIsUploadingProfilePic(false);
      setIsCropModalOpen(false);
      setCropImageSrc("");
    }
  };

  const handleProfilePicDelete = async () => {
    setIsUploadingProfilePic(true);
    try {
      await profilePictureService.deleteProfilePicture();
      setProfilePicture(null);
      showToast("Profile picture removed from Firebase profile_pictures");
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to delete profile picture: " + msg, "error");
    } finally {
      setIsUploadingProfilePic(false);
    }
  };

  const handleResumeUpload = async (file: File, setAsPrimary: boolean = true) => {
    try {
      const uploaded = await resumeService.uploadResume(file, setAsPrimary);
      showToast(`Resume "${uploaded.name}" uploaded to Cloudinary ("resume" collection)!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to upload resume to Cloudinary.", "error");
      throw err;
    }
  };

  const handleQuickResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      showToast("Please select a valid PDF file (.pdf)", "error");
      return;
    }

    setIsQuickUploadingResume(true);
    try {
      await handleResumeUpload(file, true);
      if (quickResumeInputRef.current) quickResumeInputRef.current.value = "";
    } catch (err) {
      // Toast handled in handleResumeUpload
    } finally {
      setIsQuickUploadingResume(false);
    }
  };

  const handleSetPrimaryResume = async (id: string) => {
    try {
      const target = await resumeService.setPrimaryResume(id);
      if (target) {
        showToast(`"${target.name}" is now the active primary resume for all visitors!`, "success");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to set primary resume.", "error");
      throw err;
    }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await resumeService.deleteResume(id);
      showToast("Resume removed successfully.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete resume.", "error");
      throw err;
    }
  };

  const handleDownloadResume = async (resume: ResumeDocument) => {
    try {
      await resumeService.downloadResumeFile(resume);
      showToast(`Downloading "${resume.name}"...`, "success");
    } catch (err: any) {
      showToast("Download failed: " + (err?.message || "Please check URL"), "error");
    }
  };

  const handleSelectPreset = (presetId: string, hex: string) => {
    const updated = { ...customization, colorPreset: presetId, primaryColor: hex };
    setCustomization(updated);
    applyCustomizationToDOM(updated);
  };

  const handleCustomColorChange = (hex: string) => {
    const updated = { ...customization, colorPreset: "custom", primaryColor: hex };
    setCustomization(updated);
    applyCustomizationToDOM(updated);
  };

  const handleSaveCustomization = () => {
    saveCustomizationSettings(customization);
    showToast("Portfolio theme customization saved successfully!");
  };

  const handleResetCustomization = () => {
    resetCustomizationSettings();
    const def = getCustomizationSettings();
    setCustomization(def);
    showToast("Restored default portfolio theme!");
  };
  
  const settingsImg01InputRef = useRef<HTMLInputElement>(null);
  const settingsImg02InputRef = useRef<HTMLInputElement>(null);
  const settingsImg03InputRef = useRef<HTMLInputElement>(null);

  const handleSettingsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: 'MyImage01' | 'MyImage02' | 'MyImage03') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const prevUrl = outsideWorkSettings[fieldKey];

    setIsUploadingSettingsImg(prev => ({ ...prev, [fieldKey]: true }));
    try {
      const customId = `outside_work_${fieldKey.toLowerCase()}_${Date.now()}`;
      const url = await uploadImageToCloudinary(file, "profile_images", customId);

      // Clean up previous image from Cloudinary
      if (prevUrl && prevUrl !== url && !prevUrl.includes("unsplash.com") && !prevUrl.startsWith("data:")) {
        deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Notice: Cloudinary deletion:", e));
      }

      const updated = { ...outsideWorkSettings, [fieldKey]: url };
      setOutsideWorkSettings(updated);
      dataStore.saveOutsideWorkSettings(updated);
      showToast("Photo uploaded to profile_images & saved to settings/outside_work!");
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload photo: " + msg, "error");
    } finally {
      setIsUploadingSettingsImg(prev => ({ ...prev, [fieldKey]: false }));
      if (e.target) e.target.value = "";
    }
  };

  const removeSettingsPhoto = (fieldKey: 'MyImage01' | 'MyImage02' | 'MyImage03') => {
    const prevUrl = outsideWorkSettings[fieldKey];
    if (prevUrl && !prevUrl.includes("unsplash.com") && !prevUrl.startsWith("data:")) {
      deleteImageFromCloudinary(prevUrl).catch((e) => console.warn("Notice: Cloudinary deletion:", e));
    }
    const updated = { ...outsideWorkSettings, [fieldKey]: "" };
    setOutsideWorkSettings(updated);
    dataStore.saveOutsideWorkSettings(updated);
    showToast("Photo removed from settings/outside_work");
  };

  // Handlers for About Section 5-Photo Stack (Firebase settings/more_photos)
  const handleAboutPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAboutPhoto(prev => ({ ...prev, [slotIndex]: true }));
    try {
      await aboutImagesService.uploadPhoto(file, slotIndex);
      const updated = aboutImagesService.getAboutPhotos();
      setAboutPhotos(updated);
      showToast(`About photo ${slotIndex + 1} uploaded to profile_images & saved to settings/more_photos!`);
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload photo: " + msg, "error");
    } finally {
      setIsUploadingAboutPhoto(prev => ({ ...prev, [slotIndex]: false }));
    }
  };

  const handleAboutCaptionChange = async (slotIndex: number, caption: string) => {
    const target = aboutPhotos[slotIndex];
    if (!target) return;
    const updatedPhoto: AboutPhoto = { ...target, caption };
    const nextList = [...aboutPhotos];
    nextList[slotIndex] = updatedPhoto;
    setAboutPhotos(nextList);
    await aboutImagesService.savePhoto(updatedPhoto);
  };

  const handleRemoveAboutPhoto = async (id: string, slotIndex: number) => {
    await aboutImagesService.removePhoto(id);
    const updated = aboutImagesService.getAboutPhotos();
    setAboutPhotos(updated);
    showToast(`Photo ${slotIndex + 1} removed from settings/more_photos`);
  };

  // Handlers for Mentorship Card Photos (Cloudinary profile_images & Firestore mentorship_photos)
  const handleMentorshipPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMentorshipPhoto((prev) => ({ ...prev, [slotIndex]: true }));
    try {
      await mentorshipPhotosService.uploadMentorshipPhoto(slotIndex, file);
      const updated = mentorshipPhotosService.getMentorshipPhotos();
      setMentorshipPhotos(updated);
      showToast(`Mentorship photo ${slotIndex + 1} uploaded to profile_images & saved to mentorship_photos!`);
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload mentorship photo: " + msg, "error");
    } finally {
      setIsUploadingMentorshipPhoto((prev) => ({ ...prev, [slotIndex]: false }));
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveMentorshipPhoto = async (slotIndex: number) => {
    try {
      await mentorshipPhotosService.deleteMentorshipPhoto(slotIndex);
      const updated = mentorshipPhotosService.getMentorshipPhotos();
      setMentorshipPhotos(updated);
      showToast(`Mentorship photo ${slotIndex + 1} reset to default fallback`);
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to remove mentorship photo: " + msg, "error");
    }
  };

  // Handlers for Alma Maters (Education Institutions Showcase)
  const handleAlmaCampusUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAlmaCampus((prev) => ({ ...prev, [id]: true }));
    try {
      await almaMaterService.uploadCampusImage(id, file);
      const updated = almaMaterService.getAlmaMaters();
      setAlmaMaters(updated);
      showToast("Campus image uploaded to profile_images & saved to alma_maters!");
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload campus photo: " + msg, "error");
    } finally {
      setIsUploadingAlmaCampus((prev) => ({ ...prev, [id]: false }));
      if (e.target) e.target.value = "";
    }
  };

  const handleAlmaLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAlmaLogo((prev) => ({ ...prev, [id]: true }));
    try {
      await almaMaterService.uploadLogoImage(id, file);
      const updated = almaMaterService.getAlmaMaters();
      setAlmaMaters(updated);
      showToast("Logo emblem uploaded to profile_images & saved to alma_maters!");
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload logo: " + msg, "error");
    } finally {
      setIsUploadingAlmaLogo((prev) => ({ ...prev, [id]: false }));
      if (e.target) e.target.value = "";
    }
  };

  const handleResetAlmaCampus = async (id: string) => {
    try {
      const defaultItem = DEFAULT_ALMA_MATERS.find((it) => it.id === id);
      const fallbackUrl = defaultItem ? defaultItem.imageUrl : "";
      await almaMaterService.updateAlmaMater(id, { imageUrl: fallbackUrl });
      setAlmaMaters(almaMaterService.getAlmaMaters());
      showToast("Campus photo reset to default");
    } catch {
      showToast("Failed to reset photo", "error");
    }
  };

  const handleResetAlmaLogo = async (id: string) => {
    try {
      const defaultItem = DEFAULT_ALMA_MATERS.find((it) => it.id === id);
      const fallbackUrl = defaultItem ? defaultItem.logoUrl : "";
      await almaMaterService.updateAlmaMater(id, { logoUrl: fallbackUrl });
      setAlmaMaters(almaMaterService.getAlmaMaters());
      showToast("Logo reset to default");
    } catch {
      showToast("Failed to reset logo", "error");
    }
  };

  const handleAlmaFieldChange = async (id: string, updates: Partial<AlmaMater>) => {
    await almaMaterService.updateAlmaMater(id, updates);
    setAlmaMaters(almaMaterService.getAlmaMaters());
  };

  const handleAddAlmaMater = async () => {
    const current = almaMaterService.getAlmaMaters();
    const newId = `alma_${Date.now()}`;
    const newItem: AlmaMater = {
      id: newId,
      name: "New Institution Name",
      shortName: "Campus",
      degree: "Degree / Specialization",
      period: "2022 — 2024",
      location: "City, Country",
      description: "Description of study, focus areas, and achievements.",
      imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600&auto=format&fit=crop",
      logoUrl: "",
      order: current.length,
    };

    const nextList = [...current, newItem];
    await almaMaterService.saveAlmaMaters(nextList);
    setAlmaMaters(nextList);
    showToast("New education institution added to Alma Maters!");
  };

  const handleDeleteAlmaMater = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this institution?")) return;
    await almaMaterService.deleteAlmaMater(id);
    setAlmaMaters(almaMaterService.getAlmaMaters());
    showToast("Institution removed from Alma Maters");
  };

  // Handlers for A Bit More About Me (4 Cards Showcase)
  const handleAboutMorePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAboutMoreImg((prev) => ({ ...prev, [itemId]: true }));
    try {
      const item = aboutMoreItems.find((it) => it.id === itemId);
      const itemSlug = item?.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") : itemId;
      const folder = `profile/about_more/${itemSlug}`;

      const uploadedUrl = await uploadImageToCloudinary(file, folder);
      await bitMoreAboutMeService.updateItem(itemId, { imageUrl: uploadedUrl });
      const updated = bitMoreAboutMeService.getItems();
      setAboutMoreItems(updated);
      showToast(`Image uploaded for "${item?.title || 'Card'}"!`);
    } catch (err: any) {
      console.error("Failed uploading card photo:", err);
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast(`Upload failed: ${msg}`, "error");
    } finally {
      setIsUploadingAboutMoreImg((prev) => ({ ...prev, [itemId]: false }));
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteAboutMorePhoto = async (itemId: string) => {
    try {
      await bitMoreAboutMeService.updateItem(itemId, { imageUrl: "" });
      setAboutMoreItems(bitMoreAboutMeService.getItems());
      showToast("Photo removed successfully");
    } catch {
      showToast("Failed to remove photo", "error");
    }
  };

  const handleResetAboutMorePhoto = async (itemId: string) => {
    try {
      const defaultItem = DEFAULT_ABOUT_MORE_ITEMS.find((it) => it.id === itemId);
      const fallbackUrl = defaultItem ? defaultItem.imageUrl : "";
      await bitMoreAboutMeService.updateItem(itemId, { imageUrl: fallbackUrl });
      setAboutMoreItems(bitMoreAboutMeService.getItems());
      showToast("Photo reset to default");
    } catch {
      showToast("Failed to reset photo", "error");
    }
  };

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [uploadingProjectThumb, setUploadingProjectThumb] = useState<{ [id: string]: boolean }>({});
  const projectCardFileInputRefs = useRef<{ [projectId: string]: HTMLInputElement | null }>({});

  const handleDirectThumbnailUpload = async (projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProjectThumb((prev) => ({ ...prev, [projectId]: true }));
    try {
      const uploadedUrl = await projectService.uploadProjectImage(file, `projects/${projectId}`);
      const existingProj = projects.find((p) => p.id === projectId);
      if (existingProj) {
        const updated = { ...existingProj, thumbnail: [uploadedUrl] };
        await projectService.updateProject(projectId, updated);
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
        showToast("Project image uploaded successfully!");
      }
    } catch (err: any) {
      console.error("Direct thumbnail upload failed:", err);
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to upload image: " + msg, "error");
    } finally {
      setUploadingProjectThumb((prev) => ({ ...prev, [projectId]: false }));
      if (e.target) e.target.value = "";
    }
  };
  
  // Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);

  // Delete Project Popup Confirmation State
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Delete Blog Popup Confirmation State
  const [blogToDelete, setBlogToDelete] = useState<{ id: string; title: string } | null>(null);

  // Delete Field Note Popup Confirmation State
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Delete Testimonial Popup Confirmation State
  const [testimonialToDelete, setTestimonialToDelete] = useState<{ id: string; name: string } | null>(null);

  const [showBlogModal, setShowBlogModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogItem> | null>(null);

  // Field Notes State
  const [fieldNotes, setFieldNotes] = useState<FieldNote[]>(() => fieldNotesService.getNotes());
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [blogsSubTab, setBlogsSubTab] = useState<"blogs" | "notes" | "external">("blogs");

  // External Articles State (Medium & LinkedIn)
  const [externalArticles, setExternalArticles] = useState<ExternalArticle[]>(() => getExternalArticles());
  const [showExternalArticleModal, setShowExternalArticleModal] = useState(false);
  const [currentExternalArticle, setCurrentExternalArticle] = useState<ExternalArticle | null>(null);

  const handleClearAllExternalArticles = () => {
    if (window.confirm("Are you sure you want to remove all listed external articles? You can add fresh ones anytime.")) {
      saveExternalArticles([]);
      setExternalArticles([]);
      showToast("All external articles cleared");
    }
  };

  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [showFormPreviewModal, setShowFormPreviewModal] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState("");
  const [editStep, setEditStep] = useState<1 | 2 | 3>(1);

  const [replaceTarget, setReplaceTarget] = useState<{ type: 'thumbnail' | 'heroSectionImg' | 'gallery'; index: number } | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const triggerReplaceImage = (type: 'thumbnail' | 'heroSectionImg' | 'gallery', index: number = 0) => {
    setReplaceTarget({ type, index });
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = "";
      replaceFileInputRef.current.click();
    }
  };

  const handleReplaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTarget) return;

    setIsUploadingImage(true);
    try {
      const folderId = currentProject?.id || `proj_${Date.now()}`;
      const uploadedUrl = await projectService.uploadProjectImage(file, `projects/${folderId}`);

      const { type, index } = replaceTarget;
      if (type === 'thumbnail') {
        setCurrentProject((prev) => ({ ...prev, thumbnail: [uploadedUrl] }));
      } else if (type === 'heroSectionImg') {
        setCurrentProject((prev) => {
          const updated = [...(prev?.heroSectionImg || [])];
          updated[index] = uploadedUrl;
          return { ...prev, heroSectionImg: updated };
        });
      } else if (type === 'gallery') {
        setCurrentProject((prev) => {
          const updatedImages = [...(prev?.images || [])];
          const updatedProjImages = [...(prev?.projectImages || [])];
          updatedImages[index] = uploadedUrl;
          updatedProjImages[index] = uploadedUrl;
          return {
            ...prev,
            images: updatedImages,
            projectImages: updatedProjImages,
          };
        });
      }
      showToast("Image replaced successfully!");
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Replace image failed: " + msg, "error");
    } finally {
      setIsUploadingImage(false);
      setReplaceTarget(null);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (type: 'thumbnail' | 'heroSectionImg' | 'gallery', index: number = 0) => {
    if (type === 'thumbnail') {
      setCurrentProject((prev) => ({ ...prev, thumbnail: [""] }));
      showToast("Thumbnail removed");
    } else if (type === 'heroSectionImg') {
      setCurrentProject((prev) => {
        const updated = (prev?.heroSectionImg || []).filter((_, i) => i !== index);
        return { ...prev, heroSectionImg: updated };
      });
      showToast("Hero image removed");
    } else if (type === 'gallery') {
      setCurrentProject((prev) => {
        const updatedImages = (prev?.images || []).filter((_, i) => i !== index);
        const updatedProjImages = (prev?.projectImages || []).filter((_, i) => i !== index);
        return { ...prev, images: updatedImages, projectImages: updatedProjImages };
      });
      showToast("Gallery image removed");
    }
  };

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail' | 'heroSectionImg' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const folderId = currentProject?.id || `proj_${Date.now()}`;
      const uploadPromises = Array.from(files).map((file: File) =>
        projectService.uploadProjectImage(file, `projects/${folderId}`)
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      if (field === 'thumbnail') {
        setCurrentProject((prev) => ({ ...prev, thumbnail: [uploadedUrls[0]] }));
      } else if (field === 'heroSectionImg') {
        setCurrentProject((prev) => ({
          ...prev,
          heroSectionImg: [...(prev?.heroSectionImg || []), ...uploadedUrls],
        }));
      } else if (field === 'gallery') {
        setCurrentProject((prev) => {
          const existingImages = prev?.images || [];
          const existingProjImages = prev?.projectImages || [];
          return {
            ...prev,
            images: [...existingImages, ...uploadedUrls],
            projectImages: [...existingProjImages, ...uploadedUrls],
          };
        });
      }
      showToast(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (err: any) {
      showToast("Upload failed: " + (err.message || err), "error");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrlInput.trim()) return;
    const url = newGalleryUrlInput.trim();
    setCurrentProject((prev) => {
      const existingImages = prev?.images || [];
      const existingProjImages = prev?.projectImages || [];
      return {
        ...prev,
        images: [...existingImages, url],
        projectImages: [...existingProjImages, url],
      };
    });
    setNewGalleryUrlInput("");
    showToast("Image URL added to gallery");
  };

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // Session Auth check
    if (!isAdminAuthenticated()) {
      setIsAuthenticated(false);
      navigate("/admin-login", { replace: true });
      return;
    }

    setIsAuthenticated(true);
    loadData();

    const handleDataUpdate = () => {
      setProjects(dataStore.getProjects());
      setBlogs(dataStore.getBlogs());
      setTestimonials(testimonialService.getTestimonials());
      setFieldNotes(fieldNotesService.getNotes());
      setExternalArticles(getExternalArticles());
    };

    window.addEventListener("portfolio_data_update", handleDataUpdate);
    window.addEventListener("portfolio_field_notes_updated", handleDataUpdate);
    window.addEventListener("external_articles_updated", handleDataUpdate);
    window.addEventListener("storage", handleDataUpdate);

    const unsubTestimonials = testimonialService.subscribeToTestimonials((updated) => {
      if (updated) {
        setTestimonials(updated);
      }
    });

    const unsubFieldNotes = fieldNotesService.subscribe((updatedNotes) => {
      if (updatedNotes) {
        setFieldNotes(updatedNotes);
      }
    });

    return () => {
      unsubTestimonials();
      unsubFieldNotes();
      window.removeEventListener("portfolio_data_update", handleDataUpdate);
      window.removeEventListener("portfolio_field_notes_updated", handleDataUpdate);
      window.removeEventListener("external_articles_updated", handleDataUpdate);
      window.removeEventListener("storage", handleDataUpdate);
    };
  }, [navigate]);

  const loadData = () => {
    setProjects(dataStore.getProjects());
    setBlogs(dataStore.getBlogs());
    setTestimonials(testimonialService.getTestimonials());
    setFieldNotes(fieldNotesService.getNotes());
    setExternalArticles(getExternalArticles());
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Firebase signout error:", e);
      }
    }
    clearAdminSession();
    navigate("/");
  };

  // --- PROJECT OPERATIONS ---
  const openNewProject = () => {
    setCurrentProject({
      id: "P_" + Date.now().toString().slice(-6),
      title: "",
      product: "desktop_software",
      category: "",
      description: "",
      thumbnail: [""],
      isNew: true,
      isLive: false,
      homeItem: true,
      button: "View Casestudy",
      heroSection: false,
      heroSectionImg: [],
      images: [],
    });
    setEditStep(1);
    setShowProjectModal(true);
  };

  const openEditProject = (project: Project) => {
    setCurrentProject({ ...project });
    setEditStep(1);
    setShowProjectModal(true);
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !currentProject.id) return;

    const normalizedProject = {
      ...currentProject,
      isLive: Boolean(currentProject.isLive === true || (currentProject.isLive as any) === "Yes" || (currentProject.isLive as any) === "true"),
      isNew: Boolean(currentProject.isNew === true || (currentProject.isNew as any) === "Yes" || (currentProject.isNew as any) === "true"),
    };

    const index = projects.findIndex((p) => p.id === currentProject.id);

    if (index > -1) {
      await projectService.updateProject(currentProject.id, normalizedProject);
      showToast(`Project "${currentProject.title}" successfully updated`);
    } else {
      await projectService.createProject(normalizedProject as Project);
      showToast(`Project "${currentProject.title}" successfully created`);
    }

    setProjects(projectService.getProjectsSync());
    setShowProjectModal(false);
    setCurrentProject(null);
  };

  const deleteProject = (id: string, title: string) => {
    setProjectToDelete({ id, title });
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const { id, title } = projectToDelete;
    setIsDeletingProject(true);
    try {
      await projectService.deleteProject(id);
      setProjects(projectService.getProjectsSync());
      showToast(`Project "${title}" successfully deleted from database`);
    } catch (err: any) {
      console.error("Error deleting project:", err);
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast("Failed to delete project: " + msg, "error");
    } finally {
      setIsDeletingProject(false);
      setProjectToDelete(null);
    }
  };

  // --- FIELD NOTE OPERATIONS ---
  const openNewNote = () => {
    setShowCreateNoteModal(true);
  };

  const deleteFieldNoteItem = (id: string, name?: string) => {
    setNoteToDelete({ id, title: name || "Field Note" });
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    const { id, title } = noteToDelete;
    setIsDeletingNote(true);
    try {
      await fieldNotesService.deleteNote(id);
      const updatedNotes = fieldNotesService.getNotes();
      setFieldNotes(updatedNotes);
      showToast(`Field note "${title.slice(0, 30)}" deleted`);
    } catch (err: any) {
      console.error("Error deleting field note:", err);
      showToast("Failed to delete field note", "error");
    } finally {
      setIsDeletingNote(false);
      setNoteToDelete(null);
    }
  };

  // --- BLOG OPERATIONS ---
  const blogFileInputRef = useRef<HTMLInputElement>(null);
  const pendingBlogFileRef = useRef<File | null>(null);
  const [isUploadingBlogImg, setIsUploadingBlogImg] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [blogTagInput, setBlogTagInput] = useState("");

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const openNewBlog = () => {
    pendingBlogFileRef.current = null;
    setIsUploadingBlogImg(false);
    setIsSavingBlog(false);
    setCurrentBlog({
      id: "B_" + Date.now().toString().slice(-6),
      Title: "",
      description: "",
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      badge: [],
      cover_photo: "",
      readTime: "5 min read",
      category: "Artificial Intelligence",
    });
    setBlogTagInput("");
    setShowBlogModal(true);
  };

  const openEditBlog = (blog: BlogItem) => {
    pendingBlogFileRef.current = null;
    setIsUploadingBlogImg(false);
    setIsSavingBlog(false);
    setCurrentBlog({
      ...blog,
      badge: Array.isArray(blog.badge) ? [...blog.badge] : [],
      readTime: blog.readTime || "5 min read",
      category: blog.category || "Artificial Intelligence",
    });
    setBlogTagInput("");
    setShowBlogModal(true);
  };

  const processBlogImageFile = async (file: File) => {
    if (!file || !currentBlog) return;

    // 1. Immediately create a local preview so the user instantly sees their selected image
    const localUrl = URL.createObjectURL(file);
    setCurrentBlog((prev) => prev ? { ...prev, cover_photo: localUrl } : null);
    pendingBlogFileRef.current = file;

    setIsUploadingBlogImg(true);
    try {
      const rawTitle = currentBlog.Title || "blog_post";
      const slug = rawTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "blog_post";
      const folder = `home/blog/${slug}`;

      const uploadedUrl = await uploadImageToCloudinary(file, folder);
      setCurrentBlog((prev) => prev ? { ...prev, cover_photo: uploadedUrl } : null);
      pendingBlogFileRef.current = null;
      showToast("Cover photo uploaded to cloud successfully");
    } catch (err: any) {
      console.warn("Cloudinary upload failed, falling back to local base64:", err);
      try {
        const base64 = await readFileAsBase64(file);
        setCurrentBlog((prev) => prev ? { ...prev, cover_photo: base64 } : null);
        pendingBlogFileRef.current = null;
        showToast("Cover photo saved locally", "success");
      } catch {
        showToast("Failed to process cover image", "error");
      }
    } finally {
      setIsUploadingBlogImg(false);
      if (blogFileInputRef.current) blogFileInputRef.current.value = "";
    }
  };

  const handleBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBlogImageFile(file);
    }
  };

  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBlog || !currentBlog.id) return;

    const trimmedTitle = (currentBlog.Title || "").trim();
    if (!trimmedTitle) {
      showToast("Please enter an article title", "error");
      return;
    }

    setIsSavingBlog(true);

    try {
      let finalCoverPhoto = currentBlog.cover_photo || "";

      // If an image file is pending cloud upload or still in-flight
      if (pendingBlogFileRef.current) {
        try {
          const rawTitle = trimmedTitle || "blog_post";
          const slug = rawTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "blog_post";
          const folder = `home/blog/${slug}`;
          finalCoverPhoto = await uploadImageToCloudinary(pendingBlogFileRef.current, folder);
        } catch {
          // Fallback to Base64 so image is never lost
          finalCoverPhoto = await readFileAsBase64(pendingBlogFileRef.current);
        }
        pendingBlogFileRef.current = null;
      }

      const blogToSave: BlogItem = {
        id: currentBlog.id,
        Title: trimmedTitle,
        description: currentBlog.description || "",
        date: currentBlog.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        badge: Array.isArray(currentBlog.badge) ? currentBlog.badge : [],
        cover_photo: finalCoverPhoto,
        readTime: currentBlog.readTime || "5 min read",
        category: currentBlog.category || "Artificial Intelligence",
      };

      const updatedBlogs = [...blogs];
      const index = updatedBlogs.findIndex((b) => b.id === blogToSave.id);

      if (index > -1) {
        updatedBlogs[index] = blogToSave;
        showToast(`Blog post "${blogToSave.Title}" successfully updated`);
      } else {
        updatedBlogs.unshift(blogToSave);
        showToast(`Blog post "${blogToSave.Title}" successfully published`);
      }

      await dataStore.saveBlogs(updatedBlogs);
      setBlogs(updatedBlogs);
      setShowBlogModal(false);
      setCurrentBlog(null);
    } catch (err: any) {
      console.error("Failed to save blog:", err);
      showToast("Failed to publish blog: " + (err?.message || "Unknown error"), "error");
    } finally {
      setIsSavingBlog(false);
    }
  };

  const addKeyElement = (elementStr: string) => {
    const trimmed = elementStr.trim().replace(/,$/, "");
    if (!trimmed || !currentBlog) return;
    const currentBadges = currentBlog.badge || [];
    if (currentBadges.length >= 3) {
      showToast("Maximum of 3 key elements allowed", "error");
      return;
    }
    if (!currentBadges.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setCurrentBlog({
        ...currentBlog,
        badge: [...currentBadges, trimmed],
      });
    }
    setBlogTagInput("");
  };

  const removeKeyElement = (indexToRemove: number) => {
    if (!currentBlog) return;
    const currentBadges = currentBlog.badge || [];
    setCurrentBlog({
      ...currentBlog,
      badge: currentBadges.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const deleteBlog = (id: string, title: string) => {
    setBlogToDelete({ id, title });
  };

  const confirmDeleteBlog = () => {
    if (!blogToDelete) return;
    const { id, title } = blogToDelete;
    const updated = blogs.filter((b) => b.id !== id);
    dataStore.saveBlogs(updated);
    setBlogs(updated);
    showToast(`Blog post "${title}" deleted`);
    setBlogToDelete(null);
  };

  // --- TESTIMONIAL OPERATIONS ---
  const testimonialFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingTestimonialImg, setIsUploadingTestimonialImg] = useState(false);
  const [copiedAdminTestimonialLink, setCopiedAdminTestimonialLink] = useState(false);

  const handleCopyPublicTestimonialLink = async () => {
    const ok = await testimonialService.copyPublicSubmitUrl();
    if (ok) {
      setCopiedAdminTestimonialLink(true);
      showToast("Public testimonial submission link copied to clipboard!");
      setTimeout(() => setCopiedAdminTestimonialLink(false), 2500);
    }
  };

  const handleTestimonialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTestimonial) return;

    setIsUploadingTestimonialImg(true);
    try {
      const rawName = currentTestimonial.name || "username";
      const username = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "username";
      const folder = `home/testimonial/${username}`;

      const uploadedUrl = await uploadImageToCloudinary(file, folder);
      setCurrentTestimonial((prev) => prev ? { ...prev, ImgUrl: uploadedUrl } : null);
      showToast(`Image uploaded to Cloudinary folder: ${folder}`);
    } catch (err: any) {
      console.error("Failed uploading testimonial image:", err);
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      showToast(`Upload failed: ${msg}`, "error");
    } finally {
      setIsUploadingTestimonialImg(false);
      if (e.target) e.target.value = "";
    }
  };

  const openNewTestimonial = () => {
    setCurrentTestimonial({
      id: "T_" + Date.now().toString().slice(-6),
      name: "",
      position: "",
      company: "",
      quote: "",
      ImgUrl: "",
      linkedInUrl: "",
    });
    setShowTestimonialModal(true);
  };

  const openEditTestimonial = (testimonial: Testimonial) => {
    setCurrentTestimonial({ ...testimonial });
    setShowTestimonialModal(true);
  };

  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTestimonial || !currentTestimonial.id) return;

    try {
      await testimonialService.saveTestimonial(currentTestimonial as Testimonial);
      showToast(`Testimonial by "${currentTestimonial.name}" successfully saved`);
      setShowTestimonialModal(false);
      setCurrentTestimonial(null);
    } catch (err: any) {
      showToast("Failed to save testimonial: " + (err?.message || err), "error");
    }
  };

  const deleteTestimonial = (id: string, name: string) => {
    setTestimonialToDelete({ id, name });
  };

  const confirmDeleteTestimonial = async () => {
    if (!testimonialToDelete) return;
    const { id, name } = testimonialToDelete;
    try {
      await testimonialService.deleteTestimonial(id);
      showToast(`Testimonial from "${name}" deleted`);
    } catch (err: any) {
      showToast("Failed to delete testimonial: " + (err?.message || err), "error");
    } finally {
      setTestimonialToDelete(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div id="admin-dashboard-page" className="min-h-screen md:h-screen md:overflow-hidden bg-[var(--bg)] text-[var(--ink)] font-sans flex flex-col relative">
      {/* Sticky Top Header Bar */}
      <header className="flex-none z-40 w-full bg-[var(--bg)]/80 backdrop-blur-md backdrop-saturate-150 border-b border-[var(--line)] py-4 sm:py-5 transition-all">
        <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
            title="Go to Home Page"
          >
            <Home size={18} />
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {profilePicture?.imageUrl && (
              <button
                onClick={() => setActiveTab("settings")}
                className="w-10 h-10 rounded-full overflow-hidden border border-[var(--line)] hover:border-[var(--blue)] transition-all cursor-pointer shadow-xs shrink-0"
                title="Profile Settings"
              >
                <img
                  src={getOptimizedImageUrl(profilePicture.imageUrl, 120)}
                  alt="Admin Profile"
                  className="w-full h-full object-cover"
                />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full border border-red-500/20 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout: Fixed Left Sidebar + Scrollable Right Content */}
      <div className="flex-1 md:overflow-hidden w-full max-w-[1150px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 lg:gap-8 min-h-0">
        
        {/* Navigation Sidebar: Pinned on the left side, non-scrolling */}
        <aside
          onWheel={handleSidebarWheel}
          className="w-full md:w-[240px] lg:w-[260px] shrink-0 pt-6 md:py-6 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible md:overflow-y-hidden select-none"
        >
          {/* Content Group */}
          <div className="flex md:flex-col gap-2 p-2 bg-[var(--card)] border border-[var(--line)] rounded-2xl shrink-0 shadow-xs">
            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "projects"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <FolderGit2 size={16} className={activeTab === "projects" ? "text-[var(--blue)]" : ""} />
              <span>Projects</span>
            </button>

            <button
              onClick={() => setActiveTab("blogs")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "blogs"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <FileText size={16} className={activeTab === "blogs" ? "text-[var(--blue)]" : ""} />
              <span>Blogs</span>
            </button>

            <button
              onClick={() => setActiveTab("testimonials")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "testimonials"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <Users size={16} className={activeTab === "testimonials" ? "text-[var(--blue)]" : ""} />
              <span>Testimonials</span>
            </button>
          </div>

          {/* Mentorship & Booked Sessions Group */}
          <div className="p-2 bg-[var(--card)] border border-[var(--line)] rounded-2xl shrink-0 shadow-xs flex md:flex-col gap-2">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "sessions"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <CalendarCheck size={16} className={activeTab === "sessions" ? "text-[var(--blue)]" : ""} />
              <span>Booked Sessions</span>
              {bookedSessions.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-[var(--blue)] font-semibold">
                  {bookedSessions.filter((s) => s.status === "confirmed").length || bookedSessions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("session-config")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "session-config"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <Globe size={16} className={activeTab === "session-config" ? "text-[var(--blue)]" : ""} />
              <span>Configure Session</span>
            </button>
          </div>

          {/* Standalone Settings, Customization & Notifications Group */}
          <div className="p-2 bg-[var(--card)] border border-[var(--line)] rounded-2xl shrink-0 shadow-xs flex md:flex-col gap-2">
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "settings"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <UserCog size={16} className={activeTab === "settings" ? "text-[var(--blue)]" : ""} />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("customization")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "customization"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <Palette size={16} className={activeTab === "customization" ? "text-[var(--blue)]" : ""} />
              <span>Appearances</span>
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-sans font-medium flex items-center gap-3 transition-all cursor-pointer shrink-0 md:shrink ${
                activeTab === "notifications"
                  ? "bg-neutral-100 dark:bg-zinc-800 text-[var(--ink)] font-semibold"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <Bell size={16} className={activeTab === "notifications" ? "text-[var(--blue)]" : ""} />
              <span>Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-mono bg-[var(--blue)] text-white font-semibold">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Scrollable Right-Side Content Panel */}
        <main
          ref={contentContainerRef}
          data-lenis-prevent
          className="flex-1 md:h-full md:overflow-y-auto py-6 pr-1 sm:pr-2 space-y-6 admin-scrollbar min-h-0"
        >
          {/* Firebase Setup Guide Drawer */}
          {!isFirebaseConfigured && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-[24px] overflow-hidden shadow-xs mb-6">
              <button 
                onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                className="w-full px-6 py-4 flex items-center justify-between text-left font-sans text-sm font-medium text-[var(--ink)] cursor-pointer hover:bg-neutral-100/40 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Show Step-by-Step Firebase Configuration Guide</span>
                </span>
                <span className="text-xs font-mono text-[var(--ink-soft)]">{showFirebaseGuide ? "Collapse" : "Expand"}</span>
              </button>
              
              {showFirebaseGuide && (
                <div className="px-6 pb-6 pt-2 border-t border-[var(--line)] text-sm space-y-4 text-[var(--ink-soft)] font-sans leading-relaxed">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[var(--ink)] text-xs font-mono uppercase tracking-wider">Step 1: Create a Firebase Project</p>
                    <ol className="list-decimal pl-5 space-y-1 text-xs">
                      <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-[var(--blue)] hover:underline font-medium">Firebase Console</a> and click <strong>Add project</strong>.</li>
                      <li>Give your project a name (e.g., "portfolio-app") and complete setup.</li>
                    </ol>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="font-bold text-[var(--ink)] text-xs font-mono uppercase tracking-wider">Step 2: Provision Firestore Database</p>
                    <ol className="list-decimal pl-5 space-y-1 text-xs">
                      <li>In Firebase Console, select <strong>Firestore Database</strong> and click <strong>Create database</strong>.</li>
                      <li>Choose your region and start in test/production mode.</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold text-[var(--ink)] text-xs font-mono uppercase tracking-wider">Step 3: Add Environment Variables</p>
                    <div className="bg-[var(--bg)] p-3.5 rounded-xl font-mono text-[11px] space-y-1 text-[var(--ink-soft)] overflow-x-auto border border-[var(--line)]">
                      <div>VITE_FIREBASE_API_KEY = "your_api_key_here"</div>
                      <div>VITE_FIREBASE_PROJECT_ID = "your_project_id"</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content Panel */}
          <div className="space-y-6 pb-24">
            
            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div>
                {projects.length === 0 ? (
                  <div className="min-h-[58vh] flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-[var(--ink)] mb-2">
                      What have you been working on?
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-md mb-6">
                      Add and showcase your latest case studies, products, and design engineering projects.
                    </p>
                    <button
                      onClick={() => setIsCreateProjectModalOpen(true)}
                      className="px-6 py-3 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Create your first Project</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">Manage Projects</h2>
                        <p className="text-xs text-[var(--ink-soft)] font-sans">Create, edit, and organize portfolio showcase items.</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                        <Link
                          to="/admin/arrange-featured-projects"
                          className="px-4 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--card)] hover:bg-[var(--line)]/50 text-[var(--ink)] border border-[var(--line)] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Open Arrange Featured Projects page"
                        >
                          <ArrowUpDown size={14} />
                          <span>Arrange Featured</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setIsCreateProjectModalOpen(true)}
                          className="px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Plus size={14} />
                          <span>Create Project</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      {sortProjectsByLatest(projects)
                        .map((project) => {
                        const thumbUrl = Array.isArray(project.thumbnail) ? project.thumbnail[0] : project.thumbnail;
                        const isFeatured = Boolean((project as any).isFeaturedOnHome || project.heroSection);
                        const isGridItem = Boolean((project as any).showInHomeGrid || project.homeItem);
                        const isLatest = Boolean(project.isNew);
                        const isLiveProject = Boolean(project.isLive === true || (project.isLive as any) === "Yes" || (project.isLive as any) === "true");

                        return (
                          <div 
                            key={project.id}
                            className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xs hover:border-neutral-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Thumbnail preview with Upload Icon */}
                              <div
                                onClick={() => projectCardFileInputRefs.current[project.id]?.click()}
                                className="relative w-20 h-14 rounded-xl bg-[var(--bg)] border border-dashed border-[var(--line)] hover:border-[var(--blue)] overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group transition-all"
                                title="Click to upload or replace project image"
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={(el) => {
                                    projectCardFileInputRefs.current[project.id] = el;
                                  }}
                                  className="hidden"
                                  onChange={(e) => handleDirectThumbnailUpload(project.id, e)}
                                />

                                {uploadingProjectThumb[project.id] ? (
                                  <Loader2 size={18} className="animate-spin text-[var(--blue)]" />
                                ) : thumbUrl ? (
                                  <>
                                    <img
                                      src={thumbUrl}
                                      alt={project.title}
                                      className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Upload size={16} className="text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-[var(--ink-soft)] group-hover:text-[var(--blue)] transition-colors">
                                    <Upload size={18} />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div 
                                className="min-w-0 flex-1 cursor-pointer"
                                onClick={() => openEditProject(project)}
                                title="Click to edit project details"
                              >
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h3 className="font-sans font-semibold text-base text-[var(--ink)] hover:text-[var(--blue)] transition-colors truncate">{project.title}</h3>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  <span className="font-mono text-[11px] text-[var(--blue)] tracking-wider uppercase font-semibold">
                                    {project.category || "Uncategorized"}
                                  </span>
                                  {project.productType && (
                                    <>
                                      <span className="text-[var(--ink-soft)]/40">•</span>
                                      <span className="font-mono text-[11px] text-[var(--ink-soft)] uppercase">
                                        {project.productType}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Badges & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isGridItem && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                    Home
                                  </span>
                                )}
                                {isFeatured && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                                    Featured
                                  </span>
                                )}
                                {isLatest && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                    Latest
                                  </span>
                                )}
                                {isLiveProject && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                    Live
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditProject(project)}
                                  className="p-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all cursor-pointer"
                                  title="Edit project"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteProject(project.id, project.title)}
                                  className="p-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                                  title="Delete project"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Blogs & Notes Management Section */}
          {activeTab === "blogs" && (
            <div className="space-y-6">
              {/* Top Sub-Tab Switcher (Blogs vs Notes) */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-[var(--line)]">
                <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-zinc-800/60 rounded-xl flex-wrap">
                  <button
                    type="button"
                    onClick={() => setBlogsSubTab("blogs")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      blogsSubTab === "blogs"
                        ? "bg-[var(--bg)] text-[var(--ink)] shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Articles &amp; Blogs ({blogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlogsSubTab("notes")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      blogsSubTab === "notes"
                        ? "bg-[var(--bg)] text-[var(--ink)] shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Field Notes ({fieldNotes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlogsSubTab("external")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      blogsSubTab === "external"
                        ? "bg-[var(--bg)] text-[var(--ink)] shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    External (Medium &amp; LinkedIn) ({externalArticles.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {blogsSubTab === "blogs" ? (
                    <button
                      type="button"
                      onClick={openNewBlog}
                      className="px-4.5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Create Blog</span>
                    </button>
                  ) : blogsSubTab === "notes" ? (
                    <button
                      type="button"
                      onClick={openNewNote}
                      className="px-4 py-2 rounded-full text-xs font-sans font-semibold border border-[var(--line)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Add Note</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentExternalArticle(null);
                        setShowExternalArticleModal(true);
                      }}
                      className="px-4.5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Plus size={14} />
                      <span>List External Article</span>
                    </button>
                  )}
                </div>
              </div>

              {blogsSubTab === "blogs" ? (
                <div>
                  {blogs.length === 0 ? (
                    <div className="min-h-[45vh] flex flex-col items-center justify-center text-center px-4 py-8">
                      <h2 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-[var(--ink)] mb-2">
                        What insights would you like to share?
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-md mb-6">
                        Publish articles, technical breakdowns, thoughts, and design stories.
                      </p>
                      <div className="flex items-center gap-3 justify-center flex-wrap">
                        <button
                          type="button"
                          onClick={openNewNote}
                          className="px-6 py-3 rounded-full text-xs font-sans font-semibold border border-[var(--line)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>Add a Note</span>
                        </button>
                        <button
                          type="button"
                          onClick={openNewBlog}
                          className="px-6 py-3 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>Create your first Blog</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">Manage Articles &amp; Blogs</h2>
                        <p className="text-xs text-[var(--ink-soft)] font-sans">Published articles, deep dives, and insight pieces.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5">
                        {blogs.map((blog) => (
                          <div 
                            key={blog.id}
                            className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xs hover:border-neutral-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              {blog.cover_photo && (
                                <img 
                                  src={blog.cover_photo} 
                                  alt="Cover" 
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 rounded-xl border border-[var(--line)] object-cover shrink-0 bg-[var(--bg)]"
                                />
                              )}
                              <div className="min-w-0">
                                <h3 className="font-sans font-semibold text-base text-[var(--ink)] leading-snug line-clamp-1">{blog.Title}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-[var(--ink-soft)] font-sans">{blog.date}</p>
                                  {blog.category && (
                                    <>
                                      <span className="text-[var(--ink-soft)]/40">•</span>
                                      <span className="text-xs font-sans text-[var(--blue)] font-medium">{blog.category}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {blog.badge.map(tag => (
                                    <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 dark:bg-zinc-800/80 text-[var(--ink-soft)] border border-[var(--line)]">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => openEditBlog(blog)}
                                className="p-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all cursor-pointer"
                                title="Edit blog post"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => deleteBlog(blog.id, blog.Title)}
                                className="p-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                                title="Delete blog post"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : blogsSubTab === "notes" ? (
                /* Field Notes Sub-View under Blogs tab */
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">Field Notes &amp; Thoughts</h2>
                    <p className="text-xs text-[var(--ink-soft)] font-sans">Quick thoughts, photographs, sketches, and design observations.</p>
                  </div>

                  {fieldNotes.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-[var(--line)] rounded-2xl bg-[var(--card)]/40 p-8 space-y-3">
                      <Compass size={32} className="mx-auto text-[var(--muted)] opacity-60" />
                      <h3 className="font-sans font-semibold text-base text-[var(--ink)]">No field notes yet</h3>
                      <p className="text-xs text-[var(--ink-soft)] font-sans">
                        Publish your first photograph, quick thought, or UI observation.
                      </p>
                      <button
                        type="button"
                        onClick={openNewNote}
                        className="px-5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Create Field Note</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {fieldNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xs hover:border-neutral-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {note.imageUrl ? (
                              <img
                                src={note.imageUrl}
                                alt="Note Visual"
                                className="w-14 h-14 rounded-xl border border-[var(--line)] object-cover shrink-0 bg-neutral-900"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center shrink-0 text-[var(--blue)] font-bold text-lg">
                                ”
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold bg-[var(--blue-tint)] text-[var(--blue)] border border-[var(--blue)]/20">
                                  {note.type}
                                </span>
                                <span className="text-xs text-[var(--ink-soft)] font-mono">{note.date}</span>
                                {note.location && (
                                  <span className="text-xs text-[var(--ink-soft)] font-mono flex items-center gap-1">
                                    • {note.location}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-sans font-semibold text-sm text-[var(--ink)] leading-snug line-clamp-1 mt-1">
                                {note.title || note.content}
                              </h3>
                              <p className="text-xs text-[var(--ink-soft)] font-sans line-clamp-1 mt-0.5">
                                {note.content}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => deleteFieldNoteItem(note.id, note.title || note.content)}
                              className="p-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* External Articles (Medium & LinkedIn) Sub-View under Blogs tab */
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">
                        External Articles (Medium &amp; LinkedIn)
                      </h2>
                      <p className="text-xs text-[var(--ink-soft)] font-sans">
                        Articles and think pieces published across Medium, LinkedIn, and external platforms that appear on your blog's right-hand sidebar.
                      </p>
                    </div>

                    <div className="flex items-center gap-2" />
                  </div>

                  {externalArticles.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-[var(--line)] rounded-2xl bg-[var(--card)]/40 p-8 space-y-3">
                      <ExternalLink size={32} className="mx-auto text-[var(--muted)] opacity-60" />
                      <h3 className="font-sans font-semibold text-base text-[var(--ink)]">No external articles listed yet</h3>
                      <p className="text-xs text-[var(--ink-soft)] font-sans max-w-sm mx-auto">
                        Add links to your Medium stories, LinkedIn pulse articles, or guest essays to display in your blog sidebar.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentExternalArticle(null);
                          setShowExternalArticleModal(true);
                        }}
                        className="px-5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus size={14} />
                        <span>List Your First Article</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {externalArticles.map((art) => (
                        <div
                          key={art.id}
                          className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xs hover:border-neutral-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  art.platform === "Medium"
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "bg-[#0A66C2] text-white"
                                }`}
                              >
                                {art.platform}
                              </span>
                              <span className="text-[var(--muted)]">•</span>
                              <span className="text-[var(--muted)]">{art.publishedDate}</span>
                              <span className="text-[var(--muted)]">•</span>
                              <span className="text-[var(--muted)]">{art.readTime}</span>
                            </div>

                            <h3 className="font-sans font-semibold text-base text-[var(--ink)] leading-snug line-clamp-1">
                              {art.title}
                            </h3>

                            {art.excerpt && (
                              <p className="text-xs text-[var(--ink-soft)] font-sans line-clamp-1">
                                {art.excerpt}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentExternalArticle(art);
                                setShowExternalArticleModal(true);
                              }}
                              className="p-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--line)]/50 text-[var(--ink)] transition-all cursor-pointer"
                              title="Edit article"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete "${art.title}" from external articles?`)) {
                                  const updated = externalArticles.filter((x) => x.id !== art.id);
                                  saveExternalArticles(updated);
                                  setExternalArticles(updated);
                                  showToast(`Removed "${art.title}"`);
                                }
                              }}
                              className="p-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                              title="Delete article"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Field Notes Management Section */}
          {activeTab === "field-notes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">Manage Field Notes</h2>
                  <p className="text-xs text-[var(--ink-soft)] font-sans">Curate thoughts, observations, photographs, and design discoveries.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/field-notes"
                    target="_blank"
                    className="px-4 py-2.5 rounded-full text-xs font-sans font-medium border border-[var(--line)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink size={13} />
                    <span>View Live</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowCreateNoteModal(true)}
                    className="px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Add Note</span>
                  </button>
                </div>
              </div>

              {fieldNotes.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[var(--line)] rounded-2xl bg-[var(--card)]/40 p-8 space-y-3">
                  <Compass size={32} className="mx-auto text-[var(--muted)] opacity-60" />
                  <h3 className="font-sans font-semibold text-base text-[var(--ink)]">No field notes yet</h3>
                  <p className="text-xs text-[var(--ink-soft)] font-sans">
                    Publish your first photograph, quick thought, or UI observation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateNoteModal(true)}
                    className="px-5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Field Note</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {fieldNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xs hover:border-neutral-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {note.imageUrl ? (
                          <img
                            src={note.imageUrl}
                            alt="Note Visual"
                            className="w-14 h-14 rounded-xl border border-[var(--line)] object-cover shrink-0 bg-neutral-900"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center shrink-0 text-[var(--blue)] font-bold text-lg">
                            ”
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold bg-[var(--blue-tint)] text-[var(--blue)] border border-[var(--blue)]/20">
                              {note.type}
                            </span>
                            <span className="text-xs text-[var(--ink-soft)] font-mono">{note.date}</span>
                            {note.location && (
                              <span className="text-xs text-[var(--ink-soft)] font-mono flex items-center gap-1">
                                • {note.location}
                              </span>
                            )}
                          </div>
                          <h3 className="font-sans font-semibold text-sm text-[var(--ink)] leading-snug line-clamp-1 mt-1">
                            {note.title || note.content}
                          </h3>
                          <p className="text-xs text-[var(--ink-soft)] font-sans line-clamp-1 mt-0.5">
                            {note.content}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => deleteFieldNoteItem(note.id, note.title || note.content)}
                          className="p-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Testimonials Management Section */}
          {activeTab === "testimonials" && (
            <div className="space-y-6">
              {/* Public Testimonial Submission Link Share Card */}
              <div className="bg-[var(--card)] p-5 sm:p-6 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-sans font-semibold text-[var(--ink)]">Public Testimonial Submission Link</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    id="add-testimonial-button"
                    onClick={openNewTestimonial}
                    className="px-4 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Add a new testimonial directly"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>Add Testimonial</span>
                  </button>

                  <a
                    href={testimonialService.getWhatsAppShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] dark:text-[#25D366] text-xs font-sans font-semibold border border-[#25D366]/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Send testimonial request via WhatsApp"
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyPublicTestimonialLink}
                    className="px-4 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    title="Copy public link to clipboard"
                  >
                    {copiedAdminTestimonialLink ? (
                      <>
                        <Check size={14} className="text-white" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Public Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href="/submit-testimonial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Open public submission form in new tab"
                  >
                    <span>Open Form</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {testimonials.length === 0 ? (
                <div className="min-h-[45vh] flex flex-col items-center justify-center text-center px-4 bg-[var(--card)] rounded-2xl border border-[var(--line)] p-8">
                  <h2 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight text-[var(--ink)] mb-2">
                    What are people saying about your work?
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-md mb-6">
                    Add recommendations, client endorsements, and feedback from peers, or share your public link.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openNewTestimonial}
                      className="px-6 py-3 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Create Testimonial Manually</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">Manage Testimonials</h2>
                      <p className="text-xs text-[var(--ink-soft)] font-sans">Manage quotes and recommendations ({testimonials.length} total).</p>
                    </div>
                    <button
                      onClick={openNewTestimonial}
                      className="px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] text-white hover:bg-[var(--blue-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Create Testimonial</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testimonials.map((testimonial) => (
                      <div 
                        key={testimonial.id}
                        className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-xs hover:border-neutral-300 dark:hover:border-zinc-700 flex flex-col justify-between transition-all h-full gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3.5">
                            {testimonial.ImgUrl ? (
                              <img 
                                src={testimonial.ImgUrl} 
                                alt={testimonial.name}
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 rounded-full object-cover border border-[var(--line)] bg-[var(--bg)] shrink-0" 
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-[var(--line)] flex items-center justify-center font-bold text-xs text-[var(--ink)] shrink-0">
                                {testimonial.name ? testimonial.name.slice(0, 2).toUpperCase() : "TS"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-sans font-semibold text-base text-[var(--ink)] truncate">{testimonial.name}</h3>
                              <p className="text-xs text-[var(--ink-soft)] font-sans truncate">
                                {testimonial.position} {testimonial.company ? `• ${testimonial.company}` : ""}
                              </p>
                            </div>
                          </div>

                          {testimonial.quote && (
                            <p className="text-xs text-[var(--ink-soft)] italic line-clamp-3 leading-relaxed border-l-2 border-[var(--blue)]/40 pl-3">
                              "{testimonial.quote}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end border-t border-[var(--line)] pt-3.5 mt-auto">
                          <div className="flex items-center gap-2">
                            {testimonial.linkedInUrl && (
                              <a
                                href={testimonial.linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group w-[34px] h-[34px] bg-white dark:bg-white rounded-full flex items-center justify-center shrink-0 border border-[var(--line)] transition-colors"
                                title={`${testimonial.name}'s LinkedIn Profile`}
                              >
                                <img
                                  src={utils_icons?.linkedIn || "/assets/icons/linkedIn_icon.svg"}
                                  alt="LinkedIn"
                                  className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </a>
                            )}
                            <button
                              onClick={() => openEditTestimonial(testimonial)}
                              className="p-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all cursor-pointer"
                              title="Edit testimonial"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => deleteTestimonial(testimonial.id, testimonial.name)}
                              className="p-2.5 rounded-full border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                              title="Delete testimonial"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mentorship Booked Sessions Section */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              {/* Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
                <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs">
                  <span className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                    Total Sessions
                  </span>
                  <div className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ink)]">
                    {bookedSessions.length}
                  </div>
                </div>

                <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs">
                  <span className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                    Waiting
                  </span>
                  <div className="text-2xl sm:text-3xl font-sans font-bold text-amber-600 dark:text-amber-400">
                    {bookedSessions.filter((s) => s.status === "waiting" || !s.status).length}
                  </div>
                </div>

                <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs">
                  <span className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                    Confirmed
                  </span>
                  <div className="text-2xl sm:text-3xl font-sans font-bold text-emerald-600 dark:text-emerald-400">
                    {bookedSessions.filter((s) => s.status === "confirmed").length}
                  </div>
                </div>

                <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs">
                  <span className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                    Completed
                  </span>
                  <div className="text-2xl sm:text-3xl font-sans font-bold text-neutral-800 dark:text-neutral-200">
                    {bookedSessions.filter((s) => s.status === "completed").length}
                  </div>
                </div>

                <div className="bg-[var(--card)] p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs">
                  <span className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider block mb-1">
                    Total Hours
                  </span>
                  <div className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ink)]">
                    {(
                      bookedSessions.reduce((acc, s) => acc + (s.duration === "60 minutes" ? 1 : 0.5), 0)
                    ).toFixed(1)} hrs
                  </div>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="bg-[var(--card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
                  <input
                    type="text"
                    placeholder="Search by mentee, topic, or email..."
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs sm:text-sm font-sans text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                  />
                  {sessionSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSessionSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {(["all", "waiting", "confirmed", "completed", "cancelled"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSessionStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium capitalize transition-all cursor-pointer ${
                        sessionStatusFilter === status
                          ? "bg-[var(--blue)] text-white font-semibold shadow-xs"
                          : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleRefreshSessions}
                    disabled={isRefreshingSessions}
                    className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-1"
                    title="Refresh and sync sessions from Firebase session_bookings collection"
                  >
                    <RefreshCw size={13} className={isRefreshingSessions ? "animate-spin text-neutral-700" : ""} />
                    <span>{isRefreshingSessions ? "Syncing..." : "Sync Firebase"}</span>
                  </button>
                </div>
              </div>

              {/* Session Cards List */}
              {bookedSessions.length === 0 ? (
                <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-10 sm:p-14 text-center shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-neutral-800 text-[var(--blue)] mx-auto flex items-center justify-center mb-4">
                    <CalendarCheck size={28} />
                  </div>
                  <h3 className="text-base sm:text-lg font-sans font-semibold text-[var(--ink)] mb-1">
                    No booked sessions yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-sm mx-auto mb-5 leading-relaxed">
                    When visitors book a 1:1 session with you from your mentorship modal, their session details, goals, and contact information will appear here.
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyBookingPageUrl}
                      className="px-5 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                    >
                      {copiedBookingPageUrl ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedBookingPageUrl ? "Copied Link!" : "Copy Booking Link"}</span>
                    </button>
                    <a
                      href="/session-booking"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--ink)] text-xs sm:text-sm font-sans font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink size={14} />
                      <span>Open Booking Page</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookedSessions
                    .filter((s) => {
                      if (sessionStatusFilter !== "all" && s.status !== sessionStatusFilter) return false;
                      if (!sessionSearchQuery.trim()) return true;
                      const q = sessionSearchQuery.toLowerCase();
                      const name = (s.name || s.fullName || "").toLowerCase();
                      const email = (s.email || s.emailAddress || "").toLowerCase();
                      const topic = (s.sessionName || s.sessionType || s.chooseTopic || s.topic || "").toLowerCase();
                      const role = (s.role || s.currentRole || "").toLowerCase();
                      const notes = (s.message || s.helpWith || "").toLowerCase();
                      return (
                        name.includes(q) ||
                        email.includes(q) ||
                        topic.includes(q) ||
                        role.includes(q) ||
                        notes.includes(q)
                      );
                    })
                    .map((session) => (
                      <AdminSessionBookingCard
                        key={session.id}
                        session={session}
                        onUpdateStatus={handleUpdateSessionStatus}
                        onDelete={handleDeleteSession}
                        onCopyInfo={handleCopySessionInfo}
                        isCopied={copiedSessionId === session.id}
                        googleCalendarUrl={getSessionGoogleCalendarUrl(session)}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Configure Session URL Tab */}
          {activeTab === "session-config" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-[var(--card)] p-6 sm:p-7 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[var(--blue)]">
                      <Globe size={20} />
                    </span>
                    <h2 className="text-xl sm:text-2xl font-sans font-semibold text-[var(--ink)] tracking-tight">
                      Session Booking URL
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] font-sans max-w-xl leading-relaxed">
                    Paste your external booking website URL below. When visitors click any "Book a session" button across your portfolio, they will be redirected to this link.
                  </p>
                </div>

                {sessionBookingConfig.bookingUrl && (
                  <a
                    href={sessionBookingConfig.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--ink)] text-xs font-sans font-semibold transition-all flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
                    title="Open active booking link in new tab"
                  >
                    <ExternalLink size={14} className="text-neutral-800 dark:text-neutral-200" />
                    <span>Test Active Link</span>
                  </a>
                )}
              </div>

              {/* URL Configuration Card */}
              <div className="bg-[var(--card)] p-6 sm:p-7 rounded-2xl border border-[var(--line)] shadow-xs">
                <form onSubmit={handleSaveBookingUrl} className="space-y-6">
                  {/* 1. External Booking URL */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--ink-soft)] uppercase tracking-wider mb-2">
                      Booking Website URL
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                          <Globe size={18} />
                        </div>
                        <input
                          type="url"
                          value={bookingUrlInput}
                          onChange={(e) => setBookingUrlInput(e.target.value)}
                          placeholder="Paste your booking link here (e.g. https://adplist.org/mentors/avinash-ts)"
                          className="w-full pl-11 pr-10 py-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs sm:text-sm font-mono text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:border-[var(--blue)] transition-colors"
                          required
                        />
                        {bookingUrlInput && (
                          <button
                            type="button"
                            onClick={() => setBookingUrlInput("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Clear input"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Google Meet Video Call Link */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-mono font-medium text-[var(--ink-soft)] uppercase tracking-wider">
                        Google Meet Video Call Link
                      </label>
                      <span className="text-[11px] text-[var(--ink-soft)] font-sans">
                        Included in confirmation emails (default: instant meet room)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                          <Video size={18} />
                        </div>
                        <input
                          type="url"
                          value={meetUrlInput}
                          onChange={(e) => setMeetUrlInput(e.target.value)}
                          placeholder="https://meet.google.com/new or your permanent Google Meet room"
                          className="w-full pl-11 pr-10 py-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs sm:text-sm font-mono text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:border-[var(--blue)] transition-colors"
                          required
                        />
                        {meetUrlInput && (
                          <button
                            type="button"
                            onClick={() => setMeetUrlInput("https://meet.google.com/new")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400 hover:text-[var(--blue)] transition-colors cursor-pointer"
                            title="Reset to default instant meet link"
                          >
                            Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. WhatsApp Community Link */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-mono font-medium text-[var(--ink-soft)] uppercase tracking-wider">
                        WhatsApp Design Community Link
                      </label>
                      <span className="text-[11px] text-[var(--ink-soft)] font-sans">
                        Highlighted in confirmation emails &amp; mentorship communications
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                          <MessageCircle size={18} />
                        </div>
                        <input
                          type="url"
                          value={communityUrlInput}
                          onChange={(e) => setCommunityUrlInput(e.target.value)}
                          placeholder="https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v"
                          className="w-full pl-11 pr-10 py-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs sm:text-sm font-mono text-[var(--ink)] placeholder:text-neutral-400 focus:outline-none focus:border-[var(--blue)] transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex items-center justify-between gap-4 flex-wrap border-t border-[var(--line)]">
                    <p className="text-xs text-[var(--ink-soft)] font-sans">
                      Changes take effect immediately for all upcoming confirmations.
                    </p>
                    <button
                      type="submit"
                      disabled={isSavingBookingUrl}
                      className="px-6 py-3 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {isSavingBookingUrl ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : hasSavedBookingUrl ? (
                        <>
                          <Check size={14} />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Profile Picture (DP) Management Section - Stored in Firebase profile_pictures collection */}
              <div className="bg-[var(--card)] p-6 sm:p-8 rounded-2xl border border-[var(--line)] shadow-xs space-y-6" id="admin-profile-picture-section">
                <div className="pb-4 border-b border-[var(--line)]">
                  <h3 className="text-lg font-sans font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                    <User size={20} className="text-[var(--blue)]" />
                    <span>Profile Picture</span>
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[var(--bg)] border-2 border-[var(--line)] relative flex items-center justify-center">
                      {profilePicture?.imageUrl ? (
                        <>
                          <img
                            src={getOptimizedImageUrl(profilePicture.imageUrl, 400)}
                            alt="Profile Avatar"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => profilePicInputRef.current?.click()}
                              disabled={isUploadingProfilePic}
                              className="p-2 rounded-full bg-white text-neutral-900 hover:bg-neutral-100 transition-colors shadow cursor-pointer"
                              title="Replace Profile Picture"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleProfilePicDelete}
                              disabled={isUploadingProfilePic}
                              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow cursor-pointer"
                              title="Delete Profile Picture"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-[var(--ink-soft)]">
                          <User size={36} className="opacity-40 mb-1" />
                          <span className="text-[10px] font-sans font-medium">No DP Set</span>
                        </div>
                      )}

                      {/* Uploading Spinner */}
                      {isUploadingProfilePic && (
                        <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-2 text-white animate-in fade-in duration-150">
                          <Loader2 size={20} className="animate-spin text-white" />
                          <span className="text-[10px] font-sans font-medium text-white">Saving DP...</span>
                        </div>
                      )}
                    </div>

                    {/* Active Status Ring Badge */}
                    {profilePicture?.imageUrl && (
                      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[var(--card)] flex items-center justify-center text-white shadow-sm" title="Active Display Photo">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Actions & Description */}
                  <div className="flex-1 space-y-4 text-center sm:text-left min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 className="text-sm font-sans font-semibold text-[var(--ink)]">
                          {profilePicture?.imageUrl ? "Display Picture Active" : "No Profile Picture Uploaded"}
                        </h4>
                        {profilePicture?.updatedAt && (
                          <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                            Updated {new Date(profilePicture.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] font-sans leading-relaxed max-w-xl">
                       Upload a clear, high-quality headshot or avatar image. This will be displayed as your profile picture across your profile.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                      <input
                        type="file"
                        ref={profilePicInputRef}
                        accept="image/*"
                        onChange={handleProfilePicFileSelect}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => profilePicInputRef.current?.click()}
                        disabled={isUploadingProfilePic}
                        className="px-5 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        {isUploadingProfilePic ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : profilePicture?.imageUrl ? (
                          <>
                            <RefreshCw size={14} />
                            <span>Update Picture</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Upload Profile Picture</span>
                          </>
                        )}
                      </button>

                      {profilePicture?.imageUrl && (
                        <button
                          type="button"
                          onClick={handleProfilePicDelete}
                          disabled={isUploadingProfilePic}
                          className="px-5 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-2xs active:scale-95 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          <span>Remove Picture</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Section - Cloudinary 'resume' collection & Primary Selector */}
              <div
                className="bg-[var(--card)] p-6 sm:p-8 rounded-2xl border border-[var(--line)] shadow-xs space-y-6 transition-all hover:border-[var(--blue)]/40"
                id="admin-resume-section"
              >
                <div className="pb-4 border-b border-[var(--line)] flex items-center justify-between gap-4">
                  <h3 className="text-lg font-sans font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                    <FileText size={20} className="text-[var(--blue)]" />
                    <span>Manage Resume</span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => setIsResumeModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0 active:scale-95"
                    id="admin-open-resume-modal-btn"
                  >
                    <span>Manage Resumes</span>
                  </button>
                </div>

                {/* Primary Resume Preview Card (Clicking opens window) */}
                <div
                  onClick={() => setIsResumeModalOpen(true)}
                  className="p-5 rounded-2xl bg-[var(--bg)]/50 border border-[var(--line)] hover:border-[var(--blue)]/50 transition-all cursor-pointer flex items-center justify-between gap-5 group"
                  title="Click to open Resume Manager window"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center shrink-0 border border-[var(--blue)]/20 shadow-xs group-hover:scale-105 transition-transform">
                      <FileText size={24} />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h4 className="text-base font-sans font-semibold text-[var(--ink)] truncate max-w-md">
                        {primaryResume.name}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] font-mono">
                        <span>Updated {new Date(primaryResume.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* A Bit More About Me Cards (4 Cards Showcase) - Stored in Firebase about_more_items & Cloudinary */}
              <div className="bg-[var(--card)] p-6 sm:p-8 rounded-2xl border border-[var(--line)] shadow-xs space-y-6" id="admin-about-more-photos-section">
                <div className="pb-4 border-b border-[var(--line)]">
                  <h3 className="text-lg font-sans font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                    <Sparkles size={20} className="text-[var(--blue)]" />
                    <span>A Bit More About Me Photos (4 Cards)</span>
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] font-sans mt-1">
                    Upload, replace, and remove photos for each of the 4 highlight cards in the &quot;A bit more about me&quot; section on the About page.
                  </p>
                </div>

                {/* 4 Cards Photo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aboutMoreItems.map((item, index) => {
                    const isUploading = isUploadingAboutMoreImg[item.id];
                    const cardIcons = [
                      <Code2 size={16} key="code" className="text-blue-400" />,
                      <Megaphone size={16} key="talk" className="text-amber-400" />,
                      <Heart size={16} key="heart" className="text-rose-400" />,
                      <Calendar size={16} key="cal" className="text-emerald-400" />,
                    ];

                    return (
                      <div
                        key={item.id}
                        className="bg-[var(--bg)] p-5 rounded-2xl border border-[var(--line)] space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-center gap-2.5">
                            <span className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--line)] flex items-center justify-center">
                              {cardIcons[index % cardIcons.length]}
                            </span>
                            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--ink)] block">
                              Card {index + 1}: {item.title}
                            </span>
                          </div>

                          {/* Image Preview Box */}
                          <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--line)] relative group flex items-center justify-center">
                            {item.imageUrl ? (
                              <>
                                <img
                                  src={getOptimizedImageUrl(item.imageUrl, 600)}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                  <button
                                    type="button"
                                    onClick={() => aboutMoreFileInputRefs.current[item.id]?.click()}
                                    disabled={isUploading}
                                    className="px-3.5 py-1.5 rounded-full bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-sans font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                                    title="Upload / Replace Photo"
                                  >
                                    <RefreshCw size={13} />
                                    <span>Replace</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAboutMorePhoto(item.id)}
                                    disabled={isUploading}
                                    className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs transition-colors cursor-pointer shadow"
                                    title="Delete Photo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResetAboutMorePhoto(item.id)}
                                    disabled={isUploading}
                                    className="p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 text-white text-xs transition-colors cursor-pointer shadow"
                                    title="Reset Photo to Default"
                                  >
                                    <RotateCcw size={13} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => aboutMoreFileInputRefs.current[item.id]?.click()}
                                disabled={isUploading}
                                className="w-full h-full p-4 text-center space-y-2 text-[var(--ink-soft)] hover:text-[var(--blue)] transition-colors flex flex-col items-center justify-center cursor-pointer"
                              >
                                <ImageIcon size={28} className="mx-auto opacity-50" />
                                <p className="text-xs font-sans font-medium">Click to upload photo</p>
                              </button>
                            )}

                            {/* Upload Spinner */}
                            {isUploading && (
                              <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-3 text-white animate-in fade-in duration-150">
                                <Loader2 size={20} className="animate-spin text-white" />
                                <span className="text-[11px] font-sans font-medium">Uploading Photo...</span>
                              </div>
                            )}
                          </div>

                          {/* Hidden Upload File Trigger */}
                          <input
                            type="file"
                            ref={(el) => (aboutMoreFileInputRefs.current[item.id] = el)}
                            accept="image/*"
                            onChange={(e) => handleAboutMorePhotoUpload(e, item.id)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mentorship Card Photos - Stored in Firebase mentorship_photos & Cloudinary profile_images */}
              <div className="bg-[var(--card)] p-6 sm:p-8 rounded-2xl border border-[var(--line)] shadow-xs space-y-6" id="admin-mentorship-photos-section">
                <div className="pb-4 border-b border-[var(--line)]">
                  <h3 className="text-lg font-sans font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                    <Users size={20} className="text-[var(--blue)]" />
                    <span>Mentorship Cards</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {mentorshipPhotos.map((photo, slotIndex) => {
                    const inputRef = mentorshipPhotoInputRefs[slotIndex];
                    const isUploading = isUploadingMentorshipPhoto[slotIndex];
                    const slotTitles = ["Photo 1 (Left / Back)", "Photo 2 (Right / Front)"];

                    return (
                      <div
                        key={photo.id || `mentorship-slot-${slotIndex}`}
                        className="bg-[var(--bg)] p-5 rounded-xl border border-[var(--line)] space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--ink)]">
                              {slotTitles[slotIndex]}
                            </span>
                          </div>

                          {/* Image Preview Box */}
                          <div className="aspect-square w-full rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--line)] relative group flex items-center justify-center">
                            {photo.imageUrl ? (
                              <>
                                <img
                                  src={getOptimizedImageUrl(photo.imageUrl, 400)}
                                  alt={photo.altText || slotTitles[slotIndex]}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                {/* Hover Actions: Replace / Reset */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => inputRef?.current?.click()}
                                    disabled={isUploading}
                                    className="px-3 py-1.5 rounded-full bg-white/90 text-neutral-900 hover:bg-white text-xs font-sans font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                    title="Replace photo"
                                  >
                                    <Edit size={13} />
                                    <span>Replace</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMentorshipPhoto(slotIndex)}
                                    disabled={isUploading}
                                    className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-md"
                                    title="Reset to default photo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => inputRef?.current?.click()}
                                disabled={isUploading}
                                className="w-full h-full p-4 text-center space-y-2 text-[var(--ink-soft)] hover:text-[var(--blue)] transition-colors flex flex-col items-center justify-center cursor-pointer"
                              >
                                <ImageIcon size={28} className="mx-auto opacity-50" />
                                <p className="text-xs font-sans font-medium">Click to upload photo</p>
                              </button>
                            )}

                            {/* Uploading Spinner */}
                            {isUploading && (
                              <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-3 text-white animate-in fade-in duration-150">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                  <Loader2 size={18} className="animate-spin text-white" />
                                </div>
                                <span className="text-[11px] font-sans font-medium text-white">Uploading...</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hidden File Input */}
                        <input
                          type="file"
                          ref={inputRef}
                          accept="image/*"
                          onChange={(e) => handleMentorshipPhotoUpload(e, slotIndex)}
                          className="hidden"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Outside of Work Box */}
              <div className="bg-[var(--card)] p-6 sm:p-8 rounded-2xl border border-[var(--line)] shadow-xs space-y-6" id="admin-outside-work-photos-section">
                <div className="pb-4 border-b border-[var(--line)]">
                  <h3 className="text-lg font-sans font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                    <Compass size={20} className="text-[var(--blue)]" />
                    <span>Outside of Work </span>
                  </h3>
                </div>

                {/* 3 Polaroid Photo Upload Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Photo 1 (Left Polaroid) */}
                  <div className="bg-[var(--bg)] p-5 rounded-xl border border-[var(--line)] space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--ink)]">
                          Photo 1 (Left)
                        </span>
                      </div>
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--line)] relative group flex items-center justify-center">
                        {outsideWorkSettings.MyImage01 ? (
                          <>
                            <img 
                              src={getOptimizedImageUrl(outsideWorkSettings.MyImage01, 400)} 
                              alt="Outside work photo 1" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSettingsPhoto("MyImage01")}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-md"
                              title="Remove photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <div className="p-4 text-center space-y-2 text-[var(--ink-soft)]">
                            <ImageIcon size={28} className="mx-auto opacity-50" />
                            <p className="text-xs font-sans">No photo uploaded</p>
                          </div>
                        )}

                        {/* Spinner loader on top of image */}
                        {isUploadingSettingsImg["MyImage01"] && (
                          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-3 text-white animate-in fade-in duration-150">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                              <Loader2 size={18} className="animate-spin text-white" />
                            </div>
                            <span className="text-[11px] font-sans font-medium text-white">Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="file"
                        ref={settingsImg01InputRef}
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, "MyImage01")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => settingsImg01InputRef.current?.click()}
                        disabled={isUploadingSettingsImg["MyImage01"]}
                        className="w-full py-2.5 px-5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        {isUploadingSettingsImg["MyImage01"] ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>{outsideWorkSettings.MyImage01 ? "Change Photo 1" : "Upload Photo 1"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Photo 2 (Center Polaroid) */}
                  <div className="bg-[var(--bg)] p-5 rounded-xl border border-[var(--line)] space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--ink)]">
                          Photo 2 (Center)
                        </span>
                      </div>
                      <div className="aspect-[4/4.2] w-full rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--line)] relative group flex items-center justify-center">
                        {outsideWorkSettings.MyImage02 ? (
                          <>
                            <img 
                              src={getOptimizedImageUrl(outsideWorkSettings.MyImage02, 400)} 
                              alt="Outside work photo 2" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSettingsPhoto("MyImage02")}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-md"
                              title="Remove photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <div className="p-4 text-center space-y-2 text-[var(--ink-soft)]">
                            <ImageIcon size={28} className="mx-auto opacity-50" />
                            <p className="text-xs font-sans">No photo uploaded</p>
                          </div>
                        )}

                        {/* Spinner loader on top of image */}
                        {isUploadingSettingsImg["MyImage02"] && (
                          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-3 text-white animate-in fade-in duration-150">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                              <Loader2 size={18} className="animate-spin text-white" />
                            </div>
                            <span className="text-[11px] font-sans font-medium text-white">Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="file"
                        ref={settingsImg02InputRef}
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, "MyImage02")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => settingsImg02InputRef.current?.click()}
                        disabled={isUploadingSettingsImg["MyImage02"]}
                        className="w-full py-2.5 px-5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        {isUploadingSettingsImg["MyImage02"] ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>{outsideWorkSettings.MyImage02 ? "Change Photo 2" : "Upload Photo 2"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Photo 3 (Right Polaroid) */}
                  <div className="bg-[var(--bg)] p-5 rounded-xl border border-[var(--line)] space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--ink)]">
                          Photo 3 (Right)
                        </span>
                      </div>
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--line)] relative group flex items-center justify-center">
                        {outsideWorkSettings.MyImage03 ? (
                          <>
                            <img 
                              src={getOptimizedImageUrl(outsideWorkSettings.MyImage03, 400)} 
                              alt="Outside work photo 3" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSettingsPhoto("MyImage03")}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-md"
                              title="Remove photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <div className="p-4 text-center space-y-2 text-[var(--ink-soft)]">
                            <ImageIcon size={28} className="mx-auto opacity-50" />
                            <p className="text-xs font-sans">No photo uploaded</p>
                          </div>
                        )}

                        {/* Spinner loader on top of image */}
                        {isUploadingSettingsImg["MyImage03"] && (
                          <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-3 text-white animate-in fade-in duration-150">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                              <Loader2 size={18} className="animate-spin text-white" />
                            </div>
                            <span className="text-[11px] font-sans font-medium text-white">Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="file"
                        ref={settingsImg03InputRef}
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, "MyImage03")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => settingsImg03InputRef.current?.click()}
                        disabled={isUploadingSettingsImg["MyImage03"]}
                        className="w-full py-2.5 px-5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        {isUploadingSettingsImg["MyImage03"] ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>{outsideWorkSettings.MyImage03 ? "Change Photo 3" : "Upload Photo 3"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Section: 5 Photo Polaroid Stack */}
              <div className="bg-[var(--card)] p-6 sm:p-8 rounded-2xl border border-[var(--line)] shadow-xs space-y-6" id="admin-about-photos-section">
                <div className="border-b border-[var(--line)] pb-4">
                  <h3 className="text-lg font-sans font-semibold tracking-tight text-[var(--ink)] flex items-center gap-2.5">
                    <Camera size={20} className="text-[var(--blue)]" />
                    <span>About Page Hero</span>
                  </h3>
                </div>

                {/* 5-Photo Upload Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                  {aboutPhotos.map((photo, slotIndex) => {
                    const inputRef = aboutPhotoInputRefs[slotIndex];
                    const isUploading = isUploadingAboutPhoto[slotIndex];

                    const slotLabels = [
                      "Top Left",
                      "Bottom Left",
                      "Center Hero",
                      "Bottom Right",
                      "Top Right",
                    ];

                    const defaultCaptions = [
                      "Mountain Trails",
                      "Kayaking & Rivers",
                      "Avinash • Portrait",
                      "Earthy Landscapes",
                      "Track & Speed",
                    ];

                    return (
                      <div
                        key={photo.id || `slot-${slotIndex}`}
                        className="space-y-3"
                      >
                        <div className="text-center">
                          <label className="text-xs font-sans font-medium text-[var(--ink)] block text-center">
                            {slotLabels[slotIndex]}
                          </label>
                        </div>

                        {/* Image Preview Box with Hover Options for Add, Replace, Delete */}
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[var(--bg)] border border-[var(--line)] relative group">
                          {photo.imageUrl ? (
                            <>
                              <img
                                src={getOptimizedImageUrl(photo.imageUrl, 400)}
                                alt={photo.caption || `About photo ${slotIndex + 1}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              {/* Hover Options: Replace / Delete */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => inputRef.current?.click()}
                                  disabled={isUploading}
                                  className="px-3 py-1.5 rounded-full bg-white/90 text-neutral-900 hover:bg-white text-xs font-sans font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Replace photo"
                                >
                                  <Edit size={14} />
                                  <span className="text-[11px]">Replace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAboutPhoto(photo.id, slotIndex)}
                                  className="p-2 rounded-full bg-red-600/90 text-white hover:bg-red-600 text-xs font-sans font-medium transition-colors cursor-pointer shadow-sm"
                                  title="Remove photo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div
                              onClick={() => !isUploading && inputRef.current?.click()}
                              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--line)]/50 transition-colors p-4 text-center group/empty"
                            >
                              <div className="p-3 rounded-full bg-[var(--card)] border border-[var(--line)] mb-2 group-hover/empty:scale-110 transition-transform">
                                <Upload size={16} className="text-[var(--ink-soft)]" />
                              </div>
                              <span className="text-xs font-sans font-medium text-[var(--ink-soft)]">
                                Click to upload
                              </span>
                            </div>
                          )}

                          {/* Spinner loader on top of image */}
                          {isUploading && (
                            <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-3 text-white animate-in fade-in duration-150">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                <Loader2 size={18} className="animate-spin text-white" />
                              </div>
                              <span className="text-[11px] font-sans font-medium text-white">Uploading...</span>
                            </div>
                          )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                          type="file"
                          ref={inputRef}
                          accept="image/*"
                          onChange={(e) => handleAboutPhotoUpload(e, slotIndex)}
                          className="hidden"
                          id={`about-photo-input-${slotIndex}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* About Section: Background Customizations Entry Button */}
              <div className="bg-[var(--card)] p-6 sm:p-7 rounded-2xl border border-[var(--line)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5" id="admin-about-background-section">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--blue)] font-semibold uppercase tracking-wider">Atmospheric Backgrounds</span>
                  </div>
                  <p className="text-xs text-[var(--ink-soft)] font-sans max-w-xl">
                    Configure multiple scenic landscape photos, ambient soundtracks, location metadata, and blur depths for the About page full-screen viewer.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to="/admin/backgrounds"
                    id="admin-btn-background-customizations"
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-2xs transition-all cursor-pointer active:scale-95 group"
                  >
                    <span>Background Customizations</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">Notifications & Alerts</h2>
                  <p className="text-xs text-[var(--ink-soft)] font-sans">Manage activity logs, message alerts, and notification preferences.</p>
                </div>

                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--card)] text-[var(--ink)] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCheck size={14} className="text-[var(--blue)]" />
                        <span>Mark all read</span>
                      </button>
                    )}
                    <button
                      onClick={clearAllNotifications}
                      className="px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold bg-[var(--bg)] border border-[var(--line)] hover:bg-red-500/10 hover:text-red-500 text-[var(--ink-soft)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Clear all</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                  <h3 className="font-sans font-semibold text-sm text-[var(--ink)] flex items-center gap-2">
                    <Bell size={16} className="text-[var(--blue)]" />
                    <span>Recent Activity Notifications</span>
                  </h3>
                  <span className="text-xs text-[var(--ink-soft)] font-mono">{notifications.length} total</span>
                </div>

                {notifications.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-soft)] mx-auto">
                      <BellOff size={22} />
                    </div>
                    <p className="text-sm font-sans font-semibold text-[var(--ink)]">No notifications available</p>
                    <p className="text-xs font-sans text-[var(--ink-soft)] max-w-sm mx-auto">You're all caught up! New alerts and system notifications will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                          !item.read
                            ? "bg-[var(--blue-tint)]/30 border-[var(--blue)]/30 shadow-2xs"
                            : "bg-[var(--bg)] border-[var(--line)]"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            item.type === "success" 
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                              : item.type === "warning"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-[var(--blue-tint)] text-[var(--blue)] border border-[var(--blue)]/20"
                          }`}>
                            {item.type === "success" ? <CheckCircle size={16} /> : item.type === "warning" ? <ShieldAlert size={16} /> : <Info size={16} />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-sans font-bold text-[var(--ink)]">{item.title}</h4>
                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs font-sans text-[var(--ink-soft)] leading-relaxed">{item.message}</p>
                            <span className="text-[11px] font-mono text-[var(--ink-soft)] flex items-center gap-1 pt-1">
                              <Clock size={12} />
                              {item.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!item.read && (
                            <button
                              onClick={() => {
                                const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
                                saveNotifications(updated);
                              }}
                              title="Mark as read"
                              className="p-1.5 rounded-lg text-[var(--ink-soft)] hover:text-[var(--blue)] hover:bg-[var(--line)] transition-all cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(item.id)}
                            title="Delete notification"
                            className="p-1.5 rounded-lg text-[var(--ink-soft)] hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Preferences Section */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xs space-y-6">
                <div>
                  <h3 className="font-sans font-semibold text-sm text-[var(--ink)] flex items-center gap-2">
                    <Mail size={16} className="text-[var(--blue)]" />
                    <span>Alert & Communication Settings</span>
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] font-sans mt-1">Configure automated notifications and instant system updates.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                    <div className="space-y-0.5">
                      <label className="text-xs font-sans font-bold text-[var(--ink)] block">Project Inquiries & Contact Emails</label>
                      <p className="text-[11px] font-sans text-[var(--ink-soft)]">Receive instant email notifications when visitors send messages from your portfolio.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailInquiries}
                      onChange={(e) => saveNotificationPrefs({ ...notificationPrefs, emailInquiries: e.target.checked })}
                      className="w-4 h-4 accent-[var(--blue)] rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                    <div className="space-y-0.5">
                      <label className="text-xs font-sans font-bold text-[var(--ink)] block">Security & Authentication Alerts</label>
                      <p className="text-[11px] font-sans text-[var(--ink-soft)]">Get notified on admin logins and credential changes.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.securityAlerts}
                      onChange={(e) => saveNotificationPrefs({ ...notificationPrefs, securityAlerts: e.target.checked })}
                      className="w-4 h-4 accent-[var(--blue)] rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                    <div className="space-y-0.5">
                      <label className="text-xs font-sans font-bold text-[var(--ink)] block">Portfolio Updates & Analytics</label>
                      <p className="text-[11px] font-sans text-[var(--ink-soft)]">Receive notifications when projects or testimonials are published or updated.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.projectUpdates}
                      onChange={(e) => saveNotificationPrefs({ ...notificationPrefs, projectUpdates: e.target.checked })}
                      className="w-4 h-4 accent-[var(--blue)] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearances Tab */}
          {activeTab === "customization" && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-end gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetCustomization}
                    className="px-3.5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--card)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    onClick={handleSaveCustomization}
                    className="px-5 py-2 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm transition-all cursor-pointer"
                  >
                    <span>Save Theme</span>
                  </button>
                </div>
              </div>

              {/* Primary Accent Color Presets & Custom Color Picker */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xs space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = customization.colorPreset === preset.id && customization.primaryColor === preset.hex;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id, preset.hex)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                          isSelected
                            ? "bg-[var(--blue-tint)]/40 border-[var(--blue)] ring-2 ring-[var(--blue)]/30"
                            : "bg-[var(--bg)] border-[var(--line)] hover:border-[var(--ink-soft)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-6 h-6 rounded-full border border-black/10 shadow-xs shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected && <Check size={12} className="text-white drop-shadow-xs" />}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-sans font-bold text-[var(--ink)] leading-tight">{preset.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hex Color Picker */}
                <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--line)] shrink-0 shadow-xs">
                      <input
                        type="color"
                        value={customization.primaryColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={customization.primaryColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      placeholder="#2444f0"
                      maxLength={7}
                      className="w-28 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] uppercase focus:outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>
              </div>

              {/* Homepage Featured Projects Arrangement Card */}
              <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)]">
                        <LayoutGrid size={16} />
                      </span>
                      <h3 className="text-sm sm:text-base font-sans font-semibold text-[var(--ink)]">
                        Homepage Featured Projects
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] font-sans max-w-xl">
                      Reorder the 5 featured projects displayed on the homepage.
                    </p>
                  </div>

                  <Link
                    id="admin-btn-arrange-featured-projects"
                    to="/admin/arrange-featured-projects"
                    className="px-4.5 py-2.5 rounded-xl text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-center active:scale-98"
                  >
                    <ArrowUpDown size={14} />
                    <span>Arrange Featured Projects</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-24 right-6 z-[200] px-5 py-3.5 rounded-xl shadow-2xl border flex items-center gap-3 text-xs sm:text-sm font-sans font-medium text-white transition-opacity duration-200 ${
            toast.type === "error"
              ? "bg-red-600 border-red-500"
              : "bg-emerald-600 border-emerald-500"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle size={18} className="text-white shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* --- PROJECT FORM MODAL --- */}
      {showProjectModal && currentProject && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={() => setShowProjectModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl lg:max-w-5xl h-[88vh] max-h-[840px] bg-[var(--bg)] border border-[var(--line)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto"
          >
            {/* Hidden Input for Image Replacement */}
            <input 
              ref={replaceFileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleReplaceImageFile} 
              className="hidden" 
              disabled={isUploadingImage}
            />

            {/* TOP HEADER BAR */}
            <div className="px-6 sm:px-10 py-5 border-b border-[var(--line)] flex items-center justify-between gap-4 shrink-0 bg-[var(--bg)] z-20">
              <div>
                <h3 className="text-lg sm:text-xl font-sans font-semibold tracking-tight text-[var(--ink)]">
                  {projects.some((p) => p.id === currentProject.id) ? "Edit Project" : "Add Project"}
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  Configure project metadata, upload case study assets, and publish.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="p-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close edit window"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={saveProject} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6">
                
                {/* Step Selector: Minimal pill buttons matching screenshot */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStep(1)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                      editStep === 1
                        ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <FileText size={14} />
                    <span>Project Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStep(2)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                      editStep === 2
                        ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <ImageIcon size={14} />
                    <span>Project Images</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStep(3)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors cursor-pointer ${
                      editStep === 3
                        ? "bg-[var(--blue)] text-white shadow-xs font-semibold"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--card)] hover:bg-neutral-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>Review &amp; Publish</span>
                  </button>
                </div>

                {/* PAGE 1: TEXT CONTENTS & METADATA */}
                {editStep === 1 && (
                  <div className="space-y-6 pt-2">
                    {/* Project Title Input (Large, borderless, clean) */}
                    <div>
                      <input
                        type="text"
                        required
                        value={currentProject.title || ""}
                        onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                        placeholder="Project Title (e.g. HealthTech Mobile Platform)"
                        className="w-full bg-transparent text-xl sm:text-2xl font-sans font-semibold text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none tracking-tight"
                      />
                    </div>

                    {/* Description Textarea (Clean, borderless, spacious) */}
                    <div>
                      <textarea
                        required
                        rows={5}
                        value={currentProject.description || ""}
                        onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                        placeholder="Describe your design ownership, problem space, challenge, and key contributions..."
                        className="w-full bg-transparent text-sm sm:text-base font-sans text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* Key Contributions Component */}
                    <div className="pt-2">
                      <KeyContributionsInput
                        keyContributions={currentProject.keyContributions || []}
                        onChange={(keys) => setCurrentProject({ ...currentProject, keyContributions: keys })}
                        maxKeys={10}
                        label="Key Contributions"
                      />
                    </div>

                    {/* Metadata Strip: Product Type, Class & Button */}
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[var(--line)]/60">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-1">Category / Role</label>
                        <input
                          type="text"
                          required
                          value={currentProject.productType || currentProject.category || ""}
                          onChange={(e) => setCurrentProject({ ...currentProject, category: e.target.value, productType: e.target.value })}
                          placeholder="e.g. Mobile App, Design System"
                          className="w-full bg-[var(--card)] px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--blue)]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-1">Product Class</label>
                        <select
                          value={currentProject.product || "desktop_software"}
                          onChange={(e) => setCurrentProject({ ...currentProject, product: e.target.value as "mobile_app" | "desktop_software" })}
                          className="w-full bg-[var(--card)] px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] cursor-pointer"
                        >
                          <option value="desktop_software">Desktop Software / CRM</option>
                          <option value="mobile_app">Mobile Application</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          value={currentProject.button || "View Casestudy"}
                          onChange={(e) => setCurrentProject({ ...currentProject, button: e.target.value })}
                          placeholder="e.g. View Casestudy"
                          className="w-full bg-[var(--card)] px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:border-[var(--blue)]"
                        />
                      </div>
                    </div>

                    {/* Display & Visibility Settings - Minimal Badges */}
                    <div className="pt-4 border-t border-[var(--line)]/60">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-3">
                        Display Badges &amp; Status
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)]/40 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={currentProject.homeItem !== false}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setCurrentProject({ ...currentProject, homeItem: val, showInHomeGrid: val });
                            }}
                            className="rounded text-[var(--blue)] focus:ring-[var(--blue)] cursor-pointer w-4 h-4"
                          />
                          <div>
                            <div className="text-xs font-sans text-[var(--ink)] font-semibold">Homepage</div>
                            <div className="text-[10px] text-[var(--ink-soft)]">Show on home feed</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)]/40 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={Boolean(currentProject.isFeaturedOnHome || currentProject.heroSection)}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setCurrentProject({ ...currentProject, isFeaturedOnHome: val, heroSection: val });
                            }}
                            className="rounded text-[var(--blue)] focus:ring-[var(--blue)] cursor-pointer w-4 h-4"
                          />
                          <div>
                            <div className="text-xs font-sans text-[var(--ink)] font-semibold">Featured</div>
                            <div className="text-[10px] text-[var(--ink-soft)]">Highlight as headline</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)]/40 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={Boolean(currentProject.isNew)}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setCurrentProject({ ...currentProject, isNew: val });
                            }}
                            className="rounded text-[var(--blue)] focus:ring-[var(--blue)] cursor-pointer w-4 h-4"
                          />
                          <div>
                            <div className="text-xs font-sans text-[var(--ink)] font-semibold">Latest Badge</div>
                            <div className="text-[10px] text-[var(--ink-soft)]">Show green latest tag</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-[var(--blue)]/40 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={Boolean(currentProject.isLive === true || (currentProject.isLive as any) === "Yes" || (currentProject.isLive as any) === "true")}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setCurrentProject({ ...currentProject, isLive: val });
                            }}
                            className="rounded text-[var(--blue)] focus:ring-[var(--blue)] cursor-pointer w-4 h-4"
                          />
                          <div>
                            <div className="text-xs font-sans text-[var(--ink)] font-semibold">Live Project</div>
                            <div className="text-[10px] text-[var(--ink-soft)]">Show pulsing live tag</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 2: PROJECT IMAGES WITH IN-PLACE REPLACE & DELETE */}
                {editStep === 2 && (
                  <div className="space-y-8 pt-2">
                    {/* THUMBNAIL SECTION */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-bold">
                            Thumbnail Image
                          </h4>
                          <p className="text-[11px] text-[var(--ink-soft)] font-sans">Main card cover image for project feeds</p>
                        </div>
                        <label className="text-xs font-sans font-medium text-[var(--blue)] hover:bg-[var(--blue)]/10 flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-full border border-[var(--blue)]/30 transition-colors">
                          {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          <span>Upload Thumbnail</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleProjectImageUpload(e, 'thumbnail')} 
                            className="hidden" 
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Left: Preview Card with Replace & Delete buttons */}
                        <div className="md:col-span-6 relative aspect-video rounded-2xl bg-[var(--card)] border border-[var(--line)] overflow-hidden flex items-center justify-center group shadow-xs">
                          {currentProject.thumbnail?.[0] ? (
                            <>
                              <img 
                                src={getOptimizedImageUrl(currentProject.thumbnail[0], 800)} 
                                alt="Project Thumbnail Preview" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-black/75 text-white text-[10px] font-mono uppercase font-bold tracking-wider backdrop-blur-xs">
                                Thumbnail
                              </div>
                              
                              {/* Hover Actions: Replace & Delete */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                                <button
                                  type="button"
                                  onClick={() => triggerReplaceImage('thumbnail', 0)}
                                  className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-sans font-bold hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <RefreshCw size={13} />
                                  <span>Replace Image</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage('thumbnail', 0)}
                                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-sans font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-6 text-[var(--ink-soft)] space-y-2">
                              <ImageIcon size={32} className="mx-auto opacity-40" />
                              <p className="text-xs font-sans font-medium">No thumbnail image selected.</p>
                              <button
                                type="button"
                                onClick={() => triggerReplaceImage('thumbnail', 0)}
                                className="px-3 py-1.5 rounded-lg text-xs font-sans font-semibold bg-[var(--blue-tint)] text-[var(--blue)] border border-[var(--blue)]/20 hover:bg-[var(--blue)] hover:text-white transition-all inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Upload size={12} />
                                <span>Upload or Replace</span>
                              </button>
                            </div>
                          )}

                          {/* Spinner Loader on Top of Thumbnail */}
                          {isUploadingImage && (
                            <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 text-white animate-in fade-in duration-150">
                              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                <Loader2 size={20} className="animate-spin text-white" />
                              </div>
                              <span className="text-xs font-sans font-medium text-white">Uploading Image...</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Direct URL Input */}
                        <div className="md:col-span-6 space-y-2">
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Thumbnail URL</label>
                          <input
                            type="url"
                            value={currentProject.thumbnail?.[0] || ""}
                            onChange={(e) => setCurrentProject({ ...currentProject, thumbnail: [e.target.value] })}
                            className="block w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 focus:border-[var(--blue)] transition-all"
                            placeholder="https://res.cloudinary.com/..."
                          />
                          <p className="text-[11px] text-[var(--ink-soft)] font-sans">Or pick any gallery image below and click "Set as Thumbnail".</p>
                        </div>
                      </div>
                    </div>

                    {/* HERO SECTION IMAGES */}
                    <div className="space-y-3 pt-6 border-t border-[var(--line)]/60">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-bold">
                            Hero Banners ({currentProject.heroSectionImg?.length || 0})
                          </h4>
                          <p className="text-[11px] text-[var(--ink-soft)] font-sans">Images featured in hero carousel or detail page headers</p>
                        </div>
                        <label className="text-xs font-sans font-medium text-[var(--blue)] hover:bg-[var(--blue)]/10 flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-full border border-[var(--blue)]/30 transition-colors">
                          {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          <span>Upload Hero Image(s)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            onChange={(e) => handleProjectImageUpload(e, 'heroSectionImg')} 
                            className="hidden" 
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto pr-1">
                        {currentProject.heroSectionImg && currentProject.heroSectionImg.length > 0 ? (
                          currentProject.heroSectionImg.map((imgUrl, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl bg-[var(--card)] border border-[var(--line)] overflow-hidden group shadow-xs">
                              <img src={getOptimizedImageUrl(imgUrl, 400)} alt={`Hero Banner ${idx + 1}`} className="w-full h-full object-cover" />
                              
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono font-bold uppercase">
                                Hero #{idx + 1}
                              </div>

                              {/* Hover overlay with Replace & Delete buttons */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                <button
                                  type="button"
                                  onClick={() => triggerReplaceImage('heroSectionImg', idx)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white text-black text-[11px] font-sans font-bold hover:bg-neutral-100 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                  title="Replace image file"
                                >
                                  <RefreshCw size={12} />
                                  <span>Replace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage('heroSectionImg', idx)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-sans font-bold hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                  title="Delete image"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full p-6 rounded-xl border border-dashed border-[var(--line)] text-center text-xs text-[var(--ink-soft)] font-sans">
                            No hero section images assigned. Upload hero files above.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GALLERY IMAGES */}
                    <div className="space-y-3 pt-6 border-t border-[var(--line)]/60">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-bold">
                            Gallery Assets ({currentProject.images?.length || 0})
                          </h4>
                          <p className="text-[11px] text-[var(--ink-soft)] font-sans">Upload files or add web URLs. Replace or delete existing items.</p>
                        </div>
                        <label className="text-xs font-sans font-medium text-[var(--blue)] hover:bg-[var(--blue)]/10 flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-full border border-[var(--blue)]/30 transition-colors">
                          {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          <span>Upload Gallery Images</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            onChange={(e) => handleProjectImageUpload(e, 'gallery')} 
                            className="hidden" 
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>

                      {/* Add URL Bar */}
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={newGalleryUrlInput}
                          onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddGalleryUrl();
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-[var(--card)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--blue)]"
                          placeholder="Paste image URL..."
                        />
                        <button
                          type="button"
                          onClick={handleAddGalleryUrl}
                          className="px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-[var(--card)] border border-[var(--line)] text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Grid of gallery previews with Replace & Delete buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto pr-1">
                        {currentProject.images && currentProject.images.length > 0 ? (
                          currentProject.images.map((imgUrl, idx) => {
                            const isCurrentThumbnail = currentProject.thumbnail?.[0] === imgUrl;
                            return (
                              <div key={idx} className="relative aspect-video rounded-xl bg-[var(--bg)] border border-[var(--line)] overflow-hidden group shadow-xs">
                                <img src={getOptimizedImageUrl(imgUrl, 400)} alt={`Gallery item ${idx + 1}`} className="w-full h-full object-cover" />
                                
                                {isCurrentThumbnail && (
                                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono uppercase font-bold tracking-wider">
                                    Thumbnail
                                  </div>
                                )}

                                {/* Hover overlay with Replace & Delete buttons */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => triggerReplaceImage('gallery', idx)}
                                      className="px-2.5 py-1.5 rounded-lg bg-white text-black text-[11px] font-sans font-bold hover:bg-neutral-100 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                      title="Replace image file"
                                    >
                                      <RefreshCw size={12} />
                                      <span>Replace</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteImage('gallery', idx)}
                                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-sans font-bold hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                      title="Delete image"
                                    >
                                      <Trash2 size={12} />
                                      <span>Delete</span>
                                    </button>
                                  </div>

                                  {!isCurrentThumbnail && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCurrentProject({ ...currentProject, thumbnail: [imgUrl] });
                                        showToast("Set as main thumbnail!");
                                      }}
                                      className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] font-sans font-semibold border border-white/30 backdrop-blur-xs transition-colors cursor-pointer"
                                    >
                                      Set as Thumbnail
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full p-8 rounded-xl border border-dashed border-[var(--line)] text-center text-xs text-[var(--ink-soft)] font-sans">
                            No gallery images added yet. Click above to upload image files or add URLs.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 3: REVIEW & SAVE */}
                {editStep === 3 && (
                  <div className="space-y-8 pt-2">
                    {/* Metadata Summary */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-bold">
                          1. Details Summary
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditStep(1)}
                          className="text-xs font-sans font-medium text-[var(--blue)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit size={12} />
                          <span>Edit Details</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] text-xs font-sans">
                        <div>
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Title</span>
                          <span className="font-bold text-[var(--ink)] text-sm">{currentProject.title || "Untitled Project"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Category / Role</span>
                          <span className="font-medium text-[var(--ink)]">{currentProject.category || "Uncategorized"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Product Class</span>
                          <span className="font-medium text-[var(--ink)] capitalize">{currentProject.product?.replace("_", " ")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">CTA Button</span>
                          <span className="font-medium text-[var(--ink)]">{currentProject.button || "View Casestudy"}</span>
                        </div>
                        <div className="col-span-full">
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Description</span>
                          <p className="font-normal text-[var(--ink-soft)] mt-1 line-clamp-3">{currentProject.description || "No description provided."}</p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Asset Summary */}
                    <div className="space-y-3 pt-6 border-t border-[var(--line)]/60">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--ink)] font-bold">
                          2. Media Summary
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditStep(2)}
                          className="text-xs font-sans font-medium text-[var(--blue)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit size={12} />
                          <span>Manage Images</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Thumbnail Preview */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Thumbnail</span>
                          <div className="aspect-video rounded-xl bg-[var(--card)] border border-[var(--line)] overflow-hidden">
                            {currentProject.thumbnail?.[0] ? (
                              <img src={getOptimizedImageUrl(currentProject.thumbnail[0], 400)} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--ink-soft)]">No thumbnail</div>
                            )}
                          </div>
                        </div>

                        {/* Hero Banners */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Hero Banners ({currentProject.heroSectionImg?.length || 0})</span>
                          <div className="aspect-video rounded-xl bg-[var(--card)] border border-[var(--line)] overflow-hidden flex items-center justify-center p-2 text-center">
                            {currentProject.heroSectionImg?.[0] ? (
                              <img src={getOptimizedImageUrl(currentProject.heroSectionImg[0], 400)} alt="Hero" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-[var(--ink-soft)]">No hero banners</span>
                            )}
                          </div>
                        </div>

                        {/* Gallery Count */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-[var(--ink-soft)] uppercase block">Gallery Assets</span>
                          <div className="aspect-video rounded-xl bg-[var(--card)] border border-[var(--line)] p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold font-mono text-[var(--blue)]">{currentProject.images?.length || 0}</span>
                            <span className="text-[10px] text-[var(--ink-soft)]">Asset(s) attached</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Minimal Bottom Action Bar */}
              <div className="px-6 sm:px-10 py-4 border-t border-[var(--line)] bg-[var(--bg)] shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--ink-soft)]">
                    ID: <span className="font-semibold text-[var(--ink)]">{currentProject.id}</span>
                  </span>
                  {projects.some((p) => p.id === currentProject.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProjectModal(false);
                        deleteProject(currentProject.id, currentProject.title);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-sans font-medium text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Delete this project permanently"
                    >
                      <Trash2 size={13} />
                      <span>Delete Project</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (editStep > 1) {
                        setEditStep(editStep - 1);
                      } else {
                        setShowProjectModal(false);
                      }
                    }}
                    className="px-4 py-2 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    {editStep > 1 ? "Back" : "Cancel"}
                  </button>

                  {editStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setEditStep(editStep + 1)}
                      className="px-6 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <span>{editStep === 1 ? "Next: Images" : "Next: Review"}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <Sparkles size={14} />
                      <span>Save Project</span>
                    </button>
                  )}
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- BLOG FORM MODAL --- */}
      {showBlogModal && currentBlog && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-md overflow-y-auto" 
          data-lenis-prevent="true"
          onClick={() => setShowBlogModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl lg:max-w-5xl h-[88vh] max-h-[840px] rounded-2xl sm:rounded-3xl bg-[var(--bg)] border border-[var(--line)] shadow-2xl overflow-hidden z-10 flex flex-col my-auto"
          >
            {/* Top Header Bar matching Add to Field Notes */}
            <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[var(--line)] bg-[var(--bg)] shrink-0 z-20">
              <div>
                <h3 className="font-sans font-semibold text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  {blogs.some((b) => b.id === currentBlog.id) ? "Edit Blog Post" : "Create Blog Post"}
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  Write your article story, upload cover media, and set up key elements.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="p-2 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM BODY: Minimal writing canvas */}
            <form id="blog-modal-form" onSubmit={saveBlog} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6">

                {/* Minimal Writing Canvas */}
                <div className="space-y-4">
                  {/* Title Input */}
                  <input
                    type="text"
                    required
                    value={currentBlog.Title || ""}
                    onChange={(e) => setCurrentBlog({ ...currentBlog, Title: e.target.value })}
                    placeholder="Article Title / Headline..."
                    className="w-full bg-transparent text-xl sm:text-2xl font-sans font-semibold text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none tracking-tight"
                  />

                  {/* Story Textarea */}
                  <textarea
                    value={currentBlog.description || ""}
                    onChange={(e) => setCurrentBlog({ ...currentBlog, description: e.target.value })}
                    rows={6}
                    placeholder="Write your article story, insights, or reflection here..."
                    className="w-full bg-transparent text-[var(--ink)] placeholder:text-[var(--muted)]/40 focus:outline-none resize-none leading-relaxed text-sm sm:text-base font-sans min-h-[140px]"
                  />

                  {/* Cover Photo Upload Area */}
                  <div className="pt-2">
                    <input 
                      ref={blogFileInputRef} 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBlogImageUpload} 
                      className="hidden" 
                    />

                    {currentBlog.cover_photo ? (
                      <div className="relative w-full max-h-[280px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-zinc-900 border border-[var(--line)] group">
                        <img
                          src={currentBlog.cover_photo}
                          alt="Cover preview"
                          className="w-full h-full max-h-[280px] object-cover"
                        />
                        {isUploadingBlogImg && (
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-md z-10">
                            <Loader2 size={13} className="animate-spin text-blue-400" />
                            <span>Uploading to cloud...</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => blogFileInputRef.current?.click()}
                            disabled={isUploadingBlogImg}
                            className="px-3.5 py-1.5 rounded-full bg-white text-neutral-900 text-xs font-sans font-medium hover:bg-neutral-100 transition-colors shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <Upload size={13} />
                            <span>Replace Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              pendingBlogFileRef.current = null;
                              setCurrentBlog({ ...currentBlog, cover_photo: "" });
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-sans font-medium hover:bg-rose-700 transition-colors shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => blogFileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const f = e.dataTransfer?.files?.[0];
                          if (f) processBlogImageFile(f);
                        }}
                        className="w-full py-8 border border-dashed border-[var(--line)] rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--blue)] hover:bg-[var(--blue)]/5 transition-all text-[var(--ink-soft)]"
                      >
                        {isUploadingBlogImg ? (
                          <>
                            <Loader2 size={20} className="animate-spin text-[var(--blue)]" />
                            <span className="text-xs font-sans font-medium text-[var(--ink)]">Uploading photo...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={20} className="text-[var(--muted)]" />
                            <span className="text-xs font-sans font-medium">Click to upload cover photo or drag &amp; drop</span>
                            <span className="text-[10px] text-[var(--muted)] font-mono">PNG, JPG, WEBP up to 10MB</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata Inputs (Category, Date, Read Time, Key Elements) - Minimal inline strip */}
                  <div className="pt-4 border-t border-[var(--line)]/60 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Blog Category Dropdown */}
                      <div className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-soft)] px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                        <Layers size={15} className="text-[var(--blue)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] uppercase tracking-wider font-mono text-[var(--muted)] font-medium">Category</label>
                          <select
                            value={currentBlog.category || "Artificial Intelligence"}
                            onChange={(e) => setCurrentBlog({ ...currentBlog, category: e.target.value })}
                            className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-sans font-semibold cursor-pointer truncate mt-0.5"
                          >
                            <option value="Artificial Intelligence" className="bg-[var(--card)] text-[var(--ink)]">Artificial Intelligence</option>
                            <option value="User Experience" className="bg-[var(--card)] text-[var(--ink)]">User Experience</option>
                            <option value="User Interface" className="bg-[var(--card)] text-[var(--ink)]">User Interface</option>
                          </select>
                        </div>
                      </div>

                      {/* Publication Date */}
                      <div className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-soft)] px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                        <Calendar size={15} className="text-[var(--muted)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] uppercase tracking-wider font-mono text-[var(--muted)] font-medium">Date</label>
                          <input
                            type="text"
                            value={currentBlog.date || ""}
                            onChange={(e) => setCurrentBlog({ ...currentBlog, date: e.target.value })}
                            placeholder="September 24, 2026"
                            className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-mono font-medium mt-0.5"
                          />
                        </div>
                      </div>

                      {/* Read Time */}
                      <div className="flex items-center gap-2.5 text-xs font-sans text-[var(--ink-soft)] px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--line)] shadow-2xs">
                        <BookOpen size={15} className="text-[var(--muted)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] uppercase tracking-wider font-mono text-[var(--muted)] font-medium">Read Time</label>
                          <input
                            type="text"
                            value={currentBlog.readTime || "5 min read"}
                            onChange={(e) => setCurrentBlog({ ...currentBlog, readTime: e.target.value })}
                            placeholder="5 min read"
                            className="w-full bg-transparent focus:outline-none text-[var(--ink)] text-xs font-mono font-medium mt-0.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Key Elements Tags (up to 3) */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                      <Tag size={14} className="text-[var(--muted)] shrink-0" />
                      {(currentBlog.badge || []).map((element, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card)] text-[var(--ink)] border border-[var(--line)] text-xs font-sans font-medium shadow-2xs"
                        >
                          <span>#{element}</span>
                          <button
                            type="button"
                            onClick={() => removeKeyElement(idx)}
                            className="text-[var(--ink-soft)] hover:text-rose-500 rounded-full transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}

                      {(currentBlog.badge || []).length < 3 ? (
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={blogTagInput}
                            onChange={(e) => setBlogTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                addKeyElement(blogTagInput);
                              }
                            }}
                            onBlur={() => {
                              if (blogTagInput.trim()) {
                                addKeyElement(blogTagInput);
                              }
                            }}
                            placeholder="Add key topic (max 3, press Enter)..."
                            className="w-full bg-transparent border-none outline-none text-xs font-sans text-[var(--ink)] placeholder:text-[var(--muted)]/50 py-1"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] font-sans text-[var(--ink-soft)] italic">
                          (Max 3 topics added)
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Minimal Bottom Action Bar matching Add to Field Notes */}
              <div className="px-6 sm:px-10 py-4 border-t border-[var(--line)] bg-[var(--bg)] shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="px-6 py-2.5 rounded-full text-xs font-sans font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingBlog ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>{blogs.some((b) => b.id === currentBlog?.id) ? "Saving..." : "Creating Blog..."}</span>
                    </>
                  ) : (
                    <span>{blogs.some((b) => b.id === currentBlog?.id) ? "Update Blog" : "Create Blog"}</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- TESTIMONIAL FORM MODAL (Main Page/Modal for Adding & Editing Testimonials) --- */}
      <TestimonialFormPreviewModal
        isOpen={showTestimonialModal || showFormPreviewModal}
        onClose={() => {
          setShowTestimonialModal(false);
          setShowFormPreviewModal(false);
          setCurrentTestimonial(null);
        }}
        testimonial={currentTestimonial}
        onSaved={(saved) => {
          showToast(`Testimonial by "${saved.name}" successfully saved`);
          setTestimonials(testimonialService.getTestimonials());
        }}
      />

      {/* Field Note Create Modal */}
      <CreateFieldNoteModal
        isOpen={showCreateNoteModal}
        onClose={() => setShowCreateNoteModal(false)}
        onNoteCreated={() => {
          showToast("Field Note published successfully!");
          setFieldNotes(fieldNotesService.getNotes());
          setBlogsSubTab("notes");
        }}
      />

      {/* Delete Project Confirmation Popup Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-sans font-semibold text-[var(--ink)]">
                  Delete Project?
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  This action will permanently delete the project from the database.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--ink)] font-sans leading-relaxed">
              Are you sure you want to delete the project <strong className="font-semibold text-[var(--ink)]">"{projectToDelete.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeletingProject}
                className="px-5 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                disabled={isDeletingProject}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeletingProject ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Blog Confirmation Popup Modal */}
      {blogToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-sans font-semibold text-[var(--ink)]">
                  Delete Blog Post?
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  This action will remove the blog post from your portfolio.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--ink)] font-sans leading-relaxed">
              Are you sure you want to delete <strong className="font-semibold text-[var(--ink)]">"{blogToDelete.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setBlogToDelete(null)}
                className="px-5 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteBlog}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Trash2 size={14} />
                <span>Delete Blog Post</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Field Note Confirmation Popup Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-sans font-semibold text-[var(--ink)]">
                  Delete Field Note?
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  This action will permanently delete this note.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--ink)] font-sans leading-relaxed line-clamp-3">
              Are you sure you want to delete <strong className="font-semibold text-[var(--ink)]">"{noteToDelete.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                disabled={isDeletingNote}
                className="px-5 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                disabled={isDeletingNote}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isDeletingNote ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Testimonial Confirmation Popup Modal */}
      {testimonialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-sans font-semibold text-[var(--ink)]">
                  Delete Testimonial?
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  This action will remove the recommendation from your portfolio.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--ink)] font-sans leading-relaxed">
              Are you sure you want to delete the testimonial from <strong className="font-semibold text-[var(--ink)]">"{testimonialToDelete.name}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setTestimonialToDelete(null)}
                className="px-5 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTestimonial}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Trash2 size={14} />
                <span>Delete Testimonial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Booking Confirmation Popup Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-sans font-semibold text-[var(--ink)]">
                  Delete Booked Session?
                </h3>
                <p className="text-xs text-[var(--ink-soft)] font-sans mt-0.5">
                  This action will permanently delete this booking.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--ink)] font-sans leading-relaxed">
              Are you sure you want to delete the session booking for <strong className="font-semibold text-[var(--ink)]">"{sessionToDelete.name}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={isDeletingSession}
                className="px-5 py-2.5 rounded-full border border-[var(--line)] bg-[var(--bg)] hover:bg-neutral-100 dark:hover:bg-zinc-800 text-[var(--ink)] text-xs font-sans font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
                disabled={isDeletingSession}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-sans font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeletingSession ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Session</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={(createdProject) => {
          loadData();
          showToast(`Project "${createdProject.title}" created successfully!`);
        }}
      />

      {/* Profile Picture Cropper Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSrc("");
        }}
        onCropComplete={handleCropUploadComplete}
        cropShape="round"
        aspect={1}
        title="Crop Profile Picture"
      />

      {/* Resume Management Modal Window (Cloudinary resume collection) */}
      <AdminResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        resumes={resumes}
        primaryResume={primaryResume}
        onUpload={handleResumeUpload}
        onSetPrimary={handleSetPrimaryResume}
        onDelete={handleDeleteResume}
        onDownload={handleDownloadResume}
      />

      {/* External Article (Medium & LinkedIn) Add / Edit Modal */}
      <AddExternalArticleModal
        isOpen={showExternalArticleModal}
        onClose={() => {
          setShowExternalArticleModal(false);
          setCurrentExternalArticle(null);
        }}
        initialArticle={currentExternalArticle}
        onAdded={() => {
          setExternalArticles(getExternalArticles());
          showToast(currentExternalArticle ? "External article updated successfully" : "External article listed successfully");
        }}
      />
    </div>
  );
}
