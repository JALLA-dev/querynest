import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type UserRole } from "@/db/schema";
import { safeEqual, signValue } from "./security";

const COOKIE_NAME = "querynest_session";
const SESSION_DAYS = 7;

type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  streak: number;
  notesAccessEnabled?: boolean;
  notesAccessExpiresAt?: Date | null;
};

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.userId || !parsed.role || !parsed.exp) return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string, role: UserRole) {
  const payload = encodePayload({
    userId,
    role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  return `${payload}.${signValue(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signValue(payload), signature)) return null;
  return decodePayload(payload);
}

export async function setSessionCookie(userId: string, role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(userId, role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      streak: users.streak,
      notesAccessEnabled: users.notesAccessEnabled,
      notesAccessExpiresAt: users.notesAccessExpiresAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export function isAdmin(user: AuthUser | null) {
  return user?.role === "ADMIN";
}

export type NotesAccessResult = {
  hasAccess: boolean;
  isExpired: boolean;
  status: "admin" | "active" | "expired" | "disabled";
  expiresAt: Date | null;
};

export function checkNotesAccess(user?: {
  role?: string | null;
  notesAccessEnabled?: boolean | null;
  notesAccessExpiresAt?: Date | string | null;
} | null): NotesAccessResult {
  if (!user) {
    return { hasAccess: false, isExpired: false, status: "disabled", expiresAt: null };
  }

  // Admins always have unconditional access to notes
  if (user.role === "ADMIN") {
    return { hasAccess: true, isExpired: false, status: "admin", expiresAt: null };
  }

  // If permission switch is off
  if (!user.notesAccessEnabled) {
    return { hasAccess: false, isExpired: false, status: "disabled", expiresAt: null };
  }

  // If no expiration date set, access is lifetime/ongoing
  if (!user.notesAccessExpiresAt) {
    return { hasAccess: true, isExpired: false, status: "active", expiresAt: null };
  }

  const expiry = new Date(user.notesAccessExpiresAt);
  if (isNaN(expiry.getTime())) {
    // If invalid date, grant access as fallback
    return { hasAccess: true, isExpired: false, status: "active", expiresAt: null };
  }

  if (expiry.getTime() <= Date.now()) {
    return { hasAccess: false, isExpired: true, status: "expired", expiresAt: expiry };
  }

  return { hasAccess: true, isExpired: false, status: "active", expiresAt: expiry };
}
