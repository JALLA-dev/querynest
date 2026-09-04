import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import { PublicHeader, Shell } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getQuizForStudent } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await requireUser();
  const { id } = await params;
  const data = await getQuizForStudent(id);
  if (!data) notFound();
  return (
    <Shell>
      <PublicHeader userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {data.quiz.lessonId ? <Link href={`/learn/${data.quiz.courseId}/${data.quiz.lessonId}`} className="mb-5 inline-flex text-sm font-black text-emerald-700">← Back to lesson</Link> : null}
        <QuizPlayer quiz={data.quiz} questions={data.questions.map((question) => ({ id: question.id, prompt: question.prompt, options: question.options }))} />
      </main>
    </Shell>
  );
}
