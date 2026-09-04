"use client";

import { useState } from "react";

export function AdminQuizDeleteButton({ quizId, quizTitle }: { quizId: string; quizTitle: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete quiz "${quizTitle}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      window.location.reload();
    } catch {
      alert("Could not delete quiz.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
