"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

export function openBinduAgent() {
  if (typeof window === "undefined") return;
  const widget = document.querySelector("elevenlabs-convai");
  if (widget) {
    const shadowBtn = widget.shadowRoot?.querySelector("button");
    if (shadowBtn) {
      shadowBtn.click();
    } else {
      (widget as HTMLElement).click();
    }
  }
}

export function BinduAgent() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(true);

  // Exclude from admin portal routes, only show for student portal & public pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="afterInteractive"
      />

      {/* Floating right-side Assistant Identity Pill & Tooltip */}
      <aside
        aria-label="AI Tutor Bindu"
        className="fixed bottom-24 right-5 z-40 flex flex-col items-end pointer-events-auto select-none sm:right-6"
      >
        {showTooltip && (
          <div className="relative mb-2 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-white/95 px-3.5 py-2 text-xs shadow-xl shadow-emerald-950/10 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 dark:border-emerald-500/20 dark:bg-slate-900/95">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <p className="font-extrabold text-slate-900 dark:text-white">
                Bindu <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">AI Tutor</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ask SQL questions or practice doubts!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}
      </aside>

      {/* The ElevenLabs Conversational AI Custom Element */}
      {React.createElement("elevenlabs-convai", {
        "agent-id": "agent_7601m1x76d0jev9tps56qsspcr2g",
        "action-text": "Talk to Bindu",
        "start-call-text": "Start call with Bindu",
        "end-call-text": "End call",
        "listening-text": "Bindu is listening...",
        "speaking-text": "Bindu is speaking...",
      })}
    </>
  );
}

/**
 * Dedicated right-side Student Portal Assistant Card
 * Embeddable directly into the right-hand column of /dashboard
 */
export function BinduStudentCard() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 p-6 shadow-xl shadow-emerald-950/[0.04] backdrop-blur transition-all duration-300 hover:border-emerald-500/50 dark:border-emerald-500/20 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-slate-950/80">
      {/* Glow background accent */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-xl font-black text-white shadow-lg shadow-emerald-600/30">
            <span>🎙️</span>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Bindu</h3>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                AI Agent
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Personal SQL Learning Assistant
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        Have questions about SQL syntax, joins, subqueries, or practice tasks? Voice-chat or interact with <strong>Bindu</strong> 24/7 on the right side of your student portal.
      </p>

      {/* Suggested prompts */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[
          "Explain INNER vs LEFT JOIN",
          "How does GROUP BY work?",
          "Help me debug my query",
        ].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={openBinduAgent}
            className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
          >
            💬 {prompt}
          </button>
        ))}
      </div>

      {/* Action button */}
      <div className="mt-5">
        <button
          type="button"
          onClick={openBinduAgent}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition hover:opacity-95 hover:shadow-emerald-600/40 active:scale-[0.99]"
        >
          <span>🎙️ Talk to Bindu</span>
          <span className="text-emerald-200">→</span>
        </button>
      </div>
    </section>
  );
}
