import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  onSnapshot 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../utils/firebase";

export interface SessionBookingRecord {
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
  role?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  message?: string;
  status: "waiting" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  source?: string;
  phone?: string;
  mobileNumber?: string;
  phoneNumber?: string;
  contactNumber?: string;
  // External form submission fields
  chooseTopic?: string;
  sessionDuration?: string;
  fullName?: string;
  emailAddress?: string;
  currentRole?: string;
  helpWith?: string;
  time?: string;
  [key: string]: any;
}

const COLLECTION_NAME = "session_bookings";
const STORAGE_KEY = "portfolio_firebase_session_bookings";

/**
 * Safely parse any date representation (Firestore Timestamp, ISO string, epoch ms/s, etc.)
 */
export function safeParseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  
  // Firestore Timestamp with toDate() or { seconds, nanoseconds }
  if (typeof val === "object") {
    if (typeof val.toDate === "function") {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof val.seconds === "number") {
      const d = new Date(val.seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof val._seconds === "number") {
      const d = new Date(val._seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  if (typeof val === "number") {
    const d = new Date(val > 1e11 ? val : val * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      !trimmed || 
      trimmed.toLowerCase() === "invalid date" || 
      trimmed === "undefined" || 
      trimmed === "null"
    ) {
      return null;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    
    // Handle formats like YYYY-MM-DD or DD/MM/YYYY
    const clean = trimmed.split(" ")[0].replace(/[^\d\/-]/g, "");
    const parts = clean.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const d2 = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d2.getTime())) return d2;
      } else if (parts[2].length === 4) {
        const d2 = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(d2.getTime())) return d2;
      }
    }
  }
  return null;
}

/**
 * Normalizes raw booking document from Firestore session_bookings collection
 * Supports all external form field aliases:
 * - choose topic -> sessionType
 * - session duration -> duration
 * - date -> date
 * - time -> startTime
 * - time format -> timeFormat / timezone
 * - Full name -> name
 * - Email address -> email
 * - Current role / experience -> role
 * - Portfolio / LinkedIn URL -> portfolioUrl
 * - What would you like help with? -> message
 */
export function normalizeSessionBooking(docId: string, data: any): SessionBookingRecord {
  const name = String(data.fullName || data.name || data.full_name || "Guest Mentee").trim();
  const email = String(data.emailAddress || data.email || data.email_address || "").trim().toLowerCase();
  const rawSessionName = String(
    data.sessionName ||
    data.session_name ||
    data.chooseTopic ||
    data.sessionType ||
    data.session_type ||
    data.topic ||
    data.track ||
    data.title ||
    ""
  ).trim();
  const sessionType = rawSessionName || "1:1 Mentorship Session";
  const sessionName = rawSessionName || sessionType;

  let duration = data.sessionDuration || data.duration || "60 minutes";
  if (typeof duration === "string") {
    if (duration === "30m" || duration.toLowerCase().includes("30")) duration = "30 minutes";
    else if (duration === "45m" || duration.toLowerCase().includes("45")) duration = "45 minutes";
    else if (duration === "60m" || duration.toLowerCase().includes("60")) duration = "60 minutes";
  }

  // Robust Date Resolution
  const rawDateCandidate = 
    (data.date && typeof data.date === "string" && !data.date.toLowerCase().includes("invalid") ? data.date : null) ||
    data.sessionDate ||
    data.bookingDate ||
    data.selectedDate ||
    data.slotDate ||
    data.appointmentDate ||
    data.rawDate;

  const rawCreatedCandidate = data.createdAt || data.timestamp || data.created_at;

  const parsedDateObj = safeParseDate(rawDateCandidate) || safeParseDate(rawCreatedCandidate) || new Date();
  
  const date = parsedDateObj.toLocaleDateString("en-US", { 
    weekday: "short", 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });

  // Robust Start Time Resolution
  let startTime = 
    data.startTime || 
    data.time || 
    data.timeSlot || 
    data.slot || 
    data.selectedSlot || 
    data.selectedTime || 
    data.sessionTime || 
    data.bookingTime || 
    data.timing || 
    "";

  if (!startTime || startTime === "Scheduled") {
    const sourceWithTime = safeParseDate(rawDateCandidate) || safeParseDate(rawCreatedCandidate);
    if (sourceWithTime) {
      const hours = sourceWithTime.getHours();
      const minutes = sourceWithTime.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        startTime = sourceWithTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
    }
  }

  // Clean 24h formats like 14:00 to 2:00 PM
  if (startTime && /^\d{1,2}:\d{2}$/.test(startTime.trim())) {
    const [h, m] = startTime.trim().split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    startTime = `${hour12}:${m < 10 ? `0${m}` : m} ${period}`;
  }

  if (!startTime) {
    startTime = "Flexible / TBD";
  }

  const timeFormat = data.timeFormat || "";
  const rawTimezone = data.timezone || data.timeZone || (timeFormat ? `${timeFormat}` : "");
  const timezone = rawTimezone || "GST (Dubai, GMT+4)";

  const role = data.currentRole || data.role || data.experience || "";
  const portfolioUrl = data.portfolioUrl || data.linkedInUrl || data.portfolio || data.linkedin || "";
  const message = data.helpWith || data.message || data.whatWouldYouLikeHelpWith || data.notes || "";
  const phone = String(
    data.mobileNumber || 
    data.phone || 
    data.phoneNumber || 
    data.mobile || 
    data.contactNumber || 
    data.phone_number || 
    data.mobile_number || 
    data.contact || 
    data.whatsapp || 
    ""
  ).trim();

  const rawStatus = String(data.status || "").toLowerCase().trim();
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

  const createdAt = 
    (safeParseDate(data.createdAt)?.toISOString()) || 
    (safeParseDate(data.timestamp)?.toISOString()) || 
    new Date().toISOString();

  return {
    id: docId || data.id || `booking_${Date.now()}`,
    sessionType,
    sessionName,
    sessionId: data.sessionId || data.session_id || "",
    duration,
    date,
    rawDate: typeof rawDateCandidate === "string" ? rawDateCandidate : parsedDateObj.toISOString(),
    startTime,
    endTime: data.endTime || "",
    timezone,
    timeFormat,
    name,
    email,
    phone: phone || undefined,
    mobileNumber: phone || undefined,
    phoneNumber: phone || undefined,
    contactNumber: phone || undefined,
    role,
    portfolioUrl,
    linkedInUrl: data.linkedInUrl || portfolioUrl,
    message,
    status,
    createdAt,
    source: data.source || (data.chooseTopic || data.fullName || data.helpWith ? "external_website" : "portfolio"),
    chooseTopic: data.chooseTopic,
    sessionDuration: data.sessionDuration,
    fullName: data.fullName,
    emailAddress: data.emailAddress,
    currentRole: data.currentRole,
    helpWith: data.helpWith,
    time: startTime,
  };
}

export const sessionBookingFirebaseService = {
  /**
   * Get cached session bookings from localStorage
   */
  getCachedBookings(): SessionBookingRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  /**
   * Fetch all session bookings once from Firestore collection session_bookings
   */
  async fetchBookings(): Promise<SessionBookingRecord[]> {
    if (!isFirebaseConfigured || !db) {
      return this.getCachedBookings();
    }

    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      const bookings: SessionBookingRecord[] = [];

      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          bookings.push(normalizeSessionBooking(docSnap.id, docSnap.data()));
        }
      });

      // Sort newest first
      bookings.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
        } catch {}
      }

      return bookings;
    } catch (err) {
      console.warn("Notice: Failed to fetch from session_bookings collection:", err);
      return this.getCachedBookings();
    }
  },

  /**
   * Real-time listener for Firestore collection session_bookings
   */
  initListener(callback: (bookings: SessionBookingRecord[]) => void): () => void {
    // Immediate callback with cached data
    const cached = this.getCachedBookings();
    if (cached.length > 0) {
      callback(cached);
    }

    if (!isFirebaseConfigured || !db) {
      return () => {};
    }

    try {
      const colRef = collection(db, COLLECTION_NAME);
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const bookings: SessionBookingRecord[] = [];
          snapshot.forEach((docSnap) => {
            if (docSnap.exists()) {
              bookings.push(normalizeSessionBooking(docSnap.id, docSnap.data()));
            }
          });

          // Sort newest first
          bookings.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });

          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
            } catch {}
          }

          callback(bookings);
        },
        (err) => {
          console.warn("Firestore session_bookings listener notice:", err);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn("Failed to attach Firestore session_bookings listener:", err);
      return () => {};
    }
  },

  /**
   * Update session booking status in Firestore
   */
  async updateBookingStatus(id: string, newStatus: "waiting" | "confirmed" | "completed" | "cancelled"): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn(`Failed to update booking ${id} status in Firestore:`, err);
    }
  },

  /**
   * Delete session booking from Firestore
   */
  async deleteBooking(id: string): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const filtered = list.filter((b: any) => b.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          }
        }
      } catch {}
    }
    if (!isFirebaseConfigured || !db) return;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Failed to delete booking ${id} from Firestore:`, err);
    }
  },

  /**
   * Add a session booking directly to Firestore session_bookings collection
   */
  async addBooking(data: Partial<SessionBookingRecord>): Promise<SessionBookingRecord> {
    const id = data.id || `booking_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const normalized = normalizeSessionBooking(id, { ...data, id });

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, normalized, { merge: true });
      } catch (err) {
        console.warn("Failed to save booking to Firestore session_bookings:", err);
      }
    }

    return normalized;
  }
};
