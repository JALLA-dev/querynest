import { Footer, PublicHeader, Shell, Card, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  await ensureSeeded();
  const [user, leaderboard] = await Promise.all([getCurrentUser(), getLeaderboard(50)]);
  const ownRank = user ? leaderboard.find((row) => row.userId === user.id) : null;
  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center"><Pill tone="emerald">Gamified SQL learning</Pill><h1 className="mt-4 text-5xl font-black tracking-tight">Leaderboard</h1><p className="mt-3 text-slate-600">Rankings are calculated from lesson, task, quiz, module, and course points.</p></div>
        {ownRank ? <Card className="mt-8 bg-slate-950 text-white"><p className="text-sm font-black uppercase tracking-wide text-emerald-300">Your ranking</p><div className="mt-3 flex items-center justify-between"><h2 className="text-2xl font-black">#{ownRank.rank} {ownRank.name}</h2><p className="text-3xl font-black text-emerald-300">{Number(ownRank.points)} pts</p></div></Card> : null}
        <Card className="mt-8 p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50"><tr><th className="px-5 py-4 text-left font-black">Rank</th><th className="px-5 py-4 text-left font-black">Student</th><th className="px-5 py-4 text-left font-black">Level</th><th className="px-5 py-4 text-left font-black">Points</th><th className="px-5 py-4 text-left font-black">Completed Courses</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{leaderboard.map((row) => <tr key={row.userId} className={row.userId === user?.id ? "bg-emerald-50" : "bg-white"}><td className="px-5 py-4 font-black">#{row.rank}</td><td className="px-5 py-4 font-bold">{row.name}</td><td className="px-5 py-4">{row.level}</td><td className="px-5 py-4 font-black text-emerald-700">{Number(row.points)}</td><td className="px-5 py-4">{Number(row.completedCourses)}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </main>
      <Footer />
    </Shell>
  );
}
