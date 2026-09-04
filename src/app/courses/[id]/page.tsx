import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { EnrollButton } from "@/components/enroll-button";
import { Footer, PublicHeader, Shell, Card, Pill, ProgressBar } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { getCourseCounts, getCourseWithOutline, getEnrollment } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;
  const [user, outline, counts] = await Promise.all([getCurrentUser(), getCourseWithOutline(id), getCourseCounts(id)]);
  if (!outline) notFound();
  const enrollment = user ? await getEnrollment(user.id, id) : null;
  const [firstLesson] = await db.select().from(lessons).where(and(eq(lessons.courseId, id), eq(lessons.isPublished, true))).orderBy(asc(lessons.orderIndex)).limit(1);

  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
              <div className="h-64 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${outline.course.thumbnailUrl ?? "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"})` }} />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-2"><Pill tone="emerald">{outline.course.difficulty}</Pill><Pill tone="indigo">{outline.course.totalPoints} total points</Pill></div>
                <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">{outline.course.title}</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{outline.course.longDescription ?? outline.course.description}</p>
                <p className="mt-5 text-sm font-bold text-emerald-300">Instructor: {outline.course.instructorName}</p>
              </div>
            </div>

            <Card className="mt-8">
              <h2 className="text-2xl font-black">Modules</h2>
              <div className="mt-6 grid gap-4">
                {outline.modules.map((module, index) => (
                  <div key={module.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 font-black text-emerald-700">{index + 1}</span><div><h3 className="text-lg font-black">{module.title}</h3><p className="mt-1 text-sm text-slate-600">{module.description}</p></div></div>
                    <div className="mt-4 grid gap-2 pl-0 sm:pl-14">
                      {module.lessons.map((lesson) => <Link key={lesson.id} href={`/learn/${id}/${lesson.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50"><span>{lesson.orderIndex}. {lesson.title}</span><span>{lesson.durationMinutes} min</span></Link>)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Card>
              <h2 className="text-2xl font-black">Course overview</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{counts.lessons}</p><p className="text-xs font-bold text-slate-500">Lessons</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{counts.quizzes}</p><p className="text-xs font-bold text-slate-500">Quizzes</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{counts.tasks}</p><p className="text-xs font-bold text-slate-500">Tasks</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{Math.round(outline.course.durationMinutes / 60)}h</p><p className="text-xs font-bold text-slate-500">Duration</p></div>
              </div>
              {enrollment ? <div className="mt-6"><div className="mb-2 flex justify-between text-sm font-black"><span>Your progress</span><span>{enrollment.progressPercent}%</span></div><ProgressBar value={enrollment.progressPercent} /></div> : null}
              <div className="mt-6"><EnrollButton courseId={id} enrolled={Boolean(enrollment)} nextLessonId={enrollment?.lastLessonId ?? firstLesson?.id} /></div>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </Shell>
  );
}
