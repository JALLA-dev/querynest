"use client";

import Link from "next/link";
import { useState } from "react";

export function LessonActions({
  lessonId,
  courseId,
  previousLessonId,
  nextLessonId,
  completed,
  bookmarked,
}: {
  lessonId: string;
  courseId: string;
  previousLessonId?: string;
  nextLessonId?: string;
  completed: boolean;
  bookmarked: boolean;
}) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);
    const res = await fetch("/api/progress/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    const data = (await res.json()) as { awarded?: number; progress?: { progressPercent: number }; error?: string };
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not update progress.");
      return;
    }
    setIsCompleted(true);
    setMessage(`Lesson completed. ${data.awarded ? `+${data.awarded} points earned.` : "Progress already saved."}`);
  }

  async function toggleBookmark() {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    if (res.ok) setIsBookmarked((value) => !value);
  }

  return (
    <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-4">
      {message ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {previousLessonId ? <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700" href={`/learn/${courseId}/${previousLessonId}`}>Previous Lesson</Link> : null}
          <button onClick={markComplete} disabled={loading || isCompleted} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:bg-emerald-600">
            {isCompleted ? "Completed ✓" : loading ? "Saving..." : "Mark as Complete"}
          </button>
          {nextLessonId ? <Link className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white" href={`/learn/${courseId}/${nextLessonId}`}>Next Lesson</Link> : null}
        </div>
        <button onClick={toggleBookmark} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">{isBookmarked ? "Bookmarked ★" : "Bookmark ☆"}</button>
      </div>
    </div>
  );
}
