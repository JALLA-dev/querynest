import { nanoid } from "nanoid";
import { db } from "@/db";
import { lessons, questions, quizzes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type IncomingQuestion = {
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  points?: number;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => null)) as {
      courseId?: string;
      lessonId?: string;
      title?: string;
      description?: string;
      passingPercentage?: number;
      points?: number;
      questionsList?: IncomingQuestion[];
      // Support single question fields as fallback
      question?: string;
      optionA?: string;
      optionB?: string;
      optionC?: string;
      optionD?: string;
      correctAnswer?: string;
      explanation?: string;
    } | null;

    if (!body?.courseId || !body?.title?.trim()) {
      return Response.json({ error: "Course and Quiz Title are required." }, { status: 400 });
    }

    let questionItems: IncomingQuestion[] = [];
    if (Array.isArray(body.questionsList) && body.questionsList.length > 0) {
      questionItems = body.questionsList.filter((q) => q.prompt?.trim() && q.correctAnswer?.trim());
    } else if (body.question && body.correctAnswer) {
      questionItems = [
        {
          prompt: body.question,
          optionA: body.optionA || "",
          optionB: body.optionB || "",
          optionC: body.optionC || "",
          optionD: body.optionD || "",
          correctAnswer: body.correctAnswer,
          explanation: body.explanation,
        },
      ];
    }

    if (questionItems.length === 0) {
      return Response.json({ error: "At least one valid question with a correct answer is required." }, { status: 400 });
    }

    let moduleId: string | null = null;
    if (body.lessonId) {
      const [lesson] = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1);
      moduleId = lesson?.moduleId ?? null;
    }

    const quizId = nanoid();
    await db.insert(quizzes).values({
      id: quizId,
      courseId: body.courseId,
      lessonId: body.lessonId || null,
      moduleId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      passingPercentage: Number(body.passingPercentage || 70),
      points: Number(body.points || 50),
      isPublished: true,
    });

    const questionInserts = questionItems.map((q, idx) => {
      const options = [q.optionA, q.optionB, q.optionC, q.optionD].map((opt) => opt.trim()).filter(Boolean);
      return {
        id: nanoid(),
        quizId,
        prompt: q.prompt.trim(),
        options: options.length ? options : [q.correctAnswer.trim()],
        correctAnswer: q.correctAnswer.trim(),
        explanation: q.explanation?.trim() || "Review course concepts for this question.",
        points: Number(q.points || 10),
        orderIndex: idx + 1,
      };
    });

    await db.insert(questions).values(questionInserts);

    return Response.json({ ok: true, quizId, questionsCount: questionInserts.length }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create quiz.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
