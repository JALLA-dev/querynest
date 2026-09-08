import { askSqlAgent } from "@/lib/ai-agent/sql-agent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      prompt?: string;
      apiKey?: string;
    } | null;

    const prompt = body?.prompt?.trim();
    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const response = await askSqlAgent(prompt, body?.apiKey);
    return Response.json(response);
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
