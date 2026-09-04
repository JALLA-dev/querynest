import Link from "next/link";
import { AdminNav, Card, Shell, StatCard, Pill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAllAdminContent, getAllQuizzesForAdmin } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";
import { AdminQuizCreator } from "@/components/admin-quiz-creator";
import { AdminQuizDeleteButton } from "@/components/admin-quiz-actions";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  await ensureSeeded();
  await requireAdmin();

  const [adminContent, quizStats] = await Promise.all([
    getAllAdminContent(),
    getAllQuizzesForAdmin(),
  ]);

  const overallPassRate = quizStats.totalAttempts
    ? Math.round(
        (quizStats.recentAttempts.filter((a) => a.attempt.passed).length /
          Math.max(1, quizStats.recentAttempts.length)) *
          100
      )
    : 0;

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              Instructor Administration
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              SQL Quizzes & Assessment
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Create, configure, and monitor student quiz completions, test scores, and question banks.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active Quizzes" value={quizStats.totalQuizzes} accent="emerald" />
            <StatCard label="Total Questions" value={quizStats.totalQuestions} accent="indigo" />
            <StatCard label="Student Attempts" value={quizStats.totalAttempts} accent="amber" />
            <StatCard label="Avg. Pass Rate" value={`${overallPassRate}%`} accent="rose" />
          </div>

          {/* Interactive Quiz Creator */}
          <div>
            <AdminQuizCreator courses={adminContent.courses} lessons={adminContent.lessons} />
          </div>

          {/* Existing Quizzes Table */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Existing Quizzes</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                All published quizzes accessible to students on the learning platform.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Quiz Title</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Course / Lesson</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Questions</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Points</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Attempts</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Pass Rate</th>
                    <th className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                  {quizStats.quizzes.map((q) => (
                    <tr key={q.id}>
                      <td className="px-5 py-4 font-black text-slate-950 dark:text-white">
                        <Link href={`/quizzes/${q.id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">
                          {q.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="block font-semibold text-slate-700 dark:text-slate-300">{q.courseTitle}</span>
                        {q.lessonTitle && (
                          <span className="block text-xs text-slate-500 dark:text-slate-400">Lesson: {q.lessonTitle}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">{q.questionCount}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">+{q.points}</td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{q.totalAttempts}</td>
                      <td className="px-5 py-4">
                        <span className={`font-bold ${q.passRate >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {q.passRate}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <AdminQuizDeleteButton quizId={q.id} quizTitle={q.title} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Student Attempts */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Recent Student Quiz Submissions</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Latest student attempts recorded across all quizzes.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Student</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Score</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Percentage</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Status</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Points Earned</th>
                    <th className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                  {quizStats.recentAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No student quiz attempts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    quizStats.recentAttempts.map(({ attempt, userName, userEmail }) => (
                      <tr key={attempt.id}>
                        <td className="px-5 py-4">
                          <span className="block font-black text-slate-950 dark:text-white">{userName}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{userEmail}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                          {attempt.score}/{attempt.totalQuestions}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-950 dark:text-white">
                          {attempt.percentage}%
                        </td>
                        <td className="px-5 py-4">
                          <Pill tone={attempt.passed ? "emerald" : "rose"}>
                            {attempt.passed ? "Passed" : "Needs Practice"}
                          </Pill>
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-600 dark:text-emerald-400">
                          +{attempt.pointsAwarded}
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-slate-500 dark:text-slate-400">
                          {new Date(attempt.submittedAt).toLocaleDateString()}
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
