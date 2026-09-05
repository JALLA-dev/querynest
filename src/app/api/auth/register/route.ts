import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, isValidEmail, normalizeEmail } from "@/lib/security";
import { setSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/db/init";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Ensure schema is fully synced before performing query or insert
  await ensureSchema();
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
    const rawError = err as any;
    const cause = rawError?.cause ?? {};
    const code = cause?.code ?? rawError?.code;
    const message = cause?.message ?? rawError?.message;

    console.error("[register check error]", {
      code,
      message,
      detail: cause?.detail ?? rawError?.detail,
      table: cause?.table ?? rawError?.table,
    });

    return Response.json(
      { error: "Database error during account verification. Please try again." },
      { status: 500 }
    );
  }

  // 2. Insert new user with explicit timestamps and defaults
  const id = nanoid();
  const now = new Date();

  try {
    await db.insert(users).values({
      id,
      name,
      email,
      passwordHash: hashPassword(password),
      role: "STUDENT",
      avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(email)}`,
      streak: 1,
      createdAt: now,
      updatedAt: now,
    });

    await setSessionCookie(id, "STUDENT");
    return Response.json({ ok: true, redirectTo: "/dashboard" });
  } catch (err: unknown) {
    const rawError = err as any;
    const cause = rawError?.cause ?? {};
    const code = cause?.code ?? rawError?.code;
    const message = cause?.message ?? rawError?.message;
    const detail = cause?.detail ?? rawError?.detail;
    const constraint = cause?.constraint ?? rawError?.constraint;
    const column = cause?.column ?? rawError?.column;
    const table = cause?.table ?? rawError?.table;

    console.error("[register insert error]", {
      code,
      message,
      detail,
      constraint,
      column,
      table,
    });

    // PostgreSQL code 23505 = unique_violation
    const isUniqueViolation =
      code === "23505" ||
      message?.includes("unique constraint") ||
      message?.includes("users_email_idx") ||
      message?.includes("duplicate key") ||
      detail?.includes("already exists");

    if (isUniqueViolation) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    if (code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      return Response.json({ error: "Database is temporarily unavailable. Please try again." }, { status: 503 });
    }

    return Response.json(
      {
        error: "Failed to create account. Please try again.",
        detail: process.env.NODE_ENV !== "production" ? message : undefined,
        code: code ?? "DB_INSERT_ERROR",
      },
      { status: 500 }
    );
  }
}
