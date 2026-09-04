import Link from "next/link";
import { notFound } from "next/navigation";
import { SqlEditor } from "@/components/sql-editor";
import { PublicHeader, Shell } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getTaskForStudent } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const user = await requireUser();
  const { id } = await params;
  const task = await getTaskForStudent(id);
  if (!task) notFound();
  return (
    <Shell>
      <PublicHeader userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {task.lessonId ? <Link href={`/learn/${task.courseId}/${task.lessonId}`} className="mb-5 inline-flex text-sm font-black text-emerald-700">← Back to lesson</Link> : null}
        <SqlEditor task={{ id: task.id, title: task.title, description: task.description, dbSchema: task.dbSchema, sampleData: task.sampleData, expectedOutput: task.expectedOutput, starterSql: task.starterSql, hints: task.hints, points: task.points }} />
      </main>
    </Shell>
  );
}
