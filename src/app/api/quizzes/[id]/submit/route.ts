import { nanoid } from "nanoid";
import { db } from "@/db";
import { quizAttempts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { awardPoints, getQuizForStudent } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { answers?: Record<string, string> } | null;
  const data = await getQuizForStudent(id);
  if (!data) return Response.json({ error: "Quiz not found" }, { status: 404 });
  const answers = body?.answers ?? {};
  const review = data.questions.map((question) => ({
    questionId: question.id,
    prompt: question.prompt,
    selected: answers[question.id] ?? "",
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    correct: answers[question.id] === question.correctAnswer,
  }));
  const score = review.filter((item) => item.correct).length;
  const totalQuestions = data.questions.length;
  const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= data.quiz.passingPercentage;
  const pointsEarned = passed ? await awardPoints(user.id, data.quiz.points, `Passed quiz: ${data.quiz.title}`, "quiz", data.quiz.id) : 0;
  await db.insert(quizAttempts).values({ id: nanoid(), userId: user.id, quizId: data.quiz.id, score, totalQuestions, percentage, passed, pointsAwarded: pointsEarned, answers });
  return Response.json({ score, totalQuestions, percentage, passed, pointsEarned, review });
}
