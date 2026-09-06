import { requireAdmin } from "@/lib/auth";
import { updateStudentPermissions } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSeeded();
  await requireAdmin();

  try {
    const body = await req.json();
    const {
      studentId,
      // direct flags
      enabled,
      expiresAt,
      type,
      // explicit flags
      notesEnabled,
      notesExpiresAt,
      videoEnabled,
      videoExpiresAt,
    } = body;

    if (!studentId || typeof studentId !== "string") {
      return Response.json({ error: "Invalid studentId parameter" }, { status: 400 });
    }

    const permissions: {
      notesAccessEnabled?: boolean;
      notesAccessExpiresAt?: Date | null;
      videoAccessEnabled?: boolean;
      videoAccessExpiresAt?: Date | null;
    } = {};

    // Helper to parse date
    const parseDate = (val: unknown): Date | null => {
      if (!val) return null;
      const d = new Date(String(val));
      return isNaN(d.getTime()) ? null : d;
    };

    if (type === "video") {
      if (typeof enabled === "boolean") permissions.videoAccessEnabled = enabled;
      if (expiresAt !== undefined) permissions.videoAccessExpiresAt = parseDate(expiresAt);
    } else if (type === "notes") {
      if (typeof enabled === "boolean") permissions.notesAccessEnabled = enabled;
      if (expiresAt !== undefined) permissions.notesAccessExpiresAt = parseDate(expiresAt);
    } else if (type === "both") {
      if (typeof enabled === "boolean") {
        permissions.notesAccessEnabled = enabled;
        permissions.videoAccessEnabled = enabled;
      }
      if (expiresAt !== undefined) {
        const d = parseDate(expiresAt);
        permissions.notesAccessExpiresAt = d;
        permissions.videoAccessExpiresAt = d;
      }
    } else {
      // Check for explicit fields
      if (typeof notesEnabled === "boolean") permissions.notesAccessEnabled = notesEnabled;
      if (notesExpiresAt !== undefined) permissions.notesAccessExpiresAt = parseDate(notesExpiresAt);

      if (typeof videoEnabled === "boolean") permissions.videoAccessEnabled = videoEnabled;
      if (videoExpiresAt !== undefined) permissions.videoAccessExpiresAt = parseDate(videoExpiresAt);

      // Legacy fallback
      if (permissions.notesAccessEnabled === undefined && typeof enabled === "boolean") {
        permissions.notesAccessEnabled = enabled;
        permissions.notesAccessExpiresAt = parseDate(expiresAt);
      }
    }

    const updated = await updateStudentPermissions(studentId, permissions);
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
        videoAccessEnabled: updated.videoAccessEnabled,
        videoAccessExpiresAt: updated.videoAccessExpiresAt,
      },
    });
  } catch (error: unknown) {
    return Response.json(
      { error: (error as Error).message || "Failed to update permissions" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}
