import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import DOMPurify from "isomorphic-dompurify";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow, STORAGE_QUOTA_BYTES, UserRow } from "@/lib/db";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB per file
const RASTER_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);
const SVG_TYPES = new Set(["image/svg+xml"]);
const PDF_TYPES = new Set(["application/pdf"]);

// 1×1 transparent PDF-icon-ish placeholder generated at runtime so we don't ship a binary asset
async function pdfThumbnail(): Promise<Buffer> {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#FFE4ED'/><stop offset='100%' stop-color='#EFE6FF'/>
      </linearGradient>
    </defs>
    <rect width='600' height='600' fill='url(#g)'/>
    <rect x='150' y='100' width='300' height='400' rx='24' fill='white' stroke='#D4B8FF' stroke-width='4'/>
    <text x='300' y='340' font-family='Quicksand, sans-serif' font-weight='700' font-size='90' fill='#9B6FE0' text-anchor='middle'>PDF</text>
    <text x='300' y='420' font-family='Quicksand, sans-serif' font-size='28' fill='#B894F0' text-anchor='middle'>document</text>
  </svg>`;
  return Buffer.from(svg);
}

function sanitizeSvg(input: string): string | null {
  const cleaned = DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
    FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover"],
  });
  if (!cleaned || !cleaned.includes("<svg")) return null;
  return cleaned;
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (me.role !== "kid") return NextResponse.json({ error: "Only kids can upload" }, { status: 403 });

  const form = await req.formData();
  const galleryIdRaw = form.get("galleryId");
  const file = form.get("file");
  const title = (form.get("title") ?? "").toString().trim().slice(0, 80);

  if (typeof galleryIdRaw !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const galleryId = Number(galleryIdRaw);
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File is too big (${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB max).` }, { status: 413 });
  }

  const isRaster = RASTER_TYPES.has(file.type);
  const isSvg = SVG_TYPES.has(file.type);
  const isPdf = PDF_TYPES.has(file.type);
  if (!isRaster && !isSvg && !isPdf) {
    return NextResponse.json({ error: "That file type isn't supported. Try JPG, PNG, WebP, SVG, or PDF." }, { status: 400 });
  }

  // Ownership + quota check.
  const gallery = getDb()
    .prepare("SELECT id, user_id FROM galleries WHERE id = ?")
    .get(galleryId) as Pick<GalleryRow, "id" | "user_id"> | undefined;
  if (!gallery || gallery.user_id !== me.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const usage = getDb().prepare("SELECT storage_bytes FROM users WHERE id = ?").get(me.id) as Pick<UserRow, "storage_bytes">;
  if (usage.storage_bytes + file.size > STORAGE_QUOTA_BYTES) {
    return NextResponse.json(
      { error: `You're out of space (${(STORAGE_QUOTA_BYTES / 1024 / 1024).toFixed(0)}MB max). Delete some artworks to make room.` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stem = nanoid(20);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  let fileUrl: string;
  let thumbUrl: string;
  let kind: "image" | "pdf" = "image";
  let storedBytes = 0;

  if (isPdf) {
    kind = "pdf";
    const fullPath = path.join(uploadsDir, `${stem}.pdf`);
    const thumbPath = path.join(uploadsDir, `${stem}_thumb.jpg`);
    await fs.writeFile(fullPath, buffer);
    await sharp(await pdfThumbnail()).resize(600, 600, { fit: "cover" }).jpeg({ quality: 80 }).toFile(thumbPath);
    fileUrl = `/uploads/${stem}.pdf`;
    thumbUrl = `/uploads/${stem}_thumb.jpg`;
    const stat = await fs.stat(thumbPath);
    storedBytes = file.size + stat.size;
  } else if (isSvg) {
    const safe = sanitizeSvg(buffer.toString("utf8"));
    if (!safe) return NextResponse.json({ error: "That SVG didn't pass safety checks." }, { status: 400 });
    const safeBuf = Buffer.from(safe, "utf8");
    const fullPath = path.join(uploadsDir, `${stem}.svg`);
    const thumbPath = path.join(uploadsDir, `${stem}_thumb.jpg`);
    await fs.writeFile(fullPath, safeBuf);
    // Rasterize the (sanitised) SVG for the thumbnail; sharp handles SVG via librsvg.
    await sharp(safeBuf, { density: 200 }).resize(600, 600, { fit: "cover" }).jpeg({ quality: 80 }).toFile(thumbPath);
    fileUrl = `/uploads/${stem}.svg`;
    thumbUrl = `/uploads/${stem}_thumb.jpg`;
    const [a, b] = await Promise.all([fs.stat(fullPath), fs.stat(thumbPath)]);
    storedBytes = a.size + b.size;
  } else {
    const fullPath = path.join(uploadsDir, `${stem}.jpg`);
    const thumbPath = path.join(uploadsDir, `${stem}_thumb.jpg`);
    await sharp(buffer).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(fullPath);
    await sharp(buffer).rotate().resize(600, 600, { fit: "cover" }).jpeg({ quality: 80 }).toFile(thumbPath);
    fileUrl = `/uploads/${stem}.jpg`;
    thumbUrl = `/uploads/${stem}_thumb.jpg`;
    const [a, b] = await Promise.all([fs.stat(fullPath), fs.stat(thumbPath)]);
    storedBytes = a.size + b.size;
  }

  const db = getDb();
  const result = db
    .prepare("INSERT INTO artworks (gallery_id, title, kind, file_url, thumb_url, bytes) VALUES (?, ?, ?, ?, ?, ?)")
    .run(galleryId, title, kind, fileUrl, thumbUrl, storedBytes);
  db.prepare("UPDATE users SET storage_bytes = storage_bytes + ? WHERE id = ?").run(storedBytes, me.id);

  return NextResponse.json({ id: Number(result.lastInsertRowid), fileUrl, thumbUrl, kind });
}
