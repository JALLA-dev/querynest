import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { lessons, questions, quizzes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.courseId || !body.lessonId || !body.title || !body.question || !body.correctAnswer) {
    return Response.json({ error: "Quiz title and first question are required." }, { status: 400 });
  }
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1);
  const quizId = nanoid();
  await db.insert(quizzes).values({
    id: quizId,
    courseId: body.courseId,
    lessonId: body.lessonId,
    moduleId: lesson?.moduleId ?? null,
    title: body.title.trim(),
    description: body.description?.trim() || null,
    passingPercentage: 70,
    points: Number(body.points || 50),
    isPublished: true,
  });
  await db.insert(questions).values({
    id: nanoid(),
    quizId,
    prompt: body.question.trim(),
    options: [body.optionA, body.optionB, body.optionC, body.optionD].filter(Boolean),
    correctAnswer: body.correctAnswer.trim(),
    explanation: body.explanation?.trim() || "Review the lesson notes for this answer.",
    points: 10,
    orderIndex: 1,
  });
  return Response.json({ ok: true, id: quizId }, { status: 201 });
}
