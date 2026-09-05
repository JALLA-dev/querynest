import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonActions } from "@/components/lesson-actions";
import { Card, MarkdownView, Pill, ProgressBar, PublicHeader, Shell } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { enrollUser, getEnrollment, getLessonLearningData } from "@/lib/data";
import { formatVideoEmbedUrl } from "@/lib/video";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  await ensureSeeded();
  const user = await requireUser();
  const { courseId, lessonId } = await params;
  await enrollUser(user.id, courseId);
  const [data, enrollment] = await Promise.all([getLessonLearningData(user.id, courseId, lessonId), getEnrollment(user.id, courseId)]);
  if (!data) notFound();
  const completed = data.completedLessonIds.has(lessonId);

  return (
    <Shell>
      <PublicHeader userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="rounded-[2rem] border border-white/70 bg-white p-4 shadow-xl shadow-slate-950/[0.06] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <Link href={`/courses/${courseId}`} className="text-sm font-black text-emerald-700">← Course page</Link>
          <h2 className="mt-4 text-2xl font-black">{data.outline.course.title}</h2>
          <div className="mt-4"><ProgressBar value={enrollment?.progressPercent ?? 0} /></div>
          <div className="mt-6 grid gap-5">
            {data.outline.modules.map((module) => (
              <div key={module.id}>
                <p className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">{module.title}</p>
                <div className="grid gap-1">
                  {module.lessons.map((lesson) => {
                    const isCurrent = lesson.id === lessonId;
                    const isDone = data.completedLessonIds.has(lesson.id);
                    return <Link key={lesson.id} href={`/learn/${courseId}/${lesson.id}`} className={`rounded-2xl px-3 py-2 text-sm font-bold ${isCurrent ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{isDone ? "✓" : isCurrent ? "→" : "○"} {lesson.title}</Link>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <Card className="overflow-hidden p-0">
            <div className="aspect-video w-full bg-slate-950">
              {formatVideoEmbedUrl(data.lesson.videoUrl) ? (
                <iframe
                  src={formatVideoEmbedUrl(data.lesson.videoUrl)!}
                  title={data.lesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="grid h-full place-items-center text-slate-400">Video URL can be added by the instructor in Admin &gt; Videos.</div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2"><Pill tone="emerald">+{data.lesson.points} lesson points</Pill><Pill tone="indigo">{data.lesson.durationMinutes} min</Pill>{completed ? <Pill tone="amber">Completed</Pill> : null}</div>
              <h1 className="mt-5 text-4xl font-black tracking-tight">{data.lesson.title}</h1>
              <p className="mt-3 text-lg leading-8 text-slate-600">{data.lesson.description}</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.lesson.concepts.map((concept) => <div key={concept} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">{concept}</div>)}</div>
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="text-2xl font-black">SQL examples</h2>
            <div className="mt-5 grid gap-4">
              {data.lesson.sqlExamples.length ? data.lesson.sqlExamples.map((example) => <div key={example.title} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-black">{example.title}</h3><pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-emerald-100"><code>{example.sql}</code></pre><p className="mt-3 text-sm leading-6 text-slate-600">{example.explanation}</p></div>) : <p className="text-slate-600">The instructor can add SQL examples from the lesson editor.</p>}
            </div>
          </Card>

          {data.notes.map((note) => <Card key={note.id} className="mt-6"><h2 className="text-2xl font-black">{note.title}</h2><div className="mt-4"><MarkdownView markdown={note.markdown} /></div></Card>)}

          {(data.tasks.length || data.quizzes.length) ? <Card className="mt-6"><h2 className="text-2xl font-black">Practice and checkpoint</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{data.tasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="rounded-2xl bg-emerald-50 p-5 font-black text-emerald-800">SQL Task: {task.title}<span className="mt-2 block text-sm font-bold">+{task.points} points</span></Link>)}{data.quizzes.map((quiz) => <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="rounded-2xl bg-indigo-50 p-5 font-black text-indigo-800">Quiz: {quiz.title}<span className="mt-2 block text-sm font-bold">+{quiz.points} points</span></Link>)}</div></Card> : null}

          <LessonActions lessonId={lessonId} courseId={courseId} previousLessonId={data.previousLesson?.id} nextLessonId={data.nextLesson?.id} completed={completed} bookmarked={data.isBookmarked} />
        </section>
      </main>
    </Shell>
  );
}
