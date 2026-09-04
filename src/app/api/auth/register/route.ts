import { nanoid } from "nanoid";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, isValidEmail, normalizeEmail } from "@/lib/security";
import { setSessionCookie } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => null)) as { name?: string; email?: string; password?: string } | null;
  const name = body?.name?.trim() ?? "";
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";
  if (name.length < 2) return Response.json({ error: "Name is required." }, { status: 400 });
  if (!isValidEmail(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const id = nanoid();
  try {
    await db.insert(users).values({ id, name, email, passwordHash: hashPassword(password), role: "STUDENT", avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(email)}`, streak: 1 });
    await setSessionCookie(id, "STUDENT");
    return Response.json({ ok: true, redirectTo: "/dashboard" });
  } catch {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }
}
