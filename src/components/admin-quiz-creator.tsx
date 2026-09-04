"use client";

import { useState, type FormEvent } from "react";

type Course = { id: string; title: string };
type Lesson = { id: string; title: string; courseId: string };

type QuestionItem = {
  id: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
};

export function AdminQuizCreator({ courses, lessons }: { courses: Course[]; lessons: Lesson[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingPercentage, setPassingPercentage] = useState("70");
  const [points, setPoints] = useState("50");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "q-1",
      prompt: "Which SQL clause is used to filter records?",
      optionA: "WHERE",
      optionB: "GROUP BY",
      optionC: "ORDER BY",
      optionD: "LIMIT",
      correctAnswer: "WHERE",
      explanation: "The WHERE clause extracts only those records that fulfill a specified condition.",
    },
  ]);

  const filteredLessons = lessons.filter((l) => l.courseId === courseId);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        prompt: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        explanation: "",
      },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: keyof QuestionItem, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        courseId,
        lessonId: lessonId || undefined,
        title,
        description,
        passingPercentage: Number(passingPercentage),
        points: Number(points),
        questionsList: questions,
      };

      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quiz");

      setMessage({ type: "success", text: "Quiz created successfully! Refreshing..." });
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error saving quiz" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <h3 className="text-xl font-black text-slate-950 dark:text-white">Create New SQL Quiz</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add multiple choice questions, passing thresholds, and rewards.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
          {questions.length} {questions.length === 1 ? "Question" : "Questions"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          Target Course *
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setLessonId("");
            }}
            required
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          Associated Lesson (Optional)
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Course-wide / Milestone Quiz</option>
            {filteredLessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">
          Quiz Title *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. JOIN Mastery & Aggregations Checkpoint"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief overview of what this quiz evaluates..."
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          Passing Percentage (%)
          <input
            type="number"
            min="10"
            max="100"
            value={passingPercentage}
            onChange={(e) => setPassingPercentage(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          Points Awarded on Passing
          <input
            type="number"
            min="5"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>
      </div>

      {/* Questions List */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-black text-slate-950 dark:text-white">Questions Builder</h4>
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            + Add Another Question
          </button>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Question {idx + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
                >
                  Remove
                </button>
              )}
            </div>

            <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Question Prompt *
              <input
                value={q.prompt}
                onChange={(e) => updateQuestion(idx, "prompt", e.target.value)}
                required
                placeholder="e.g. Which command deletes all rows without logging individual row deletions?"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Option A *
                <input
                  value={q.optionA}
                  onChange={(e) => updateQuestion(idx, "optionA", e.target.value)}
                  required
                  placeholder="e.g. TRUNCATE"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Option B *
                <input
                  value={q.optionB}
                  onChange={(e) => updateQuestion(idx, "optionB", e.target.value)}
                  required
                  placeholder="e.g. DROP TABLE"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Option C
                <input
                  value={q.optionC}
                  onChange={(e) => updateQuestion(idx, "optionC", e.target.value)}
                  placeholder="e.g. DELETE"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Option D
                <input
                  value={q.optionD}
                  onChange={(e) => updateQuestion(idx, "optionD", e.target.value)}
                  placeholder="e.g. REMOVE"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Correct Answer * (Matches one of the options)
                <input
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)}
                  required
                  placeholder="Exact text of correct choice"
                  className="rounded-xl border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-sm font-bold text-emerald-950 outline-none ring-emerald-200 focus:ring-2 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100"
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Explanation (Shown after attempt)
                <input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                  placeholder="Why this answer is correct..."
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className={`mt-5 rounded-2xl p-4 text-sm font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
        >
          {loading ? "Creating Quiz..." : "Publish Quiz"}
        </button>
      </div>
    </form>
  );
}
