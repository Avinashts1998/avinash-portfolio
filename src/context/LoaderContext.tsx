import { createContext, useContext, useState, ReactNode } from "react";

// Track session-level completion of preloading in memory
let hasLoadedInSession = false;

interface LoaderContextType {
  isLoaded: boolean;
  completeLoader: () => void;
  hasLoadedInSession: boolean;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const completeLoader = () => {
    hasLoadedInSession = true;
    try {
      sessionStorage.removeItem("splash_screen_shown");
    } catch {}
    setIsLoaded(true);
  };

  return (
    <LoaderContext.Provider value={{ isLoaded, completeLoader, hasLoadedInSession }}>
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
}
