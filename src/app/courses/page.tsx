import Link from "next/link";
import { Footer, PublicHeader, Shell, SectionHeading, Card, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { getCourseCounts, getPublishedCourses } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await ensureSeeded();
  const [user, courses] = await Promise.all([getCurrentUser(), getPublishedCourses()]);
  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Course library" title="Choose your SQL learning path">Browse instructor-published courses. New courses created in the admin dashboard appear here automatically.</SectionHeading>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {await Promise.all(courses.map(async (course) => {
            let counts = { lessons: 0, tasks: 0, quizzes: 0 };
            try {
              counts = await getCourseCounts(course.id);
            } catch (err) {
              // Fallback to zeros if database counts are temporarily unavailable
            }
            return (
              <Link key={course.id} href={`/courses/${course.id}`} className="group rounded-[2rem] border border-white/70 bg-white p-5 shadow-xl shadow-slate-950/[0.06] transition hover:-translate-y-1">
                <div className="h-44 rounded-[1.5rem] bg-cover bg-center" style={{ backgroundImage: `url(${course.thumbnailUrl ?? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80"})` }} />
                <div className="mt-5 flex flex-wrap gap-2"><Pill tone="emerald">{course.difficulty}</Pill><Pill tone="indigo">{Math.round(course.durationMinutes / 60)}h</Pill></div>
                <h2 className="mt-4 text-2xl font-black group-hover:text-emerald-700">{course.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{course.description}</p>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-500"><span>{counts.lessons} lessons</span><span>{counts.tasks} tasks</span><span>{counts.quizzes} quizzes</span><span>{course.totalPoints} pts</span></div>
              </Link>
            );
          }))}
        </div>
        {!courses.length ? <Card className="mt-10 text-center"><h2 className="text-2xl font-black">No courses yet</h2><p className="mt-2 text-slate-600">The instructor can publish the first course from the admin dashboard.</p></Card> : null}
      </main>
      <Footer />
    </Shell>
  );
}
