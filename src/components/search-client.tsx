"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type ResultGroup = Record<string, Array<{ id: string; title: string; description: string | null; type: string; courseId?: string; lessonId?: string }>>;

function hrefFor(item: { id: string; type: string; courseId?: string; lessonId?: string }) {
  if (item.type === "Course") return `/courses/${item.id}`;
  if (item.type === "Lesson") return item.courseId ? `/learn/${item.courseId}/${item.id}` : "/courses";
  if (item.type === "Task") return `/tasks/${item.id}`;
  if (item.type === "Quiz") return `/quizzes/${item.id}`;
  if (item.type === "Note") return item.lessonId ? "/dashboard" : "/search";
  return "/search";
}

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultGroup | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = (await res.json()) as ResultGroup;
    setResults(data);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <form onSubmit={submit} className="rounded-[2rem] border border-white/70 bg-white p-4 shadow-xl shadow-slate-950/[0.06] sm:flex sm:gap-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search JOIN, SELECT, tasks, quizzes..." className="min-h-14 flex-1 rounded-2xl border border-slate-200 px-5 text-lg font-bold outline-none ring-emerald-200 focus:ring-4" />
        <button className="mt-3 min-h-14 rounded-2xl bg-slate-950 px-6 font-black text-white sm:mt-0" type="submit">{loading ? "Searching..." : "Search"}</button>
      </form>
      {results ? (
        <div className="mt-8 grid gap-4">
          {Object.entries(results).flatMap(([, items]) => items).length === 0 ? <p className="rounded-2xl bg-white p-6 text-center font-bold text-slate-600">No matches found.</p> : null}
          {Object.entries(results).map(([group, items]) => items.length ? (
            <section key={group} className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06]">
              <h2 className="text-xl font-black capitalize">{group}</h2>
              <div className="mt-4 grid gap-3">
                {items.map((item) => <Link key={`${item.type}-${item.id}`} href={hrefFor(item)} className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-300"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{item.type}</span><h3 className="mt-2 font-black">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p></Link>)}
              </div>
            </section>
          ) : null)}
        </div>
      ) : null}
    </div>
  );
}
