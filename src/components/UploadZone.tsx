"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadZone({ galleryId }: { galleryId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) {
      setError("Please pick image files only.");
      return;
    }
    setError("");
    setBusy(true);
    setProgress({ done: 0, total: arr.length });
    for (let i = 0; i < arr.length; i++) {
      const fd = new FormData();
      fd.append("file", arr[i]);
      fd.append("galleryId", String(galleryId));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Upload failed");
        break;
      }
      setProgress({ done: i + 1, total: arr.length });
    }
    setBusy(false);
    setProgress(null);
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
      }}
      className={`card p-8 text-center border-2 border-dashed transition-colors ${
        dragOver ? "border-lilac-400 bg-lilac-50" : "border-blush-200"
      }`}
    >
      <div className="text-4xl mb-2">✨</div>
      <p className="font-display text-lg text-lilac-500 mb-1">Add new art</p>
      <p className="text-sm text-gray-500 mb-4">Drag pictures here, or pick from your computer</p>
      <button onClick={() => inputRef.current?.click()} disabled={busy} className="btn-primary">
        {busy ? `Uploading ${progress?.done ?? 0}/${progress?.total ?? 0}…` : "Pick pictures 🌷"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      {error && <p className="text-blush-500 text-sm mt-3">💔 {error}</p>}
    </div>
  );
}
