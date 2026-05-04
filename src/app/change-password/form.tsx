"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const forced = sp.get("forced") === "1";

  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't change password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="card p-8 w-full max-w-md space-y-4">
        <div className="text-5xl text-center mb-1">🔒</div>
        <h1 className="font-display text-2xl text-center text-lilac-500">
          {forced ? "Pick a new password" : "Change your password"}
        </h1>
        {forced && (
          <p className="text-sm text-center text-gray-500">
            Choose something you&apos;ll remember. At least 8 characters.
          </p>
        )}
        <div>
          <label className="block text-sm font-semibold text-lilac-500 mb-1">Current password</label>
          <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-lilac-500 mb-1">New password</label>
          <input type="password" className="input" value={newPassword} onChange={(e) => setNew(e.target.value)} minLength={8} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-lilac-500 mb-1">Confirm new password</label>
          <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        </div>
        {error && <p className="text-blush-500 text-sm text-center">💔 {error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
          {busy ? "Saving…" : "Save new password ✨"}
        </button>
      </form>
    </main>
  );
}
