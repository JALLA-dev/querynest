import { requireUser } from "@/lib/auth";
import { changeUserPassword } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } | null;

    if (!body?.currentPassword || !body?.newPassword) {
      return Response.json({ error: "Current password and new password are required." }, { status: 400 });
    }

    if (body.newPassword.length < 8) {
      return Response.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
    }

    if (body.confirmPassword && body.newPassword !== body.confirmPassword) {
      return Response.json({ error: "New passwords do not match." }, { status: 400 });
    }

    await changeUserPassword(user.id, body.currentPassword, body.newPassword);
    return Response.json({ ok: true, message: "Password changed successfully." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to change password.";
    return Response.json({ error: msg }, { status: 400 });
  }
}
