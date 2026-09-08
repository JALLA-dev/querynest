"use client";

import { useState } from "react";
import type { AgentResponse } from "@/lib/ai-agent/sql-agent";

interface SqlAiAgentPanelProps {
  currentQuery?: string;
  selectedTable?: string;
  onInjectQuery: (sql: string, table?: string) => void;
  onAutoRunQuery: (sql: string, table?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  suggestedSql?: string;
  suggestedTable?: string;
  provider?: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  "I don't know how to write a query to find highest paid employees",
  "Find all employees in Engineering department",
  "Show me top students with score >= 80",
  "Explain the difference between INNER JOIN and LEFT JOIN",
];

export function SqlAiAgentPanel({
  currentQuery,
  selectedTable,
  onInjectQuery,
  onAutoRunQuery,
}: SqlAiAgentPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      sender: "agent",
      text: "👋 Hi! I'm your **QueryNest SQL AI Agent** powered by the OpenAI Agents architecture. Ask me any SQL concept or tell me what data you want to retrieve. If you can't write a query, I can automatically write it and run it in your editor!",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleSend(promptText?: string) {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data: AgentResponse = await res.json();

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: data.reply || "Here is the SQL query for your requirement:",
        suggestedSql: data.suggestedSql,
        suggestedTable: data.suggestedTable,
        provider: data.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "agent",
          text: "⚠️ Sorry, there was an issue processing your question. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="flex flex-col h-full rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-950/[0.04] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-base font-black text-white shadow-md shadow-emerald-600/30">
            🤖
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-950 dark:text-white">SQL AI Agent</h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Live Copilot
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Answers doubts, writes & runs queries automatically
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="pt-3 pb-2">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
          Try asking:
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300 disabled:opacity-50"
            >
              💡 {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 space-y-3.5 overflow-y-auto py-3 pr-1 max-h-[420px] text-xs leading-relaxed">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-3.5 ${
                m.sender === "user"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-slate-200/80 bg-slate-50/90 text-slate-800 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">
                {m.text}
              </div>

              {/* Suggested SQL Card with Action Buttons */}
              {m.suggestedSql && (
                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-slate-950 p-3 text-emerald-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Generated SQL
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.suggestedSql!)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white"
                    >
                      {copiedId === m.id ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed select-all">
                    {m.suggestedSql}
                  </pre>

                  {/* One-Click Action Buttons to interact directly with the editor */}
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onInjectQuery(m.suggestedSql!, m.suggestedTable)}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-slate-700 active:scale-95"
                    >
                      ✍️ Fill in Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => onAutoRunQuery(m.suggestedSql!, m.suggestedTable)}
                      className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-[11px] font-black text-white shadow-md shadow-emerald-600/30 transition hover:opacity-90 active:scale-95"
                    >
                      ⚡ Auto-Run in Panel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 opacity-75">
                <span>{m.timestamp}</span>
                {m.provider && (
                  <span className="font-mono uppercase">{m.provider}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>AI Agent is analyzing schema and formulating query...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or describe a query to write..."
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none ring-emerald-400 transition placeholder:text-slate-400 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
