import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow } from "@/lib/db";

// Rotate the share token, invalidating the old secret link.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const galleryId = Number(id);

  const gallery = getDb()
    .prepare("SELECT id, user_id FROM galleries WHERE id = ?")
    .get(galleryId) as Pick<GalleryRow, "id" | "user_id"> | undefined;
  if (!gallery || gallery.user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const token = nanoid(32);
  getDb().prepare("UPDATE galleries SET share_token = ? WHERE id = ?").run(token, galleryId);
  return NextResponse.json({ token });
}
