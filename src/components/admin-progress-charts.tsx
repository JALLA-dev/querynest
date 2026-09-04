"use client";

import { useState } from "react";

type ChartProps = {
  courseProgressBars: Array<{ title: string; studentsCount: number; avgProgress: number }>;
  quizScoreDistribution: Array<{ label: string; count: number }>;
  metrics: {
    totalStudents: number;
    averageProgress: number;
    totalQuizzesTaken: number;
    overallQuizPassRate: number;
    totalTasksSolved: number;
  };
};

export function AdminProgressCharts({ courseProgressBars, quizScoreDistribution, metrics }: ChartProps) {
  const [activeChart, setActiveChart] = useState<"all" | "bar" | "distribution" | "radial">("all");

  const totalQuizDistribution = quizScoreDistribution.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Chart View Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Chart Types:</span>
          {(["all", "bar", "distribution", "radial"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveChart(mode)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black capitalize transition ${
                activeChart === mode
                  ? "bg-slate-950 text-white dark:bg-emerald-500 dark:text-slate-950"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {mode === "all" ? "All Visualizations" : mode === "bar" ? "Course Bar Chart" : mode === "distribution" ? "Quiz Score Trend" : "Progress Gauges"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Bar Chart - Course Average Progress */}
        {(activeChart === "all" || activeChart === "bar") && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Course Completion Bar Graph</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Average student progress % per course curriculum</p>
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">Bar Chart</span>
            </div>

            <div className="mt-6 space-y-4">
              {courseProgressBars.length ? (
                courseProgressBars.map((course) => (
                  <div key={course.title} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="truncate pr-2">{course.title} ({course.studentsCount} enrolled)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">{course.avgProgress}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                        style={{ width: `${Math.max(5, course.avgProgress)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No course enrollment data to display.</p>
              )}
            </div>
          </div>
        )}

        {/* Chart 2: Column / Histogram - Quiz Score Distribution */}
        {(activeChart === "all" || activeChart === "distribution") && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Quiz Score Distribution Graph</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Histogram of student score percentages across all attempts</p>
              </div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">Histogram</span>
            </div>

            <div className="mt-6 flex h-48 items-end gap-4 pt-6">
              {quizScoreDistribution.map((bucket, index) => {
                const heightPercent = Math.max(12, Math.round((bucket.count / totalQuizDistribution) * 100));
                const colors = [
                  "from-emerald-500 to-teal-400",
                  "from-indigo-500 to-cyan-400",
                  "from-amber-400 to-orange-500",
                  "from-rose-500 to-pink-500",
                ];
                return (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{bucket.count}</span>
                    <div
                      className={`w-full rounded-t-2xl bg-gradient-to-t ${colors[index % colors.length]} transition-all duration-700 shadow-md`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-center font-mono text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {bucket.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart 3: Radial Progress Gauges & Success Rates */}
        {(activeChart === "all" || activeChart === "radial") && (
          <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Overall Learning Gauges & Metrics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Key competency meters across the entire student population</p>
              </div>
              <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">Gauges</span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/70 p-6 text-center dark:bg-slate-950/40">
                <div className="relative grid size-28 place-items-center rounded-full border-8 border-emerald-500/20 dark:border-emerald-500/30">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {metrics.averageProgress}%
                  </span>
                </div>
                <h4 className="mt-3 font-black text-slate-950 dark:text-white">Average Curriculum Progress</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mean course completion</p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/70 p-6 text-center dark:bg-slate-950/40">
                <div className="relative grid size-28 place-items-center rounded-full border-8 border-indigo-500/20 dark:border-indigo-500/30">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {metrics.overallQuizPassRate}%
                  </span>
                </div>
                <h4 className="mt-3 font-black text-slate-950 dark:text-white">Quiz Mastery Pass Rate</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {metrics.totalQuizzesTaken} total quiz submissions
                </p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/70 p-6 text-center dark:bg-slate-950/40">
                <div className="relative grid size-28 place-items-center rounded-full border-8 border-amber-500/20 dark:border-amber-500/30">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {metrics.totalTasksSolved}
                  </span>
                </div>
                <h4 className="mt-3 font-black text-slate-950 dark:text-white">SQL Tasks Solved</h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Practical query challenges passed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
