import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav, Card, Pill, Shell, StatCard } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getStudentDetailForAdmin, levelFromPoints } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";
import { AdminStudentNotesAccess } from "@/components/admin-student-notes-access";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureSeeded();
  await requireAdmin();
  const { id } = await params;

  const data = await getStudentDetailForAdmin(id);
  if (!data || !data.student) {
    notFound();
  }

  const { student, totalPoints, profileData } = data;
  const level = levelFromPoints(totalPoints);

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-8">
          {/* Breadcrumb / Back Link */}
          <div>
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
            >
              ← Back to Students Directory
            </Link>
          </div>

          {/* Student Profile Overview */}
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <img
                src={student.avatarUrl ?? "https://api.dicebear.com/9.x/shapes/svg?seed=student"}
                alt={student.name}
                className="size-24 rounded-[2rem] bg-slate-100 ring-2 ring-emerald-500/20 object-cover dark:bg-slate-800"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black text-slate-950 dark:text-white">{student.name}</h1>
                  <Pill tone="emerald">{level}</Pill>
                  <Pill tone="indigo">{student.streak} day streak</Pill>
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{student.email}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {student.bio ?? "SQL learner enrolled at Querynest."}
                </p>
                <p className="text-xs text-slate-400">
                  Joined: {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "Recently"}
                </p>
              </div>
            </div>
          </Card>

          {/* CLASS NOTES PERMISSION & EXPIRY CONTROL */}
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-4">
              Class Notes Access Management
            </h2>
            <AdminStudentNotesAccess student={student} />
          </div>

          {/* Student Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Points" value={totalPoints} accent="emerald" />
            <StatCard
              label="Courses Completed"
              value={profileData?.dashboard?.stats?.completedCourses ?? 0}
              accent="indigo"
            />
            <StatCard
              label="Tasks Solved"
              value={profileData?.dashboard?.stats?.tasksCompleted ?? 0}
              accent="amber"
            />
            <StatCard
              label="Quizzes Passed"
              value={profileData?.dashboard?.stats?.quizzesCompleted ?? 0}
              accent="rose"
            />
          </div>

          {/* Badges & Certificates */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Earned Badges</h2>
              <div className="mt-4 grid gap-3">
                {profileData?.badges?.length ? (
                  profileData.badges.map(({ badge }) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <b className="text-slate-950 dark:text-white">{badge.name}</b>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{badge.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No badges earned yet.</p>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Certificates</h2>
              <div className="mt-4 grid gap-3">
                {profileData?.certificates?.length ? (
                  profileData.certificates.map(({ certificate, course }) => (
                    <div
                      key={certificate.id}
                      className="rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-950/40"
                    >
                      <b className="text-emerald-950 dark:text-emerald-200">{course.title}</b>
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                        Certificate ID: {certificate.certificateId} • Issued:{" "}
                        {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No course certificates issued yet.</p>
                )}
              </div>
            </Card>
          </div>
        </section>
      </main>
    </Shell>
  );
}
