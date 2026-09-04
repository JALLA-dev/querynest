import { AdminNav, Card, Shell } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { listStudentsForAdmin, levelFromPoints } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  await ensureSeeded();
  await requireAdmin();
  const students = await listStudentsForAdmin();
  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">Manage students</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">Students</h1>
          <Card className="mt-8 p-0"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50"><tr><th className="px-5 py-4 text-left font-black">Student</th><th className="px-5 py-4 text-left font-black">Email</th><th className="px-5 py-4 text-left font-black">Points</th><th className="px-5 py-4 text-left font-black">Level</th><th className="px-5 py-4 text-left font-black">Streak</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{students.map((student) => <tr key={student.id}><td className="px-5 py-4 font-black">{student.name}</td><td className="px-5 py-4">{student.email}</td><td className="px-5 py-4 font-black text-emerald-700">{student.totalPoints}</td><td className="px-5 py-4">{levelFromPoints(student.totalPoints)}</td><td className="px-5 py-4">{student.streak} days</td></tr>)}</tbody></table></div></Card>
        </section>
      </main>
    </Shell>
  );
}
