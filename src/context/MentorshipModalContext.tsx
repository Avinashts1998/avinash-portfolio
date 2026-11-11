import React, { createContext, useContext, useState, ReactNode } from "react";
import { sessionConfigService } from "../services/sessionConfigService";

interface MentorshipModalContextType {
  isOpen: boolean;
  openMentorship: (customUrl?: string) => void;
  closeMentorship: () => void;
}

const MentorshipModalContext = createContext<MentorshipModalContextType | undefined>(undefined);

export function MentorshipModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openMentorship = (customUrl?: string) => {
    // Direct navigation to the configured external session booking website URL
    sessionConfigService.navigateToBooking(customUrl);
  };

  const closeMentorship = () => {
    setIsOpen(false);
  };

  return (
    <MentorshipModalContext.Provider value={{ isOpen, openMentorship, closeMentorship }}>
      {children}
    </MentorshipModalContext.Provider>
  );
}

export function useMentorshipModal() {
  const context = useContext(MentorshipModalContext);
  if (context === undefined) {
    throw new Error("useMentorshipModal must be used within a MentorshipModalProvider");
  }
  return context;
}
