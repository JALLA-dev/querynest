import Link from "next/link";
import { AdminNav, Card, Shell, StatCard } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminAnalytics, getVisitorAnalytics, getAllQuizzesForAdmin } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureSeeded();
  const admin = await requireAdmin();
  const [analytics, visitorData, quizData] = await Promise.all([
    getAdminAnalytics(),
    getVisitorAnalytics(8),
    getAllQuizzesForAdmin(),
  ]);

  const cardItems = [
    ["Total Students", analytics.cards.students, "emerald"],
    ["Total Courses", analytics.cards.courses, "indigo"],
    ["Total Quizzes", quizData.totalQuizzes, "amber"],
    ["Total Site Visits", visitorData.totalVisits, "rose"],
    ["Enrollments", analytics.cards.enrollments, "emerald"],
    ["Platform Points", analytics.cards.points, "indigo"],
  ] as const;

  const quickActions = [
    { label: "+ Create Quiz", href: "/admin/quizzes", tone: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black" },
    { label: "+ New Course / Lesson", href: "/admin/courses", tone: "bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700" },
    { label: "🌐 Visitor Logs", href: "/admin/visitors", tone: "bg-white text-slate-800 border border-slate-200 hover:border-emerald-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" },
    { label: "📈 Student Progress & Charts", href: "/admin/progress", tone: "bg-white text-slate-800 border border-slate-200 hover:border-emerald-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" },
    { label: "⚙️ Profile & Password", href: "/admin/settings", tone: "bg-white text-slate-800 border border-slate-200 hover:border-emerald-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200" },
  ];

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                Instructor Console
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                Welcome, {admin.name}
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Full administration of SQL courses, interactive quizzes, student progress analytics, visitor telemetry, and security.
              </p>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap gap-2.5">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`rounded-2xl px-4 py-2.5 text-xs font-bold shadow-sm transition ${action.tone}`}
              >
                {action.label}
              </Link>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cardItems.map(([label, value, accent]) => (
              <StatCard key={label} label={label} value={value} accent={accent} />
            ))}
          </div>

          {/* Popular Courses & Platform Health */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Student Enrollments by Course</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Relative distribution of enrolled learners</p>
              <div className="mt-6 h-64 rounded-[2rem] bg-gradient-to-t from-emerald-100/50 to-white p-5 dark:from-emerald-950/30 dark:to-slate-950/60 dark:border dark:border-slate-800">
                <div className="flex h-full items-end gap-3">
                  {analytics.popularCourses.map((course) => (
                    <div key={course.title} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-2xl bg-emerald-500 shadow-lg dark:bg-emerald-400 transition-all duration-700"
                        style={{ height: `${Math.max(20, 30 + Number(course.enrollments) * 26)}px` }}
                      />
                      <span className="text-center text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-1">
                        {course.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Platform Competency Health</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Curriculum and evaluation performance indicators</p>
              <div className="mt-5 grid gap-3">
                {[
                  { label: "Course Completion Velocity", pct: 72 },
                  { label: "Quiz Success Ratio", pct: 81 },
                  { label: "Task Execution Accuracy", pct: 78 },
                  { label: "Active Student Retention", pct: 88 },
                ].map(({ label, pct }) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <div className="flex justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                      <span>{label}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{pct}%</span>
                    </div>
                    <div className="mt-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-slate-950 dark:bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Real-time Telemetry & Recent Activity */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Live Visitors Feed */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Live Website Visitors</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Who is browsing Querynest right now</p>
                </div>
                <Link href="/admin/visitors" className="text-xs font-black text-emerald-600 hover:underline dark:text-emerald-400">
                  Full Log →
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitorData.recentVisits.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-950 dark:text-white block">
                        {v.userName || (v.userRole !== "GUEST" ? "Authenticated User" : "Anonymous Guest")}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{v.path}</span>
                    </div>
                    <span className="text-slate-400">
                      {new Date(v.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Quiz Attempts Feed */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Recent Quiz Submissions</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Student quiz attempts & scores</p>
                </div>
                <Link href="/admin/quizzes" className="text-xs font-black text-emerald-600 hover:underline dark:text-emerald-400">
                  Quiz Manager →
                </Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {quizData.recentAttempts.length === 0 ? (
                  <p className="p-6 text-xs text-slate-500 text-center">No student quiz attempts yet.</p>
                ) : (
                  quizData.recentAttempts.slice(0, 5).map(({ attempt, userName }) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-950 dark:text-white block">{userName}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Score: {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                        </span>
                      </div>
                      <span className={`font-black ${attempt.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {attempt.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>
      </main>
    </Shell>
  );
}
