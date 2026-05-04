"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: number;
  title: string;
  fileUrl: string;
  thumbUrl: string;
  canDelete: boolean;
};

export default function ArtworkTile({ id, title, fileUrl, thumbUrl, canDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function del(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this artwork? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/artworks/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert("Couldn't delete that — try again.");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card overflow-hidden wiggle text-left group relative"
      >
        <div className="aspect-square">
          <img src={thumbUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        {title && (
          <div className="p-3">
            <p className="font-semibold text-sm text-gray-700 truncate">{title}</p>
          </div>
        )}
        {canDelete && (
          <span
            onClick={del}
            className="absolute top-2 right-2 bg-white/90 hover:bg-blush-100 text-blush-500 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete"
            role="button"
            aria-disabled={deleting}
          >
            {deleting ? "…" : "🗑"}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[90vh] flex flex-col items-center gap-3">
            <img src={fileUrl} alt={title} className="rounded-3xl shadow-2xl max-h-[80vh] object-contain" />
            {title && <p className="text-white font-display text-xl">{title}</p>}
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-sm">close ✕</button>
          </div>
        </div>
      )}
    </>
  );
}
