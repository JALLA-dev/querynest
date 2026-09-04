import { getQuizForStudent } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const quiz = await getQuizForStudent(id);
  if (!quiz) return Response.json({ error: "Quiz not found" }, { status: 404 });
  return Response.json(quiz);
}
