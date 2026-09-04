import { AdminNav, Card, Shell, StatCard, Pill, ProgressBar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getDetailedStudentsProgress } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";
import { AdminProgressCharts } from "@/components/admin-progress-charts";

export const dynamic = "force-dynamic";

export default async function AdminStudentProgressPage() {
  await ensureSeeded();
  await requireAdmin();

  const progressData = await getDetailedStudentsProgress();
  const { students, metrics, chartData } = progressData;

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              Student Analytics & Visual Graphs
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Student Learning Progress
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Visual graph charts and granular tracking of every student&apos;s curriculum progress, quiz scores, and practice task completions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Enrolled Students" value={metrics.totalStudents} accent="emerald" />
            <StatCard label="Avg. Course Progress" value={`${metrics.averageProgress}%`} accent="indigo" />
            <StatCard label="Quizzes Completed" value={metrics.totalQuizzesTaken} accent="amber" />
            <StatCard label="Tasks Solved" value={metrics.totalTasksSolved} accent="rose" />
          </div>

          {/* Multiple Chart Types Component */}
          <AdminProgressCharts
            courseProgressBars={chartData.courseProgressBars}
            quizScoreDistribution={chartData.quizScoreDistribution}
            metrics={metrics}
          />

          {/* Granular Student Progress Matrix */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Every Student&apos;s Detailed Progress</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Individual metrics across courses, quizzes, and tasks for each learner.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Student</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Level & Streak</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Course Progress</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Quizzes (Passed/Total)</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Avg. Quiz Score</th>
                    <th className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-400">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No students enrolled yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatarUrl || "https://api.dicebear.com/9.x/shapes/svg?seed=querynest"}
                              alt={s.name}
                              className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 object-cover"
                            />
                            <div>
                              <span className="block font-black text-slate-950 dark:text-white">{s.name}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400">{s.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Pill tone="emerald">{s.level}</Pill>
                          <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
                            🔥 {s.streak} day streak
                          </span>
                        </td>
                        <td className="px-5 py-4 min-w-[200px]">
                          {s.coursesEnrolled.length ? (
                            s.coursesEnrolled.map((c) => (
                              <div key={c.courseId} className="mb-2 last:mb-0">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                  <span className="truncate max-w-[140px]">{c.title}</span>
                                  <span>{c.progress}%</span>
                                </div>
                                <div className="mt-1">
                                  <ProgressBar value={c.progress} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Not enrolled yet</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {s.quizzesPassed} / {s.quizzesAttempted}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {s.tasksSolved} tasks solved
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-black ${s.avgQuizScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : s.avgQuizScore > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                            {s.quizzesAttempted ? `${s.avgQuizScore}%` : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                            {s.points} pts
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </Shell>
  );
}
