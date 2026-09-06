"use client";

import { useState, useTransition } from "react";
import { Pill } from "./ui";

type StudentAccessProps = {
  student: {
    id: string;
    name: string;
    email: string;
    notesAccessEnabled?: boolean | null;
    notesAccessExpiresAt?: Date | string | null;
  };
  compact?: boolean;
  onUpdate?: (updated: { enabled: boolean; expiresAt: Date | null }) => void;
};

export function AdminStudentNotesAccess({ student, compact = false, onUpdate }: StudentAccessProps) {
  const [enabled, setEnabled] = useState(Boolean(student.notesAccessEnabled));
  
  // Format initial ISO date for datetime-local input
  const initialDateStr = student.notesAccessExpiresAt
    ? new Date(student.notesAccessExpiresAt).toISOString().slice(0, 16)
    : "";

  const [expiresAt, setExpiresAt] = useState<string>(initialDateStr);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [now] = useState(() => Date.now());

  // Derive status
  const getStatus = () => {
    if (!enabled) return { label: "Disabled", tone: "slate" as const, desc: "Notes locked" };
    if (!expiresAt) return { label: "Active (Lifetime)", tone: "emerald" as const, desc: "No expiration limit" };
    
    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime())) return { label: "Active", tone: "emerald" as const, desc: "Valid" };
    
    if (expDate.getTime() <= now) {
      return {
        label: "Expired",
        tone: "amber" as const,
        desc: `Expired on ${expDate.toLocaleDateString()}`,
      };
    }

    const diffDays = Math.ceil((expDate.getTime() - now) / (1000 * 60 * 60 * 24));
    return {
      label: `Active (${diffDays}d left)`,
      tone: "emerald" as const,
      desc: `Expires ${expDate.toLocaleDateString()}`,
    };
  };

  const status = getStatus();

  // Helper for quick date presets
  const applyPreset = (days: number | null) => {
    if (days === null) {
      setExpiresAt("");
    } else {
      const target = new Date(now + days * 24 * 60 * 60 * 1000);
      setExpiresAt(target.toISOString().slice(0, 16));
    }
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const payloadDate = expiresAt ? new Date(expiresAt).toISOString() : null;
        const res = await fetch("/api/admin/students/notes-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            enabled,
            expiresAt: payloadDate,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to update permissions");
        }

        setMessage({ type: "success", text: "Class notes permission updated!" });
        if (onUpdate) {
          onUpdate({
            enabled,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          });
        }
      } catch (err: unknown) {
        setMessage({ type: "error", text: (err as Error).message || "Update failed" });
      }
    });
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-slate-700"></div>
        </label>
        <span className="text-xs font-semibold">
          <Pill tone={status.tone}>{status.label}</Pill>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Class Notes Permission</h3>
            <Pill tone={status.tone}>{status.label}</Pill>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Control whether <b>{student.name}</b> can view study notes on lesson pages.
          </p>
        </div>

        {/* Big Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {enabled ? "Access ON" : "Access OFF"}
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-7 w-14 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 after:absolute after:top-[3px] after:left-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:after:translate-x-7 dark:bg-slate-700"></div>
          </label>
        </div>
      </div>

      {/* Expiry Settings */}
      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Expiration Date & Time (Optional)
        </label>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Leave blank for indefinite lifetime access, or set an expiry date. When expired, notes are automatically locked.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={!enabled}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:disabled:bg-slate-900"
          />

          {expiresAt && enabled ? (
            <button
              type="button"
              onClick={() => setExpiresAt("")}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Clear Expiry
            </button>
          ) : null}
        </div>

        {/* Quick Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Quick presets:</span>
          {[
            { label: "+7 Days", days: 7 },
            { label: "+30 Days", days: 30 },
            { label: "+90 Days", days: 90 },
            { label: "+1 Year", days: 365 },
            { label: "Lifetime (No Expiry)", days: null },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={!enabled}
              onClick={() => applyPreset(preset.days)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save Action & Feedback */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="text-xs">
          {message ? (
            <span
              className={`font-bold ${
                message.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {message.type === "success" ? "✓ " : "⚠ "}
              {message.text}
            </span>
          ) : (
            <span className="text-slate-400">{status.desc}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
