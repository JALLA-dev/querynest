import { requireUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      bio?: string;
      avatarUrl?: string;
    } | null;

    if (!body?.name?.trim()) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }

    await updateUserProfile(user.id, {
      name: body.name,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
    });

    return Response.json({ ok: true, message: "Profile updated successfully." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update profile.";
    return Response.json({ error: msg }, { status: 400 });
  }
}
