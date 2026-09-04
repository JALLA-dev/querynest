"use client";

import { useState } from "react";

export function EnrollButton({ courseId, enrolled, nextLessonId }: { courseId: string; enrolled: boolean; nextLessonId?: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function enroll() {
    if (enrolled && nextLessonId) {
      window.location.href = `/learn/${courseId}/${nextLessonId}`;
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
    const data = (await res.json()) as { error?: string; nextLessonId?: string };
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) window.location.href = "/login";
      else setMessage(data.error ?? "Could not enroll.");
      return;
    }
    window.location.href = data.nextLessonId ? `/learn/${courseId}/${data.nextLessonId}` : "/dashboard";
  }

  return (
    <div>
      <button onClick={enroll} disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-black text-white shadow-xl shadow-emerald-900/20 disabled:opacity-60 sm:w-auto">
        {loading ? "Loading..." : enrolled ? "Continue Learning" : "Enroll and Start Learning"}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-rose-600">{message}</p> : null}
    </div>
  );
}
