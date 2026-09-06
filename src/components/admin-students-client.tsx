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

  const getNotesStatus = (student: AdminStudentItem) => {
    if (!student.notesAccessEnabled) {
      return { label: "No Access", tone: "slate" as const, text: "Disabled" };
    }
    if (!student.notesAccessExpiresAt) {
      return { label: "Lifetime", tone: "emerald" as const, text: "Active (No Expiry)" };
    }
    const exp = new Date(student.notesAccessExpiresAt);
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

  const handleUpdate = (studentId: string, enabled: boolean, expiresAt: Date | null) => {
    const expStr = expiresAt ? expiresAt.toISOString() : null;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, notesAccessEnabled: enabled, notesAccessExpiresAt: expStr } : s))
    );
    if (selectedStudent && selectedStudent.id === studentId) {
      setSelectedStudent((prev) => (prev ? { ...prev, notesAccessEnabled: enabled, notesAccessExpiresAt: expStr } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Total Students: {students.length}</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Notes Active: {students.filter((s) => s.notesAccessEnabled && (!s.notesAccessExpiresAt || new Date(s.notesAccessExpiresAt).getTime() > now)).length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/80">
              <tr>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Student</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Email</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Points</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Level</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Streak</th>
                <th className="px-5 py-4 text-left font-black text-slate-900 dark:text-white">Class Notes Access</th>
                <th className="px-5 py-4 text-right font-black text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
              {filtered.map((student) => {
                const notesStatus = getNotesStatus(student);
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
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{student.streak} days</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Pill tone={notesStatus.tone}>{notesStatus.label}</Pill>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{notesStatus.text}</span>
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
                          View Profile →
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

      {/* Quick Manage Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Manage Class Notes Access
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student: <b>{selectedStudent.name}</b> ({selectedStudent.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <AdminStudentNotesAccess
                student={selectedStudent}
                onUpdate={({ enabled, expiresAt }) => handleUpdate(selectedStudent.id, enabled, expiresAt)}
              />
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
              <Link
                href={`/admin/students/${selectedStudent.id}`}
                className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Open Full Student Profile →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
