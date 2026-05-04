import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth";
import { getDb, UserRow } from "@/lib/db";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ACCEPTED.has(file.type)) return NextResponse.json({ error: "Use JPG, PNG, WebP, or HEIC" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image too big (5MB max)" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stem = nanoid(20);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const outPath = path.join(uploadsDir, `avatar_${stem}.jpg`);
  await sharp(buffer).rotate().resize(400, 400, { fit: "cover" }).jpeg({ quality: 85 }).toFile(outPath);

  // Best-effort cleanup of old avatar.
  const old = getDb().prepare("SELECT avatar_url FROM users WHERE id = ?").get(me.id) as Pick<UserRow, "avatar_url"> | undefined;
  if (old?.avatar_url) {
    try { await fs.unlink(path.join(process.cwd(), "public", old.avatar_url)); } catch { /* ignore */ }
  }

  const url = `/uploads/avatar_${stem}.jpg`;
  getDb().prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(url, me.id);
  return NextResponse.json({ url });
}
