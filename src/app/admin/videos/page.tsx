import { AdminNav, Shell } from "@/components/ui";
import { AdminVideoManager } from "@/components/admin-video-manager";
import { requireAdmin } from "@/lib/auth";
import { getAllAdminContent } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  await ensureSeeded();
  await requireAdmin();
  const content = await getAllAdminContent();

  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section className="min-w-0">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              Content & Media Studio
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Video Lesson Management
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Attach video lectures (YouTube, Vimeo, Loom, or MP4) to SQL lessons with live player preview.
            </p>
          </div>

          <AdminVideoManager
            courses={content.courses.map(({ id, title }) => ({ id, title }))}
            modules={content.modules.map(({ id, title, courseId }) => ({ id, title, courseId }))}
            lessons={content.lessons.map(({ id, title, courseId, moduleId, videoUrl, videoProvider, durationMinutes, description }) => ({
              id,
              title,
              courseId,
              moduleId,
              videoUrl,
              videoProvider,
              durationMinutes,
              description,
            }))}
          />
        </section>
      </main>
    </Shell>
  );
}
