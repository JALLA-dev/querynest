import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });
  return Response.json(lesson);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.title) return Response.json({ error: "Title is required." }, { status: 400 });
  await db.update(lessons).set({
    title: body.title.trim(),
    slug: slugify(body.title),
    description: body.description?.trim() || "Updated lesson.",
    videoUrl: body.videoUrl?.trim() || null,
    durationMinutes: Number(body.durationMinutes || 8),
    updatedAt: new Date(),
  }).where(eq(lessons.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;
  await db.delete(lessons).where(eq(lessons.id, id));
  return Response.json({ ok: true });
}
