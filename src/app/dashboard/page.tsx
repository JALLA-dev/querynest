import Link from "next/link";
import { Footer, PublicHeader, Shell, Card, StatCard, ProgressBar, Pill, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { getDashboardData, getPublishedCourses, getAllQuizzesForStudent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureSeeded();
  const user = await requireUser();
  const [dashboard, courses, quizzes] = await Promise.all([
    getDashboardData(user.id),
    getPublishedCourses(),
    getAllQuizzesForStudent(user.id),
  ]);

  const currentEnrollment = dashboard.enrollments[0]?.enrollment;
  const currentCourse = dashboard.enrollments[0]?.course;
  const passedQuizzes = quizzes.filter((q) => q.isPassed).length;

  return (
    <Shell>
      <PublicHeader userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header greeting */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Pill tone="emerald">{dashboard.stats.level}</Pill>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">🔥 {user.streak} Day Streak</span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Welcome back, {user.name}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Continue your SQL mastery journey, solve tasks, pass quizzes, and earn course certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/practice"
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition hover:opacity-90"
            >
              ⚡ Open SQL Panel
            </Link>
            <Link
              href="/quizzes"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              📝 Take a Quiz
            </Link>
            <Link
              href="/profile"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              ⚙️ Settings & Badges
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                Open Admin
              </Link>
            ) : null}
          </div>
        </div>

        {/* Key KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Points" value={dashboard.stats.totalPoints} accent="emerald" />
          <StatCard label="Courses Enrolled" value={dashboard.stats.totalCourses} accent="indigo" />
          <StatCard label="Quizzes Passed" value={`${passedQuizzes}/${quizzes.length}`} accent="amber" />
          <StatCard label="Lessons Completed" value={dashboard.stats.lessonsCompleted} accent="rose" />
        </div>

        {/* Continue Learning & Overall Progress */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Active Lesson</h2>
            {currentCourse && dashboard.currentLesson ? (
              <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-6 text-white dark:bg-slate-950 dark:border dark:border-slate-800">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">{currentCourse.title}</p>
                <h3 className="mt-2 text-2xl font-black">{dashboard.currentLesson.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-6">{dashboard.currentLesson.description}</p>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                    <span>Course Progress</span>
                    <span className="text-emerald-300">{currentEnrollment?.progressPercent ?? 0}%</span>
                  </div>
                  <ProgressBar value={currentEnrollment?.progressPercent ?? 0} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/learn/${currentCourse.id}/${dashboard.currentLesson.id}`}
                    className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                  >
                    Resume Lesson →
                  </Link>
                  <Link
                    href={`/courses/${currentCourse.id}`}
                    className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    Course Syllabus
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No active enrollment"
                body="Enroll in a Querynest SQL course to jump directly into your interactive learning path."
                action={
                  <Link
                    href="/courses"
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-emerald-500 dark:text-slate-950"
                  >
                    Browse Courses
                  </Link>
                }
              />
            )}
          </Card>

          <Card>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Proficiency Summary</h2>
            <div className="mt-5 grid place-items-center rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 p-8 text-center dark:bg-slate-950/60 dark:border dark:border-slate-800">
              <p className="text-6xl font-black text-slate-950 dark:text-white">{dashboard.stats.overallProgress}%</p>
              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">Average syllabus completion</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                Tasks Completed
                <b className="mt-1 block text-2xl text-slate-950 dark:text-white">{dashboard.stats.tasksCompleted}</b>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                Quiz Points Earned
                <b className="mt-1 block text-2xl text-slate-950 dark:text-white">{dashboard.stats.quizPoints}</b>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Quizzes Section */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">Knowledge Checkpoint Quizzes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quick multiple-choice tests to reinforce your query reasoning.</p>
            </div>
            <Link href="/quizzes" className="text-xs font-black text-emerald-600 hover:underline dark:text-emerald-400">
              View All ({quizzes.length}) →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {quizzes.slice(0, 3).map((quiz) => (
              <Card key={quiz.id} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <Pill tone="emerald">+{quiz.points} pts</Pill>
                    {quiz.isPassed ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Passed</span>
                    ) : quiz.totalAttempts > 0 ? (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">↻ Retake</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">New</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">{quiz.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{quiz.questionCount} Questions • {quiz.passingPercentage}% Pass</p>
                </div>
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="mt-4 block w-full rounded-xl bg-slate-100 py-2.5 text-center text-xs font-black text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {quiz.isPassed ? "Practice Again" : "Start Quiz"}
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Enrolled Courses */}
        <section>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Your Courses</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dashboard.enrollments.map(({ enrollment, course }) => (
              <Card key={enrollment.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white">{course.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-5">{course.description}</p>
                  </div>
                  <Pill tone="emerald">{enrollment.progressPercent}%</Pill>
                </div>
                <div className="mt-5">
                  <ProgressBar value={enrollment.progressPercent} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/courses/${course.id}`}
                    className="text-xs font-black text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    View Course Details →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {!dashboard.enrollments.length ? (
          <section>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Recommended Courses</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="rounded-[2rem] border border-white/70 bg-white/80 p-6 font-black text-slate-950 shadow-lg shadow-slate-950/[0.04] transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  {course.title}
                  <span className="mt-2 block text-xs font-normal text-slate-500 dark:text-slate-400">{course.description}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </Shell>
  );
}
