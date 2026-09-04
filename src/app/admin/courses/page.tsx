import Link from "next/link";
import { AdminContentManager } from "@/components/admin-content-manager";
import { AdminNav, Card, Pill, Shell } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getAllAdminContent } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  await ensureSeeded();
  await requireAdmin();
  const content = await getAllAdminContent();
  return (
    <Shell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <AdminNav />
        <section>
          <div><p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">Course management</p><h1 className="mt-3 text-5xl font-black tracking-tight">Create dynamic SQL content</h1><p className="mt-2 text-slate-600">Create Course → Module → Lesson → Video → Notes → Task → Quiz without touching application code.</p></div>
          <div className="mt-8"><AdminContentManager courses={content.courses.map(({ id, title }) => ({ id, title }))} modules={content.modules.map(({ id, title, courseId }) => ({ id, title, courseId }))} lessons={content.lessons.map(({ id, title, courseId, moduleId }) => ({ id, title, courseId, moduleId }))} /></div>
          <Card className="mt-8">
            <h2 className="text-2xl font-black">Existing courses</h2>
            <div className="mt-5 grid gap-3">{content.courses.map((course) => <div key={course.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-black">{course.title}</h3><p className="text-sm text-slate-600">{course.description}</p></div><div className="flex gap-2"><Pill tone={course.isPublished ? "emerald" : "amber"}>{course.isPublished ? "Published" : "Draft"}</Pill><Link href={`/courses/${course.id}`} className="text-sm font-black text-emerald-700">View</Link></div></div></div>)}</div>
          </Card>
        </section>
      </main>
    </Shell>
  );
}
