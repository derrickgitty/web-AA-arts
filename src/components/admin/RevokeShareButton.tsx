"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeShareButton({ shareId }: { shareId: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function revoke() {
    if (!confirm("Revoke this share link? Anyone with the link will lose access.")) return;
    setBusy(true);
    const res = await fetch(`/api/shares/${shareId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Couldn't revoke — try again.");
  }
  return (
    <button onClick={revoke} disabled={busy} className="btn-secondary text-sm py-2 px-3 hover:bg-blush-50 hover:text-blush-500">
      {busy ? "…" : "Revoke"}
    </button>
  );
}
