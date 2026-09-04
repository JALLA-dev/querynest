import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json().catch(() => null)) as { lessonId?: string } | null;
  if (!body?.lessonId) return Response.json({ error: "Lesson ID is required." }, { status: 400 });
  const [existing] = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, user.id), eq(bookmarks.lessonId, body.lessonId))).limit(1);
  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
    return Response.json({ ok: true, bookmarked: false });
  }
  await db.insert(bookmarks).values({ id: nanoid(), userId: user.id, lessonId: body.lessonId }).onConflictDoNothing();
  return Response.json({ ok: true, bookmarked: true });
}
