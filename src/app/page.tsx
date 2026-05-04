import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow } from "@/lib/db";

// Send signed-in users to their main gallery; otherwise to login.
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myGallery = getDb()
    .prepare("SELECT id FROM galleries WHERE user_id = ? AND parent_id IS NULL LIMIT 1")
    .get(user.id) as Pick<GalleryRow, "id"> | undefined;

  if (!myGallery) {
    // Should never happen because seed creates one — but show a friendly fallback.
    return (
      <main className="p-10 text-center">
        <p>Your gallery hasn&apos;t been set up yet. Ask the grown-up to run the seed script.</p>
      </main>
    );
  }
  redirect(`/gallery/${myGallery.id}`);
}
