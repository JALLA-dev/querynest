import { asc, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { enrollUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  await enrollUser(user.id, id);
  const [firstLesson] = await db.select().from(lessons).where(and(eq(lessons.courseId, id), eq(lessons.isPublished, true))).orderBy(asc(lessons.orderIndex)).limit(1);
  return Response.json({ ok: true, nextLessonId: firstLesson?.id });
}
