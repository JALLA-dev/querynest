import { redirect } from "next/navigation";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { enrollUser } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function LearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  await ensureSeeded();
  const user = await requireUser();
  const { courseId } = await params;
  await enrollUser(user.id, courseId);
  const [firstLesson] = await db.select().from(lessons).where(and(eq(lessons.courseId, courseId), eq(lessons.isPublished, true))).orderBy(asc(lessons.orderIndex)).limit(1);
  redirect(firstLesson ? `/learn/${courseId}/${firstLesson.id}` : `/courses/${courseId}`);
}
