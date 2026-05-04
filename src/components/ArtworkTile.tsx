"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: number;
  title: string;
  fileUrl: string;
  thumbUrl: string;
  kind: "image" | "pdf";
  canDelete: boolean;
  watermark?: string; // when set, draws a faint diagonal watermark on the lightbox view
};

export default function ArtworkTile({ id, title, fileUrl, thumbUrl, kind, canDelete, watermark }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const router = useRouter();

  // Reset transform whenever the lightbox opens.
  useEffect(() => {
    if (open) { setZoom(1); setRotate(0); setPan({ x: 0, y: 0 }); }
  }, [open]);

  async function del(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this artwork? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/artworks/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert("Couldn't delete that — try again.");
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => Math.min(5, Math.max(0.5, z + delta)));
  }

  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
  }
  function onMouseUp() { dragRef.current = null; }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onContextMenu={(e) => e.preventDefault()}
        className="card overflow-hidden wiggle text-left group relative select-none"
      >
        <div className="aspect-square">
          <img
            src={thumbUrl}
            alt={title}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
            style={{ WebkitUserDrag: "none" } as React.CSSProperties}
          />
          {kind === "pdf" && (
            <span className="absolute top-2 left-2 bg-lilac-100 text-lilac-500 text-xs font-bold px-2 py-1 rounded-full">PDF</span>
          )}
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
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative w-full h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
              <div className="font-display text-lg truncate">{title || (kind === "pdf" ? "Document" : "Artwork")}</div>
              <div className="flex items-center gap-2 flex-wrap">
                {kind === "image" && (
                  <>
                    <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10" title="Zoom out">−</button>
                    <span className="text-sm w-14 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom((z) => Math.min(5, z + 0.25))} className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10" title="Zoom in">+</button>
                    <button onClick={() => setRotate((r) => (r + 90) % 360)} className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10" title="Rotate">↻</button>
                    <button onClick={() => { setZoom(1); setRotate(0); setPan({ x: 0, y: 0 }); }} className="bg-white/20 hover:bg-white/30 rounded-full px-3 h-10 text-sm" title="Reset">Reset</button>
                  </>
                )}
                <button onClick={() => setOpen(false)} className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10" title="Close">✕</button>
              </div>
            </div>

            <div
              className="flex-1 overflow-hidden flex items-center justify-center"
              onWheel={kind === "image" ? onWheel : undefined}
              onMouseDown={kind === "image" ? onMouseDown : undefined}
              onMouseMove={kind === "image" ? onMouseMove : undefined}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ cursor: kind === "image" && zoom > 1 ? (dragRef.current ? "grabbing" : "grab") : "default" }}
            >
              {kind === "image" ? (
                <div className="relative">
                  <img
                    src={fileUrl}
                    alt={title}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl pointer-events-none"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`,
                      transition: dragRef.current ? "none" : "transform 0.15s",
                      WebkitUserDrag: "none",
                    } as React.CSSProperties}
                  />
                  {watermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                      <span className="text-white/20 font-display text-4xl rotate-[-30deg] tracking-wider">
                        © {watermark}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Embed the PDF with the toolbar hidden so the browser's "download" button doesn't appear
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full bg-white rounded-2xl shadow-2xl"
                  title={title || "PDF"}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
