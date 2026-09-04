import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

export function BrandMark() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-emerald-300 shadow-lg shadow-emerald-950/20 transition group-hover:rotate-3 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
        QN
      </span>
      <span>
        <span className="block text-lg font-black tracking-tight text-slate-950 dark:text-white">Querynest</span>
        <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">SQL School</span>
      </span>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_32rem),linear-gradient(180deg,#f8fafc,#eef2ff)] text-slate-950 transition-colors duration-200 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32rem),linear-gradient(180deg,#020617,#0f172a)] dark:text-slate-100">
      {children}
    </div>
  );
}

export function PublicHeader({ userName, isAdmin }: { userName?: string; isAdmin?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex dark:text-slate-300">
          <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" href="/courses">Courses</Link>
          <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" href="/quizzes">Quizzes</Link>
          <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" href="/leaderboard">Leaderboard</Link>
          <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" href="/search">Search</Link>
          {isAdmin ? <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" href="/admin">Admin</Link> : null}
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {userName ? (
            <>
              <Link href="/dashboard" className="hidden rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-950/15 sm:inline-flex dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
                Dashboard
              </Link>
              <Link href="/profile" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500">
                Profile
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500" type="submit">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">
                Login
              </Link>
              <Link href="/register" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-950/15 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/querynest.sql/";
  return (
    <footer className="border-t border-slate-200 bg-white/80 transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">A modern SQL learning platform for video lessons, notes, tasks, quizzes, progress, certificates, and gamified practice.</p>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Learn</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link className="hover:text-emerald-600 dark:hover:text-emerald-400" href="/courses">Courses</Link>
            <Link className="hover:text-emerald-600 dark:hover:text-emerald-400" href="/quizzes">Quizzes</Link>
            <Link className="hover:text-emerald-600 dark:hover:text-emerald-400" href="/dashboard">Dashboard</Link>
            <Link className="hover:text-emerald-600 dark:hover:text-emerald-400" href="/leaderboard">Leaderboard</Link>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Community & Theme</h3>
          <div className="mt-3 flex flex-col gap-3 items-start">
            <a className="inline-flex rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-4 py-2 text-sm font-black text-white shadow-lg hover:opacity-90" href={instagramUrl} target="_blank" rel="noreferrer">
              Follow us on Instagram
            </a>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-950/[0.06] backdrop-blur transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/85 dark:shadow-black/40 ${className}`}>
      {children}
    </section>
  );
}

export function StatCard({ label, value, accent = "emerald" }: { label: string; value: string | number; accent?: "emerald" | "indigo" | "amber" | "rose" }) {
  const colors = {
    emerald: "from-emerald-500 to-teal-500",
    indigo: "from-indigo-500 to-violet-500",
    amber: "from-amber-400 to-orange-500",
    rose: "from-rose-500 to-fuchsia-500",
  };
  return (
    <Card className="overflow-hidden p-5">
      <div className={`mb-5 h-2 w-16 rounded-full bg-gradient-to-r ${colors[accent]}`} />
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "emerald" | "indigo" | "amber" | "rose" }) {
  const classes = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800",
    amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
    rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${classes[tone]}`}>{children}</span>;
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">{title}</h2>
      {children ? <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">{children}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800 dark:text-slate-200">⌁</div>
      <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;
  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCode) {
        nodes.push(<pre key={`code-${index}`} className="my-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-emerald-100 dark:border dark:border-slate-800"><code>{code.join("\n")}</code></pre>);
        code = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      code.push(line);
      return;
    }
    if (line.startsWith("### ")) nodes.push(<h3 key={index} className="mt-6 text-xl font-black text-slate-950 dark:text-white">{line.replace("### ", "")}</h3>);
    else if (line.startsWith("## ")) nodes.push(<h2 key={index} className="mt-6 text-2xl font-black text-slate-950 dark:text-white">{line.replace("## ", "")}</h2>);
    else if (line.startsWith("- ")) nodes.push(<li key={index} className="ml-5 list-disc text-slate-700 dark:text-slate-300">{line.replace("- ", "")}</li>);
    else if (line.trim()) nodes.push(<p key={index} className="my-3 leading-7 text-slate-700 dark:text-slate-300">{line}</p>);
  });
  return <div className="prose prose-slate max-w-none dark:prose-invert">{nodes}</div>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-left font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900/50">
          {rows.map((row, index) => (
            <tr key={index}>{columns.map((column) => <td key={column} className="px-4 py-3 text-slate-700 dark:text-slate-300">{String(row[column] ?? "")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminNav() {
  const links = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Courses", href: "/admin/courses", icon: "📚" },
    { label: "Quizzes", href: "/admin/quizzes", icon: "📝" },
    { label: "Student Progress", href: "/admin/progress", icon: "📈" },
    { label: "Students", href: "/admin/students", icon: "👥" },
    { label: "Visitors", href: "/admin/visitors", icon: "🌐" },
    { label: "Analytics", href: "/admin/analytics", icon: "📉" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <aside className="rounded-[2rem] border border-white/70 bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/15 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/90 lg:sticky lg:top-24 lg:h-fit">
      <div className="mb-6 flex items-center justify-between px-2">
        <BrandMark />
      </div>
      <nav className="grid gap-1.5">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white dark:hover:bg-slate-800"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t border-white/10 pt-4 px-2 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
