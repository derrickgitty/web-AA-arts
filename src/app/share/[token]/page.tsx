import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getDb, GalleryRow, ArtworkRow, ShareRow } from "@/lib/db";
import ArtworkTile from "@/components/ArtworkTile";
import NoDownloadGuard from "@/components/NoDownloadGuard";

type ShareLookup = ShareRow & { gallery_name: string; owner_display: string };

async function logView(shareId: number) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const ua = (h.get("user-agent") ?? "").slice(0, 200);
  getDb()
    .prepare("INSERT INTO share_views (share_id, viewer_ip, viewer_user_agent) VALUES (?, ?, ?)")
    .run(shareId, ip, ua);
}

function isDescendant(galleryId: number, rootId: number): boolean {
  if (galleryId === rootId) return true;
  let current: number | null = galleryId;
  for (let i = 0; i < 50; i++) {
    if (current === null) return false;
    if (current === rootId) return true;
    const row = getDb().prepare("SELECT parent_id FROM galleries WHERE id = ?").get(current) as { parent_id: number | null } | undefined;
    if (!row) return false;
    current = row.parent_id;
  }
  return false;
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { token } = await params;
  const { g } = await searchParams;
  const db = getDb();

  const share = db
    .prepare(
      `SELECT s.*, g.name as gallery_name, u.display_name as owner_display
       FROM shares s
       JOIN galleries g ON g.id = s.gallery_id
       JOIN users u ON u.id = g.user_id
       WHERE s.token = ?`
    )
    .get(token) as ShareLookup | undefined;
  if (!share) notFound();
  if (share.revoked_at) notFound();
  if (share.expires_at && share.expires_at < Math.floor(Date.now() / 1000)) notFound();

  // Default view = the shared gallery itself; ?g=N descends to a sub if it's in the subtree.
  let viewedGalleryId = share.gallery_id;
  if (g) {
    const requested = Number(g);
    if (Number.isFinite(requested) && isDescendant(requested, share.gallery_id)) {
      viewedGalleryId = requested;
    }
  }

  const gallery = db.prepare("SELECT * FROM galleries WHERE id = ?").get(viewedGalleryId) as GalleryRow | undefined;
  if (!gallery) notFound();

  await logView(share.id);

  const subs = db
    .prepare(
      `SELECT id, name,
        (SELECT COUNT(*) FROM artworks a WHERE a.gallery_id = g.id) as artwork_count,
        (SELECT thumb_url FROM artworks a WHERE a.gallery_id = g.id ORDER BY a.created_at DESC LIMIT 1) as thumb_url
       FROM galleries g WHERE g.parent_id = ? ORDER BY g.created_at DESC`
    )
    .all(viewedGalleryId) as { id: number; name: string; artwork_count: number; thumb_url: string | null }[];

  const artworks = db
    .prepare("SELECT * FROM artworks WHERE gallery_id = ? ORDER BY created_at DESC")
    .all(viewedGalleryId) as ArtworkRow[];

  // Crumbs: from the shared root down to the currently viewed gallery
  const crumbs: GalleryRow[] = [];
  let cur: number | null = viewedGalleryId;
  while (cur !== null) {
    const r = db.prepare("SELECT * FROM galleries WHERE id = ?").get(cur) as GalleryRow | undefined;
    if (!r) break;
    crumbs.unshift(r);
    if (r.id === share.gallery_id) break;
    cur = r.parent_id;
  }

  return (
    <div className="min-h-screen">
      <NoDownloadGuard />
      <header className="bg-white/60 backdrop-blur border-b border-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-display text-xl text-lilac-500 flex items-center gap-2">
            <span>🎨</span> Art Portal
          </div>
          <span className="text-xs text-gray-400">shared with {share.recipient_label}</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10 select-none">
        <nav className="text-sm text-gray-500 mb-2 flex items-center gap-2 flex-wrap">
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-2">
              {i > 0 && <span>›</span>}
              {i === crumbs.length - 1 ? (
                <span className="text-lilac-500 font-semibold">{c.name}</span>
              ) : (
                <Link href={c.id === share.gallery_id ? `/share/${token}` : `/share/${token}?g=${c.id}`} className="hover:text-lilac-500">
                  {c.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <h1 className="font-display text-4xl text-lilac-500">{gallery.name}</h1>
        <p className="text-gray-500 mb-8">By {share.owner_display} ✨</p>

        {subs.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl text-lilac-500 mb-3">Sub-galleries</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subs.map((s) => (
                <Link key={s.id} href={`/share/${token}?g=${s.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow group block">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blush-100 via-lilac-100 to-mint-100">
                    {s.thumb_url ? (
                      <img src={s.thumb_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📁</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg text-lilac-500 truncate">{s.name}</h3>
                    <p className="text-sm text-gray-500">{s.artwork_count} {s.artwork_count === 1 ? "artwork" : "artworks"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-xl text-lilac-500 mb-3">Artworks</h2>
          {artworks.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-2">🌷</div>
              <p className="text-gray-500">No art here yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map((a) => (
                <ArtworkTile
                  key={a.id}
                  id={a.id}
                  title={a.title}
                  fileUrl={a.file_url}
                  thumbUrl={a.thumb_url}
                  kind={a.kind}
                  canDelete={false}
                  watermark={share.owner_display}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="text-center text-xs text-gray-400 py-6">made with 💕 in the art portal</footer>
    </div>
  );
}
