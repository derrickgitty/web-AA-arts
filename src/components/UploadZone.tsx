"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.svg,.pdf,image/*,application/pdf";

function isAcceptedFile(f: File) {
  return f.type.startsWith("image/") || f.type === "application/pdf";
}

export default function UploadZone({ galleryId }: { galleryId: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(isAcceptedFile);
    if (arr.length === 0) {
      setError("Please pick image or PDF files only.");
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
      <p className="text-sm text-gray-500 mb-4">Images (jpg, png, webp, svg) and PDFs · drag in, or pick from your computer</p>
      <div className="flex gap-2 justify-center flex-wrap">
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary">
          {busy ? `Uploading ${progress?.done ?? 0}/${progress?.total ?? 0}…` : "Pick files 🌷"}
        </button>
        <button onClick={() => folderRef.current?.click()} disabled={busy} className="btn-secondary">
          📁 Pick a folder
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      <input
        ref={folderRef}
        type="file"
        // webkitdirectory enables folder selection in Chromium/WebKit; non-standard but widely supported
        // @ts-expect-error react types don't include webkitdirectory
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      {error && <p className="text-blush-500 text-sm mt-3">💔 {error}</p>}
    </div>
  );
}
