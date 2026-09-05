import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons } from "@/db/schema";
import { Footer, PublicHeader, Card, Pill, SectionHeading, Shell, ProgressBar } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { getCourseCounts, getLeaderboard } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();

  let user = null;
  let courseRows: any[] = [];
  let popularLessons: any[] = [];
  let leaderboard: any[] = [];

  try {
    [user, courseRows, popularLessons, leaderboard] = await Promise.all([
      getCurrentUser(),
      db.select().from(courses).where(eq(courses.isPublished, true)).orderBy(desc(courses.createdAt)).limit(3),
      db.select().from(lessons).where(eq(lessons.isPublished, true)).orderBy(asc(lessons.orderIndex)).limit(6),
      getLeaderboard(3),
    ]);
  } catch (e) {
    console.warn("[home] Database not available, rendering with empty data");
  }

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/querynest.tech?igsi=cnA3cnJqMml6djBr";

  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <div>
            <Pill tone="emerald">SQL courses • tasks • quizzes • points</Pill>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 sm:text-7xl">Build real SQL confidence inside Querynest.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">A professional learning hub for students coming from Instagram: video lessons, SQL notes, safe practice tasks, quizzes, certificates, progress, and a leaderboard in one clean product.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/courses" className="rounded-2xl bg-slate-950 px-6 py-4 text-center font-black text-white shadow-xl shadow-slate-950/20">Start Learning SQL</Link>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-6 py-4 text-center font-black text-white shadow-xl shadow-orange-900/20">Follow us on Instagram</a>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[ ["2k+", "Learners"], ["80+", "SQL prompts"], ["24/7", "Practice"] ].map(([value, label]) => <div key={label} className="rounded-3xl bg-white/80 p-4 text-center shadow-lg shadow-slate-950/[0.05]"><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold uppercase text-slate-500">{label}</p></div>)}
            </div>
          </div>
          <Card className="relative overflow-hidden p-5">
            <div className="absolute right-6 top-6 rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">Live dashboard</div>
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <p className="font-mono text-sm text-emerald-300">SELECT skill_level FROM querynest;</p>
              <h2 className="mt-10 text-3xl font-black">Continue Learning</h2>
              <p className="mt-2 text-slate-300">Current Lesson: INNER JOIN Explained</p>
              <div className="mt-6"><ProgressBar value={80} /></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">80%</p><p className="text-xs text-slate-300">Course progress</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">+780</p><p className="text-xs text-slate-300">Available points</p></div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Featured courses" title="Structured SQL paths from fundamentals to projects">Every course is created from the instructor dashboard and shown dynamically to students.</SectionHeading>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {await Promise.all(courseRows.map(async (course) => {
              const counts = await getCourseCounts(course.id);
              return (
                <Link key={course.id} href={`/courses/${course.id}`} className="group rounded-[2rem] border border-white/70 bg-white p-5 shadow-xl shadow-slate-950/[0.06] transition hover:-translate-y-1">
                  <div className="h-40 rounded-[1.5rem] bg-cover bg-center" style={{ backgroundImage: `url(${course.thumbnailUrl ?? "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80"})` }} />
                  <div className="mt-5 flex items-center gap-2"><Pill tone="indigo">{course.difficulty}</Pill><Pill tone="emerald">{course.totalPoints} pts</Pill></div>
                  <h3 className="mt-4 text-2xl font-black group-hover:text-emerald-700">{course.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{course.description}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-500"><span>{counts.lessons} lessons</span><span>{counts.tasks} tasks</span><span>{counts.quizzes} quizzes</span></div>
                </Link>
              );
            }))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Card>
            <h2 className="text-3xl font-black">Popular lessons</h2>
            <div className="mt-6 grid gap-3">
              {popularLessons.map((lesson) => <Link key={lesson.id} href={`/learn/${lesson.courseId}/${lesson.id}`} className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-300"><p className="font-black">{lesson.title}</p><p className="text-sm text-slate-600">{lesson.durationMinutes} min • +{lesson.points} points</p></Link>)}
            </div>
          </Card>
          <Card>
            <h2 className="text-3xl font-black">Latest SQL videos</h2>
            <div className="mt-6 grid gap-4">
              {popularLessons.slice(0, 3).map((lesson) => <div key={lesson.id} className="flex gap-4 rounded-2xl bg-slate-50 p-3"><div className="grid size-16 place-items-center rounded-2xl bg-slate-950 text-emerald-300">▶</div><div><p className="font-black">{lesson.title}</p><p className="text-sm text-slate-600">Short video, notes, examples, and practice.</p></div></div>)}
            </div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-4">
            {["Step-by-step SQL roadmap", "Safe in-browser SQL practice", "Points, badges, streaks", "Instructor-managed content"].map((benefit) => <Card key={benefit} className="p-5"><div className="text-3xl">✦</div><h3 className="mt-4 font-black">{benefit}</h3><p className="mt-2 text-sm leading-6 text-slate-600">Designed for beginners while staying extensible for future paid cohorts, AI support, and live classes.</p></Card>)}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <Card className="bg-slate-950 text-white">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">Instructor brand</p>
            <h2 className="mt-4 text-4xl font-black">From Instagram tips to a full SQL academy.</h2>
            <p className="mt-4 leading-7 text-slate-300">Querynest turns bite-sized social content into an organized e-learning system where every concept has a lesson, note, task, quiz, score, and progress trail.</p>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-black text-slate-950">Follow us on Instagram</a>
          </Card>
          <Card>
            <h2 className="text-3xl font-black">Leaderboard preview</h2>
            <div className="mt-6 grid gap-3">
              {leaderboard.map((row) => <div key={row.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-black">#{row.rank} {row.name}</p><p className="text-sm text-slate-600">{row.level}</p></div><p className="text-xl font-black text-emerald-600">{Number(row.points)} pts</p></div>)}
            </div>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Student love" title="Built to make SQL feel approachable" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {["The tasks make every lesson practical.", "I can continue exactly where I stopped.", "The notes and quizzes helped me revise fast."].map((quote, index) => <Card key={quote}><p className="text-lg font-bold leading-8">“{quote}”</p><p className="mt-5 text-sm font-black text-slate-500">Querynest Student {index + 1}</p></Card>)}
          </div>
        </section>
      </main>
      <Footer />
    </Shell>
  );
}
