"use client";

import { useEffect, useState } from "react";

type Share = {
  id: number;
  recipient_label: string;
  token: string;
  expires_at: number | null;
  revoked_at: number | null;
  created_at: number;
  views: number;
};

function statusOf(s: Share) {
  if (s.revoked_at) return { text: "Revoked", color: "text-gray-400" };
  if (s.expires_at && s.expires_at < Math.floor(Date.now() / 1000))
    return { text: "Expired", color: "text-gray-400" };
  if (s.expires_at === null) return { text: "Permanent", color: "text-mint-500" };
  return { text: `expires ${new Date(s.expires_at * 1000).toLocaleDateString()}`, color: "text-lilac-500" };
}

export default function SharesManager({ galleryId }: { galleryId: number }) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [recipientLabel, setLabel] = useState("");
  const [days, setDays] = useState<string>("7");
  const [permanent, setPermanent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function load() {
    const res = await fetch(`/api/galleries/${galleryId}/shares`);
    if (res.ok) setShares((await res.json()).shares);
  }
  useEffect(() => { if (open) load(); }, [open, galleryId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch(`/api/galleries/${galleryId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientLabel, days: Number(days), permanent }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Couldn't create link.");
      return;
    }
    setLabel("");
    setDays("7");
    setPermanent(false);
    load();
  }

  async function revoke(id: number) {
    if (!confirm("Revoke this link? Anyone with it will lose access.")) return;
    const res = await fetch(`/api/shares/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function copy(s: Share) {
    const url = `${window.location.origin}/share/${s.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">💌 Share</button>
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div onClick={(e) => e.stopPropagation()} className="card p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl text-lilac-500">Share this gallery 💌</h2>
            <form onSubmit={create} className="space-y-3 bg-blush-50 p-4 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-lilac-500 mb-1">Who&apos;s it for?</label>
                  <input className="input" placeholder="e.g. Grandma, Mrs Lim" value={recipientLabel} onChange={(e) => setLabel(e.target.value)} required maxLength={60} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-lilac-500 mb-1">Days (default 7)</label>
                  <input
                    type="number"
                    min={1}
                    max={1825}
                    className="input disabled:opacity-40"
                    value={permanent ? "" : days}
                    disabled={permanent}
                    onChange={(e) => setDays(e.target.value)}
                    required={!permanent}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
                <span>No expiry (permanent)</span>
              </label>
              {err && <p className="text-blush-500 text-xs">💔 {err}</p>}
              <button disabled={busy || !recipientLabel.trim()} className="btn-primary disabled:opacity-50">
                {busy ? "Creating…" : "Create link ✨"}
              </button>
            </form>

            <div>
              <h3 className="font-display text-lg text-lilac-500 mb-2">Existing links</h3>
              {shares.length === 0 ? (
                <p className="text-sm text-gray-400">No links yet.</p>
              ) : (
                <ul className="space-y-2">
                  {shares.map((s) => {
                    const st = statusOf(s);
                    const active = !s.revoked_at && (s.expires_at === null || s.expires_at > Math.floor(Date.now() / 1000));
                    return (
                      <li key={s.id} className="bg-white rounded-2xl p-3 border border-blush-100">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold">{s.recipient_label}</p>
                            <p className={`text-xs ${st.color}`}>{st.text} · {s.views} {s.views === 1 ? "view" : "views"}</p>
                          </div>
                          <div className="flex gap-2">
                            {active && (
                              <>
                                <button onClick={() => copy(s)} className="btn-secondary text-sm py-2 px-3">
                                  {copiedId === s.id ? "Copied! ✨" : "Copy link"}
                                </button>
                                <button onClick={() => revoke(s.id)} className="btn-ghost text-sm text-blush-500">Revoke</button>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="pt-3 border-t border-blush-100 text-right">
              <button onClick={() => setOpen(false)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
