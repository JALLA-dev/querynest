import { requireAdmin } from "@/lib/auth";
import { updateStudentNotesAccess } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSeeded();
  await requireAdmin();

  try {
    const body = await req.json();
    const { studentId, enabled, expiresAt } = body;

    if (!studentId || typeof studentId !== "string") {
      return Response.json({ error: "Invalid studentId parameter" }, { status: 400 });
    }

    if (typeof enabled !== "boolean") {
      return Response.json({ error: "Invalid enabled flag" }, { status: 400 });
    }

    let parsedExpiry: Date | null = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (isNaN(parsedExpiry.getTime())) {
        return Response.json({ error: "Invalid expiresAt date format" }, { status: 400 });
      }
    }

    const updated = await updateStudentNotesAccess(studentId, enabled, parsedExpiry);
    if (!updated) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    return Response.json({
      ok: true,
      student: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        notesAccessEnabled: updated.notesAccessEnabled,
        notesAccessExpiresAt: updated.notesAccessExpiresAt,
      },
    });
  } catch (error: unknown) {
    return Response.json(
      { error: (error as Error).message || "Failed to update notes access" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}
