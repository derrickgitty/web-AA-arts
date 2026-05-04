import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb, GalleryRow, ArtworkRow } from "@/lib/db";

// Public, read-only view. Anyone with the token can see this gallery and its sub-galleries.
// Sub-galleries are linked through the same /share/<token> route via their own tokens.
type GalleryWithOwner = GalleryRow & { owner_display: string };

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const gallery = db
    .prepare(
      `SELECT g.*, u.display_name as owner_display
       FROM galleries g JOIN users u ON u.id = g.user_id
       WHERE g.share_token = ?`
    )
    .get(token) as GalleryWithOwner | undefined;
  if (!gallery) notFound();

  const subs = db
    .prepare(
      `SELECT id, name, share_token,
        (SELECT COUNT(*) FROM artworks a WHERE a.gallery_id = g.id) as artwork_count,
        (SELECT thumb_url FROM artworks a WHERE a.gallery_id = g.id ORDER BY a.created_at DESC LIMIT 1) as thumb_url
       FROM galleries g WHERE g.parent_id = ? ORDER BY g.created_at DESC`
    )
    .all(gallery.id) as { id: number; name: string; share_token: string; artwork_count: number; thumb_url: string | null }[];

  const artworks = db
    .prepare("SELECT * FROM artworks WHERE gallery_id = ? ORDER BY created_at DESC")
    .all(gallery.id) as ArtworkRow[];

  return (
    <div>
      <header className="bg-white/60 backdrop-blur border-b border-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-display text-xl text-lilac-500 flex items-center gap-2">
            <span>🎨</span> Art Portal
          </div>
          <span className="text-xs text-gray-400">shared gallery</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl text-lilac-500">{gallery.name}</h1>
        <p className="text-gray-500 mb-8">By {gallery.owner_display} ✨</p>

        {subs.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl text-lilac-500 mb-3">Sub-galleries</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subs.map((s) => (
                <Link
                  key={s.id}
                  href={`/share/${s.share_token}`}
                  className="card overflow-hidden hover:shadow-lg transition-shadow group block"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-blush-100 via-lilac-100 to-mint-100">
                    {s.thumb_url ? (
                      <img src={s.thumb_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" className="card overflow-hidden wiggle block">
                  <div className="aspect-square">
                    <img src={a.thumb_url} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                  {a.title && (
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-700 truncate">{a.title}</p>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="text-center text-xs text-gray-400 py-6">made with 💕 in the art portal</footer>
    </div>
  );
}
