import { getTaskForStudent } from "@/lib/data";
import { executePracticeSql } from "@/lib/sql-engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const task = await getTaskForStudent(id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  const result = executePracticeSql(body?.query ?? "", task.sampleData);
  return Response.json(result);
}
