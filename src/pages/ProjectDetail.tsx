import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation, useNavigationType } from "react-router-dom";
import { 
  ArrowLeft, Heart, Bookmark, Calendar, ArrowRight,
  ChartBarTrendUp as TrendingUp, Users, CheckCircle as CheckCircle2, Shield, Sparkles, Clock, 
  Location as MapPin, Play, Pause, Refresh as RefreshCw, Layers, ShieldNetwork as Network, Compass, 
  Sun, Droplet as Droplets, Thermometer, ChevronRight, MessageSquare, AlertCircle,
  Share, Check, ArrowDown, ArrowUp, InfoCircle as Info, Home
} from "reicon-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { getLenis } from "../hooks/useLenis";
import { useLoader } from "../context/LoaderContext";
import { useResumeModal } from "../context/ResumeModalContext";
import { useContactModal } from "../context/ContactModalContext";
import { dataStore } from "../utils/dataStore";
import { projectService, sortProjectsByLatest } from "../services/projectService";
import { useProfilePicture } from "../hooks/useProfilePicture";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import ScrollReveal from "../components/layout/ScrollReveal";
import ShortDetailsModal from "../components/projects/ShortDetailsModal";
import ShareModal from "../components/projects/ShareModal";
import ComingSoonFrame from "../components/common/ComingSoonFrame";
import CustomDropdown from "../components/ui/CustomDropdown";
import { getPreviousPath } from "../utils/navigationHistory";

// ----------------------------------------------------
// Custom SVG Logos for each project
// ----------------------------------------------------
const ProjectLogo = ({ id, className = "w-6 h-6" }: { id: string, className?: string }) => {
  switch (id) {
    case "001": // Fitznow
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#10B981" />
          <path d="M7 12H17M17 12L13 8M17 12L13 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "002": // Crux CRM
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="#0052FF" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      );
    case "003": // Where's My Car
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#3B82F6" />
          <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
      );
    case "004": // Home Decor
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#F59E0B" />
          <path d="M6 12L12 6L18 12V18H6V12Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "005": // Physio Guru
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#EC4899" />
          <path d="M12 6C12 6 8 10 8 12C8 14 10 16 12 16C14 16 16 14 16 12C16 10 12 6 12 6Z" fill="white" />
        </svg>
      );
    case "006": // Smart Soil
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#059669" />
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#0052FF" />
        </svg>
      );
  }
};

// ----------------------------------------------------
// INTERACTIVE PLAYGROUNDS FOR EACH PROJECT
// ----------------------------------------------------

// 1. Fitznow (Workout Tracker)
const FitznowPlayground = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [reps, setReps] = useState(12);
  const [activeSet, setActiveSet] = useState(1);
  const [exercise, setExercise] = useState("Dumbbell Bicep Curls");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 font-bold">Interactive Prototype</span>
          <h4 className="font-sans font-bold text-base text-[var(--ink)]">Active Workout Panel</h4>
        </div>
        <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 font-medium dark:bg-emerald-500/5">
          Live Sync
        </span>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-850 p-4 rounded-xl gap-4">
          <div className="flex-1">
            <p className="text-xs text-neutral-400 font-medium mb-1">Current Exercise</p>
            <CustomDropdown
              variant="compact"
              value={exercise}
              options={["Dumbbell Bicep Curls", "Goblet Squats", "Push-Ups", "Plank Hold"]}
              onChange={(val) => setExercise(val)}
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400 font-medium">Active Set</p>
            <div className="flex gap-1.5 mt-1 justify-end">
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSet(s)}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                    activeSet === s 
                      ? "bg-emerald-500 text-white shadow-sm" 
                      : "bg-zinc-200 dark:bg-zinc-800 text-neutral-500 hover:bg-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timer Box */}
        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-xl bg-neutral-50/20">
          <div className="text-4xl font-mono font-bold tracking-tight text-[var(--ink)] transition-all">
            {formatTime(seconds)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 font-medium uppercase tracking-wider">Elapsed Time</p>
          
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive 
                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
              }`}
            >
              {isActive ? <Pause size={12} /> : <Play size={12} />}
              <span>{isActive ? "Pause" : "Start Set"}</span>
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setSeconds(0);
              }}
              className="px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-neutral-600 dark:text-neutral-300 text-xs font-medium cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Repetition Counter */}
        <div className="flex items-center justify-between p-2">
          <div>
            <h5 className="text-sm font-bold text-[var(--ink)]">Target Repetitions</h5>
            <p className="text-xs text-neutral-400">Aim for a slow, controlled negative phase</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setReps(Math.max(1, reps - 1))}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-lg cursor-pointer select-none"
            >
              -
            </button>
            <span className="text-xl font-mono font-bold w-6 text-center text-[var(--ink)]">{reps}</span>
            <button
              onClick={() => setReps(reps + 1)}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-lg cursor-pointer select-none"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Crux CRM (Mini Sales Dashboard & Ticket Queue)
const CruxCRMPlayground = () => {
  const [sales, setSales] = useState(14850);
  const [tickets, setTickets] = useState([
    { id: "#T-402", name: "Sarah Jenkins", issue: "Refund request for Order #9822", status: "Open", date: "Just now" },
    { id: "#T-399", name: "David Chen", issue: "API webhook failures on checkout", status: "In Progress", date: "10m ago" },
    { id: "#T-395", name: "Aria Thorne", issue: "Bulk subscription update error", status: "Open", date: "1h ago" }
  ]);

  const handleSimulateSale = () => {
    const saleAmt = Math.floor(Math.random() * 250) + 45;
    setSales((prev) => prev + saleAmt);
  };

  const handleResolveTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--blue)] font-bold">Interactive Playground</span>
          <h4 className="font-sans font-bold text-base text-[var(--ink)]">eCommerce Operations Command</h4>
        </div>
        <button
          onClick={handleSimulateSale}
          className="px-3 py-1.5 text-xs bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white font-semibold rounded-full flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Sparkles size={11} />
          <span>Simulate Sale</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-xl border border-neutral-100 dark:border-zinc-800">
          <p className="text-xs text-neutral-400 font-medium">Daily Revenue</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-[var(--ink)] mt-1">
            ${sales.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-0.5 mt-1">
            <TrendingUp size={10} /> +18.4% vs yesterday
          </span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-850 p-4 rounded-xl border border-neutral-100 dark:border-zinc-800">
          <p className="text-xs text-neutral-400 font-medium">Pending Tickets</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-[var(--ink)] mt-1">
            {tickets.length}
          </p>
          <span className="text-[10px] text-neutral-400 font-medium block mt-1">
            Average response: 4.8m
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2">Priority Customer Support Queue</h5>
        <AnimatePresence mode="popLayout">
          {tickets.length > 0 ? (
            tickets.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 border border-neutral-150 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-neutral-400">{t.id}</span>
                    <span className="text-xs font-bold text-[var(--ink)]">{t.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      t.status === "Open" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500" : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{t.issue}</p>
                </div>
                <button
                  onClick={() => handleResolveTicket(t.id)}
                  className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white rounded-full transition-all cursor-pointer"
                >
                  Resolve
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-xl">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
              <p className="text-xs font-bold text-[var(--ink)]">All Tickets Resolved!</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Inbox zero achieved successfully.</p>
              <button 
                onClick={() => setTickets([
                  { id: "#T-402", name: "Sarah Jenkins", issue: "Refund request for Order #9822", status: "Open", date: "Just now" },
                  { id: "#T-399", name: "David Chen", issue: "API webhook failures on checkout", status: "In Progress", date: "10m ago" },
                  { id: "#T-395", name: "Aria Thorne", issue: "Bulk subscription update error", status: "Open", date: "1h ago" }
                ])}
                className="mt-3 text-[10px] font-bold text-[var(--blue)] hover:underline cursor-pointer"
              >
                Reset Queue
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 3. Where's My Car (Tactile Radar Locator)
const WheresMyCarPlayground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(42.6);
  const [angle, setAngle] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate angle in degrees
    let calculatedAngle = Math.atan2(y, x) * (180 / Math.PI);
    setAngle(calculatedAngle + 90); // Adjusting offset so compass needle aligns

    // Calculate simulated distance based on how close the cursor is to the center
    const distFromCenter = Math.sqrt(x*x + y*y);
    const maxDist = Math.sqrt((rect.width/2)**2 + (rect.height/2)**2);
    const calculatedDistance = Math.max(0.5, ((distFromCenter / maxDist) * 80));
    setDistance(parseFloat(calculatedDistance.toFixed(1)));
  };

  const handleMouseLeave = () => {
    setAngle(0);
    setDistance(42.6);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-500 font-bold">Interactive Prototype</span>
          <h4 className="font-sans font-bold text-base text-[var(--ink)]">Magnetic Car Locator</h4>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-500 rounded font-bold dark:bg-blue-500/5">
          Offline GPS
        </span>
      </div>

      <p className="text-xs text-neutral-400 mb-4 text-center">
        Move your cursor around the radar box below to simulate walking toward your vehicle.
      </p>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-square max-h-[220px] bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-neutral-150 dark:border-zinc-800 flex flex-col items-center justify-center cursor-crosshair overflow-hidden mx-auto"
      >
        {/* Dynamic circular concentric grids */}
        <div className="absolute w-[80%] h-[80%] border border-dashed border-neutral-200 dark:border-zinc-800 rounded-full" />
        <div className="absolute w-[50%] h-[50%] border border-neutral-200 dark:border-zinc-800 rounded-full" />
        <div className="absolute w-[20%] h-[20%] border border-neutral-200 dark:border-zinc-800 rounded-full" />

        {/* Compass Dial */}
        <div 
          style={{ transform: `rotate(${angle}deg)` }}
          className="relative w-28 h-28 flex items-center justify-center transition-transform duration-100 ease-out z-10"
        >
          {/* Glowing Arrow Indicator */}
          <div className="absolute top-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[20px] border-b-blue-500 filter drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)]" />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </div>

        {/* Static overlay target */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center bg-white/85 dark:bg-zinc-900/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-neutral-100 dark:border-zinc-800">
          <p className="text-xs font-mono font-bold text-[var(--ink)]">
            {distance < 2.0 ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={12} /> You arrived!
              </span>
            ) : (
              `Distance: ${distance} m`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// 4. Home Decor (Smart Controller Widget)
const HomeDecorPlayground = () => {
  const [brightness, setBrightness] = useState(75);
  const [temp, setTemp] = useState(21.5);
  const [lights, setLights] = useState(true);
  const [airCon, setAirCon] = useState(true);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold">Interactive Widget</span>
          <h4 className="font-sans font-bold text-base text-[var(--ink)]">Living Room Ambient Panel</h4>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${lights ? "bg-amber-400 animate-pulse" : "bg-neutral-300"}`} />
      </div>

      <div className="space-y-6">
        {/* Toggle Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLights(!lights)}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
              lights 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200" 
                : "bg-zinc-50 dark:bg-zinc-850 border-transparent text-neutral-400"
            }`}
          >
            <Sun className={`mb-2 ${lights ? "text-amber-500" : "text-neutral-400"}`} size={18} />
            <span className="text-xs font-bold block">Smart Lights</span>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70">
              {lights ? "ON" : "OFF"}
            </span>
          </button>
          <button
            onClick={() => setAirCon(!airCon)}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
              airCon 
                ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200" 
                : "bg-zinc-50 dark:bg-zinc-850 border-transparent text-neutral-400"
            }`}
          >
            <Thermometer className={`mb-2 ${airCon ? "text-blue-500 animate-pulse" : "text-neutral-400"}`} size={18} />
            <span className="text-xs font-bold block">Climate Control</span>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70">
              {airCon ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Dynamic ambient slider background based on slider values */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 font-medium">Luminance</span>
              <span className="font-mono font-bold text-[var(--ink)]">{brightness}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={brightness}
              disabled={!lights}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 font-medium">Temperature</span>
              <span className="font-mono font-bold text-[var(--ink)]">{temp.toFixed(1)}°C</span>
            </div>
            <input 
              type="range" 
              min="160" 
              max="280" 
              value={temp * 10}
              disabled={!airCon}
              onChange={(e) => setTemp(parseInt(e.target.value) / 10)}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Home Visualization */}
        <div 
          style={{ 
            backgroundColor: lights ? `rgba(245, 158, 11, ${brightness / 400})` : "transparent"
          }}
          className="h-16 rounded-xl border border-dashed border-neutral-200 dark:border-zinc-800 flex items-center justify-center transition-all duration-300"
        >
          <span className="text-xs text-[var(--ink-soft)] font-medium">
            {lights ? `Simulated Ambient Glow at ${brightness}%` : "Room is currently dark"}
          </span>
        </div>
      </div>
    </div>
  );
};

// 5. Physio Guru (Physical Therapy Breath/Hold Timer)
const PhysioGuruPlayground = () => {
  const [step, setStep] = useState(1);
  const [holding, setHolding] = useState(false);
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (holding && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setHolding(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [holding, seconds]);

  const handleStartHold = () => {
    setSeconds(10);
    setHolding(true);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-pink-500 font-bold">Guided therapy</span>
          <h4 className="font-sans font-bold text-base text-[var(--ink)]">Isometric Stretch Guide</h4>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-pink-500/10 text-pink-600 rounded font-bold dark:bg-pink-500/5">
          Step {step} of 3
        </span>
      </div>

      <div className="space-y-5">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl">
          <h5 className="text-sm font-bold text-[var(--ink)]">
            {step === 1 && "1. Hamstring Straight Stretch"}
            {step === 2 && "2. Lower Back Bridge Stretch"}
            {step === 3 && "3. Quadricep Flex Release"}
          </h5>
          <p className="text-xs text-neutral-400 mt-1">
            {step === 1 && "Raise leg slowly until you feel light tension, hold safely."}
            {step === 2 && "Lift hips upward, aligning shoulders and knees perfectly."}
            {step === 3 && "Pull foot backward toward glutes, flexing the knee joint gently."}
          </p>
        </div>

        {/* Pulse Breath Visualizer */}
        <div className="flex flex-col items-center justify-center py-6 border border-neutral-100 dark:border-zinc-800 rounded-xl relative overflow-hidden bg-neutral-50/10">
          <AnimatePresence>
            {holding && (
              <motion.div 
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-24 h-24 bg-pink-500/10 rounded-full z-0 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <span className="text-4xl font-mono font-bold text-[var(--ink)] z-10">
            {seconds}s
          </span>
          <span className="text-[10px] text-neutral-400 font-mono tracking-wider font-semibold uppercase mt-1 z-10">
            {holding ? "Inhale deeply & Hold" : "Stretch Hold Ready"}
          </span>

          <button
            onClick={handleStartHold}
            disabled={holding}
            className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed z-10 cursor-pointer shadow-sm transition-all"
          >
            {holding ? "Stretch Active" : "Start 10s Hold"}
          </button>
        </div>

        {/* Step controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              setStep(Math.max(1, step - 1));
              setHolding(false);
              setSeconds(10);
            }}
            disabled={step === 1}
            className="text-xs font-bold text-neutral-400 hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer"
          >
            Previous stretch
          </button>
          <button
            onClick={() => {
              setStep(Math.min(3, step + 1));
              setHolding(false);
              setSeconds(10);
            }}
            disabled={step === 3}
            className="text-xs font-bold text-pink-500 hover:text-pink-600 disabled:opacity-30 cursor-pointer"
          >
            Next stretch
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. Smart Soil (IoT Sensor Readings Simulator)
const SmartSoilPlayground = () => {
  const [sector, setSector] = useState("North sector (NPK-3)");
  const [moisture, setMoisture] = useState(42);
  const [temp, setTemp] = useState(24.8);
  const [ph, setPh] = useState(6.4);
  const [simulatingRain, setSimulatingRain] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (simulatingRain) {
      timer = setInterval(() => {
        setMoisture((prev) => {
          if (prev >= 85) {
            setSimulatingRain(false);
            if (timer) clearInterval(timer);
            return 85;
          }
          return prev + 5;
        });
        setTemp((prev) => parseFloat((prev - 0.2).toFixed(1)));
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [simulatingRain]);

  const handleSimulateRain = () => {
    setSimulatingRain(true);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 font-bold">IoT Dashboard Live Feed</span>
          <h4 className="font-sans font-bold text-base text-[var(--ink)]">Agricultural Soil Sensors</h4>
        </div>
        <button
          onClick={handleSimulateRain}
          disabled={simulatingRain || moisture >= 80}
          className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1 shadow-sm"
        >
          <Droplets size={11} />
          <span>{simulatingRain ? "Simulating..." : "Simulate Rain"}</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-neutral-400 font-medium mb-1.5">Select Irrigation Field</p>
          <CustomDropdown
            variant="compact"
            value={sector}
            options={["North sector (NPK-3)", "South Ridge (NPK-1)", "Greenhouse Array B"]}
            onChange={(val) => {
              setSector(val);
              setSimulatingRain(false);
              if (val === "North sector (NPK-3)") {
                setMoisture(42);
                setTemp(24.8);
                setPh(6.4);
              } else if (val === "South Ridge (NPK-1)") {
                setMoisture(28);
                setTemp(27.4);
                setPh(5.8);
              } else {
                setMoisture(65);
                setTemp(22.1);
                setPh(6.9);
              }
            }}
          />
        </div>

        {/* Telemetry rows */}
        <div className="space-y-3.5">
          {/* Moisture sensor */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1 text-neutral-400">
                <Droplets size={12} className="text-blue-500" /> Soil Moisture
              </span>
              <span className="font-mono font-bold text-[var(--ink)]">{moisture}%</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                style={{ width: `${moisture}%` }}
                className={`h-full transition-all duration-300 rounded-full ${
                  moisture < 35 
                    ? "bg-rose-500" 
                    : moisture > 75 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                }`}
              />
            </div>
            <p className="text-[10px] text-right font-medium">
              {moisture < 35 && <span className="text-rose-500">Critical: Under-irrigated</span>}
              {moisture >= 35 && moisture <= 75 && <span className="text-emerald-500">Perfect moisture range</span>}
              {moisture > 75 && <span className="text-amber-500">Saturated soil</span>}
            </p>
          </div>

          {/* Temperature and pH sensors */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-zinc-50 dark:bg-zinc-850 p-3 rounded-xl border border-neutral-100 dark:border-zinc-800">
              <span className="text-xs text-neutral-400 font-medium flex items-center gap-1 mb-1">
                <Thermometer size={12} className="text-amber-500" /> Temperature
              </span>
              <span className="text-base font-mono font-bold text-[var(--ink)]">{temp}°C</span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-850 p-3 rounded-xl border border-neutral-100 dark:border-zinc-800">
              <span className="text-xs text-neutral-400 font-medium flex items-center gap-1 mb-1">
                <AlertCircle size={12} className="text-emerald-600" /> pH Level
              </span>
              <span className="text-base font-mono font-bold text-[var(--ink)]">{ph}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import { CaseStudyContent, CASE_STUDIES } from "../data/caseStudies";


const renderHeadlineWithPrimaryColor = (text: string) => {
  if (text.includes(", ")) {
    const parts = text.split(", ");
    const firstPart = parts.slice(0, -1).join(", ");
    const lastPart = parts[parts.length - 1];
    return (
      <>
        {firstPart}, <span className="text-[var(--blue)]">{lastPart}</span>
      </>
    );
  }
  
  const words = text.split(" ");
  if (words.length > 2) {
    const firstPart = words.slice(0, -2).join(" ");
    const lastPart = words.slice(-2).join(" ");
    return (
      <>
        {firstPart} <span className="text-[var(--blue)]">{lastPart}</span>
      </>
    );
  }
  
  return text;
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { isLoaded } = useLoader();
  const { openResume } = useResumeModal();
  const { openContact } = useContactModal();
  
  // Real-time synchronized projects store
  const [projectsList, setProjectsList] = useState(() => dataStore.getProjects());

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((updated) => {
      if (updated) {
        setProjectsList(updated);
      }
    });

    const handleUpdate = () => {
      setProjectsList(dataStore.getProjects());
    };
    window.addEventListener("portfolio_data_update", handleUpdate);
    return () => {
      unsub();
      window.removeEventListener("portfolio_data_update", handleUpdate);
    };
  }, []);

  // Retrieve current project or default to Crux CRM
  const currentId = id || "002";

  // Find dynamic project from data store / Firestore
  const dynamicProject = projectsList.find((p) => 
    p.id === currentId || 
    p.slug === currentId || 
    p.id?.toLowerCase() === currentId?.toLowerCase() || 
    p.title?.toLowerCase() === currentId?.toLowerCase() ||
    p.title?.toLowerCase().replace(/\s+/g, "-") === currentId?.toLowerCase()
  );

  const caseStudy = CASE_STUDIES[currentId] || (dynamicProject ? {
    id: dynamicProject.id,
    title: dynamicProject.title,
    subtitle: dynamicProject.category || dynamicProject.productType || "Case Study Visuals",
    tag: dynamicProject.product === "mobile_app" ? "Mobile Development" : "CRM & Product",
    product: dynamicProject.product || "desktop_software",
    thumbnail: dynamicProject.thumbnail?.[0] || "",
    role: "Product Designer",
    duration: "2026",
    deliverables: ["Product Architecture", "UI Design", "Prototyping"],
    impact: "High-impact product design and user experience architecture.",
    overview: dynamicProject.description || "Detailed case study and product designs.",
    challengeTitle: "Challenge Overview",
    challengeText: dynamicProject.description || "Solving key user experience and interface challenges.",
    solutionTitle: "Designed Solution",
    solutionText: "Implemented user-centered features with modern interface patterns.",
    logoColor: "#0052FF",
    detailHeadline: dynamicProject.title,
    detailSubheadline: dynamicProject.description
  } : CASE_STUDIES["002"]);

  // Collect all project images from all available fields (projectImages, images, thumbnail, heroSectionImg, static CASE_STUDIES)
  const projectImages = (() => {
    const imagesList: string[] = [];
    if (dynamicProject) {
      if (Array.isArray(dynamicProject.projectImages) && dynamicProject.projectImages.length > 0) {
        imagesList.push(...dynamicProject.projectImages);
      }
      if (Array.isArray(dynamicProject.images) && dynamicProject.images.length > 0) {
        imagesList.push(...dynamicProject.images);
      }
      if (Array.isArray(dynamicProject.thumbnail) && dynamicProject.thumbnail.length > 0) {
        imagesList.push(...dynamicProject.thumbnail);
      }
      if (Array.isArray(dynamicProject.heroSectionImg) && dynamicProject.heroSectionImg.length > 0) {
        imagesList.push(...dynamicProject.heroSectionImg);
      }
    }
    if (caseStudy) {
      if (Array.isArray((caseStudy as any).projectImages)) {
        imagesList.push(...(caseStudy as any).projectImages);
      }
      if (Array.isArray((caseStudy as any).images)) {
        imagesList.push(...(caseStudy as any).images);
      }
    }
    return Array.from(new Set(imagesList.filter(Boolean)));
  })();

  const [copied, setCopied] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [scrollMode, setScrollMode] = useState<"down" | "up" | "hidden">("down");
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showShortDetails, setShowShortDetails] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  const detailsToDisplay = {
    projectName: dynamicProject?.title || caseStudy.title || "Project Details",
    onelineDescription: dynamicProject?.description || caseStudy.overview || "Product design case study overview.",
    position: {
      role: (dynamicProject as any)?.role || caseStudy.role || "Product Designer",
      keyContributions: Array.isArray(dynamicProject?.keyContributions) && dynamicProject.keyContributions.length > 0
        ? dynamicProject.keyContributions.join(" • ")
        : typeof (dynamicProject as any)?.keyContributions === "string" && (dynamicProject as any).keyContributions
        ? (dynamicProject as any).keyContributions
        : caseStudy.deliverables ? caseStudy.deliverables.join(" • ") : "Product Architecture • UI Design • Prototyping",
    },
    duration: {
      duration: (dynamicProject as any)?.duration || "3 Months",
      startAndEnd: (dynamicProject as any)?.year ? `2024 - ${dynamicProject.year}` : caseStudy.duration || "2024 - Present",
    },
    createdDate: (dynamicProject as any)?.month && (dynamicProject as any)?.year
      ? `${(dynamicProject as any).month} ${(dynamicProject as any).year}`
      : (dynamicProject as any)?.year
      ? `June ${(dynamicProject as any).year}`
      : "June 2026",
  };

  // Toggle scroll down / scroll to top mode based on scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const lenis = getLenis();
      const scrollTop = lenis ? lenis.scroll : window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (scrollTop < 12) {
        setScrollMode("down");
      } else if (scrollPercent >= 15) {
        setScrollMode("up");
      } else {
        setScrollMode("hidden");
      }
    };

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentId]);

  const handleShare = () => {
    setShowShareModal(true);
  };

  // Robust go back to the real previous page & previous scroll position
  const handleBack = () => {
    const currentPath = location.pathname;
    const prevPath = getPreviousPath();
    const isFromHomeFeatured = location.state?.fromSection === "selected-works" || 
      location.state?.from === "/#selected-works" || 
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("home_featured_scroll") !== null);

    // 1. If we have a tracked previous in-app route that differs from current path:
    if (prevPath && prevPath !== currentPath) {
      navigate(-1);

      // Failsafe timer (giving AnimatePresence exit transition 450ms to finish):
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          navigate(isFromHomeFeatured ? "/#selected-works" : prevPath, {
            state: { fromSection: isFromHomeFeatured ? "selected-works" : undefined }
          });
        }
      }, 450);
      return;
    }

    // 2. If location.state.from is provided and differs from current path:
    if (location.state?.from && location.state.from !== currentPath) {
      navigate(location.state.from, {
        state: { fromSection: location.state.fromSection }
      });
      return;
    }

    // 3. Fallback to /#selected-works if from home featured, else /projects
    if (isFromHomeFeatured) {
      navigate("/#selected-works", { state: { fromSection: "selected-works" } });
    } else {
      navigate("/projects");
    }
  };

  // Adjust scroll resize once component loads
  useEffect(() => {
    const lenis = getLenis();
    if (navigationType !== "POP") {
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }
    if (lenis) {
      lenis.resize();
    }
    const timer = setTimeout(() => getLenis()?.resize(), 400);
    return () => clearTimeout(timer);
  }, [currentId, navigationType]);

  // Real-time author profile picture
  const profilePicture = useProfilePicture();

  // Compute 4 recent projects for Dribbble-like showcase (excluding current project)
  const recentProjects = (() => {
    const sorted = sortProjectsByLatest(projectsList || []);
    const currentKey = (currentId || "").toLowerCase().trim();
    const currentSlug = (dynamicProject?.slug || "").toLowerCase().trim();
    const currentTitle = (dynamicProject?.title || caseStudy?.title || "").toLowerCase().trim();

    const isCurrent = (projId?: string, slug?: string, title?: string) => {
      const i = (projId || "").toLowerCase().trim();
      const s = (slug || "").toLowerCase().trim();
      const t = (title || "").toLowerCase().trim();
      return (
        Boolean(i && i === currentKey) ||
        Boolean(s && s === currentKey) ||
        Boolean(i && currentSlug && i === currentSlug) ||
        Boolean(s && currentSlug && s === currentSlug) ||
        Boolean(t && currentTitle && t === currentTitle) ||
        Boolean(t && t.replace(/\s+/g, "-") === currentKey)
      );
    };

    const items: Array<{
      id: string;
      title: string;
      thumbnail: string;
      isLive?: boolean;
      product?: string;
    }> = [];

    sorted.forEach((p) => {
      if (!isCurrent(p.id, p.slug, p.title)) {
        const thumb = Array.isArray(p.thumbnail) && p.thumbnail.length > 0
          ? p.thumbnail[0]
          : typeof p.thumbnail === "string" && p.thumbnail
          ? p.thumbnail
          : Array.isArray(p.heroSectionImg) && p.heroSectionImg.length > 0
          ? p.heroSectionImg[0]
          : Array.isArray(p.images) && p.images.length > 0
          ? p.images[0]
          : "";

        items.push({
          id: p.id,
          title: p.title,
          thumbnail: thumb,
          isLive: Boolean(p.isLive === true || (p.isLive as any) === "Yes" || (p.isLive as any) === "true"),
          product: p.product,
        });
      }
    });

    // If fewer than 4 from projectsList, backfill from static CASE_STUDIES so 4 cards are always shown
    if (items.length < 4) {
      Object.keys(CASE_STUDIES).forEach((key) => {
        const cs = CASE_STUDIES[key];
        if (!isCurrent(cs.id, undefined, cs.title) && !items.some((it) => it.id === cs.id || it.title.toLowerCase() === cs.title.toLowerCase())) {
          items.push({
            id: cs.id,
            title: cs.title,
            thumbnail: cs.thumbnail || "",
            isLive: false,
            product: cs.product,
          });
        }
      });
    }

    return items.slice(0, 4);
  })();

  // Compute next project for dedicated footer navigation
  const nextProject = (() => {
    // Build unified list of projects (dynamic projects + case studies)
    const allUnified: Array<{
      id: string;
      slug?: string;
      title: string;
      description: string;
      thumbnail: string;
    }> = [];

    const addedKeys = new Set<string>();

    const getDesc = (p: any, cs?: any) => {
      const pDesc = typeof p?.description === "string" ? p.description.trim() : "";
      if (pDesc) return pDesc;
      const pDetails = typeof p?.details === "string" ? p.details.trim() : "";
      if (pDetails) return pDetails;
      if (cs?.detailSubheadline?.trim()) return cs.detailSubheadline.trim();
      if (cs?.overview?.trim()) return cs.overview.trim();
      if (cs?.challengeText?.trim()) return cs.challengeText.trim();
      const pShort = typeof p?.shortDetails === "string" ? p.shortDetails.trim() : "";
      if (pShort) return pShort;
      if (cs?.subtitle?.trim()) return cs.subtitle.trim();
      return "Detailed case study and product architecture by Avinash Shajan.";
    };

    const getThumb = (p: any, cs?: any) => {
      if (Array.isArray(p?.thumbnail) && p.thumbnail.length > 0 && p.thumbnail[0]) return p.thumbnail[0];
      if (typeof p?.thumbnail === "string" && p.thumbnail) return p.thumbnail;
      if (Array.isArray(p?.heroSectionImg) && p.heroSectionImg.length > 0 && p.heroSectionImg[0]) return p.heroSectionImg[0];
      if (Array.isArray(p?.images) && p.images.length > 0 && p.images[0]) return p.images[0];
      if (cs?.thumbnail) return cs.thumbnail;
      return "";
    };

    // Add projects from projectsList
    const sorted = sortProjectsByLatest(projectsList || []);
    sorted.forEach((p) => {
      const k = (p.id || p.slug || p.title || "").toLowerCase().trim();
      if (!k || addedKeys.has(k)) return;
      addedKeys.add(k);

      const cs = CASE_STUDIES[p.id] || (p.slug && CASE_STUDIES[p.slug]) || Object.values(CASE_STUDIES).find(c => c.title.toLowerCase() === p.title?.toLowerCase());

      allUnified.push({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: getDesc(p, cs),
        thumbnail: getThumb(p, cs),
      });
    });

    // Backfill from CASE_STUDIES
    Object.keys(CASE_STUDIES).forEach((key) => {
      const cs = CASE_STUDIES[key];
      const k = (cs.id || cs.title || "").toLowerCase().trim();
      if (!k || addedKeys.has(k) || allUnified.some(u => u.id === cs.id || u.title.toLowerCase() === cs.title.toLowerCase())) return;
      addedKeys.add(k);

      allUnified.push({
        id: cs.id,
        title: cs.title,
        description: cs.detailSubheadline || cs.overview || cs.subtitle || "Product Design Case Study",
        thumbnail: cs.thumbnail || "",
      });
    });

    if (allUnified.length === 0) return null;

    // Find current index
    const currentKey = (currentId || "").toLowerCase().trim();
    const currentSlug = (dynamicProject?.slug || "").toLowerCase().trim();
    const currentTitle = (dynamicProject?.title || caseStudy?.title || "").toLowerCase().trim();

    const currentIdx = allUnified.findIndex((p) => {
      const i = (p.id || "").toLowerCase().trim();
      const s = (p.slug || "").toLowerCase().trim();
      const t = (p.title || "").toLowerCase().trim();
      return (
        Boolean(i && i === currentKey) ||
        Boolean(s && s === currentKey) ||
        Boolean(i && currentSlug && i === currentSlug) ||
        Boolean(s && currentSlug && s === currentSlug) ||
        Boolean(t && currentTitle && t === currentTitle)
      );
    });

    let nextIdx = (currentIdx + 1) % allUnified.length;
    if (nextIdx === currentIdx && allUnified.length > 1) {
      nextIdx = (currentIdx + 2) % allUnified.length;
    }

    return allUnified[nextIdx] || allUnified[0] || null;
  })();

  // Render the appropriate interactive playground demo
  const renderPlayground = () => {
    switch (currentId) {
      case "001":
        return <FitznowPlayground />;
      case "002":
        return <CruxCRMPlayground />;
      case "003":
        return <WheresMyCarPlayground />;
      case "004":
        return <HomeDecorPlayground />;
      case "005":
        return <PhysioGuruPlayground />;
      case "006":
        return <SmartSoilPlayground />;
      default:
        return <CruxCRMPlayground />;
    }
  };

  return (
    <div id="page-project-detail" className="space-y-12">
      
      {/* 1. FIGMA HEADER ROW */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="-mt-12 sticky z-40 bg-[var(--bg)]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-neutral-200/50 dark:border-zinc-800/50 transition-all duration-300 shadow-none"
        style={{ top: "var(--navbar-offset, 72px)" }}
      >
        <header className="flex flex-row items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 pb-3 sm:pb-4 transition-all duration-300">
          
          {/* Left Side: Go Back button only */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBack();
              }}
              className="h-9 sm:h-10 px-3.5 sm:px-4.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-sans text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border border-transparent dark:border-white/10 select-none shrink-0 active:scale-95"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              <span>Go Back</span>
            </button>
          </div>

          {/* Right Side: Action row (Short Details, Share, Calendar) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Short Details / Info Button */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setShowShortDetails(true)}
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
                onFocus={() => setShowInfoTooltip(true)}
                onBlur={() => setShowInfoTooltip(false)}
                aria-label="View project details"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-neutral-200 dark:border-zinc-800 text-zinc-400 hover:text-[var(--ink)] hover:border-neutral-300 dark:hover:border-zinc-700 flex items-center justify-center transition-all cursor-pointer bg-transparent"
              >
                <Info size={15} strokeWidth={2} className="sm:w-4 sm:h-4" />
              </button>
              <AnimatePresence>
                {showInfoTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 5, scale: prefersReducedMotion ? 1 : 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 3, scale: prefersReducedMotion ? 1 : 0.95 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 26 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-[#0d0d15] text-[#f4f4f5] text-[13px] font-sans font-medium tracking-tight px-3.5 py-2 rounded-[8px] shadow-tooltip border border-white/5 pointer-events-none whitespace-nowrap z-50 hidden sm:block"
                    style={{ originX: 1, originY: 0.5 }}
                  >
                    Shot details
                    {/* Triangle Pointer */}
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#0d0d15] border-t border-r border-white/5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Share Button */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={handleShare}
                onMouseEnter={() => setShowShareTooltip(true)}
                onMouseLeave={() => setShowShareTooltip(false)}
                onFocus={() => setShowShareTooltip(true)}
                onFocusCapture={() => setShowShareTooltip(true)}
                onBlur={() => setShowShareTooltip(false)}
                aria-label="Share case study"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-neutral-200 dark:border-zinc-800 text-zinc-400 hover:text-[var(--ink)] hover:border-neutral-300 dark:hover:border-zinc-700 bg-transparent flex items-center justify-center transition-all cursor-pointer select-none"
              >
                <Share size={13} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
              </button>
              <AnimatePresence>
                {showShareTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 5, scale: prefersReducedMotion ? 1 : 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: prefersReducedMotion ? 0 : 3, scale: prefersReducedMotion ? 1 : 0.95 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 26 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-[#0d0d15] text-[#f4f4f5] text-[13px] font-sans font-medium tracking-tight px-3.5 py-2 rounded-[8px] shadow-tooltip border border-white/5 pointer-events-none whitespace-nowrap z-50 hidden sm:block"
                    style={{ originX: 1, originY: 0.5 }}
                  >
                    Share
                    {/* Triangle Pointer */}
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#0d0d15] border-t border-r border-white/5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Get in touch button: Black pill styling */}
            <button
              type="button"
              onClick={openContact}
              className="h-9 sm:h-10 px-4 sm:px-5 rounded-full font-sans text-xs sm:text-[13px] font-semibold flex items-center justify-center cursor-pointer select-none whitespace-nowrap shrink-0 active:scale-95 transition-all duration-200 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border-none shadow-none"
            >
              Get in touch
            </button>
          </div>
        </header>
      </motion.div>

      {/* NEW HEADLINE SECTION ABOVE CASE STUDY IMAGES */}
      <div className="w-full max-w-3xl text-left pt-6 pb-5">
        {caseStudy.detailHeadline && (
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-[32px] sm:text-[42px] md:text-[55px] font-bold tracking-tight leading-[1.1] text-[var(--ink)]"
          >
            {renderHeadlineWithPrimaryColor(caseStudy.detailHeadline)}
          </motion.h2>
        )}
        {caseStudy.detailSubheadline && (
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mt-4 text-[15px] md:text-[17px] text-[var(--ink-soft)] leading-relaxed font-sans font-normal"
          >
            {caseStudy.detailSubheadline}
          </motion.p>
        )}
      </div>

      {/* 2. CASE STUDY IMAGES VERTICAL LIST OR COMING SOON FRAME */}
      {projectImages && projectImages.length > 0 ? (
        <section className="-mt-1 flex flex-col items-center justify-center w-full space-y-4 md:space-y-6">
          {projectImages.map((imgUrl, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3) }}
              className="w-full overflow-hidden"
            >
              <img
                src={imgUrl}
                alt={`${caseStudy.title} case study slice ${index + 1}`}
                referrerPolicy="no-referrer"
                loading="lazy"
                onLoad={() => getLenis()?.resize()}
                className="w-full h-auto object-contain block select-none pointer-events-none"
              />
            </motion.div>
          ))}
        </section>
      ) : (
        <section className="w-full py-4">
          <ComingSoonFrame
            title={`${caseStudy.title} Case Study Visuals`}
            subtitle="High-resolution screens and interactive prototypes under preparation."
            aspectRatio="aspect-[16/9]"
            className="w-full"
          />
        </section>
      )}


      {/* 5. DRIBBBLE-STYLE AUTHOR & RECENT PROJECTS SHOWCASE */}
      <footer className="pt-16 sm:pt-20">
        {/* Next Project Section */}
        {nextProject && (
          <div className="pb-10">
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-neutral-100/80 dark:bg-zinc-850/60 border-none shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[var(--ink)] tracking-tight">
                    {nextProject.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] line-clamp-2 leading-relaxed">
                    {nextProject.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {nextProject.thumbnail && (
                    <div className="w-20 h-14 sm:w-28 sm:h-20 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-zinc-800 shrink-0 bg-neutral-200 dark:bg-zinc-800 hidden xs:block">
                      <img
                        src={getOptimizedImageUrl(nextProject.thumbnail, 240)}
                        alt={nextProject.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Link
                    to={`/project/${nextProject.id}`}
                    state={{ from: location.pathname }}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      getLenis()?.scrollTo(0, { immediate: true });
                    }}
                    className="group/btn h-10 px-5.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white font-sans text-[13px] font-semibold flex items-center gap-2 transition-all shrink-0 select-none cursor-pointer active:scale-95"
                  >
                    <span>Explore next project</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Horizontal Divider */}
        <div className="w-full h-px bg-neutral-200/70 dark:bg-zinc-800/80 mb-8 sm:mb-10" />

        {/* Section Header: Explore more projects */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h4 className="text-base sm:text-lg font-sans font-bold text-[var(--ink)] tracking-tight">
            Explore more projects
          </h4>
        </div>

        {/* 4 Recent Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {recentProjects.map((proj) => {
            const optimizedThumb = proj.thumbnail ? getOptimizedImageUrl(proj.thumbnail, 600) : "";
            return (
              <Link
                key={proj.id}
                to={`/project/${proj.id}`}
                state={{ from: location.pathname }}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  getLenis()?.scrollTo(0, { immediate: true });
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none block transition-all duration-300 hover:border-black/[0.12] dark:hover:border-white/[0.16] cursor-pointer"
              >
                {optimizedThumb ? (
                  <img
                    src={optimizedThumb}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <ComingSoonFrame
                      title={proj.title}
                      subtitle="Image Coming Soon"
                      aspectRatio="aspect-full h-full"
                      className="w-full h-full rounded-xl border-dashed border-[var(--line)]"
                    />
                  </div>
                )}

                {/* Top Right Live Badge */}
                {proj.isLive && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1 pointer-events-none">
                    <span className="inline-flex items-center gap-[3px] h-[18px] px-2 rounded-full bg-[#fee2e2] text-[#ff0000] text-[8px] font-bold tracking-wider uppercase select-none shadow-xs leading-none">
                      <span className="relative flex h-[5px] w-[5px] aspect-square shrink-0 items-center justify-center">
                        <span className="animate-live-ping absolute inline-flex h-[180%] w-[180%] rounded-full aspect-square bg-red-500/50"></span>
                        <span className="relative inline-flex rounded-full aspect-square h-[5px] w-[5px] bg-[#ff0000]"></span>
                      </span>
                      <span>LIVE</span>
                    </span>
                  </div>
                )}

                {/* Hover Overlay with White View Project Button */}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out flex items-center justify-center p-3.5 z-10 rounded-2xl pointer-events-none">
                  <div className="h-9 px-4.5 rounded-full bg-white text-zinc-950 font-sans text-xs font-semibold shadow-none flex items-center gap-1.5 transform translate-y-1.5 group-hover:translate-y-0 transition-transform duration-300 select-none">
                    <span>View Project</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 truncate">
                    <span className="text-white font-medium text-[12.5px] sm:text-[13.5px] tracking-tight drop-shadow-sm font-sans select-none">
                      {proj.title}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </footer>

      {/* Floating Scroll / Back to Top Hint */}
      <AnimatePresence>
        {scrollMode !== "hidden" && (
          <motion.div
            key="scroll-action-hint"
            layout
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => {
              const lenis = getLenis();
              if (scrollMode === "up") {
                if (lenis) {
                  lenis.scrollTo(0, { 
                    duration: 1.6,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                  });
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              } else {
                if (lenis) {
                  lenis.scrollTo(window.innerHeight * 0.4, { 
                    duration: 1.0,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                  });
                } else {
                  window.scrollTo({ top: window.innerHeight * 0.4, behavior: "smooth" });
                }
              }
            }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center justify-center bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-full shadow-floating border border-neutral-200/60 dark:border-zinc-800/50 cursor-pointer select-none hover:bg-neutral-50 dark:hover:bg-zinc-900/80 hover:border-neutral-300 dark:hover:border-zinc-700 active:scale-95 hover:scale-105 transition-all duration-300 whitespace-nowrap px-3.5 py-2 gap-2 w-auto max-w-max text-[11px] sm:text-xs font-sans font-medium text-neutral-800 dark:text-zinc-200"
          >
            <div className="flex items-center justify-center rounded-full shrink-0 w-5 h-5 bg-neutral-100 dark:bg-zinc-800/80">
              <motion.div
                animate={{ 
                  y: scrollMode === "down" ? [0, 3, 0] : [0, -3, 0]
                }}
                transition={{ 
                  duration: 1.4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="flex items-center justify-center"
              >
                {scrollMode === "down" ? (
                  <ArrowDown size={11} strokeWidth={3} className="text-neutral-600 dark:text-neutral-200" />
                ) : (
                  <ArrowUp size={11} strokeWidth={3} className="text-neutral-600 dark:text-neutral-200" />
                )}
              </motion.div>
            </div>
            <span className="font-sans font-semibold tracking-wide text-neutral-700 dark:text-neutral-300">
              {scrollMode === "down" ? "Scroll down to read more" : "Go to top"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Short Details Modal */}
      <AnimatePresence>
        {showShortDetails && (
          <ShortDetailsModal
            onClose={() => setShowShortDetails(false)}
            details={detailsToDisplay}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            onClose={() => setShowShareModal(false)}
            project={{
              title: dynamicProject?.title || caseStudy.title,
              thumbnail: getOptimizedImageUrl(
                Array.isArray(dynamicProject?.thumbnail)
                  ? (dynamicProject?.thumbnail[0] || "")
                  : (dynamicProject?.thumbnail || caseStudy.thumbnail || ""),
                600
              ),
              link: `/project/${currentId}`
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
