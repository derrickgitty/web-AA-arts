import Link from "next/link";

type Props = {
  id: number;
  name: string;
  artworkCount: number;
  thumbUrl: string | null;
  ownerName?: string;
};

export default function GalleryCard({ id, name, artworkCount, thumbUrl, ownerName }: Props) {
  return (
    <Link
      href={`/gallery/${id}`}
      className="card overflow-hidden hover:shadow-lg transition-shadow group block"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-blush-100 via-lilac-100 to-mint-100 relative">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">📁</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-lilac-500 truncate">{name}</h3>
        <p className="text-sm text-gray-500">
          {artworkCount} {artworkCount === 1 ? "artwork" : "artworks"}
          {ownerName ? ` · by ${ownerName}` : ""}
        </p>
      </div>
    </Link>
  );
}
