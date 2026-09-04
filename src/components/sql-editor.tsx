"use client";

import { useMemo, useState } from "react";
import { DataTable } from "./ui";
import type { JsonRow, PracticeDataset } from "@/db/schema";

type RunResponse = { ok: boolean; message: string; rows: JsonRow[]; columns: string[]; correct?: boolean; pointsEarned?: number; error?: string };

export function SqlEditor({ task }: { task: { id: string; title: string; description: string; dbSchema: string; sampleData: PracticeDataset; expectedOutput: JsonRow[]; starterSql: string; hints: string[]; points: number } }) {
  const [query, setQuery] = useState(task.starterSql);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const tableName = Object.keys(task.sampleData.tables)[0];
  const sampleRows = task.sampleData.tables[tableName] ?? [];
  const sampleColumns = useMemo(() => Object.keys(sampleRows[0] ?? {}), [sampleRows]);
  const expectedColumns = useMemo(() => Object.keys(task.expectedOutput[0] ?? {}), [task.expectedOutput]);

  async function run(submit = false) {
    setLoading(true);
    const res = await fetch(`/api/tasks/${task.id}/${submit ? "submit" : "run"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = (await res.json()) as RunResponse;
    setLoading(false);
    setResult(data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <aside className="space-y-5">
        <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06]">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-black tracking-tight">{task.title}</h1>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">+{task.points} pts</span>
          </div>
          <p className="mt-3 leading-7 text-slate-600">{task.description}</p>
          <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-sm text-emerald-100"><code>{task.dbSchema}</code></div>
        </section>
        <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06]">
          <h2 className="text-lg font-black">Sample data</h2>
          <div className="mt-4"><DataTable columns={sampleColumns} rows={sampleRows} /></div>
        </section>
        <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06]">
          <h2 className="text-lg font-black">Expected output</h2>
          <div className="mt-4"><DataTable columns={expectedColumns} rows={task.expectedOutput} /></div>
        </section>
      </aside>
      <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-xl shadow-slate-950/[0.06]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black">SQL Editor</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQuery("")} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Clear</button>
            <button onClick={() => setQuery(task.starterSql)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Reset</button>
            <button onClick={() => run(false)} disabled={loading} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Run Query</button>
            <button onClick={() => run(true)} disabled={loading} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Submit</button>
          </div>
        </div>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          spellCheck={false}
          className="min-h-[260px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-5 font-mono text-sm leading-7 text-emerald-100 outline-none ring-emerald-200 focus:ring-4"
        />
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <h3 className="font-black">Hints</h3>
          <ul className="mt-2 grid gap-1 text-sm text-slate-600">{task.hints.map((hint) => <li key={hint}>• {hint}</li>)}</ul>
        </div>
        {result ? (
          <div className={`mt-5 rounded-2xl border p-4 ${result.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`font-black ${result.ok ? "text-emerald-700" : "text-rose-700"}`}>{result.correct === true ? "✓ Correct result" : result.correct === false ? "✗ Incorrect result" : result.message}</p>
            {result.pointsEarned ? <p className="mt-1 text-sm font-bold text-emerald-700">Points Earned: +{result.pointsEarned}</p> : null}
            {result.rows.length ? <div className="mt-4"><DataTable columns={result.columns} rows={result.rows} /></div> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
