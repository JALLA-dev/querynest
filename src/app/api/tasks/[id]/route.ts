import { getTaskForStudent } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const task = await getTaskForStudent(id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json(task);
}
