"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillCredentials(type: "admin" | "student") {
    if (type === "admin") {
      setEmail("admin@querynest.dev");
      setPassword("Querynest@123");
    } else {
      setEmail("student@querynest.dev");
      setPassword("Querynest@123");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string; redirectTo?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    window.location.href = data.redirectTo ?? "/dashboard";
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {mode === "register" ? (
        <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          Full name
          <input required name="name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-900" placeholder="Your name" />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        Email
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-900"
          placeholder="you@example.com"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        Password
        <input
          required
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-200 focus:ring-4 dark:border-slate-800 dark:bg-slate-900"
          placeholder="At least 8 characters"
        />
      </label>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
      <button disabled={loading} className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white shadow-xl shadow-slate-950/15 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400" type="submit">
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
      </button>
      {mode === "login" ? (
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">Forgot password?</Link>
          <Link href="/register" className="font-bold text-slate-700 hover:underline dark:text-slate-300">Create account</Link>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">Already learning? <Link href="/login" className="font-black text-emerald-600 hover:underline dark:text-emerald-400">Login</Link></p>
      )}

      {mode === "login" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          <p className="font-bold text-slate-900 dark:text-slate-200 mb-2">Quick Demo Accounts (Click to Fill):</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className="flex-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-bold px-3 py-2 text-left hover:opacity-90 border border-purple-200 dark:border-purple-800/60"
            >
              👑 <span className="underline">Admin / Instructor</span>
              <span className="block text-[10px] font-normal opacity-75">admin@querynest.dev</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("student")}
              className="flex-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold px-3 py-2 text-left hover:opacity-90 border border-emerald-200 dark:border-emerald-800/60"
            >
              🎓 <span className="underline">Demo Student</span>
              <span className="block text-[10px] font-normal opacity-75">student@querynest.dev</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
