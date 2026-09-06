import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonActions } from "@/components/lesson-actions";
import { Card, MarkdownView, Pill, ProgressBar, PublicHeader, Shell } from "@/components/ui";
import { checkNotesAccess, checkVideoAccess, requireUser } from "@/lib/auth";
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
  const notesAccess = checkNotesAccess(user);
  const videoAccess = checkVideoAccess(user);

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
              {videoAccess.hasAccess ? (
                formatVideoEmbedUrl(data.lesson.videoUrl) ? (
                  <iframe
                    src={formatVideoEmbedUrl(data.lesson.videoUrl)!}
                    title={data.lesson.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="grid h-full place-items-center text-slate-400">Video URL can be added by the instructor in Admin &gt; Videos.</div>
                )
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40">
                  <div className="grid size-16 place-items-center rounded-3xl bg-amber-500/20 text-3xl text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                    🔒
                  </div>
                  <h3 className="mt-4 text-xl sm:text-2xl font-black tracking-tight">Class Video Restricted</h3>
                  <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-300">
                    {videoAccess.isExpired
                      ? `Your video lecture permission expired on ${videoAccess.expiresAt?.toLocaleDateString()}. Please contact your instructor to renew access.`
                      : "Video playback for this lesson is restricted. Request video permission from your platform instructor to unlock."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Pill tone={videoAccess.isExpired ? "amber" : "slate"}>
                      {videoAccess.isExpired ? "Video Expired" : "Video Locked"}
                    </Pill>
                    <Link
                      href="/profile"
                      className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
                    >
                      Check Profile Status →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="emerald">+{data.lesson.points} lesson points</Pill>
                <Pill tone="indigo">{data.lesson.durationMinutes} min</Pill>
                {videoAccess.hasAccess && videoAccess.status === "active" && videoAccess.expiresAt && (
                  <Pill tone="emerald">Video valid until {videoAccess.expiresAt.toLocaleDateString()}</Pill>
                )}
                {completed ? <Pill tone="amber">Completed</Pill> : null}
              </div>
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

          {data.notes.length > 0 ? (
            notesAccess.hasAccess ? (
              data.notes.map((note) => (
                <Card key={note.id} className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">{note.title}</h2>
                    {notesAccess.status === "admin" && (
                      <Pill tone="indigo">Instructor Access</Pill>
                    )}
                    {notesAccess.status === "active" && notesAccess.expiresAt && (
                      <Pill tone="emerald">
                        Notes Access until {notesAccess.expiresAt.toLocaleDateString()}
                      </Pill>
                    )}
                  </div>
                  <div className="mt-4">
                    <MarkdownView markdown={note.markdown} />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="mt-6 border-2 border-dashed border-amber-300 bg-amber-50/40 p-6 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-2xl text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    🔒
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-slate-950 dark:text-white">Class Notes Restricted</h3>
                      {notesAccess.isExpired ? (
                        <Pill tone="amber">Permission Expired</Pill>
                      ) : (
                        <Pill tone="slate">Permission Required</Pill>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {notesAccess.isExpired
                        ? `Your permission to view class notes expired on ${notesAccess.expiresAt?.toLocaleDateString()}. Please contact your platform administrator or instructor to renew access.`
                        : "Class notes for this lesson require instructor permission. Your admin can grant permission with a custom expiration date by visiting your student profile."}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        href="/profile"
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        Check Profile Access Status →
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )
          ) : null}

          {(data.tasks.length || data.quizzes.length) ? <Card className="mt-6"><h2 className="text-2xl font-black">Practice and checkpoint</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{data.tasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="rounded-2xl bg-emerald-50 p-5 font-black text-emerald-800">SQL Task: {task.title}<span className="mt-2 block text-sm font-bold">+{task.points} points</span></Link>)}{data.quizzes.map((quiz) => <Link key={quiz.id} href={`/quizzes/${quiz.id}`} className="rounded-2xl bg-indigo-50 p-5 font-black text-indigo-800">Quiz: {quiz.title}<span className="mt-2 block text-sm font-bold">+{quiz.points} points</span></Link>)}</div></Card> : null}

          <LessonActions lessonId={lessonId} courseId={courseId} previousLessonId={data.previousLesson?.id} nextLessonId={data.nextLesson?.id} completed={completed} bookmarked={data.isBookmarked} />
        </section>
      </main>
    </Shell>
  );
}
