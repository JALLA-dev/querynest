import Link from "next/link";
import { Footer, PublicHeader, Shell, Card, Pill, StatCard } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getAllQuizzesForStudent } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  const quizzes = await getAllQuizzesForStudent(user?.id);

  const totalPointsAvailable = quizzes.reduce((sum, q) => sum + q.points, 0);
  const completedCount = quizzes.filter((q) => q.totalAttempts > 0).length;
  const passedCount = quizzes.filter((q) => q.isPassed).length;

  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">Knowledge Checkpoints</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl dark:text-white">SQL Quizzes</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Test your SQL syntax, join logic, aggregations, and subquery skills to earn points and level up.
            </p>
          </div>
          {user?.role === "ADMIN" ? (
            <Link href="/admin/quizzes" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
              + Admin Quiz Manager
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Quizzes" value={quizzes.length} accent="emerald" />
          <StatCard label="Quizzes Passed" value={user ? `${passedCount}/${quizzes.length}` : quizzes.length} accent="indigo" />
          <StatCard label="Available Points" value={totalPointsAvailable} accent="amber" />
          <StatCard label="Passing Score" value="70%" accent="rose" />
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-black dark:text-white">All Quizzes</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Pill tone={quiz.courseDifficulty === "Advanced" ? "rose" : quiz.courseDifficulty === "Intermediate" ? "indigo" : "emerald"}>
                      {quiz.courseDifficulty}
                    </Pill>
                    {quiz.isPassed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        ✓ Passed ({quiz.bestPercentage}%)
                      </span>
                    ) : quiz.totalAttempts > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        ↻ Retake ({quiz.bestPercentage}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Not Started
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{quiz.title}</h3>
                  <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">{quiz.courseTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 line-clamp-2">
                    {quiz.description || "Comprehensive test of SQL query concepts covered in this module."}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{quiz.questionCount} Questions</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+{quiz.points} Pts</span>
                    <span>Pass: {quiz.passingPercentage}%</span>
                  </div>

                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="mt-4 flex w-full items-center justify-center rounded-2xl bg-slate-950 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                  >
                    {quiz.isPassed ? "Retake Quiz" : quiz.totalAttempts > 0 ? "Try Again" : "Start Quiz"}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </Shell>
  );
}
