import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { certificates, courses, users } from "@/db/schema";
import { Card, PublicHeader, Shell } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const authUser = await requireUser();
  const { id } = await params;
  const [row] = await db
    .select({ certificate: certificates, course: courses, student: users })
    .from(certificates)
    .innerJoin(courses, eq(courses.id, certificates.courseId))
    .innerJoin(users, eq(users.id, certificates.userId))
    .where(eq(certificates.id, id))
    .limit(1);
  if (!row || (authUser.role !== "ADMIN" && row.student.id !== authUser.id)) notFound();
  return (
    <Shell>
      <PublicHeader userName={authUser.name} isAdmin={authUser.role === "ADMIN"} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border-4 border-emerald-200 bg-[radial-gradient(circle_at_top,#ecfdf5,white_55%)] p-10 text-center">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-700">Certificate of Completion</p>
          <h1 className="mt-8 text-5xl font-black tracking-tight">Congratulations!</h1>
          <p className="mt-6 text-xl text-slate-600">This certificate is proudly awarded to</p>
          <p className="mt-3 text-4xl font-black text-slate-950">{row.student.name}</p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">for successfully completing <b>{row.course.title}</b> with Querynest.</p>
          <div className="mt-10 grid gap-4 rounded-[2rem] bg-white/80 p-6 text-left sm:grid-cols-3">
            <div><p className="text-xs font-black uppercase text-slate-500">Instructor</p><p className="font-black">{row.certificate.instructorName}</p></div>
            <div><p className="text-xs font-black uppercase text-slate-500">Completion date</p><p className="font-black">{row.certificate.issuedAt.toLocaleDateString()}</p></div>
            <div><p className="text-xs font-black uppercase text-slate-500">Certificate ID</p><p className="font-black">{row.certificate.certificateId}</p></div>
          </div>
          <button className="mt-8 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white" type="button">Download Certificate</button>
          <p className="mt-3 text-xs text-slate-500">Use your browser print dialog to save as PDF.</p>
        </Card>
      </main>
    </Shell>
  );
}
