import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/security";
import { formatVideoEmbedUrl, detectVideoProvider } from "@/lib/video";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json().catch(() => null)) as {
    lessonId?: string;
    courseId?: string;
    moduleId?: string;
    title?: string;
    videoUrl?: string;
    durationMinutes?: number | string;
    description?: string;
  } | null;

  if (!body) {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  // If lessonId provided, update existing lesson's video
  if (body.lessonId) {
    const formattedUrl = formatVideoEmbedUrl(body.videoUrl);
    const provider = detectVideoProvider(body.videoUrl);
    const duration = Number(body.durationMinutes || 10);

    const updateData: Record<string, unknown> = {
      videoUrl: formattedUrl,
      videoProvider: provider,
      durationMinutes: duration,
      updatedAt: new Date(),
    };

    if (body.title && body.title.trim()) {
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }

    await db.update(lessons).set(updateData).where(eq(lessons.id, body.lessonId));
    return Response.json({ ok: true, formattedUrl });
  }

  // Otherwise, create a new video lesson
  if (!body.courseId || !body.moduleId || !body.title?.trim()) {
    return Response.json({ error: "Course, module, and lesson title are required." }, { status: 400 });
  }

  const formattedUrl = formatVideoEmbedUrl(body.videoUrl);
  const provider = detectVideoProvider(body.videoUrl);
  const duration = Number(body.durationMinutes || 10);
  const id = `lesson-${nanoid(8)}`;

  await db.insert(lessons).values({
    id,
    courseId: body.courseId,
    moduleId: body.moduleId,
    title: body.title.trim(),
    slug: slugify(body.title.trim()),
    description: body.description?.trim() || `Video lesson: ${body.title.trim()}`,
    videoUrl: formattedUrl,
    videoProvider: provider,
    durationMinutes: duration,
    points: 10,
    isPublished: true,
  });

  return Response.json({ ok: true, id, formattedUrl });
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) {
    return Response.json({ error: "lessonId required" }, { status: 400 });
  }

  await db.update(lessons).set({
    videoUrl: null,
    videoProvider: "external",
    updatedAt: new Date(),
  }).where(eq(lessons.id, lessonId));

  return Response.json({ ok: true });
}
