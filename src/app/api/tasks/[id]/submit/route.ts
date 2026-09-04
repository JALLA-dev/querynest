import { nanoid } from "nanoid";
import { db } from "@/db";
import { taskSubmissions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { awardPoints, getTaskForStudent } from "@/lib/data";
import { areRowsEqual, executePracticeSql } from "@/lib/sql-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const task = await getTaskForStudent(id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  const result = executePracticeSql(body?.query ?? "", task.sampleData);
  const correct = result.ok && areRowsEqual(result.rows, task.expectedOutput);
  const pointsEarned = correct ? await awardPoints(user.id, task.points, `Completed task: ${task.title}`, "task", task.id) : 0;
  await db.insert(taskSubmissions).values({ id: nanoid(), userId: user.id, taskId: task.id, query: body?.query ?? "", isCorrect: correct, result: result.rows, pointsAwarded: pointsEarned });
  return Response.json({ ...result, correct, pointsEarned, message: correct ? "Correct result submitted." : result.message || "Incorrect result." });
}
