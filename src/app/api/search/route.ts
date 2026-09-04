import { sanitizeSearch } from "@/lib/security";
import { searchContent } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const query = sanitizeSearch(url.searchParams.get("q") ?? "");
  if (!query) return Response.json({ courses: [], lessons: [], notes: [], tasks: [], quizzes: [] });
  return Response.json(await searchContent(query));
}
