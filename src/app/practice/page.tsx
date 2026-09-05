import { PublicHeader, Footer, Shell } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { SqlSandbox } from "@/components/sql-sandbox";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  const allTasks = await db.select({
    id: tasks.id,
    title: tasks.title,
    points: tasks.points,
    difficulty: tasks.difficulty,
    description: tasks.description,
  }).from(tasks);

  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span>💻</span> Live SQL Practice Panel
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Interactive SQL Playground
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600 dark:text-slate-400">
            Practice SQL queries freely on sample datasets with live execution feedback, or solve specific challenges to earn points and climb the ranks.
          </p>
        </div>

        <SqlSandbox initialTasks={allTasks} />
      </main>
      <Footer />
    </Shell>
  );
}
