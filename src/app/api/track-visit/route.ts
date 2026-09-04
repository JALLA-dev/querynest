import { getCurrentUser } from "@/lib/auth";
import { recordSiteVisit } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = (await request.json().catch(() => ({}))) as { path?: string; referer?: string };
    const userAgent = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");

    const visit = await recordSiteVisit({
      path: body.path || "/",
      ip: ip || null,
      userAgent: userAgent || null,
      referer: body.referer || request.headers.get("referer") || null,
      userId: user?.id || null,
      userRole: user?.role || "GUEST",
      userName: user?.name || null,
    });

    return Response.json({ ok: true, visitId: visit.id });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
