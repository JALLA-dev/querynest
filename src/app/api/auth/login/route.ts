import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie } from "@/lib/auth";
import { normalizeEmail, verifyPassword } from "@/lib/security";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }
  await db.update(users).set({ lastActiveAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  await setSessionCookie(user.id, user.role);
  return Response.json({ ok: true, redirectTo: user.role === "ADMIN" ? "/admin" : "/dashboard" });
}
