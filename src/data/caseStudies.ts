export interface CaseStudyContent {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  product: string;
  thumbnail: string;
  role: string;
  duration: string;
  deliverables: string[];
  impact: string;
  overview: string;
  challengeTitle: string;
  challengeText: string;
  solutionTitle: string;
  solutionText: string;
  logoColor: string;
  detailHeadline?: string;
  detailSubheadline?: string;
}

export const CASE_STUDIES: Record<string, CaseStudyContent> = {
  "001": {
    id: "001",
    title: "Fitznow",
    subtitle: "Mobile Fitness Application",
    tag: "Mobile Development",
    product: "mobile_app",
    thumbnail: "",
    role: "Lead Mobile UX Designer",
    duration: "4 Months (Jan - April 2026)",
    deliverables: ["iOS App Architecture", "Haptic Pattern System", "Tactile Interface Library", "Motion System"],
    impact: "44% increase in Day-7 user retention and average workout logs.",
    overview: "Fitznow is a clean, hyper-focused mobile workout companion. In an industry flooded with noisy subscription widgets, Fitznow isolates the user experience to keep people moving without distraction.",
    challengeTitle: "Fighting the 'First-Week Friction' Churn Wave",
    challengeText: "The team discovered that over 65% of users dropped out of active fitness plans because launching a session took more than 5 taps. Our challenge was to design a 0-tap initiation layout that safely caches previous presets.",
    solutionTitle: "Tactile Session Isolation & Smart State Retrieval",
    solutionText: "We established a single-session focus state. By fading out peripheral telemetry and scaling touch targets to 52px, we allowed sweaty fingers to safely log reps. A dynamic timer changes the ambient glow of the app to encourage progress.",
    logoColor: "#10B981",
    detailHeadline: "Reclaiming physical training through tactile clarity.",
    detailSubheadline: "A friction-free mobile workout companion designed to cut through subscription noise and guide active sets offline with zero distraction."
  },
  "002": {
    id: "002",
    title: "Crux CRM",
    subtitle: "CRM for eCommerce & B2C Business",
    tag: "CRM & Product",
    product: "desktop_software",
    thumbnail: "",
    role: "Principal Product Designer",
    duration: "6 Months (July - Dec 2025)",
    deliverables: ["Unified Workspace Portal", "Component Library", "Keyboard Command Engine", "Interactive Charts"],
    impact: "38% faster ticket resolution times and +22% customer life cycle retention.",
    overview: "Crux CRM is an elite customer relationship workspace designed for consumer-centric teams. It unifies order parameters, shipping pipelines, and real-time support requests into a highly optimized, dual-column screen layout.",
    challengeTitle: "Information Overload and Screen Fragmenting",
    challengeText: "Operational staff were constantly context-switching between 4 browser tabs to solve simple customer issues. This lag resulted in longer ticket queues and frustrated customers. Our mission was to centralize operations under a 1-screen rule.",
    solutionTitle: "Command-Line Navigation & Stacking Layout",
    solutionText: "We implemented an integrated operations portal. Active customer folders can be quickly opened in sliding side-panels without losing parent view, backed by beautiful telemetry overlays that make raw ticket queues highly scannable.",
    logoColor: "#0052FF",
    detailHeadline: "Deliberate workflow terminal, engineered for scale.",
    detailSubheadline: "An elite operations terminal that unifies multi-tab customer pipelines, live chats, and order feeds into a highly polished, keyboard-driven workspace."
  },
  "003": {
    id: "003",
    title: "Where's My Car",
    subtitle: "Parked Car Locating Mobile App",
    tag: "Mobile Development",
    product: "mobile_app",
    thumbnail: "",
    role: "Sole Designer & Developer",
    duration: "2 Months (Spring 2025)",
    deliverables: ["Geographic Micro-interactions", "Interactive Compass Calibration", "Widget Controls"],
    impact: "Over 80,000 successful parking sessions pinned with 100% offline uptime.",
    overview: "A lightweight, beautiful, single-screen utility. Utilizing low-power location algorithms and high-contrast ambient dials, it guides users back to their vehicle with a clean, stress-free interface.",
    challengeTitle: "Weak GPS and Underground Garage Deadzones",
    challengeText: "Traditional navigation platforms require high-bandwidth map rendering that fails inside concrete garages. Our goal was to design a hybrid local compass that estimates direction using built-in phone sensors offline.",
    solutionTitle: "Dynamic Radar Pointing & Compass Dial Calibration",
    solutionText: "We crafted a direct, magnetic vector interface. Instead of detailed maps, users are shown an arrow indicator that reacts in real-time as they walk, accompanied by haptic alerts as they approach their vehicle.",
    logoColor: "#3B82F6",
    detailHeadline: "Calm directional guidance, keeping you on track offline.",
    detailSubheadline: "An elegant, sensor-driven vehicle finder that guides users back to their parking spot without active data connections, using haptic steps and low-power compass dials."
  },
  "004": {
    id: "004",
    title: "Home Decor",
    subtitle: "Universal Home Controller",
    tag: "CRM & Product",
    product: "desktop_software",
    thumbnail: "",
    role: "Lead IoT UX Designer",
    duration: "5 Months (Aug - Dec 2025)",
    deliverables: ["Bento Widget Grid", "Interactive Dimmer System", "Hardware Sync Status Controls"],
    impact: "Unified control over 14 smart protocols into a single safe environment.",
    overview: "Home Decor bridges the gap between scattered smart home devices. It groups controls into a highly responsive desktop app styled with generous negative space and comfortable dark palettes.",
    challengeTitle: "Scattered Control Panels and High Cognitive Load",
    challengeText: "Users have individual applications for speakers, lightbulbs, thermostats, and security locks. This friction causes users to abandon smart routines altogether. We sought to build a single, unified bento dashboard.",
    solutionTitle: "Lightweight Floating Panel & Tactile Sliders",
    solutionText: "We organized smart commands into a customizable, responsive grid. The interface utilizes a fluid theme that adjusts in color temperature depending on current room settings, offering subtle ambient feedback.",
    logoColor: "#F59E0B",
    detailHeadline: "Ambient orchestration for the modern sanctuary.",
    detailSubheadline: "A cohesive bento-grid dashboard connecting fourteen smart home hardware protocols into a comfortable, ambient dark console aware of room color-temperature trends."
  },
  "005": {
    id: "005",
    title: "Physio Guru",
    subtitle: "Recovery & Rehabilitation App",
    tag: "Mobile Development",
    product: "mobile_app",
    thumbnail: "",
    role: "Senior Interaction Designer",
    duration: "3 Months (Feb - May 2025)",
    deliverables: ["Therapy Hold Timer", "Accessibility Controls", "Custom Video Loop Playback"],
    impact: "+58% exercise compliance rate among patients recovering from knee injuries.",
    overview: "Physio Guru is a warm, encouraging mobile tool designed to help patients complete physical rehabilitation correctly. Focuses on smooth, paced loop animations and highly accessible layouts.",
    challengeTitle: "Form Recall and Lack of Patient Motivation",
    challengeText: "Patients often forget the mechanical cues given by therapists during clinic hours, leading to incorrect posture or abandoned sessions. We designed a clear, interactive visual guidance system.",
    solutionTitle: "Synchronized Hold Timer & Visual Breath Guiding",
    solutionText: "We designed slow-motion video loops and paired them with a calming, pulsing holding timer. The circular timing ring expands and contracts to pace the patient's breathing, making recovery an encouraging ritual.",
    logoColor: "#EC4899",
    detailHeadline: "Calming mechanical loops, built for patient recovery.",
    detailSubheadline: "An empathetic physical therapy companion guiding recovery postures with slow-motion exercise loops, haptic pace rings, and high-contrast accessible layout options."
  },
  "006": {
    id: "006",
    title: "Smart Soil",
    subtitle: "Agricultural IoT Platform",
    tag: "CRM & Product",
    product: "desktop_software",
    thumbnail: "",
    role: "Lead Systems Designer",
    duration: "6 Months (Winter 2025)",
    deliverables: ["Telemetry Dashboard", "Field Warning System", " NP-K Ratio Analytical Charts"],
    impact: "Saved 1.2M gallons of water across 40 test fields through precise smart irrigation.",
    overview: "Smart Soil is an agricultural analytical dashboard that translates raw moisture, salinity, and mineral sensors into simple, highly actionable farming decisions.",
    challengeTitle: "Raw Telemetry Sinking into Noise",
    challengeText: "Farmers were presented with complex decimal readouts and telemetry streams that were hard to read on the field. Our challenge was to design a clean warning layout that flags dry soil sectors immediately.",
    solutionTitle: "Acre Sector Isolation & Dynamic Bar Indicators",
    solutionText: "We established a sector bento grid that isolates failing sectors using high-contrast orange and red indicator caps, paired with clear text commands that simplify actions.",
    logoColor: "#059669",
    detailHeadline: "Translating raw IoT field telemetry into pure harvest.",
    detailSubheadline: "An agricultural systems dashboard highlighting dry soil sectors, salinity level graphs, and N-P-K mineral metrics to help farm operators irrigate with maximum water-saving precision."
  }
};
