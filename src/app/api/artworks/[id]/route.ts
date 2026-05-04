import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ArtworkRow, GalleryRow } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const artworkId = Number(id);
  const db = getDb();

  const row = db
    .prepare(
      `SELECT a.id, a.file_url, a.thumb_url, g.user_id as owner_id
       FROM artworks a JOIN galleries g ON g.id = a.gallery_id
       WHERE a.id = ?`
    )
    .get(artworkId) as (Pick<ArtworkRow, "id" | "file_url" | "thumb_url"> & Pick<GalleryRow, "user_id">) | undefined;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.user_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const root = process.cwd();
  for (const url of [row.file_url, row.thumb_url]) {
    try {
      await fs.unlink(path.join(root, "public", url));
    } catch {
      /* file already gone — ignore */
    }
  }
  db.prepare("DELETE FROM artworks WHERE id = ?").run(artworkId);
  return NextResponse.json({ ok: true });
}
