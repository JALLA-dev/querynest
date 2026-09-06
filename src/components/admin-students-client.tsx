"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Pill } from "./ui";
import { AdminStudentNotesAccess } from "./admin-student-notes-access";

export type AdminStudentItem = {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  streak: number;
  notesAccessEnabled?: boolean | null;
  notesAccessExpiresAt?: string | null;
  videoAccessEnabled?: boolean | null;
  videoAccessExpiresAt?: string | null;
  createdAt?: string | null;
};

function levelFromPoints(points: number) {
  if (points >= 1000) return "SQL Master";
  if (points >= 600) return "SQL Developer";
  if (points >= 300) return "SQL Practitioner";
  if (points >= 100) return "SQL Explorer";
  return "SQL Beginner";
}

type Props = {
  students: AdminStudentItem[];
};

export function AdminStudentsClient({ students: initialStudents }: Props) {
  const [students, setStudents] = useState<AdminStudentItem[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentItem | null>(null);
  const [now] = useState(() => Date.now());

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (enabled?: boolean | null, dateStr?: string | null, type?: string) => {
    if (!enabled) {
      return { label: "Locked", tone: "slate" as const, text: "Disabled" };
    }
    if (!dateStr) {
      return { label: "Lifetime", tone: "emerald" as const, text: "Permanent" };
    }
    const exp = new Date(dateStr);
    if (isNaN(exp.getTime())) return { label: "Active", tone: "emerald" as const, text: "Active" };
    if (exp.getTime() <= now) {
      return { label: "Expired", tone: "amber" as const, text: `Expired ${exp.toLocaleDateString()}` };
    }
    return {
      label: "Active",
      tone: "emerald" as const,
      text: `Until ${exp.toLocaleDateString()}`,
    };
  };

  const handleUpdate = (
    studentId: string,
    updated: {
      notesEnabled: boolean;
      notesExpiresAt: Date | null;
      videoEnabled: boolean;
      videoExpiresAt: Date | null;
    }
  ) => {
    const notesExpStr = updated.notesExpiresAt ? updated.notesExpiresAt.toISOString() : null;
    const videoExpStr = updated.videoExpiresAt ? updated.videoExpiresAt.toISOString() : null;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              notesAccessEnabled: updated.notesEnabled,
              notesAccessExpiresAt: notesExpStr,
              videoAccessEnabled: updated.videoEnabled,
              videoAccessExpiresAt: videoExpStr,
            }
          : s
      )
    );

    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              notesAccessEnabled: updated.notesEnabled,
              notesAccessExpiresAt: notesExpStr,
              videoAccessEnabled: updated.videoEnabled,
              videoAccessExpiresAt: videoExpStr,
            }
          : null
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>{students.length} students</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Notes Active:{" "}
            {
              students.filter(
                (s) =>
                  s.notesAccessEnabled &&
                  (!s.notesAccessExpiresAt || new Date(s.notesAccessExpiresAt).getTime() > now)
              ).length
            }
          </span>
          <span>•</span>
          <span className="text-indigo-600 dark:text-indigo-400">
            Videos Active:{" "}
            {
              students.filter(
                (s) =>
                  s.videoAccessEnabled &&
                  (!s.videoAccessExpiresAt || new Date(s.videoAccessExpiresAt).getTime() > now)
              ).length
            }
          </span>
        </div>
      </div>

      {/* MOBILE INTERFACE: Touch-friendly Card List (visible on screens < 768px) */}
      <div className="grid gap-3.5 md:hidden">
        {filtered.map((student) => {
          const notesStatus = getStatus(student.notesAccessEnabled, student.notesAccessExpiresAt, "Notes");
          const videoStatus = getStatus(student.videoAccessEnabled, student.videoAccessExpiresAt, "Video");
          return (
            <Card key={student.id} className="p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="font-black text-base text-slate-950 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 truncate block"
                  >
                    {student.name}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
                </div>
                <Pill tone="emerald">{levelFromPoints(student.totalPoints)}</Pill>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800">
                  <span className="font-bold text-slate-500">Notes:</span>
                  <Pill tone={notesStatus.tone}>{notesStatus.label}</Pill>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800">
                  <span className="font-bold text-slate-500">Video:</span>
                  <Pill tone={videoStatus.tone}>{videoStatus.label}</Pill>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs dark:border-slate-800">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {student.totalPoints} pts • {student.streak}d streak
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                    className="min-h-[38px] rounded-xl bg-emerald-600 px-3.5 py-1.5 font-black text-white hover:bg-emerald-500"
                  >
                    Manage
                  </button>
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="min-h-[38px] inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    Profile →
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">No students match your search.</div>
        )}
      </div>

      {/* DESKTOP INTERFACE: Full Data Table (visible on md and above) */}
      <Card className="hidden md:block p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Student</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Email</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Points</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Level</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Notes Access</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Video Access</th>
                <th className="px-5 py-4 text-right font-black text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
              {filtered.map((student) => {
                const notesStatus = getStatus(student.notesAccessEnabled, student.notesAccessExpiresAt, "Notes");
                const videoStatus = getStatus(student.videoAccessEnabled, student.videoAccessExpiresAt, "Video");
                return (
                  <tr key={student.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-black text-slate-900 dark:text-white">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline flex items-center gap-2"
                      >
                        {student.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{student.email}</td>
                    <td className="px-5 py-4 font-black text-emerald-700 dark:text-emerald-400">{student.totalPoints}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{levelFromPoints(student.totalPoints)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Pill tone={notesStatus.tone}>{notesStatus.label}</Pill>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{notesStatus.text}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Pill tone={videoStatus.tone}>{videoStatus.label}</Pill>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{videoStatus.text}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                        >
                          Manage Access
                        </button>
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Profile →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No students match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Responsive Modal / Drawer for Access Management */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Student Permissions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <b>{selectedStudent.name}</b> ({selectedStudent.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <AdminStudentNotesAccess
                student={selectedStudent}
                onUpdate={(updated) => handleUpdate(selectedStudent.id, updated)}
              />
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
              <Link
                href={`/admin/students/${selectedStudent.id}`}
                className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                View Full Student Profile →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="min-h-[40px] rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
