"use client";

import { useState, type FormEvent } from "react";
import { ThemeToggle } from "./theme-toggle";

type UserData = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
};

export function AdminSettingsClient({ user }: { user: UserData }) {
  // Profile details state
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [bio, setBio] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl, bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "Error updating profile" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters long." });
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err instanceof Error ? err.message : "Error updating password" });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Profile Details Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Admin Profile Details</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your public identity and profile credentials.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {user.role}
          </span>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 grid gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={avatarUrl || "https://api.dicebear.com/9.x/shapes/svg?seed=querynest-admin"}
              alt="Avatar preview"
              className="size-20 rounded-2xl bg-slate-100 object-cover ring-2 ring-emerald-500/30 dark:bg-slate-800"
            />
            <div className="flex-1">
              <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Avatar Image URL
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or Dicebear URL"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Display Name *
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Email Address (Login ID)
              <input
                type="email"
                disabled
                value={user.email}
                className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-500"
              />
            </label>
          </div>

          <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            Instructor Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Tell students about your database engineering experience..."
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          {profileMsg && (
            <div className={`rounded-xl p-3 text-xs font-bold ${profileMsg.type === "success" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {profileLoading ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">Security & Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Change your administrator password securely. Remember to keep it confidential.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            Current Password *
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              New Password * (Min. 8 characters)
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm New Password *
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>

          {passwordMsg && (
            <div className={`rounded-xl p-3 text-xs font-bold ${passwordMsg.type === "success" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>
              {passwordMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Appearance & Day/Night Mode Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/[0.04] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Day / Night Mode</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle between modern daylight aesthetics and ultra-dark OLED contrast mode.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
