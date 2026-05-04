import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ShareRow, GalleryRow } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const shareId = Number(id);
  const db = getDb();

  const row = db
    .prepare(
      `SELECT s.id, s.revoked_at, g.user_id as owner_id
       FROM shares s JOIN galleries g ON g.id = s.gallery_id
       WHERE s.id = ?`
    )
    .get(shareId) as (Pick<ShareRow, "id" | "revoked_at"> & Pick<GalleryRow, "user_id"> & { owner_id: number }) | undefined;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Kid can revoke their own; admin can revoke any.
  if (me.role !== "admin" && row.owner_id !== me.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (row.revoked_at) return NextResponse.json({ ok: true });

  db.prepare("UPDATE shares SET revoked_at = strftime('%s','now') WHERE id = ?").run(shareId);
  if (me.role === "admin") {
    db.prepare(
      "INSERT INTO admin_actions (admin_id, action_type, target_share_id, details) VALUES (?, 'revoke_share', ?, ?)"
    ).run(me.id, shareId, "Revoked share link");
  }
  return NextResponse.json({ ok: true });
}
