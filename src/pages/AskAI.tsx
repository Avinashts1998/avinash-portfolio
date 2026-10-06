import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Send,
  Copy,
  Check,
  Mic,
  ArrowUpRight,
  FolderKanban,
} from "lucide-react";
import { dataStore, Project } from "../utils/dataStore";
import { projectService } from "../services/projectService";
import { getOptimizedImageUrl } from "../utils/cloudinary";
import { useScrollLock } from "../hooks/useScrollLock";
import { getFeederAnswerDetails, findFeederAnswer } from "../feeders/ai-feeder-predata";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isError?: boolean;
}

// Dynamic suggestions generator based on current topic
function getDynamicSuggestions(query: string): string[] {
  const q = (query || "").toLowerCase();

  if (q.includes("starlfinx") || q.includes("experience") || q.includes("contribution") || q.includes("work")) {
    return [
      "Can you summarize his experience at Starlfinx Fintech and key contributions?",
      "Show me his most impactful projects and what he achieved.",
      "What kind of designer is he and what are his core strengths?",
      "How does he approach problem-solving and product thinking?",
      "How does he collaborate with engineers and product teams?",
    ];
  }

  if (q.includes("hire") || q.includes("senior") || q.includes("role") || q.includes("fit")) {
    return [
      "Why should we hire him for a Senior Product Designer role?",
      "What kind of designer is he and what are his core strengths?",
      "Can you summarize his experience at Starlfinx Fintech and key contributions?",
      "How does he collaborate with engineers and product teams?",
      "What is his experience with AI in design workflows and products?",
    ];
  }

  if (q.includes("philosophy") || q.includes("strength") || q.includes("thinking") || q.includes("problem")) {
    return [
      "What kind of designer is he and what are his core strengths?",
      "How does he approach problem-solving and product thinking?",
      "Why should we hire him for a Senior Product Designer role?",
      "Show me his most impactful projects and what he achieved.",
      "How does he collaborate with engineers and product teams?",
    ];
  }

  if (q.includes("project") || q.includes("finpay") || q.includes("pulsepay") || q.includes("cardx")) {
    return [
      "Show me his most impactful projects and what he achieved.",
      "Can you summarize his experience at Starlfinx Fintech and key contributions?",
      "What is his experience with AI in design workflows and products?",
      "How does he approach problem-solving and product thinking?",
      "Why should we hire him for a Senior Product Designer role?",
    ];
  }

  return [
    "Why should we hire him for a Senior Product Designer role?",
    "What kind of designer is he and what are his core strengths?",
    "Can you summarize his experience at Starlfinx Fintech and key contributions?",
    "Show me his most impactful projects and what he achieved.",
    "How does he approach problem-solving and product thinking?",
    "What is his experience with AI in design workflows and products?",
    "How does he collaborate with engineers and product teams?",
  ];
}

// Helper to determine dynamic "In a nutshell" statement matching the video
function getNutshellHeadline(query: string, replyText?: string): { lead: string; highlight: string; trail: string } {
  const q = (query || "").toLowerCase();

  if (q.includes("experience") || q.includes("contribution") || q.includes("adobe") || q.includes("summary")) {
    return {
      lead: "Avinash's ",
      highlight: "impactful",
      trail: " contributions include designing flagship enterprise products, token-driven design systems, and enhancing onboarding.",
    };
  }

  if (q.includes("philosophy") || q.includes("values") || q.includes("centricity") || q.includes("thinking") || q.includes("approach")) {
    return {
      lead: "Avinash's design philosophy emphasizes ",
      highlight: "user-centricity",
      trail: " and measurable impact for intuitive, effective solutions.",
    };
  }

  if (q.includes("hire") || q.includes("senior") || q.includes("role") || q.includes("fit") || q.includes("why")) {
    return {
      lead: "Avinash's proven ",
      highlight: "experience",
      trail: " and ownership make him the top choice for senior product design roles.",
    };
  }

  if (q.includes("system") || q.includes("token") || q.includes("ai") || q.includes("workflow")) {
    return {
      lead: "Building ",
      highlight: "scalable systems",
      trail: " and AI-powered workflows that bridge design with enterprise engineering.",
    };
  }

  if (q.includes("project") || q.includes("case study") || q.includes("portfolio")) {
    return {
      lead: "End-to-end design execution that directly drives ",
      highlight: "measurable impact",
      trail: " and high user adoption.",
    };
  }

  return {
    lead: "Avinash's proven ",
    highlight: "experience",
    trail: " and ownership make him the top choice for senior product design roles.",
  };
}

interface HeadlinePart {
  text: string;
  isHighlight?: boolean;
}

interface HeadlineLine {
  parts: HeadlinePart[];
}

function getNutshellLines(query: string, _replyText?: string): HeadlineLine[] {
  const q = (query || "").toLowerCase();

  if (q.includes("system") || q.includes("token") || q.includes("ai") || q.includes("workflow")) {
    return [
      { parts: [{ text: "Architecting " }, { text: "scalable systems", isHighlight: true }] },
      { parts: [{ text: "and AI-powered workflows" }] },
      { parts: [{ text: "that bridge design with" }] },
      { parts: [{ text: "enterprise engineering." }] },
    ];
  }

  if (q.includes("impact") || q.includes("experience") || q.includes("contribution") || q.includes("adobe") || q.includes("summary")) {
    return [
      { parts: [{ text: "Avinash's " }, { text: "impactful", isHighlight: true }, { text: " work" }] },
      { parts: [{ text: "spans flagship enterprise apps," }] },
      { parts: [{ text: "token-driven design systems," }] },
      { parts: [{ text: "and high-growth products." }] },
    ];
  }

  if (q.includes("philosophy") || q.includes("values") || q.includes("centricity") || q.includes("thinking") || q.includes("approach")) {
    return [
      { parts: [{ text: "Design philosophy rooted in" }] },
      { parts: [{ text: "user-centricity", isHighlight: true }, { text: " and craft," }] },
      { parts: [{ text: "delivering intuitive, measurable" }] },
      { parts: [{ text: "solutions for complex workflows." }] },
    ];
  }

  if (q.includes("project") || q.includes("case study") || q.includes("portfolio")) {
    return [
      { parts: [{ text: "End-to-end design execution" }] },
      { parts: [{ text: "that drives " }, { text: "measurable impact", isHighlight: true }] },
      { parts: [{ text: "and high user adoption" }] },
      { parts: [{ text: "across global platforms." }] },
    ];
  }

  if (q.includes("collaborat") || q.includes("engineer") || q.includes("handoff") || q.includes("team")) {
    return [
      { parts: [{ text: "Bridging product vision with" }] },
      { parts: [{ text: "engineering execution", isHighlight: true }, { text: " and craft," }] },
      { parts: [{ text: "reducing dev rework by 25%" }] },
      { parts: [{ text: "and handoff gaps by 30%." }] },
    ];
  }

  if (q.includes("starlfinx") || q.includes("fintech") || q.includes("payflow") || q.includes("finpay") || q.includes("cardx") || q.includes("trustshield") || q.includes("pulsepay")) {
    return [
      { parts: [{ text: "Fintech product design at" }] },
      { parts: [{ text: "Starlfinx Technologies", isHighlight: true }, { text: " in Dubai," }] },
      { parts: [{ text: "slashing payment drop-offs by 45%" }] },
      { parts: [{ text: "and onboarding friction by 50%." }] },
    ];
  }

  // Default / Senior role
  return [
    { parts: [{ text: "Avinash's proven " }, { text: "experience", isHighlight: true }] },
    { parts: [{ text: "and ownership make him" }] },
    { parts: [{ text: "the top choice for senior" }] },
    { parts: [{ text: "product design roles." }] },
  ];
}

// Simple helper to format Markdown (bold, lists, line breaks, arrows) into clean JSX
function FormattedText({ text }: { text: string }) {
  const sanitizedText = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^#{1,6}\s+/.test(trimmed)) {
        const title = trimmed.replace(/^#{1,6}\s+/, "");
        return title.startsWith("**") ? title : `**${title}**`;
      }
      return line;
    })
    .join("\n");

  const blocks = sanitizedText.split(/\n\n+/);

  return (
    <div className="space-y-4 text-xs sm:text-[13.5px] font-normal text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split("\n");
        const isBulletList = lines.some((l) => /^[•●\-\*]\s+/.test(l.trim()));
        const isWorkflowSequence = lines.some((l) => l.trim().includes("→") || l.trim() === "↓");

        if (isWorkflowSequence) {
          return (
            <div
              key={bIdx}
              className="my-3 space-y-1.5 bg-neutral-100/70 dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5"
            >
              {lines.map((line, lIdx) => {
                const isDownArrow = line.trim() === "↓";
                if (isDownArrow) {
                  return (
                    <div key={lIdx} className="text-center text-[#2444f0] dark:text-[#4278ff] text-sm font-medium select-none py-0.5">
                      ↓
                    </div>
                  );
                }
                return (
                  <div key={lIdx} className="text-xs sm:text-[13px] font-normal text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <InlineFormatted text={line} />
                  </div>
                );
              })}
            </div>
          );
        }

        if (isBulletList) {
          return (
            <div key={bIdx} className="space-y-2 my-2">
              {lines.map((line, lIdx) => {
                const lineTrim = line.trim();
                if (!lineTrim) return null;

                const isMainBullet = /^[•●]\s+/.test(lineTrim);
                const isSubBullet = /^[\-\*]\s+/.test(lineTrim) || line.startsWith("  ") || line.startsWith("\t");
                const cleanLine = lineTrim.replace(/^[•●\-\*]\s+/, "").trim();

                if (isSubBullet) {
                  return (
                    <div key={lIdx} className="pl-5 text-neutral-700 dark:text-neutral-300 text-[12.5px] sm:text-[13px] font-normal flex items-start gap-2 animate-line-reveal">
                      <span className="text-neutral-400 dark:text-neutral-500 mt-1 select-none text-[10px]">•</span>
                      <span className="flex-1 leading-relaxed">
                        <InlineFormatted text={cleanLine} />
                      </span>
                    </div>
                  );
                }

                if (isMainBullet) {
                  return (
                    <div key={lIdx} className="text-neutral-900 dark:text-neutral-100 flex items-start gap-2.5 pt-0.5 font-normal animate-line-reveal">
                      <span className="text-[#2444f0] dark:text-[#4278ff] mt-1 shrink-0 select-none text-xs">●</span>
                      <span className="flex-1 leading-relaxed">
                        <InlineFormatted text={cleanLine} />
                      </span>
                    </div>
                  );
                }

                // If not starting with a bullet, it's a description paragraph under the bullet point
                return (
                  <div key={lIdx} className="pl-5 text-neutral-700 dark:text-neutral-300 text-xs sm:text-[13px] font-normal leading-relaxed animate-line-reveal">
                    <InlineFormatted text={lineTrim} />
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <p key={bIdx} className="leading-relaxed font-normal animate-line-reveal">
            <InlineFormatted text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

function InlineFormatted({ text }: { text: string }) {
  const cleanText = text.replace(/#{1,6}\s*/g, "");
  const parts = cleanText.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-medium text-black dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <em key={i} className="italic font-normal text-neutral-800 dark:text-neutral-200">
              {part.slice(1, -1)}
            </em>
          );
        }

        // Auto-detect key prefix labels like "Impact:", "Achievements:", "Outcome:" if not already markdown-bolded
        const colonMatch = part.match(/^([A-Za-z0-9\s–\-]{2,30}:)(\s+.*)?$/);
        if (colonMatch && i === 0) {
          return (
            <span key={i} className="font-normal">
              <strong className="font-medium text-black dark:text-white">
                {colonMatch[1]}
              </strong>
              {colonMatch[2] || ""}
            </span>
          );
        }

        return <span key={i} className="font-normal">{part}</span>;
      })}
    </>
  );
}

export default function AskAI() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  // Completely lock whole-page and document scroll while on /ask
  useScrollLock(true);

  const [currentQuery, setCurrentQuery] = useState(
    queryParam || "Can you summarize his experience at Adobe and key contributions?"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>(() => dataStore.getProjects());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const activeFetchQueryRef = useRef<string | null>(null);
  const completedQueriesRef = useRef<Set<string>>(new Set());
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const predefinedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to real-time project list
  useEffect(() => {
    const unsub = projectService.subscribeToProjects((updated) => {
      if (updated && updated.length > 0) {
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

  const featuredProjects = useMemo(() => {
    const filtered = projectsList.filter(
      (p) => p.homeItem !== false || p.isFeaturedOnHome || p.heroSection
    );
    return filtered.length > 0 ? filtered : projectsList;
  }, [projectsList]);

  const handleStopGeneration = () => {
    if (predefinedTimeoutRef.current) {
      clearTimeout(predefinedTimeoutRef.current);
      predefinedTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    activeFetchQueryRef.current = null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    if (predefinedTimeoutRef.current) {
      clearTimeout(predefinedTimeoutRef.current);
      predefinedTimeoutRef.current = null;
    }

    // If already generating or streaming, halt previous and proceed with new query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setIsStreaming(false);

    activeFetchQueryRef.current = queryText;
    setCurrentQuery(queryText);

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === "user" && last.text === queryText) {
        return prev;
      }
      return [...prev, userMessage];
    });

    setInput("");
    setIsLoading(true);

    // Direct client lookup for authoritative questions from /src/feeders/ai-feeder-predata.tsx
    const feederMatch = getFeederAnswerDetails(queryText);
    if (feederMatch) {
      setIsLoading(true);
      setIsStreaming(false);

      if (predefinedTimeoutRef.current) {
        clearTimeout(predefinedTimeoutRef.current);
      }

      // Predefined Q&A simulated reasoning: up to 5s, distinct for each question
      predefinedTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        predefinedTimeoutRef.current = null;

        const aiMessageId = (Date.now() + 1).toString();
        const fullAnswer = feederMatch.answer;
        const allLines = fullAnswer.split("\n");

        // Grab first non-empty block/line to start
        let currentLineIdx = 0;
        let initialChunk = allLines[0] || "";
        currentLineIdx = 1;
        while (currentLineIdx < allLines.length && initialChunk.trim() === "") {
          initialChunk += "\n" + allLines[currentLineIdx];
          currentLineIdx++;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            sender: "ai",
            text: initialChunk,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        if (currentLineIdx >= allLines.length) {
          setIsStreaming(false);
          activeFetchQueryRef.current = null;
          return;
        }

        setIsStreaming(true);
        let accumulatedText = initialChunk;

        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
        }

        streamingIntervalRef.current = setInterval(() => {
          if (currentLineIdx >= allLines.length) {
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
            setIsStreaming(false);
            activeFetchQueryRef.current = null;
            return;
          }

          let nextChunk = allLines[currentLineIdx];
          currentLineIdx++;

          // Grab any consecutive empty lines with the next line so pauses don't stall
          while (currentLineIdx < allLines.length && nextChunk.trim() === "") {
            nextChunk += "\n" + allLines[currentLineIdx];
            currentLineIdx++;
          }

          accumulatedText += "\n" + nextChunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
            )
          );

          if (chatScrollContainerRef.current) {
            const el = chatScrollContainerRef.current;
            el.scrollTo({
              top: el.scrollHeight,
              behavior: "smooth",
            });
          }

          if (currentLineIdx >= allLines.length) {
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
            setIsStreaming(false);
            activeFetchQueryRef.current = null;
          }
        }, 70);
      }, feederMatch.durationMs);

      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === "NO_API_KEY") {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: "ai",
              text: "🔑 **Gemini API Key Required**\n\nTo use the Google Gemini AI Portfolio Assistant, please add your `GEMINI_API_KEY` in the **Settings > Secrets** panel of AI Studio.\n\nOnce added, ask your question again!",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isError: true,
            },
          ]);
        } else {
          let errorDisplay = data.message || "Failed to generate response.";
          if (
            errorDisplay.includes("503") ||
            errorDisplay.includes("high demand") ||
            errorDisplay.includes("UNAVAILABLE")
          ) {
            errorDisplay =
              "The AI service is experiencing temporary high demand on Google's servers. Please try again in a few moments.";
          } else if (errorDisplay.includes("429") || errorDisplay.includes("quota")) {
            errorDisplay = "Rate limit reached. Please wait a moment before trying again.";
          }

          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: "ai",
              text: `⚠️ **AI Notice**: ${errorDisplay}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isError: true,
            },
          ]);
        }
        setIsLoading(false);
      } else {
        const fullReply = data.reply || "";
        const aiMessageId = (Date.now() + 1).toString();
        const allLines = fullReply.split("\n");

        let currentLineIdx = 0;
        let accumulatedText = "";

        // Advance to first non-empty block
        while (currentLineIdx < allLines.length && accumulatedText.trim() === "") {
          accumulatedText += (accumulatedText ? "\n" : "") + allLines[currentLineIdx];
          currentLineIdx++;
        }

        // Add the response card with the first line immediately
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            sender: "ai",
            text: accumulatedText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        setIsLoading(false);

        if (currentLineIdx >= allLines.length) {
          setIsStreaming(false);
          completedQueriesRef.current.add(queryText);
        } else {
          setIsStreaming(true);

          streamingIntervalRef.current = setInterval(() => {
            if (currentLineIdx >= allLines.length) {
              if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
                streamingIntervalRef.current = null;
              }
              setIsStreaming(false);
              completedQueriesRef.current.add(queryText);
              return;
            }

            let nextChunk = allLines[currentLineIdx];
            currentLineIdx++;

            // If empty spacing line, grab next line as well to avoid empty pauses
            while (currentLineIdx < allLines.length && nextChunk.trim() === "") {
              nextChunk += "\n" + allLines[currentLineIdx];
              currentLineIdx++;
            }

            accumulatedText += "\n" + nextChunk;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
              )
            );

            if (chatScrollContainerRef.current) {
              const el = chatScrollContainerRef.current;
              el.scrollTo({
                top: el.scrollHeight,
                behavior: "smooth",
              });
            }

            if (currentLineIdx >= allLines.length) {
              if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
                streamingIntervalRef.current = null;
              }
              setIsStreaming(false);
              completedQueriesRef.current.add(queryText);
            }
          }, 40);
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat request cancelled for query:", queryText);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: "⚠️ **Network Error**: Unable to connect to the Gemini AI backend. Please check your connection and try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isError: true,
          },
        ]);
      }
      setIsLoading(false);
    } finally {
      abortControllerRef.current = null;
      activeFetchQueryRef.current = null;
    }
  };

  // Process query from URL search param reliably on initial load & param updates
  useEffect(() => {
    const targetQ = (queryParam || "").trim();
    if (!targetQ) return;

    if (activeFetchQueryRef.current !== targetQ) {
      handleSendMessage(targetQ);
    }
  }, [queryParam]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (predefinedTimeoutRef.current) {
        clearTimeout(predefinedTimeoutRef.current);
        predefinedTimeoutRef.current = null;
      }
      activeFetchQueryRef.current = null;
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Smooth scroll within the chat container ONLY
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBackToPortfolio = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    handleStopGeneration();

    // 1. If we came from a known prior internal route (e.g. project detail page or specific section)
    const stateFrom = (location.state as any)?.from;
    if (stateFrom && typeof stateFrom === "string" && !stateFrom.startsWith("/ask")) {
      navigate(stateFrom);
      return;
    }

    // 2. If the user navigated within this session (React Router history state index > 0)
    const historyIdx = (window.history.state as any)?.idx;
    if (typeof historyIdx === "number" && historyIdx > 0) {
      navigate(-1);
      return;
    }

    // 3. Resilient fallback: always return cleanly to the main portfolio home
    navigate("/");
  };

  // Get the latest AI message for nutshell & project recommendation
  const latestAiMessage = [...messages].reverse().find((m) => m.sender === "ai");

  const isGenerating = isLoading || isStreaming;
  const hasAiCompletedResponse = messages.some((m) => m.sender === "ai" && !m.isError);
  const showContent = !isGenerating && hasAiCompletedResponse;

  const nutshell = useMemo(() => {
    return getNutshellHeadline(currentQuery, latestAiMessage?.text);
  }, [currentQuery, latestAiMessage]);

  const nutshellLines = useMemo(() => {
    return getNutshellLines(currentQuery, latestAiMessage?.text);
  }, [currentQuery, latestAiMessage]);

  const dynamicSuggestions = useMemo(() => {
    return getDynamicSuggestions(currentQuery);
  }, [currentQuery]);

  return (
    <div
      id="page-ask-ai"
      className="fixed inset-0 w-full h-[100dvh] h-screen overflow-hidden flex flex-col bg-[#fafaf9] dark:bg-[#0d0d0e] text-[var(--ink)] z-10 select-auto transition-colors selection:bg-[#2444f0]/20"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      {/* Dark mode overlay override for subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Header Row matching Video */}
      <header className="shrink-0 relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Rounded Pill Back Button */}
        <Link
          to="/"
          onClick={handleBackToPortfolio}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-850 text-xs font-sans font-medium text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-neutral-400 group select-none active:scale-95"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to portfolio</span>
        </Link>

        {/* Center: Consistent Font Sans Editorial Title with Primary Blue */}
        <div className="text-center absolute left-1/2 -translate-x-1/2 hidden md:block pointer-events-none">
          <h1 className="text-2xl lg:text-[28px] font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
            Ask AI about{" "}
            <span className="text-[#2444f0] dark:text-[#4278ff] font-sans">
              Avinash's work
            </span>
          </h1>
        </div>

        {/* Right: Spacer to keep title centered */}
        <div className="w-[140px] hidden sm:block pointer-events-none" />
      </header>

      {/* Mobile Title Display */}
      <div className="md:hidden px-5 pb-2 shrink-0 text-center relative z-10">
        <h1 className="text-xl font-sans font-bold text-neutral-900 dark:text-white tracking-tight">
          Ask AI about{" "}
          <span className="text-[#2444f0] dark:text-[#4278ff]">
            Avinash's work
          </span>
        </h1>
      </div>

      {/* Main Two-Column Viewport: Whole Page is LOCKED from scrolling */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-3 sm:pb-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch overflow-hidden">
        
        {/* LEFT COLUMN: Scrollable Chat Stream + Pinned Bottom Viewport Input */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Scrollable Conversation Stream ONLY */}
          <div
            ref={chatScrollContainerRef}
            data-lenis-prevent
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-2 no-scrollbar scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {messages.length === 0 && !isLoading && (
              <div className="w-full bg-white dark:bg-[#141416] border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-5 sm:p-7 shadow-xs">
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                  Ready to answer any questions about Avinash's product design projects, design system leadership, UX methodologies, and collaboration style. Select a question below or ask anything.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isLatestAi = msg.sender === "ai" && idx === messages.length - 1;

              return msg.sender === "user" ? (
                /* User Question Bubble with Primary Blue */
                <div key={msg.id} className="flex justify-end pt-2 pb-1">
                  <div className="bg-[#2444f0] dark:bg-[#2663FF] text-white px-4 sm:px-5 py-2.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm font-sans font-medium max-w-[90%] sm:max-w-[85%] shadow-sm leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* AI Response Card matching Video */
                <div
                  key={msg.id}
                  className="w-full bg-white dark:bg-[#141416] border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-5 sm:p-7 shadow-xs relative transition-all animate-fade-in"
                >
                  <FormattedText text={msg.text} />

                  {/* Project Preview Cards matching Video (shown once streaming completes) */}
                  {isLatestAi && !msg.isError && !isStreaming && featuredProjects.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-850 animate-fade-in">
                      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        {featuredProjects.slice(0, 4).map((proj) => {
                          const img = proj.thumbnail?.[0]
                            ? getOptimizedImageUrl(proj.thumbnail[0], 350)
                            : "";
                          return (
                            <Link
                              key={proj.id}
                              to={`/project/${proj.id}`}
                              className="group block rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-[#fbfbfa] dark:bg-neutral-900/60 p-2 sm:p-2.5 hover:border-[#2444f0]/60 dark:hover:border-[#4278ff]/60 hover:shadow-sm transition-all text-left"
                            >
                              <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-neutral-200/70 dark:bg-neutral-800 mb-2 relative">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={proj.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                    <FolderKanban size={18} />
                                  </div>
                                )}
                              </div>
                              <h4 className="text-[11px] sm:text-xs font-sans font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-[#2444f0] dark:group-hover:text-[#4278ff] transition-colors truncate">
                                {proj.title}
                              </h4>
                              <div className="mt-1 flex items-center text-[10px] text-neutral-400 group-hover:text-[#2444f0] dark:group-hover:text-[#4278ff] transition-colors">
                                <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* In-flight Loading Indicator with Primary Blue */}
            {isLoading && (
              <div className="pt-1 pb-1 animate-fade-in">
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-blue-200/70 dark:border-blue-900/60 bg-white/95 dark:bg-[#141416] shadow-2xs">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-200 dark:border-blue-950 border-t-[#2444f0] dark:border-t-[#2663FF] animate-spin shrink-0" />
                  <span className="text-xs sm:text-sm font-sans text-neutral-700 dark:text-neutral-200 font-medium">
                    AI Thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* PINNED BOTTOM AREA: Always Visible at Viewport Bottom (Never scrolls out) */}
          <div className="shrink-0 pt-2 pb-1 space-y-2 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9] to-transparent dark:from-[#0d0d0e] dark:via-[#0d0d0e] z-10">
            {/* Pill Suggested Questions Row (Slowly scrolls horizontally, pauses on hover) */}
            <div
              className={`w-full overflow-hidden pb-1 no-scrollbar transition-opacity duration-300 relative select-none [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] ${
                isLoading || isStreaming ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <div className="animate-marquee-slow flex items-center gap-2">
                {[...dynamicSuggestions, ...dynamicSuggestions].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    disabled={isLoading || isStreaming}
                    className="px-3.5 py-1.5 rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900 text-xs font-sans text-neutral-700 dark:text-neutral-300 hover:text-[#2444f0] dark:hover:text-[#4278ff] hover:border-[#2444f0]/50 dark:hover:border-[#4278ff]/50 transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Capsule Input Bar matching Video */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isLoading || isStreaming) {
                  handleStopGeneration();
                } else {
                  handleSendMessage();
                }
              }}
              autoComplete="off"
              className="w-full rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 pl-4 pr-1.5 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2 transition-all duration-300 ease-out focus-within:border-neutral-850 dark:focus-within:border-neutral-300 focus-within:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.1),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:focus-within:shadow-[0_14px_36px_-6px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)] focus-within:ring-4 focus-within:ring-neutral-900/[0.035] dark:focus-within:ring-white/[0.045] focus-within:-translate-y-0.5"
            >
              <input
                ref={inputRef}
                name="ask_ai_search_query"
                type="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                aria-autocomplete="none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Avinash's work..."
                className="pill-input no-focus-outline flex-1 bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-none font-sans"
                style={{ outline: "none", boxShadow: "none" }}
              />

              {/* Mic voice dictation */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-red-500 text-white"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
                title={isListening ? "Listening... Click to stop" : "Voice input"}
              >
                {isListening ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-duration:500ms]" />
                    <Mic size={14} />
                    <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-duration:500ms] [animation-delay:-0.2s]" />
                  </div>
                ) : (
                  <Mic size={15} />
                )}
              </button>

              {/* Send Paper Airplane Button inside circular pill */}
              <button
                type="submit"
                disabled={isLoading || isStreaming || !input.trim()}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shrink-0 shadow-2xs active:scale-95 ${
                  isLoading || isStreaming || !input.trim()
                    ? "bg-neutral-100 dark:bg-neutral-850 text-neutral-400 cursor-not-allowed"
                    : "bg-neutral-200/80 dark:bg-neutral-800 hover:bg-[#2444f0] hover:text-white text-neutral-700 dark:text-neutral-200 cursor-pointer"
                }`}
                title="Send question"
              >
                <Send size={13} className="ml-0.5" />
              </button>
            </form>

            {/* Subtext under input matching video */}
            <p className="text-[10px] sm:text-[11px] font-sans text-neutral-400 dark:text-neutral-500 text-center select-none">
              AI generated responses may be inaccurate. Verify for accuracy.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Fixed with Black Blurred Circle during generation (matching Reference Image 2) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 lg:pl-12 xl:pl-20 flex-col justify-center h-full relative select-none">
          
          {/* Black blurred circle in light mode / subtle luminous circle in dark mode while loading */}
          <div
            className={`absolute left-1/2 top-1/2 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] pointer-events-none transition-all duration-700 ease-in-out ${
              !showContent
                ? "opacity-100 animate-ai-thinking-orb"
                : "opacity-0 -translate-x-1/2 -translate-y-1/2 scale-90 blur-[45px]"
            }`}
          >
            {/* Morphing inner layer */}
            <div className={`w-full h-full rounded-full ${!showContent ? "animate-ai-thinking-morph" : ""}`}>
              {/* Light mode black blurred circle matching Reference */}
              <div
                className="w-full h-full rounded-full dark:hidden"
                style={{
                  background: "radial-gradient(circle, rgba(15, 15, 15, 0.46) 0%, rgba(25, 25, 25, 0.32) 40%, rgba(35, 35, 35, 0.12) 62%, transparent 75%)",
                }}
              />
              {/* Dark mode luminous blurred circle */}
              <div
                className="w-full h-full rounded-full hidden dark:block"
                style={{
                  background: "radial-gradient(circle, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.16) 40%, rgba(255, 255, 255, 0.06) 62%, transparent 75%)",
                }}
              />
            </div>
          </div>

          {/* Statement Text: Fades out softly during loading/streaming, reveals with smooth line-by-line blur animation when response completes */}
          <div
            className={`space-y-4 relative z-10 max-w-[400px] transition-opacity duration-300 ${
              showContent
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <motion.span
              key={`nutshell-label-${currentQuery}`}
              initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
              animate={
                showContent
                  ? { opacity: 1, filter: "blur(0px)", y: 0 }
                  : { opacity: 0, filter: "blur(10px)", y: 10 }
              }
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.05,
              }}
              className="text-[11px] sm:text-xs font-sans font-normal text-neutral-400 dark:text-neutral-500 block mb-1 ml-[30px] pb-1 will-change-[filter,opacity,transform]"
            >
              In a nutshell
            </motion.span>

            <h2 className="text-2xl sm:text-[28px] lg:text-[31px] xl:text-[33px] font-sans font-bold text-neutral-900 dark:text-white tracking-tight leading-[1.28] max-w-[380px] pt-0 pb-[35px] ml-[30px] space-y-1">
              {nutshellLines.map((line, lineIdx) => (
                <motion.span
                  key={`line-${currentQuery}-${lineIdx}`}
                  initial={{ opacity: 0, filter: "blur(14px)", y: 16 }}
                  animate={
                    showContent
                      ? { opacity: 1, filter: "blur(0px)", y: 0 }
                      : { opacity: 0, filter: "blur(14px)", y: 16 }
                  }
                  transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.12 + lineIdx * 0.16,
                  }}
                  className="block will-change-[filter,opacity,transform]"
                >
                  {line.parts.map((part, partIdx) => (
                    <span
                      key={partIdx}
                      className={part.isHighlight ? "text-[#2444f0] dark:text-[#4278ff]" : ""}
                    >
                      {part.text}
                    </span>
                  ))}
                </motion.span>
              ))}
            </h2>
          </div>
        </div>
      </main>
    </div>
  );
}
