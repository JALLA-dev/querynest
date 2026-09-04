import { requireAdmin } from "@/lib/auth";
import { listStudentsForAdmin } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  await requireAdmin();
  return Response.json(await listStudentsForAdmin());
}
