import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow } from "@/lib/db";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password?forced=1");

  if (user.role === "admin") redirect("/admin");

  const myGallery = getDb()
    .prepare("SELECT id FROM galleries WHERE user_id = ? AND parent_id IS NULL LIMIT 1")
    .get(user.id) as Pick<GalleryRow, "id"> | undefined;

  if (!myGallery) {
    return (
      <main className="p-10 text-center">
        <p>Your gallery hasn&apos;t been set up yet. Ask the grown-up to run the seed script.</p>
      </main>
    );
  }
  redirect(`/gallery/${myGallery.id}`);
}
