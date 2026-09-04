import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { lessons, tasks, type JsonRow, type PracticeDataset } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json().catch(() => null)) as Record<string, string> | null;
  if (!body?.courseId || !body.lessonId || !body.title || !body.description || !body.sampleDataJson || !body.expectedOutputJson || !body.solutionSql) {
    return Response.json({ error: "Complete all required task fields." }, { status: 400 });
  }
  let sampleData: PracticeDataset;
  let expectedOutput: JsonRow[];
  try {
    sampleData = JSON.parse(body.sampleDataJson) as PracticeDataset;
    expectedOutput = JSON.parse(body.expectedOutputJson) as JsonRow[];
  } catch {
    return Response.json({ error: "Sample data and expected output must be valid JSON." }, { status: 400 });
  }
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1);
  const id = nanoid();
  await db.insert(tasks).values({
    id,
    courseId: body.courseId,
    lessonId: body.lessonId,
    moduleId: lesson?.moduleId ?? null,
    title: body.title.trim(),
    description: body.description.trim(),
    difficulty: body.difficulty?.trim() || "Easy",
    dbSchema: body.dbSchema?.trim() || "Practice table",
    sampleData,
    expectedOutput,
    starterSql: body.solutionSql.trim(),
    solutionSql: body.solutionSql.trim(),
    hints: ["Read the expected output columns carefully."],
    points: Number(body.points || 20),
    isPublished: true,
  });
  return Response.json({ ok: true, id }, { status: 201 });
}
