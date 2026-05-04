"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSubGalleryButton({ parentId }: { parentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setName("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't create that.");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">📁 New sub-gallery</button>
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card p-6 w-full max-w-sm space-y-3">
            <h2 className="font-display text-xl text-lilac-500">Name your sub-gallery 🌷</h2>
            <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Watercolours" maxLength={60} required />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={busy || !name.trim()} className="btn-primary disabled:opacity-50">{busy ? "Creating…" : "Create ✨"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
