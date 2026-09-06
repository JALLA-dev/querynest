import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, PublicHeader, Shell, Card, Pill, StatCard } from "@/components/ui";
import { checkNotesAccess, requireUser } from "@/lib/auth";
import { getProfileData } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";
import { AdminSettingsClient } from "@/components/admin-settings-client";
import { AdminStudentNotesAccess } from "@/components/admin-student-notes-access";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ userId?: string }>;
}) {
  await ensureSeeded();
  const authUser = await requireUser();
  const query = searchParams ? await searchParams : {};
  const targetUserId = authUser.role === "ADMIN" && query.userId ? query.userId : authUser.id;

  const data = await getProfileData(targetUserId);
  if (!data) notFound();

  const isViewingOther = targetUserId !== authUser.id;
  const notesAccess = checkNotesAccess(data.user);

  return (
    <Shell>
      <PublicHeader userName={authUser.name} isAdmin={authUser.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {isViewingOther && (
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                You are managing student: <b>{data.user.name}</b> ({data.user.email}) as Administrator
              </p>
            </div>
            <Link
              href="/admin/students"
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500"
            >
              ← Back to Students
            </Link>
          </div>
        )}

        <Card>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={data.user.avatarUrl ?? "https://api.dicebear.com/9.x/shapes/svg?seed=querynest"}
              alt="Profile"
              className="size-24 rounded-[2rem] bg-slate-100 ring-2 ring-emerald-500/20 object-cover dark:bg-slate-800"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="emerald">{data.dashboard.stats.level}</Pill>
                {data.user.role === "ADMIN" && <Pill tone="indigo">Admin</Pill>}
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">{data.user.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.user.email}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {data.user.bio ?? "SQL learner at Querynest."}
              </p>
            </div>
          </div>
        </Card>

        {/* CLASS NOTES ACCESS PERMISSION SECTION */}
        {authUser.role === "ADMIN" && isViewingOther ? (
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-4">Class Notes Permission</h2>
            <AdminStudentNotesAccess
              student={{
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                notesAccessEnabled: Boolean(data.user.notesAccessEnabled),
                notesAccessExpiresAt: data.user.notesAccessExpiresAt
                  ? new Date(data.user.notesAccessExpiresAt).toISOString()
                  : null,
              }}
            />
          </div>
        ) : (
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">Class Notes Access</h2>
                  {notesAccess.status === "admin" && <Pill tone="indigo">Admin Privilege</Pill>}
                  {notesAccess.status === "active" && <Pill tone="emerald">Access Granted</Pill>}
                  {notesAccess.status === "expired" && <Pill tone="amber">Access Expired</Pill>}
                  {notesAccess.status === "disabled" && <Pill tone="slate">Restricted</Pill>}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {notesAccess.status === "admin" &&
                    "As an administrator and instructor, you have permanent unrestricted access to all class notes and lesson materials."}
                  {notesAccess.status === "active" &&
                    (notesAccess.expiresAt
                      ? `Your class notes permission is active until ${notesAccess.expiresAt.toLocaleDateString()} at ${notesAccess.expiresAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
                      : "You have permanent active access to view all study notes across Querynest classes.")}
                  {notesAccess.status === "expired" &&
                    `Your class notes permission expired on ${notesAccess.expiresAt?.toLocaleDateString()}. Please contact your instructor to extend or renew access.`}
                  {notesAccess.status === "disabled" &&
                    "Access to class notes requires permission from the platform administrator or course instructor. Reach out to your instructor to unlock study notes."}
                </p>
              </div>

              {notesAccess.status === "active" ? (
                <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-center dark:bg-emerald-950/40">
                  <span className="text-2xl">📖</span>
                  <p className="mt-1 text-xs font-black text-emerald-800 dark:text-emerald-300">Notes Unlocked</p>
                </div>
              ) : notesAccess.status !== "admin" ? (
                <div className="rounded-2xl bg-amber-50 px-5 py-3 text-center dark:bg-amber-950/40">
                  <span className="text-2xl">🔒</span>
                  <p className="mt-1 text-xs font-black text-amber-800 dark:text-amber-300">Notes Locked</p>
                </div>
              ) : null}
            </div>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total points" value={data.dashboard.stats.totalPoints} accent="emerald" />
          <StatCard label="Courses completed" value={data.dashboard.stats.completedCourses} accent="indigo" />
          <StatCard label="Tasks completed" value={data.dashboard.stats.tasksCompleted} accent="amber" />
          <StatCard label="Quizzes completed" value={data.dashboard.stats.quizzesCompleted} accent="rose" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Earned Badges</h2>
            <div className="mt-5 grid gap-3">
              {data.badges.length ? (
                data.badges.map(({ badge }) => (
                  <div key={badge.id} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                    <span className="text-3xl">{badge.icon}</span>
                    <div>
                      <b className="text-slate-950 dark:text-white">{badge.name}</b>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{badge.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Earn points by completing tasks and quizzes to unlock badges.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Verified Certificates</h2>
            <div className="mt-5 grid gap-3">
              {data.certificates.length ? (
                data.certificates.map(({ certificate, course }) => (
                  <Link
                    key={certificate.id}
                    href={`/certificates/${certificate.id}`}
                    className="block rounded-2xl bg-emerald-50/70 p-4 font-black text-emerald-900 transition hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                  >
                    {course.title}
                    <span className="mt-1 block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Certificate ID: {certificate.certificateId}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Complete 100% of a course to generate your official certificate.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Profile Details & Security Settings (only when viewing own profile) */}
        {!isViewingOther && (
          <div className="pt-4">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-6">Account Settings & Security</h2>
            <AdminSettingsClient
              user={{
                id: authUser.id,
                name: authUser.name,
                email: authUser.email,
                avatarUrl: authUser.avatarUrl,
                role: authUser.role,
              }}
            />
          </div>
        )}
      </main>
      <Footer />
    </Shell>
  );
}
