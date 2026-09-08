import { askSqlAgent } from "@/lib/ai-agent/sql-agent";
import { getCurrentUser, checkAiAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Verify student/admin permissions
    const user = await getCurrentUser();
    const access = checkAiAccess(user);

    if (!access.hasAccess) {
      const isExpired = access.isExpired;
      const expireMsg = access.expiresAt
        ? `Your access expired on ${access.expiresAt.toLocaleDateString()}. `
        : "";

      return Response.json(
        {
          hasAiAccess: false,
          error: "AI_ACCESS_RESTRICTED",
          reply: `🔒 **AI Agent Access Restricted**\n\n${expireMsg}AI Agent & Voice Copilot requires instructor permission. Please contact your instructor or platform administrator to get access.`,
          message: "Please contact your instructor to get access.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      prompt?: string;
      apiKey?: string;
    } | null;

    const prompt = body?.prompt?.trim();
    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const response = await askSqlAgent(prompt, body?.apiKey);
    return Response.json({ ...response, hasAiAccess: true });
  } catch (error) {
    console.error("[api/ai/agent] Error:", error);
    return Response.json(
      {
        error: "Failed to process question.",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
