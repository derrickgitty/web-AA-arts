import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow, ShareRow } from "@/lib/db";
import { shareToken } from "@/lib/passwords";

const MAX_DAYS = 365 * 5; // 5 years cap on custom expiry

// List shares for a gallery the user owns.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const galleryId = Number(id);

  const gallery = getDb()
    .prepare("SELECT id, user_id FROM galleries WHERE id = ?")
    .get(galleryId) as Pick<GalleryRow, "id" | "user_id"> | undefined;
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gallery.user_id !== me.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const shares = getDb()
    .prepare(
      `SELECT id, recipient_label, token, expires_at, revoked_at, created_at,
        (SELECT COUNT(*) FROM share_views v WHERE v.share_id = shares.id) as views
       FROM shares WHERE gallery_id = ? ORDER BY created_at DESC`
    )
    .all(galleryId) as (ShareRow & { views: number })[];

  return NextResponse.json({ shares });
}

// Create a new share for a gallery the user owns.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const galleryId = Number(id);

  const { recipientLabel, days, permanent } = await req.json();
  if (typeof recipientLabel !== "string" || !recipientLabel.trim()) {
    return NextResponse.json({ error: "Tell us who this link is for." }, { status: 400 });
  }
  let expiresAt: number | null = null;
  if (!permanent) {
    const d = Number(days);
    if (!Number.isInteger(d) || d < 1 || d > MAX_DAYS) {
      return NextResponse.json({ error: `Days must be between 1 and ${MAX_DAYS}.` }, { status: 400 });
    }
    expiresAt = Math.floor(Date.now() / 1000) + d * 86400;
  }

  const gallery = getDb()
    .prepare("SELECT id, user_id FROM galleries WHERE id = ?")
    .get(galleryId) as Pick<GalleryRow, "id" | "user_id"> | undefined;
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gallery.user_id !== me.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const token = shareToken();
  const result = getDb()
    .prepare(
      "INSERT INTO shares (gallery_id, created_by_user_id, recipient_label, token, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(galleryId, me.id, recipientLabel.trim().slice(0, 60), token, expiresAt);

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    token,
    recipient_label: recipientLabel.trim().slice(0, 60),
    expires_at: expiresAt,
    revoked_at: null,
    created_at: Math.floor(Date.now() / 1000),
    views: 0,
  });
}
