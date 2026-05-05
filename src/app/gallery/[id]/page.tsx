import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow, ArtworkRow, STORAGE_QUOTA_BYTES } from "@/lib/db";
import Header from "@/components/Header";
import GalleryCard from "@/components/GalleryCard";
import ArtworkTile from "@/components/ArtworkTile";
import UploadZone from "@/components/UploadZone";
import CreateSubGalleryButton from "@/components/CreateSubGalleryButton";
import SharesManager from "@/components/SharesManager";
import DeleteGalleryButton from "@/components/DeleteGalleryButton";
import AvatarUploader from "@/components/AvatarUploader";
import Avatar from "@/components/Avatar";

type GalleryWithOwner = GalleryRow & {
  owner_username: string;
  owner_display: string;
  owner_avatar: string | null;
  owner_storage_bytes: number;
};

function buildBreadcrumb(galleryId: number): GalleryRow[] {
  const trail: GalleryRow[] = [];
  let current: number | null = galleryId;
  while (current !== null) {
    const row = getDb().prepare("SELECT * FROM galleries WHERE id = ?").get(current) as GalleryRow | undefined;
    if (!row) break;
    trail.unshift(row);
    current = row.parent_id;
  }
  return trail;
}

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password?forced=1");

  const { id } = await params;
  const galleryId = Number(id);
  if (!Number.isFinite(galleryId)) notFound();

  const db = getDb();
  const gallery = db
    .prepare(
      `SELECT g.*, u.username as owner_username, u.display_name as owner_display,
        u.avatar_url as owner_avatar, u.storage_bytes as owner_storage_bytes
       FROM galleries g JOIN users u ON u.id = g.user_id
       WHERE g.id = ?`
    )
    .get(galleryId) as GalleryWithOwner | undefined;
  if (!gallery) notFound();

  const owned = gallery.user_id === user.id;
  const breadcrumb = buildBreadcrumb(galleryId);

  const subs = db
    .prepare(
      `SELECT g.id, g.name,
        (SELECT COUNT(*) FROM artworks a WHERE a.gallery_id = g.id) as artwork_count,
        (SELECT thumb_url FROM artworks a WHERE a.gallery_id = g.id ORDER BY a.created_at DESC LIMIT 1) as thumb_url
       FROM galleries g WHERE g.parent_id = ? ORDER BY g.created_at DESC`
    )
    .all(galleryId) as { id: number; name: string; artwork_count: number; thumb_url: string | null }[];

  const artworks = db
    .prepare("SELECT * FROM artworks WHERE gallery_id = ? ORDER BY created_at DESC")
    .all(galleryId) as ArtworkRow[];

  const usagePct = Math.min(100, Math.round((gallery.owner_storage_bytes / STORAGE_QUOTA_BYTES) * 100));

  return (
    <div>
      <Header displayName={user.displayName} avatarUrl={user.avatarUrl} theme={user.theme} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <nav className="text-sm text-gray-500 mb-2 flex items-center gap-2 flex-wrap">
          {!owned && (
            <>
              <Link href="/explore" className="hover:text-lilac-500">👀 Explore</Link>
              <span>›</span>
            </>
          )}
          {breadcrumb.map((g, i) => (
            <span key={g.id} className="flex items-center gap-2">
              {i > 0 && <span>›</span>}
              {i === breadcrumb.length - 1 ? (
                <span className="text-lilac-500 font-semibold">{g.name}</span>
              ) : (
                <Link href={`/gallery/${g.id}`} className="hover:text-lilac-500">{g.name}</Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div className="flex items-start gap-4">
            {owned ? (
              <AvatarUploader currentSrc={gallery.owner_avatar} name={gallery.owner_display} />
            ) : (
              <Avatar src={gallery.owner_avatar} name={gallery.owner_display} size={64} />
            )}
            <div>
              <h1 className="font-display text-4xl text-lilac-500">{gallery.name}</h1>
              <p className="text-gray-500">
                {owned ? "Your gallery 🌸" : `By ${gallery.owner_display} ✨`}
              </p>
            </div>
          </div>
          {owned && (
            <div className="flex gap-2 flex-wrap">
              <SharesManager galleryId={gallery.id} />
              <CreateSubGalleryButton parentId={gallery.id} />
            </div>
          )}
        </div>

        {owned && breadcrumb.length === 1 && (
          <div className="card p-3 px-4 mt-4 flex items-center gap-3 text-xs">
            <span className="text-gray-500">Storage</span>
            <div className="flex-1 bg-blush-100 rounded-full h-2 overflow-hidden">
              <div className="bg-lilac-400 h-full" style={{ width: `${usagePct}%` }} />
            </div>
            <span className="text-gray-500 tabular-nums">
              {(gallery.owner_storage_bytes / 1024 / 1024).toFixed(1)}MB / {(STORAGE_QUOTA_BYTES / 1024 / 1024).toFixed(0)}MB
            </span>
          </div>
        )}

        {owned && (
          <div className="my-6">
            <UploadZone galleryId={gallery.id} />
          </div>
        )}

        {subs.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl text-lilac-500 mb-3">Sub-galleries</h2>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {subs.map((s) => (
                <GalleryCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  artworkCount={s.artwork_count}
                  thumbUrl={s.thumb_url}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-xl text-lilac-500 mb-3">Artworks</h2>
          {artworks.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-2">🌷</div>
              <p className="text-gray-500">{owned ? "No art yet — upload your first piece!" : "No art here yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {artworks.map((a) => (
                <ArtworkTile
                  key={a.id}
                  id={a.id}
                  title={a.title}
                  fileUrl={a.file_url}
                  thumbUrl={a.thumb_url}
                  kind={a.kind}
                  canDelete={owned}
                  watermark={owned ? undefined : gallery.owner_display}
                />
              ))}
            </div>
          )}
        </section>

        {owned && gallery.parent_id !== null && (
          <div className="mt-10 text-center">
            <DeleteGalleryButton galleryId={gallery.id} parentId={gallery.parent_id} />
          </div>
        )}
      </main>
    </div>
  );
}
