import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow, ArtworkRow } from "@/lib/db";

async function deleteArtworkFiles(artworks: ArtworkRow[]) {
  const root = process.cwd();
  for (const a of artworks) {
    for (const url of [a.file_url, a.thumb_url]) {
      try {
        await fs.unlink(path.join(root, "public", url));
      } catch {
        /* file already gone — ignore */
      }
    }
  }
}

// Rename a gallery the user owns.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { name } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  getDb().prepare("UPDATE galleries SET name = ? WHERE id = ?").run(name.trim().slice(0, 60), galleryId);
  return NextResponse.json({ ok: true });
}

// Delete a sub-gallery (and its artworks recursively). Top-level galleries cannot be deleted.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const galleryId = Number(id);
  const db = getDb();

  const gallery = db
    .prepare("SELECT id, user_id, parent_id FROM galleries WHERE id = ?")
    .get(galleryId) as GalleryRow | undefined;
  if (!gallery || gallery.user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (gallery.parent_id === null) {
    return NextResponse.json({ error: "Cannot delete your main gallery" }, { status: 400 });
  }

  // Collect every gallery in the subtree so we can clean up files first.
  const ids: number[] = [galleryId];
  const queue = [galleryId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = db
      .prepare("SELECT id FROM galleries WHERE parent_id = ?")
      .all(current) as { id: number }[];
    for (const c of children) {
      ids.push(c.id);
      queue.push(c.id);
    }
  }
  const placeholders = ids.map(() => "?").join(",");
  const artworks = db
    .prepare(`SELECT * FROM artworks WHERE gallery_id IN (${placeholders})`)
    .all(...ids) as ArtworkRow[];
  await deleteArtworkFiles(artworks);

  // ON DELETE CASCADE wipes the subtree and its artworks.
  db.prepare("DELETE FROM galleries WHERE id = ?").run(galleryId);
  return NextResponse.json({ ok: true });
}
