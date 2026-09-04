"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Full name
          <input required name="name" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-200 focus:ring-4" placeholder="Your name" />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Email
        <input required type="email" name="email" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-200 focus:ring-4" placeholder="you@example.com" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Password
        <input required type="password" name="password" minLength={8} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-200 focus:ring-4" placeholder="At least 8 characters" />
      </label>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}
      <button disabled={loading} className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white shadow-xl shadow-slate-950/15 disabled:cursor-not-allowed disabled:opacity-60" type="submit">
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        Demo student login: <b className="text-slate-900 dark:text-slate-100">student@querynest.dev</b> with password <b className="text-slate-900 dark:text-slate-100">Querynest@123</b>.
      </div>
    </form>
  );
}
