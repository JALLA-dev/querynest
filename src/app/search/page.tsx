import { Footer, PublicHeader, SectionHeading, Shell } from "@/components/ui";
import { SearchClient } from "@/components/search-client";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  await ensureSeeded();
  const user = await getCurrentUser();
  return (
    <Shell>
      <PublicHeader userName={user?.name} isAdmin={user?.role === "ADMIN"} />
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Global search" title="Search every SQL topic">Find courses, lessons, notes, tasks, and quizzes created by the instructor.</SectionHeading>
        <div className="mt-10"><SearchClient /></div>
      </main>
      <Footer />
    </Shell>
  );
}
