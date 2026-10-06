import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

// Layout & Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageWrapper from "./components/layout/PageWrapper";
import ScrollToTop from "./components/layout/ScrollToTop";
import ThemeToggle from "./components/layout/ThemeToggle";
import AISearchOverlay from "./components/ai-search/AISearchOverlay";
import AIChatModal from "./components/ai-search/AIChatModal";

// Hooks
import { useLenis } from "./hooks/useLenis";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Resume from "./pages/Resume";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBackgroundManager from "./pages/AdminBackgroundManager";
import AdminArrangeFeaturedProjects from "./pages/AdminArrangeFeaturedProjects";
import ProjectDetail from "./pages/ProjectDetail";
import SubmitTestimonial from "./pages/SubmitTestimonial";
import Testimonials from "./pages/Testimonials";
import ComingSoon from "./pages/ComingSoon";
import FieldNotes from "./pages/FieldNotes";
import SessionBookingPage from "./pages/SessionBookingPage";
import AskAI from "./pages/AskAI";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize smooth scrolling globally
  useLenis();

  // Listen to open-ai-chat event from Navbar or other triggers and navigate to full page
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const msg = customEvent.detail?.message;
      setIsSearchOpen(false);
      if (msg) {
        navigate(`/ask?q=${encodeURIComponent(msg)}`, { state: { from: location.pathname } });
      } else {
        navigate("/ask", { state: { from: location.pathname } });
      }
    };
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, [navigate]);

  // Close AI Chat Modal when navigating away
  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname]);

  const hideLayout = 
    location.pathname.startsWith("/admin") || 
    location.pathname === "/admin-login" ||
    location.pathname === "/session-booking" ||
    location.pathname === "/book" ||
    location.pathname === "/booking" ||
    location.pathname === "/ask" ||
    location.pathname === "/ai" ||
    location.pathname === "/ask-ai";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* Reset scroll position on route change */}
      <ScrollToTop />

        {/* Layout Components */}
        {!hideLayout && (
          <Navbar isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
        )}

        {/* Floating Theme Toggle (Bottom Right Corner) */}
        <ThemeToggle />

        {/* Full-viewport background blur & tint search overlay */}
        {!hideLayout && location.pathname !== "/ask" && (
          <AISearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}

        {/* Gemini AI Interactive Chat Modal */}
        {!hideLayout && location.pathname !== "/ask" && (
          <AIChatModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="flex-1 flex flex-col"
              >
                <Routes location={location}>
                  <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                  <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                  <Route path="/projects" element={<PageWrapper><Projects /></PageWrapper>} />
                  <Route path="/project/:id" element={<PageWrapper><ProjectDetail /></PageWrapper>} />
                  <Route path="/resume" element={<PageWrapper><Resume /></PageWrapper>} />
                  <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />
                  <Route path="/blog/:id" element={<PageWrapper><BlogDetail /></PageWrapper>} />
                  <Route path="/blogs" element={<Navigate to="/blog" replace />} />
                  <Route path="/field-notes" element={<PageWrapper><FieldNotes /></PageWrapper>} />
                  <Route path="/notes" element={<Navigate to="/field-notes" replace />} />
                  <Route path="/contact" element={<Navigate to="/" replace />} />
                  <Route path="/testimonials" element={<PageWrapper><Testimonials /></PageWrapper>} />
                  <Route path="/ask" element={<AskAI />} />
                  <Route path="/ai" element={<Navigate to="/ask" replace />} />
                  <Route path="/ask-ai" element={<Navigate to="/ask" replace />} />
                  <Route path="/submit-testimonial" element={<PageWrapper><SubmitTestimonial /></PageWrapper>} />
                  <Route path="/testimonials/submit" element={<PageWrapper><SubmitTestimonial /></PageWrapper>} />
                  <Route path="/coming-soon" element={<PageWrapper><ComingSoon /></PageWrapper>} />
                  <Route path="/subscribe" element={<Navigate to="/coming-soon" replace />} />
                  <Route path="/session-booking" element={<SessionBookingPage />} />
                  <Route path="/book" element={<SessionBookingPage />} />
                  <Route path="/booking" element={<SessionBookingPage />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/backgrounds" element={<AdminBackgroundManager />} />
                  <Route path="/admin/arrange-featured-projects" element={<AdminArrangeFeaturedProjects />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {!hideLayout && <Footer />}
        </div>
    </div>
  );
}
