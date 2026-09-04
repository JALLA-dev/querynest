import { db } from "@/db";
import { quizzes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await db.delete(quizzes).where(eq(quizzes.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete quiz.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
