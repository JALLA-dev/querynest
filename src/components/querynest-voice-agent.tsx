"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AgentResponse } from "@/lib/ai-agent/sql-agent";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  suggestedSql?: string;
  suggestedTable?: string;
  provider?: string;
  timestamp: string;
}

export function QuerynestVoiceAgent() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [hasAiAccess, setHasAiAccess] = useState<boolean | null>(null);
  const [aiAccessMessage, setAiAccessMessage] = useState<string>("");
  const [greetingGiven, setGreetingGiven] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch logged-in user profile to wish them by name & check permission
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data?.user) {
          setUserName(data.user.name);
          if (data.user.role === "ADMIN") {
            setHasAiAccess(true);
          } else if (data.user.aiAccess) {
            setHasAiAccess(data.user.aiAccess.hasAccess);
            if (!data.user.aiAccess.hasAccess) {
              if (data.user.aiAccess.isExpired) {
                setAiAccessMessage(
                  `Your AI Agent access expired on ${new Date(
                    data.user.aiAccess.expiresAt
                  ).toLocaleDateString()}. Please contact your instructor to renew.`
                );
              } else {
                setAiAccessMessage(
                  "AI Agent & Voice Copilot requires instructor permission. Please contact your instructor to get access."
                );
              }
            }
          } else {
            setHasAiAccess(false);
            setAiAccessMessage("Please contact your instructor to get access.");
          }
        } else {
          setHasAiAccess(false);
          setAiAccessMessage(
            "Please log in and contact your instructor to unlock AI Agent access."
          );
        }
      } catch {
        setHasAiAccess(false);
        setAiAccessMessage("Please contact your instructor to get access.");
      }
    }
    loadUser();
  }, []);

  // Compute time-based wish
  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  // Generate personalized greeting when opened
  function handleOpen() {
    setIsOpen(true);
    if (!greetingGiven && messages.length === 0) {
      const timeWish = getTimeGreeting();
      const displayName = userName ? userName.split(" ")[0] : "Student";

      let welcomeText = `${timeWish}, ${displayName}! 👋 Welcome to **QueryNest**.\n\nI'm your personal SQL AI Tutor & Voice Assistant. You can ask me any SQL question, practice doubts, or tell me to write queries. You can also talk to me using voice! 🎙️`;

      if (hasAiAccess === false) {
        welcomeText = `${timeWish}, ${displayName}! 👋\n\n🔒 **AI Agent Access Restricted**\n\n${
          aiAccessMessage || "Please contact your instructor to unlock AI Agent access."
        }`;
      }

      const initialMsg: ChatMessage = {
        id: "welcome",
        sender: "agent",
        text: welcomeText,
        timestamp: "Just now",
      };
      setMessages([initialMsg]);
      setGreetingGiven(true);

      if (autoVoice && hasAiAccess !== false) {
        speakText(`${timeWish} ${displayName}! Welcome to QueryNest. I'm your SQL AI Tutor. How can I help you today?`);
      }
    }
  }

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Setup Speech Recognition (Speech-to-Text)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            setIsListening(false);
            handleSend(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [autoVoice, hasAiAccess]);

  // Voice toggle: start/stop speech recognition
  function toggleVoiceInput() {
    if (hasAiAccess === false) {
      alert("AI Agent access is locked. Please contact your instructor to get access.");
      return;
    }
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setIsListening(true);
      recognitionRef.current.start();
    }
  }

  // Text-to-Speech
  function speakText(textToSpeak: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = textToSpeak
      .replace(/```[\s\S]*?```/g, "Here is the SQL query shown below.")
      .replace(/[*_`#]/g, "")
      .replace(/💡|👋|⚡|✍️|🤖|🎙️|🔒/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }

  // Send question to AI Agent
  async function handleSend(promptText?: string) {
    const text = (promptText ?? input).trim();
    if (!text || loading) return;

    if (hasAiAccess === false) {
      setMessages((prev) => [
        ...prev,
        {
          id: `lock-${Date.now()}`,
          sender: "agent",
          text: `🔒 **Permission Required**\n\n${aiAccessMessage || "Please contact your instructor to unlock AI Agent access."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }

    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const data: AgentResponse & { hasAiAccess?: boolean; error?: string } = await res.json();

      if (res.status === 403 || data.hasAiAccess === false) {
        setHasAiAccess(false);
        setAiAccessMessage(
          data.reply || "Please contact your instructor to get access to the AI Agent."
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `denied-${Date.now()}`,
            sender: "agent",
            text:
              data.reply ||
              "🔒 **AI Agent Access Restricted**\n\nPlease contact your instructor or platform administrator to unlock access.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: data.reply || "Here is what I found for your query:",
        suggestedSql: data.suggestedSql,
        suggestedTable: data.suggestedTable,
        provider: data.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (autoVoice) {
        speakText(data.reply);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "agent",
          text: "⚠️ Sorry, I could not process your request. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Inject query to editor when on /practice page
  function injectQueryToPractice(sql: string, autoRun = false) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("querynest-inject-sql", {
        detail: { sql, autoRun },
      })
    );

    if (!pathname?.startsWith("/practice")) {
      window.location.href = `/practice?injectedQuery=${encodeURIComponent(sql)}`;
    }
  }

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <aside aria-label="QueryNest AI Voice Assistant" className="fixed bottom-6 right-6 z-50">
      {/* Floating QueryNest Logo Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleOpen}
            className="relative flex items-center justify-center size-14 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl shadow-emerald-950/40 ring-2 ring-emerald-500/40 transition-all duration-300 hover:scale-110 hover:ring-emerald-400 hover:shadow-emerald-500/30 active:scale-95 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-950 dark:ring-emerald-400/50"
            title="Open QueryNest AI Voice Tutor"
          >
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 blur-sm transition group-hover:opacity-60 animate-pulse" />

            <span className="relative font-black text-lg tracking-tight text-emerald-400 font-mono">
              QN
            </span>

            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span
                className={`relative inline-flex size-3 rounded-full border-2 border-slate-950 ${
                  hasAiAccess === false ? "bg-amber-500" : "bg-emerald-500"
                }`}
              ></span>
            </span>
          </button>

          <div className="pointer-events-none absolute bottom-16 right-0 w-48 rounded-xl border border-emerald-500/30 bg-slate-950/90 px-3 py-1.5 text-center text-xs text-white shadow-xl backdrop-blur-md opacity-0 transition group-hover:opacity-100">
            <p className="font-bold text-emerald-300">QueryNest AI Tutor</p>
            <p className="text-[10px] text-slate-400">
              {hasAiAccess === false
                ? "Permission required • Contact instructor"
                : userName
                ? `Click for personal help, ${userName.split(" ")[0]}!`
                : "Voice & SQL doubts assistant"}
            </p>
          </div>
        </div>
      )}

      {/* Expanded AI Voice Tutor Modal / Panel */}
      {isOpen && (
        <div className="flex flex-col w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] rounded-[2rem] border border-emerald-500/30 bg-white/95 shadow-2xl shadow-slate-950/25 backdrop-blur-xl animate-in zoom-in-95 duration-200 dark:border-emerald-500/20 dark:bg-slate-900/95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-emerald-400 shadow-md ring-1 ring-emerald-500/30 dark:bg-emerald-500/20">
                QN
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">
                    QueryNest AI
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      hasAiAccess === false
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {hasAiAccess === false ? "🔒 Locked" : "Voice Agent"}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {userName ? `Hi, ${userName}!` : "SQL Learning Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {hasAiAccess !== false && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setAutoVoice(!autoVoice);
                  }}
                  className={`rounded-xl p-2 text-xs transition ${
                    autoVoice
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title={autoVoice ? "Voice Read Aloud: ON" : "Voice Read Aloud: OFF"}
                >
                  {autoVoice ? "🔊" : "🔇"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Locked State Warning Banner */}
          {hasAiAccess === false && (
            <div className="m-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center dark:bg-amber-950/30">
              <span className="text-2xl block mb-1">🔒</span>
              <b className="text-xs font-black text-amber-900 dark:text-amber-200 block">
                Instructor Permission Required
              </b>
              <p className="mt-1 text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {aiAccessMessage ||
                  "AI Agent & Voice Copilot access is restricted. Please contact your instructor to get access."}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                👑 Contact your instructor to unlock
              </div>
            </div>
          )}

          {/* Voice Wave Animation Banner */}
          {isSpeaking && (
            <div className="flex items-center justify-between bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="flex gap-0.5 items-center">
                  <span className="inline-block w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="inline-block w-1 h-5 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="inline-block w-1 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="inline-block w-1 h-4 bg-emerald-500 rounded-full animate-bounce" />
                </span>
                <span>Speaking explanation...</span>
              </div>
              <button
                type="button"
                onClick={stopSpeaking}
                className="rounded-lg bg-emerald-200/60 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-900 hover:bg-emerald-300 dark:bg-emerald-900 dark:text-emerald-200"
              >
                Stop
              </button>
            </div>
          )}

          {/* Listening Banner */}
          {isListening && (
            <div className="flex items-center justify-between bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 border-b border-rose-500/20 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Listening to your voice... Speak now!</span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="rounded-lg bg-rose-200 px-2 py-0.5 text-[10px] font-black uppercase text-rose-900 hover:bg-rose-300 dark:bg-rose-900 dark:text-rose-200"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Conversation History */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs leading-relaxed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-3.5 ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "border border-slate-200/80 bg-slate-50/90 text-slate-800 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                  {m.suggestedSql && (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-slate-950 p-3 text-emerald-300">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          Generated SQL
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCode(m.id, m.suggestedSql!)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white"
                        >
                          {copiedId === m.id ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed select-all">
                        {m.suggestedSql}
                      </pre>

                      <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => injectQueryToPractice(m.suggestedSql!, false)}
                          className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-slate-700"
                        >
                          ✍️ Fill in Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => injectQueryToPractice(m.suggestedSql!, true)}
                          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-[11px] font-black text-white shadow-md shadow-emerald-600/30 transition hover:opacity-90"
                        >
                          ⚡ Auto-Run in Panel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {m.sender === "agent" && hasAiAccess !== false && (
                      <button
                        type="button"
                        onClick={() => speakText(m.text)}
                        className="flex items-center gap-1 hover:text-emerald-500"
                        title="Read aloud"
                      >
                        🔊 Listen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span>QueryNest AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Suggestions (Only if allowed) */}
          {hasAiAccess !== false && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  "Find employees salary > 60k",
                  "Explain WHERE vs HAVING",
                  "Top students by score",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer with Microphone & Send */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-4 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={hasAiAccess === false}
              className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                isListening
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse"
                  : hasAiAccess === false
                  ? "border border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800"
                  : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-400"
              }`}
              title={
                hasAiAccess === false
                  ? "Contact your instructor to get access"
                  : isListening
                  ? "Stop listening"
                  : "Click to talk (Voice input)"
              }
            >
              🎙️
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                hasAiAccess === false
                  ? "Access locked. Contact your instructor."
                  : "Ask SQL doubt or click mic to talk..."
              }
              disabled={loading || hasAiAccess === false}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none ring-emerald-400 transition placeholder:text-slate-400 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
            />

            <button
              type="submit"
              disabled={loading || !input.trim() || hasAiAccess === false}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/25 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
