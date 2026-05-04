"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";

export default function AvatarUploader({ currentSrc, name }: { currentSrc: string | null; name: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/me/avatar", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't change avatar.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={() => ref.current?.click()}
      disabled={busy}
      className="relative group"
      title="Change avatar"
    >
      <Avatar src={currentSrc} name={name} size={64} />
      <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
        {busy ? "…" : "Change"}
      </span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
    </button>
  );
}
