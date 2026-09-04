import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getCourseWithOutline } from "@/lib/data";
import { slugify } from "@/lib/security";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await context.params;
  const course = await getCourseWithOutline(id);
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });
  return Response.json(course);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.title) return Response.json({ error: "Title is required." }, { status: 400 });
  await db.update(courses).set({
    title: body.title.trim(),
    slug: slugify(body.title),
    description: body.description?.trim() || "Updated Querynest course.",
    instructorName: body.instructorName?.trim() || "Querynest Instructor",
    difficulty: body.difficulty?.trim() || "Beginner",
    durationMinutes: Number(body.durationMinutes || 120),
    updatedAt: new Date(),
  }).where(eq(courses.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;
  await db.delete(courses).where(eq(courses.id, id));
  return Response.json({ ok: true });
}
