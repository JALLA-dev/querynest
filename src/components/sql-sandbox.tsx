"use client";

import { useState } from "react";
import { DataTable } from "./ui";
import type { JsonRow, PracticeDataset } from "@/db/schema";
import { DEFAULT_PRACTICE_DATASET } from "@/app/api/practice/run/route";

const TEMPLATES = [
  { label: "SELECT *", query: "SELECT * FROM employees" },
  { label: "Salary > 60k", query: "SELECT name, department, salary FROM employees WHERE salary > 60000" },
  { label: "Order by Salary", query: "SELECT name, salary, city FROM employees ORDER BY salary desc" },
  { label: "Engineering Only", query: "SELECT name, city FROM employees WHERE department = 'Engineering'" },
  { label: "Top Students", query: "SELECT name, score, track FROM students WHERE score >= 80 ORDER BY score desc" },
  { label: "Completed Orders", query: "SELECT customer, item, amount FROM orders WHERE status = 'Completed'" },
];

export function SqlSandbox({ initialTasks }: { initialTasks?: Array<{ id: string; title: string; points: number; difficulty: string; description: string }> }) {
  const [selectedTable, setSelectedTable] = useState<string>("employees");
  const [query, setQuery] = useState("SELECT * FROM employees");
  const [result, setResult] = useState<{ ok: boolean; message: string; rows: JsonRow[]; columns: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const currentTableRows = DEFAULT_PRACTICE_DATASET.tables[selectedTable] ?? [];
  const currentTableColumns = Object.keys(currentTableRows[0] ?? {});

  async function runQuery() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/practice/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, dataset: DEFAULT_PRACTICE_DATASET }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, message: "Network error executing query", rows: [], columns: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Table Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/80 p-5 backdrop-blur-md shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black">
            ⚡
          </span>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Active Database Table</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose a dataset to query or inspect schema</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(DEFAULT_PRACTICE_DATASET.tables).map((tbl) => (
            <button
              key={tbl}
              type="button"
              onClick={() => {
                setSelectedTable(tbl);
                setQuery(`SELECT * FROM ${tbl}`);
                setResult(null);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-black transition ${
                selectedTable === tbl
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 dark:bg-emerald-500 dark:text-slate-950"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              📊 {tbl} ({DEFAULT_PRACTICE_DATASET.tables[tbl].length} rows)
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Side: SQL Code Editor & Query Results */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  SQL Sandbox Editor
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setQuery(`SELECT * FROM ${selectedTable}`)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Reset
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={runQuery}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Running..." : "▶ Run SQL"}
                </button>
              </div>
            </div>

            {/* Quick Query Templates */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Templates:</span>
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => {
                    setQuery(tmpl.query);
                    if (tmpl.query.includes("employees")) setSelectedTable("employees");
                    else if (tmpl.query.includes("students")) setSelectedTable("students");
                    else if (tmpl.query.includes("orders")) setSelectedTable("orders");
                  }}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={7}
              placeholder="e.g. SELECT name, salary FROM employees WHERE salary > 60000 ORDER BY salary DESC;"
              spellCheck={false}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-relaxed text-emerald-300 outline-none ring-emerald-400 focus:ring-2 dark:border-slate-800"
            />

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Supports safe SELECT statements with WHERE conditions, column projections, and ORDER BY clauses.
            </p>
          </div>

          {/* Results Display */}
          <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06] dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">Query Output</h3>
            {result ? (
              <div className="space-y-4">
                <div
                  className={`rounded-2xl p-4 text-sm font-semibold border ${
                    result.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {result.message}
                </div>
                {result.ok && result.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <DataTable columns={result.columns} rows={result.rows} />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Type or select a query above and click <b className="text-emerald-600 dark:text-emerald-400">▶ Run SQL</b> to see live results here.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Table Schema Preview & Guided Tasks */}
        <div className="space-y-6">
          {/* Table Data Preview */}
          <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Table: <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedTable}</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">Previewing {currentTableRows.length} rows</span>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <DataTable columns={currentTableColumns} rows={currentTableRows} />
            </div>
          </div>

          {/* Guided Practice Tasks */}
          {initialTasks && initialTasks.length > 0 && (
            <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl shadow-slate-950/[0.06] dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Curated Practice Challenges</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Solve these targeted tasks to earn profile points and rank on the leaderboard:
              </p>
              <div className="grid gap-3">
                {initialTasks.map((t) => (
                  <a
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-emerald-500"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                        {t.difficulty}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white dark:bg-emerald-500 dark:text-slate-950">
                        +{t.points} pts
                      </span>
                      <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 group-hover:underline">
                        Solve Task →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
