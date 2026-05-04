import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Header from "@/components/Header";
import GalleryCard from "@/components/GalleryCard";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const galleries = getDb()
    .prepare(
      `SELECT g.id, g.name, u.display_name as owner_display,
        (SELECT COUNT(*) FROM artworks a WHERE a.gallery_id = g.id) as artwork_count,
        (SELECT thumb_url FROM artworks a WHERE a.gallery_id = g.id ORDER BY a.created_at DESC LIMIT 1) as thumb_url
       FROM galleries g JOIN users u ON u.id = g.user_id
       WHERE g.user_id != ? AND g.parent_id IS NULL
       ORDER BY g.created_at DESC`
    )
    .all(user.id) as { id: number; name: string; owner_display: string; artwork_count: number; thumb_url: string | null }[];

  return (
    <div>
      <Header displayName={user.displayName} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl text-lilac-500 mb-1">Explore 👀</h1>
        <p className="text-gray-500 mb-8">See what your friend has been making ✨</p>
        {galleries.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-2">🌼</div>
            <p className="text-gray-500">No other galleries to peek at yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((g) => (
              <GalleryCard
                key={g.id}
                id={g.id}
                name={g.name}
                artworkCount={g.artwork_count}
                thumbUrl={g.thumb_url}
                ownerName={g.owner_display}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
