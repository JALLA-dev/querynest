import { AdminNav, Shell } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { listStudentsForAdmin } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";
import { AdminStudentsClient } from "@/components/admin-students-client";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  await ensureSeeded();
  await requireAdmin();

  let rawStudents: Awaited<ReturnType<typeof listStudentsForAdmin>> = [];
  try {
    rawStudents = await listStudentsForAdmin();
  } catch (err) {
    console.error("[AdminStudentsPage] listStudentsForAdmin notice:", err);
  }

  // Ensure fully JSON-serializable primitives for Client Component boundary
  const students = rawStudents.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    totalPoints: Number(s.totalPoints || 0),
    streak: Number(s.streak || 0),
    notesAccessEnabled: Boolean(s.notesAccessEnabled),
    notesAccessExpiresAt: s.notesAccessExpiresAt
      ? new Date(s.notesAccessExpiresAt).toISOString()
      : null,
    videoAccessEnabled: Boolean(s.videoAccessEnabled),
    videoAccessExpiresAt: s.videoAccessExpiresAt
      ? new Date(s.videoAccessExpiresAt).toISOString()
      : null,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
  }));

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              Student Directory & Access
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Students
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage student enrollments, monitor points and levels, and grant or revoke Class Notes access permissions with custom expiration dates.
            </p>
          </div>
          <AdminStudentsClient students={students} />
        </section>
      </main>
    </Shell>
  );
}
