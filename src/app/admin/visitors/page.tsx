import { AdminNav, Card, Shell, StatCard, Pill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getVisitorAnalytics } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

function parseDevice(ua: string | null) {
  if (!ua) return "Unknown Device";
  if (/mobile/i.test(ua)) return "Mobile Device";
  if (/tablet/i.test(ua)) return "Tablet";
  if (/windows/i.test(ua)) return "Windows PC";
  if (/macintosh|mac os/i.test(ua)) return "Mac";
  if (/linux/i.test(ua)) return "Linux PC";
  return "Desktop Browser";
}

export default async function AdminVisitorsPage() {
  await ensureSeeded();
  await requireAdmin();

  const analytics = await getVisitorAnalytics(100);

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              Audience & Telemetry
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Website Visitors
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Live telemetry showing who is visiting Querynest, top visited landing pages, and member engagement.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Site Visits" value={analytics.totalVisits} accent="emerald" />
            <StatCard label="Visits Today" value={analytics.visitsToday} accent="indigo" />
            <StatCard label="Member Visits" value={analytics.memberVisits} accent="amber" />
            <StatCard label="Guest Visits" value={analytics.guestVisits} accent="rose" />
          </div>

          {/* Top Visited Pages */}
          <Card>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Top Visited Pages</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Most frequent destinations across all sessions.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analytics.topPages.length ? (
                analytics.topPages.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {item.path}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.count} views
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No page views recorded yet.</p>
              )}
            </div>
          </Card>

          {/* Real-time Visitor Logs */}
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">Live Visitor Stream</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Detailed chronological view of individuals visiting our platform.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/80">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Visitor</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Role</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Page URL</th>
                    <th className="px-5 py-3.5 text-left font-black text-slate-600 dark:text-slate-400">Device / Browser</th>
                    <th className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-400">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/40">
                  {analytics.recentVisits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No visitor logs captured yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.recentVisits.map((v) => (
                      <tr key={v.id}>
                        <td className="px-5 py-4">
                          <span className="block font-bold text-slate-950 dark:text-white">
                            {v.userName || (v.userRole !== "GUEST" ? "Authenticated User" : "Anonymous Visitor")}
                          </span>
                          {v.ip && <span className="block font-mono text-xs text-slate-400">IP: {v.ip}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <Pill tone={v.userRole === "ADMIN" ? "indigo" : v.userRole === "STUDENT" ? "emerald" : "slate"}>
                            {v.userRole}
                          </Pill>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                          {v.path}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {parseDevice(v.userAgent)}
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-slate-500 dark:text-slate-400">
                          {new Date(v.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </Shell>
  );
}
