import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow } from "@/lib/db";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB per image — phones can produce big files
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const galleryIdRaw = form.get("galleryId");
  const file = form.get("file");
  const title = (form.get("title") ?? "").toString().trim().slice(0, 80);

  if (typeof galleryIdRaw !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const galleryId = Number(galleryIdRaw);
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json({ error: "That file type isn't supported. Try JPG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too big (15MB max)." }, { status: 413 });
  }

  const gallery = getDb()
    .prepare("SELECT id, user_id FROM galleries WHERE id = ?")
    .get(galleryId) as Pick<GalleryRow, "id" | "user_id"> | undefined;
  if (!gallery || gallery.user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stem = nanoid(20);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const fullPath = path.join(uploadsDir, `${stem}.jpg`);
  const thumbPath = path.join(uploadsDir, `${stem}_thumb.jpg`);

  // Re-encode everything to JPEG for consistency (also handles HEIC from iPhones).
  // .rotate() applies EXIF orientation so portrait photos don't end up sideways.
  await sharp(buffer).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(fullPath);
  await sharp(buffer).rotate().resize(600, 600, { fit: "cover" }).jpeg({ quality: 80 }).toFile(thumbPath);

  const fileUrl = `/uploads/${stem}.jpg`;
  const thumbUrl = `/uploads/${stem}_thumb.jpg`;

  const result = getDb()
    .prepare("INSERT INTO artworks (gallery_id, title, file_url, thumb_url) VALUES (?, ?, ?, ?)")
    .run(galleryId, title, fileUrl, thumbUrl);

  return NextResponse.json({ id: result.lastInsertRowid, fileUrl, thumbUrl });
}
