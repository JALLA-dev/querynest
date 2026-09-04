import { AdminNav, Card, Shell } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { AdminSettingsClient } from "@/components/admin-settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await ensureSeeded();
  const admin = await requireAdmin();

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="space-y-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">Settings</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">Admin Settings</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage your personal credentials, change password, profile details, and theme mode.
            </p>
          </div>

          <AdminSettingsClient
            user={{
              id: admin.id,
              name: admin.name,
              email: admin.email,
              avatarUrl: admin.avatarUrl,
              role: admin.role,
            }}
          />

          <Card>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Platform Information & Integrations</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
              Querynest is structured with PostgreSQL + Drizzle ORM, secure PBKDF2 password hashing, visitor analytics, student progress telemetry, and extensible content architecture.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-300 dark:border dark:border-slate-800">
              NEXT_PUBLIC_INSTAGRAM_URL controls the Instagram community target CTA.
            </div>
          </Card>
        </section>
      </main>
    </Shell>
  );
}
