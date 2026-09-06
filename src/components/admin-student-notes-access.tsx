"use client";

import { useState, useTransition } from "react";
import { Pill } from "./ui";

export type StudentAccessProps = {
  student: {
    id: string;
    name: string;
    email: string;
    notesAccessEnabled?: boolean | null;
    notesAccessExpiresAt?: string | null;
    videoAccessEnabled?: boolean | null;
    videoAccessExpiresAt?: string | null;
  };
  compact?: boolean;
  onUpdate?: (updated: {
    notesEnabled: boolean;
    notesExpiresAt: Date | null;
    videoEnabled: boolean;
    videoExpiresAt: Date | null;
  }) => void;
};

export function AdminStudentNotesAccess({ student, compact = false, onUpdate }: StudentAccessProps) {
  // Notes state
  const [notesEnabled, setNotesEnabled] = useState(Boolean(student.notesAccessEnabled));
  const initialNotesDate = student.notesAccessExpiresAt
    ? new Date(student.notesAccessExpiresAt).toISOString().slice(0, 16)
    : "";
  const [notesExpiresAt, setNotesExpiresAt] = useState<string>(initialNotesDate);

  // Video state
  const [videoEnabled, setVideoEnabled] = useState(Boolean(student.videoAccessEnabled));
  const initialVideoDate = student.videoAccessExpiresAt
    ? new Date(student.videoAccessExpiresAt).toISOString().slice(0, 16)
    : "";
  const [videoExpiresAt, setVideoExpiresAt] = useState<string>(initialVideoDate);

  // Active sub-tab on mobile / desktop
  const [activeTab, setActiveTab] = useState<"notes" | "video">("notes");

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [now] = useState(() => Date.now());

  // Derive status helper
  const computeStatus = (enabled: boolean, dateStr: string, itemType: string) => {
    if (!enabled) return { label: `${itemType} Locked`, tone: "slate" as const, desc: "Access disabled" };
    if (!dateStr) return { label: "Lifetime", tone: "emerald" as const, desc: "No expiration limit" };

    const expDate = new Date(dateStr);
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

  const notesStatus = computeStatus(notesEnabled, notesExpiresAt, "Notes");
  const videoStatus = computeStatus(videoEnabled, videoExpiresAt, "Video");

  const applyPreset = (setter: (val: string) => void, days: number | null) => {
    if (days === null) {
      setter("");
    } else {
      const target = new Date(now + days * 24 * 60 * 60 * 1000);
      setter(target.toISOString().slice(0, 16));
    }
  };

  const syncVideoToNotes = () => {
    setVideoEnabled(notesEnabled);
    setVideoExpiresAt(notesExpiresAt);
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const payloadNotesDate = notesExpiresAt ? new Date(notesExpiresAt).toISOString() : null;
        const payloadVideoDate = videoExpiresAt ? new Date(videoExpiresAt).toISOString() : null;

        const res = await fetch("/api/admin/students/notes-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            notesEnabled,
            notesExpiresAt: payloadNotesDate,
            videoEnabled,
            videoExpiresAt: payloadVideoDate,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to update permissions");
        }

        setMessage({ type: "success", text: "Access permissions updated successfully!" });
        if (onUpdate) {
          onUpdate({
            notesEnabled,
            notesExpiresAt: notesExpiresAt ? new Date(notesExpiresAt) : null,
            videoEnabled,
            videoExpiresAt: videoExpiresAt ? new Date(videoExpiresAt) : null,
          });
        }
      } catch (err: unknown) {
        setMessage({ type: "error", text: (err as Error).message || "Update failed" });
      }
    });
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Pill tone={notesStatus.tone}>📝 {notesStatus.label}</Pill>
        <Pill tone={videoStatus.tone}>🎬 {videoStatus.label}</Pill>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-950/5 transition-colors sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Header with Student Info */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            Class Materials Access Control
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure permission switches and expiration dates for <b>{student.name}</b>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={notesStatus.tone}>Notes: {notesStatus.label}</Pill>
          <Pill tone={videoStatus.tone}>Video: {videoStatus.label}</Pill>
        </div>
      </div>

      {/* Tabs / Selector (Mobile-friendly pills) */}
      <div className="mt-4 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
            activeTab === "notes"
              ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span>📝</span>
          <span>Class Notes Access</span>
          <span className={`size-2 rounded-full ${notesEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("video")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
            activeTab === "video"
              ? "bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span>🎬</span>
          <span>Class Video Access</span>
          <span className={`size-2 rounded-full ${videoEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
        </button>
      </div>

      {/* TAB CONTENT: NOTES */}
      {activeTab === "notes" && (
        <div className="mt-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800/50">
            <div>
              <b className="text-sm font-black text-slate-950 dark:text-white">Class Notes Permission Switch</b>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant or revoke permission to view all markdown study notes on lesson pages.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {notesEnabled ? "Granted (ON)" : "Locked (OFF)"}
              </span>
              <label className="relative inline-flex min-h-[44px] min-w-[56px] cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notesEnabled}
                  onChange={(e) => setNotesEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-7 w-14 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:top-[11px] after:left-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:after:translate-x-7 dark:bg-slate-700"></div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Notes Expiration Date & Time
            </label>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              When expired, class notes are automatically locked for this student.
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={notesExpiresAt}
                onChange={(e) => setNotesExpiresAt(e.target.value)}
                disabled={!notesEnabled}
                className="min-h-[44px] w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              {notesExpiresAt && notesEnabled && (
                <button
                  type="button"
                  onClick={() => setNotesExpiresAt("")}
                  className="min-h-[44px] rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Clear Expiry
                </button>
              )}
            </div>

            {/* Quick presets */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Presets:</span>
              {[
                { label: "+7 Days", days: 7 },
                { label: "+30 Days", days: 30 },
                { label: "+90 Days", days: 90 },
                { label: "+1 Year", days: 365 },
                { label: "Lifetime", days: null },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={!notesEnabled}
                  onClick={() => applyPreset(setNotesExpiresAt, p.days)}
                  className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VIDEO */}
      {activeTab === "video" && (
        <div className="mt-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800/50">
            <div>
              <b className="text-sm font-black text-slate-950 dark:text-white">Class Video Permission Switch</b>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant or revoke permission to view video lectures and tutorials on lesson pages.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {videoEnabled ? "Granted (ON)" : "Locked (OFF)"}
              </span>
              <label className="relative inline-flex min-h-[44px] min-w-[56px] cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={videoEnabled}
                  onChange={(e) => setVideoEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-7 w-14 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:top-[11px] after:left-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:after:translate-x-7 dark:bg-slate-700"></div>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Video Expiration Date & Time
              </label>
              <button
                type="button"
                onClick={syncVideoToNotes}
                className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Copy from Notes Settings ⤸
              </button>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              When expired, lesson video players are automatically locked for this student.
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={videoExpiresAt}
                onChange={(e) => setVideoExpiresAt(e.target.value)}
                disabled={!videoEnabled}
                className="min-h-[44px] w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              {videoExpiresAt && videoEnabled && (
                <button
                  type="button"
                  onClick={() => setVideoExpiresAt("")}
                  className="min-h-[44px] rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Clear Expiry
                </button>
              )}
            </div>

            {/* Quick presets */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Presets:</span>
              {[
                { label: "+7 Days", days: 7 },
                { label: "+30 Days", days: 30 },
                { label: "+90 Days", days: 90 },
                { label: "+1 Year", days: 365 },
                { label: "Lifetime", days: null },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={!videoEnabled}
                  onClick={() => applyPreset(setVideoExpiresAt, p.days)}
                  className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Action & Feedback */}
      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
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
            <span className="text-slate-400">
              Notes: {notesStatus.desc} • Video: {videoStatus.desc}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving Changes...
            </>
          ) : (
            "Save All Permissions"
          )}
        </button>
      </div>
    </div>
  );
}
