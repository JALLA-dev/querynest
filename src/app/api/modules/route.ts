import { nanoid } from "nanoid";
import { db } from "@/db";
import { modules } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.courseId || !body.title) return Response.json({ error: "Course and title are required." }, { status: 400 });
  const id = nanoid();
  await db.insert(modules).values({
    id,
    courseId: body.courseId,
    title: body.title.trim(),
    description: body.description?.trim() || null,
    orderIndex: Number(body.orderIndex || 1),
    points: 100,
    isPublished: true,
  });
  return Response.json({ ok: true, id }, { status: 201 });
}
