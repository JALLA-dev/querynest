import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
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

  // 1. Explicitly check if an account with this email already exists
  try {
    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; detail?: string };
    console.error("[register check error]", {
      code: error?.code,
      message: error?.message,
      detail: error?.detail,
    });
    // If the database query itself failed, don't falsely claim 409
    return Response.json(
      { error: "Database error during account verification. Please try again." },
      { status: 500 }
    );
  }

  // 2. Insert new user
  const id = nanoid();
  try {
    await db.insert(users).values({
      id,
      name,
      email,
      passwordHash: hashPassword(password),
      role: "STUDENT",
      avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(email)}`,
      streak: 1,
    });

    await setSessionCookie(id, "STUDENT");
    return Response.json({ ok: true, redirectTo: "/dashboard" });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; detail?: string; constraint?: string };
    console.error("[register insert error]", {
      code: error?.code,
      message: error?.message,
      detail: error?.detail,
      constraint: error?.constraint,
    });

    // PostgreSQL code 23505 = unique_violation
    const isUniqueViolation =
      error?.code === "23505" ||
      error?.message?.includes("unique constraint") ||
      error?.message?.includes("users_email_idx") ||
      error?.message?.includes("duplicate key");

    if (isUniqueViolation) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
      return Response.json({ error: "Database is temporarily unavailable. Please try again." }, { status: 503 });
    }

    return Response.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
