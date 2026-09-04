import { nanoid } from "nanoid";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { getPublishedCourses } from "@/lib/data";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/security";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  return Response.json(await getPublishedCourses());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.title || !body.description) return Response.json({ error: "Title and description are required." }, { status: 400 });
  const id = nanoid();
  await db.insert(courses).values({
    id,
    title: body.title.trim(),
    slug: slugify(body.title),
    description: body.description.trim(),
    longDescription: body.description.trim(),
    instructorName: body.instructorName?.trim() || admin.name,
    difficulty: body.difficulty?.trim() || "Beginner",
    durationMinutes: Number(body.durationMinutes || 120),
    totalPoints: 500,
    tags: ["SQL"],
    isPublished: true,
    createdById: admin.id,
  });
  return Response.json({ ok: true, id }, { status: 201 });
}
