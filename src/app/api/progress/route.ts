import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const user = await requireUser();
  return Response.json(await getDashboardData(user.id));
}
