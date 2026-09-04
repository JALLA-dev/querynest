import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { lessons, notes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.courseId || !body.moduleId || !body.title || !body.description) {
    return Response.json({ error: "Course, module, title, and description are required." }, { status: 400 });
  }
  const [lessonCount] = await db.select({ value: count() }).from(lessons).where(eq(lessons.courseId, body.courseId));
  const id = nanoid();
  await db.insert(lessons).values({
    id,
    courseId: body.courseId,
    moduleId: body.moduleId,
    title: body.title.trim(),
    slug: slugify(body.title),
    description: body.description.trim(),
    videoUrl: body.videoUrl?.trim() || null,
    videoProvider: body.videoUrl?.includes("youtube") ? "youtube" : "external",
    durationMinutes: Number(body.durationMinutes || 8),
    orderIndex: (lessonCount?.value ?? 0) + 1,
    points: 10,
    concepts: [body.title.trim()],
    sqlExamples: [],
    isPublished: true,
  });
  await db.insert(notes).values({ id: nanoid(), lessonId: id, title: `${body.title.trim()} Notes`, markdown: body.notesMarkdown?.trim() || `## ${body.title.trim()}\n\nAdd lesson notes here.` });
  return Response.json({ ok: true, id }, { status: 201 });
}
