"use client";

import { useState } from "react";

export default function ShareButton({ galleryId, initialToken }: { galleryId: number; initialToken: string }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : `/share/${token}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function rotate() {
    if (!confirm("Get a new link? The old one will stop working.")) return;
    setRotating(true);
    const res = await fetch(`/api/galleries/${galleryId}/share`, { method: "POST" });
    setRotating(false);
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">💌 Share</button>
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div onClick={(e) => e.stopPropagation()} className="card p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-xl text-lilac-500">Share this gallery 💌</h2>
            <p className="text-sm text-gray-500">Anyone with this secret link can see your gallery — but they can&apos;t change anything. Only share with people you trust.</p>
            <div className="flex gap-2">
              <input readOnly value={url} className="input text-sm" onFocus={(e) => e.currentTarget.select()} />
              <button onClick={copy} className="btn-primary shrink-0">{copied ? "Copied! ✨" : "Copy"}</button>
            </div>
            <button onClick={rotate} disabled={rotating} className="text-sm text-gray-500 hover:text-blush-500 underline disabled:opacity-50">
              {rotating ? "Making new link…" : "Get a new link (stops the old one)"}
            </button>
            <div className="text-right">
              <button onClick={() => setOpen(false)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
