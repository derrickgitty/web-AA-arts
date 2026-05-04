"use client";

import { useState } from "react";

export default function ResetPasswordButton({ userId, username }: { userId: number; username: string }) {
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  async function reset() {
    if (!confirm(`Reset ${username}'s password? They'll need to change it on next login.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      alert("Reset failed.");
      return;
    }
    const data = await res.json();
    setGenerated(data.password);
  }

  if (generated) {
    return (
      <div className="text-right">
        <code className="bg-mint-100 text-mint-500 px-3 py-1 rounded-lg text-sm">{generated}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(generated); }}
          className="btn-ghost text-xs ml-2"
        >
          Copy
        </button>
        <button onClick={() => setGenerated(null)} className="btn-ghost text-xs">✕</button>
      </div>
    );
  }
  return (
    <button onClick={reset} disabled={busy} className="btn-secondary text-sm py-2 px-3">
      {busy ? "…" : "Reset password"}
    </button>
  );
}
