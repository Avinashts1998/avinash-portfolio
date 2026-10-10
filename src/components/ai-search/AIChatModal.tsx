import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, X, User, Key, RefreshCw, Copy, Check, Square, Mic, MicOff, ArrowUpRight, FolderKanban } from "lucide-react";
import Icons8AIIcon from "../icons/Icons8AIIcon";
import { useScrollLock } from "../../hooks/useScrollLock";
import { dataStore, Project } from "../../utils/dataStore";
import { projectService } from "../../services/projectService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import { getFeederAnswerDetails, findFeederAnswer } from "../../feeders/ai-feeder-predata";

function AISparkleIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <Icons8AIIcon
      size={size}
      className={`animate-breathe shrink-0 ${className}`.trim()}
    />
  );
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SUGGESTED_PROMPTS = [
  "Why should we hire him for a Senior Product Designer role?",
  "What kind of designer is he and what are his core strengths?",
  "Can you summarize his experience at Starlfinx Fintech and key contributions?",
  "Show me his most impactful projects and what he achieved.",
  "How does he approach problem-solving and product thinking?",
  "What is his experience with AI in design workflows and products?",
  "How does he collaborate with engineers and product teams?",
];

// Simple helper to format basic Markdown (bold, lists, line breaks) into JSX
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
    <div className="space-y-3.5 text-xs sm:text-sm font-sans leading-relaxed">
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
              className="my-2.5 space-y-1 bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3"
            >
              {lines.map((line, lIdx) => {
                const isDownArrow = line.trim() === "↓";
                if (isDownArrow) {
                  return (
                    <div key={lIdx} className="text-center text-[#2444f0] dark:text-[#4278ff] text-sm font-bold select-none">
                      ↓
                    </div>
                  );
                }
                return (
                  <div key={lIdx} className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <InlineFormatted text={line} />
                  </div>
                );
              })}
            </div>
          );
        }

        if (isBulletList) {
          return (
            <div key={bIdx} className="space-y-1.5 my-1.5">
              {lines.map((line, lIdx) => {
                const lineTrim = line.trim();
                if (!lineTrim) return null;

                const isMainBullet = /^[•●]\s+/.test(lineTrim);
                const isSubBullet = /^[\-\*]\s+/.test(lineTrim) || line.startsWith("  ") || line.startsWith("\t");
                const cleanLine = lineTrim.replace(/^[•●\-\*]\s+/, "").trim();

                if (isSubBullet) {
                  return (
                    <div key={lIdx} className="pl-4 text-neutral-600 dark:text-neutral-300 text-xs flex items-start gap-2">
                      <span className="text-neutral-400 dark:text-neutral-500 mt-1 select-none text-[10px]">•</span>
                      <span className="flex-1 leading-relaxed">
                        <InlineFormatted text={cleanLine} />
                      </span>
                    </div>
                  );
                }

                if (isMainBullet) {
                  return (
                    <div key={lIdx} className="text-neutral-800 dark:text-neutral-200 flex items-start gap-2 pt-0.5">
                      <span className="text-[#2444f0] dark:text-[#4278ff] mt-1 shrink-0 select-none text-xs">●</span>
                      <span className="flex-1 leading-relaxed font-medium">
                        <InlineFormatted text={cleanLine} />
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={lIdx} className="pl-4 text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed">
                    <InlineFormatted text={lineTrim} />
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <p key={bIdx}>
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

export default function AIChatModal({ isOpen, onClose, initialQuery = "" }: AIChatModalProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>(() => dataStore.getProjects());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const predefinedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubProjects = projectService.subscribeToProjects((updated) => {
      if (updated && updated.length > 0) {
        setProjectsList(updated);
      }
    });

    const handleUpdate = () => {
      setProjectsList(dataStore.getProjects());
    };
    window.addEventListener("portfolio_data_update", handleUpdate);
    return () => {
      unsubProjects();
      window.removeEventListener("portfolio_data_update", handleUpdate);
    };
  }, []);

  const featuredProjects = projectsList.filter(
    (p) => p.homeItem !== false || p.isFeaturedOnHome || p.heroSection
  );
  const displayProjects = featuredProjects.length > 0 ? featuredProjects : projectsList;

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

  const handleStopGeneration = () => {
    if (predefinedTimeoutRef.current) {
      clearTimeout(predefinedTimeoutRef.current);
      predefinedTimeoutRef.current = null;
    }
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      if (predefinedTimeoutRef.current) {
        clearTimeout(predefinedTimeoutRef.current);
      }
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Stop background Lenis scrolling and lock body scroll when modal is open
  useScrollLock(isOpen);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Trigger initial query if passed
  useEffect(() => {
    if (isOpen && initialQuery.trim() && messages.length === 0) {
      handleSendMessage(initialQuery.trim());
    }
  }, [isOpen, initialQuery]);

  // Listen for custom trigger event
  useEffect(() => {
    const handleOpenAiChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const msg = customEvent.detail?.message;
      if (msg) {
        handleSendMessage(msg);
      }
    };

    window.addEventListener("open-ai-chat", handleOpenAiChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenAiChat);
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    if (isLoading) {
      handleStopGeneration();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (predefinedTimeoutRef.current) {
      clearTimeout(predefinedTimeoutRef.current);
      predefinedTimeoutRef.current = null;
    }

    const feederMatch = getFeederAnswerDetails(queryText);
    if (feederMatch) {
      setIsLoading(true);

      predefinedTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        predefinedTimeoutRef.current = null;

        const aiMessageId = (Date.now() + 1).toString();
        const fullAnswer = feederMatch.answer;
        const allLines = fullAnswer.split("\n");

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
          return;
        }

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
            return;
          }

          let nextChunk = allLines[currentLineIdx];
          currentLineIdx++;

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

          if (currentLineIdx >= allLines.length) {
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
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
          // Clean raw JSON or ApiError strings if present
          if (errorDisplay.includes("503") || errorDisplay.includes("high demand") || errorDisplay.includes("UNAVAILABLE")) {
            errorDisplay = "The AI service is experiencing temporary high demand on Google's servers. Please try again in a few moments.";
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
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: "_Response generation stopped._",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
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
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="ai-chat-modal"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl lg:max-w-6xl h-[92vh] max-h-[820px] bg-[var(--card)] border border-[var(--line)] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-scale-up"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg)]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--blue-tint)] text-[var(--blue)] border border-[var(--blue)]/30 flex items-center justify-center shrink-0">
              <AISparkleIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-hero font-bold text-[var(--ink)]">
                Ask Avinash's AI Assistant
              </h2>
              <p className="text-[11px] text-[var(--ink-soft)] font-sans">
                Driven by AI • Real-time knowledge on projects, skills & experience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 sm:p-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[var(--blue-tint)] text-[var(--blue)] border border-[var(--blue)]/30 flex items-center justify-center shrink-0">
                <AISparkleIcon size={28} />
              </div>

              <div className="max-w-md space-y-1">
                <h3 className="text-base sm:text-lg font-hero font-bold text-[var(--ink)]">
                  How can I help you explore Avinash's work?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
                  Ask me anything about his experience as a Senior Product Designer, design systems expertise, or featured project case studies.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div className={`shrink-0 h-fit pt-1.5 ${
                      msg.isError
                        ? "text-amber-500"
                        : "text-[var(--blue)]"
                    }`}>
                      {msg.isError ? <Key size={18} /> : <AISparkleIcon size={18} />}
                    </div>
                  )}

                  <div
                    className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed relative group ${
                      msg.sender === "user"
                        ? "bg-[var(--blue)] text-white rounded-tr-xs"
                        : msg.isError
                        ? "bg-amber-500/10 border border-amber-500/20 text-[var(--ink)] rounded-tl-xs"
                        : "bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] rounded-tl-xs"
                    }`}
                  >
                    <FormattedText text={msg.text} />

                    {msg.sender === "ai" && !msg.isError && displayProjects.length > 0 && (
                      <div className="mt-2.5">
                            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                              {displayProjects.slice(0, 6).map((proj) => {
                                const img = proj.thumbnail?.[0]
                                  ? getOptimizedImageUrl(proj.thumbnail[0], 400)
                                  : "";
                                return (
                                  <button
                                    key={proj.id}
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      navigate(`/project/${proj.id}`);
                                    }}
                                    className="w-[260px] sm:w-[300px] shrink-0 bg-[var(--card)] hover:bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--blue)]/60 rounded-2xl p-3 text-left transition-all duration-300 group cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--blue)]/5 hover:-translate-y-0.5"
                                  >
                                    <div>
                                      <div className="w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800/80 mb-2.5 relative group/img">
                                        {img ? (
                                          <img
                                            src={img}
                                            alt={proj.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[var(--ink-soft)] bg-[var(--line)]/40">
                                            <FolderKanban size={24} />
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 group-hover:opacity-40 transition-opacity" />
                                      </div>

                                      <div className="px-0.5">
                                        <h4 className="text-xs sm:text-[13px] font-semibold text-[var(--ink)] line-clamp-1 group-hover:text-[var(--blue)] transition-colors mb-1">
                                          {proj.title}
                                        </h4>
                                        <p className="text-[11px] text-[var(--ink-soft)] line-clamp-2 leading-relaxed">
                                          {proj.description || proj.shortDetails || "Explore full design process & key takeaways."}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-[var(--line)]/60 flex items-center justify-between text-[10px] font-medium text-[var(--blue)] px-0.5">
                                      <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        Explore Work
                                      </span>
                                      <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                  </div>

                  {msg.sender === "user" && (
                    <div className="p-2 rounded-xl bg-[var(--line)] text-[var(--ink-soft)] shrink-0 h-fit">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start items-center text-xs text-[var(--ink-soft)]">
                  <div className="shrink-0 h-fit pt-1 text-[var(--blue)]">
                    <AISparkleIcon size={18} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-[var(--bg)] border border-[var(--line)] flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-[var(--blue)]" />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Modal Input Footer */}
        <div className="p-3 sm:p-4 bg-[var(--bg)]/50 shrink-0 space-y-2.5">
          {/* Suggested Chat Chips Marquee */}
          <div className="w-full overflow-hidden pb-1 px-0.5">
            <div className="animate-marquee-slow flex items-center gap-2">
              {[...SUGGESTED_PROMPTS, ...SUGGESTED_PROMPTS].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--line)]/40 hover:border-[var(--blue)]/60 hover:bg-[var(--blue-tint)] text-[11px] sm:text-xs text-[var(--ink)] font-sans transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <AISparkleIcon size={12} className="text-[var(--blue)] shrink-0" />
                  <span className="whitespace-nowrap">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isLoading) {
                handleStopGeneration();
              } else {
                handleSendMessage();
              }
            }}
            className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-1.5 sm:p-2 focus-within:border-[var(--blue)] focus-within:ring-3 focus-within:ring-[var(--blue)]/15 transition-all duration-200"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Avinash's experience, case studies, or skills..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[var(--ink)] placeholder-[var(--ink-soft)] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none no-focus-outline font-sans"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
                isListening
                  ? "bg-red-500 text-white"
                  : "bg-transparent text-[var(--ink-soft)] hover:text-[var(--blue)] hover:bg-[var(--blue-tint)]"
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak to AI"}
            >
              {isListening ? (
                <div className="flex items-center gap-1">
                  {/* Clean audio frequency waveform bars */}
                  <span className="w-0.5 h-2.5 bg-white/90 rounded-full animate-bounce [animation-duration:600ms] [animation-delay:-0.3s]" />
                  <span className="w-0.5 h-4 bg-white rounded-full animate-bounce [animation-duration:500ms] [animation-delay:-0.15s]" />
                  <Mic size={15} />
                  <span className="w-0.5 h-4 bg-white rounded-full animate-bounce [animation-duration:500ms] [animation-delay:-0.15s]" />
                  <span className="w-0.5 h-2.5 bg-white/90 rounded-full animate-bounce [animation-duration:600ms] [animation-delay:-0.3s]" />
                </div>
              ) : (
                <Mic size={16} />
              )}
            </button>
            {isLoading ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-colors flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
                title="Stop generation"
              >
                <Square size={13} className="fill-current shrink-0" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-hover)] disabled:opacity-40 text-white text-xs font-sans font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Send</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
