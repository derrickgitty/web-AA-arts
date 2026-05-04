import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";

type Row = {
  id: number;
  name: string;
  owner_display: string;
  owner_avatar: string | null;
  artwork_count: number;
  thumb_url: string | null;
};

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password?forced=1");

  const galleries = getDb()
    .prepare(
      `SELECT g.id, g.name, u.display_name as owner_display, u.avatar_url as owner_avatar,
        (SELECT COUNT(*) FROM artworks a WHERE a.gallery_id = g.id) as artwork_count,
        (SELECT thumb_url FROM artworks a WHERE a.gallery_id = g.id ORDER BY a.created_at DESC LIMIT 1) as thumb_url
       FROM galleries g JOIN users u ON u.id = g.user_id
       WHERE g.user_id != ? AND g.parent_id IS NULL AND u.role = 'kid'
       ORDER BY g.created_at DESC`
    )
    .all(user.id) as Row[];

  return (
    <div>
      <Header displayName={user.displayName} avatarUrl={user.avatarUrl} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl text-lilac-500 mb-1">Explore 👀</h1>
        <p className="text-gray-500 mb-8">See what your friend has been making ✨</p>
        {galleries.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-2">🌼</div>
            <p className="text-gray-500">No other galleries to peek at yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {galleries.map((g) => (
              <Link key={g.id} href={`/gallery/${g.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow group block">
                <div className="aspect-[4/3] bg-gradient-to-br from-blush-100 via-lilac-100 to-mint-100">
                  {g.thumb_url ? (
                    <img src={g.thumb_url} alt="" draggable={false} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📁</div>
                  )}
                </div>
                <div className="p-4 flex items-center gap-3">
                  <Avatar src={g.owner_avatar} name={g.owner_display} size={36} />
                  <div className="min-w-0">
                    <h3 className="font-display text-lg text-lilac-500 truncate">{g.name}</h3>
                    <p className="text-sm text-gray-500 truncate">by {g.owner_display} · {g.artwork_count} {g.artwork_count === 1 ? "artwork" : "artworks"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
