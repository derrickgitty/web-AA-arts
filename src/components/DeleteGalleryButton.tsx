"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGalleryButton({ galleryId, parentId }: { galleryId: number; parentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm("Delete this sub-gallery and all its art? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/galleries/${galleryId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push(`/gallery/${parentId}`);
    else alert("Couldn't delete that — try again.");
  }
  return (
    <button onClick={del} disabled={busy} className="btn-ghost text-gray-400 hover:text-blush-500">
      {busy ? "Deleting…" : "🗑 Delete sub-gallery"}
    </button>
  );
}
