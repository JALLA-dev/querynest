import { AdminNav, Card, Shell, StatCard } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await ensureSeeded();
  await requireAdmin();
  const analytics = await getAdminAnalytics();
  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">Analytics</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">Learning insights</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Students" value={analytics.cards.students} /><StatCard label="Enrollments" value={analytics.cards.enrollments} accent="indigo" /><StatCard label="Platform points" value={analytics.cards.points} accent="amber" /><StatCard label="Quizzes" value={analytics.cards.quizzes} accent="rose" /></div>
          <Card className="mt-8"><h2 className="text-2xl font-black">Popular courses</h2><div className="mt-5 grid gap-3">{analytics.popularCourses.map((course) => <div key={course.title} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between font-black"><span>{course.title}</span><span>{course.enrollments} enrollments</span></div></div>)}</div></Card>
        </section>
      </main>
    </Shell>
  );
}
