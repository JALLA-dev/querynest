import { requireUser } from "@/lib/auth";
import { completeLesson } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json().catch(() => null)) as { lessonId?: string } | null;
  if (!body?.lessonId) return Response.json({ error: "Lesson ID is required." }, { status: 400 });
  try {
    const result = await completeLesson(user.id, body.lessonId);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save progress." }, { status: 400 });
  }
}
