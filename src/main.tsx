import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/google-sans-flex";
import "@fontsource/google-sans-flex/400.css";
import "@fontsource/google-sans-flex/500.css";
import "@fontsource/google-sans-flex/600.css";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext";
import { LoaderProvider } from "./context/LoaderContext";
import { ResumeModalProvider } from "./context/ResumeModalContext";
import { ContactModalProvider } from "./context/ContactModalContext";
import { MentorshipModalProvider } from "./context/MentorshipModalContext";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <LoaderProvider>
        <BrowserRouter>
          <ResumeModalProvider>
            <ContactModalProvider>
              <MentorshipModalProvider>
                <App />
              </MentorshipModalProvider>
            </ContactModalProvider>
          </ResumeModalProvider>
        </BrowserRouter>
      </LoaderProvider>
    </ThemeProvider>
  </StrictMode>,
);
