import React, { createContext, useContext, useState, ReactNode } from "react";
import ResumeModal from "../components/resume/ResumeModal";
import { useScrollLock } from "../hooks/useScrollLock";

interface ResumeModalContextType {
  isOpen: boolean;
  openResume: () => void;
  closeResume: () => void;
}

const ResumeModalContext = createContext<ResumeModalContextType | undefined>(undefined);

export function ResumeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openResume = () => {
    setIsOpen(true);
  };

  const closeResume = () => {
    setIsOpen(false);
  };

  // Prevent scroll and coordinate Lenis when modal is open
  useScrollLock(isOpen);

  return (
    <ResumeModalContext.Provider value={{ isOpen, openResume, closeResume }}>
      {children}
      <ResumeModal isOpen={isOpen} onClose={closeResume} />
    </ResumeModalContext.Provider>
  );
}

export function useResumeModal() {
  const context = useContext(ResumeModalContext);
  if (context === undefined) {
    throw new Error("useResumeModal must be used within a ResumeModalProvider");
  }
  return context;
}
