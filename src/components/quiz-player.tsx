"use client";

import { useState } from "react";

type Question = { id: string; prompt: string; options: string[]; correctAnswer?: string; explanation?: string };
type Quiz = { id: string; title: string; description: string | null; passingPercentage: number; points: number };
type Result = { score: number; totalQuestions: number; percentage: number; passed: boolean; pointsEarned: number; review: Array<{ questionId: string; prompt: string; selected: string; correctAnswer: string; explanation: string; correct: boolean }> };

export function QuizPlayer({ quiz, questions }: { quiz: Quiz; questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const current = questions[index];

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = (await res.json()) as Result;
    setLoading(false);
    setResult(data);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06]">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em]">Quiz Completed</p>
          <h1 className="mt-2 text-4xl font-black">Score: {result.score}/{result.totalQuestions}</h1>
          <p className="mt-2 font-bold">{result.percentage}% • {result.passed ? "Passed" : "Try again"} • +{result.pointsEarned} points</p>
        </div>
        <div className="mt-6 grid gap-4">
          {result.review.map((item, reviewIndex) => (
            <div key={item.questionId} className={`rounded-2xl border p-4 ${item.correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <p className="text-sm font-black text-slate-500">Question {reviewIndex + 1}</p>
              <h3 className="mt-1 font-black text-slate-950">{item.prompt}</h3>
              <p className="mt-2 text-sm text-slate-700">Your answer: <b>{item.selected || "No answer"}</b></p>
              <p className="text-sm text-slate-700">Correct answer: <b>{item.correctAnswer}</b></p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06]">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">Question {index + 1} of {questions.length}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">{quiz.title}</h1>
      {quiz.description ? <p className="mt-2 text-slate-600">{quiz.description}</p> : null}
      <div className="mt-8">
        <h2 className="text-xl font-black">{current.prompt}</h2>
        <div className="mt-5 grid gap-3">
          {current.options.map((option) => (
            <button
              key={option}
              onClick={() => setAnswers((value) => ({ ...value, [current.id]: option }))}
              className={`rounded-2xl border px-5 py-4 text-left font-bold transition ${answers[current.id] === option ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between gap-3">
        <button disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="rounded-2xl border border-slate-200 px-5 py-3 font-black disabled:opacity-40">Previous</button>
        {index === questions.length - 1 ? (
          <button disabled={loading} onClick={submit} className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white disabled:opacity-60">{loading ? "Submitting..." : "Finish Quiz"}</button>
        ) : (
          <button onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">Next</button>
        )}
      </div>
    </div>
  );
}
