import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import ContactModal from "../components/contact/ContactModal";

interface ContactModalContextType {
  isOpen: boolean;
  openContact: () => void;
  closeContact: () => void;
}

const ContactModalContext = createContext<ContactModalContextType | undefined>(undefined);

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openContact = () => {
    setIsOpen(true);
  };

  const closeContact = () => {
    setIsOpen(false);
  };

  // Global event listener so buttons, links, or AI chat actions can trigger the contact popup
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener("open-contact-modal", handleOpenEvent);
    return () => {
      window.removeEventListener("open-contact-modal", handleOpenEvent);
    };
  }, []);

  return (
    <ContactModalContext.Provider value={{ isOpen, openContact, closeContact }}>
      {children}
      <ContactModal isOpen={isOpen} onClose={closeContact} />
    </ContactModalContext.Provider>
  );
}

export function useContactModal() {
  const context = useContext(ContactModalContext);
  if (context === undefined) {
    throw new Error("useContactModal must be used within a ContactModalProvider");
  }
  return context;
}
