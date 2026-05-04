import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth";
import { getDb, GalleryRow } from "@/lib/db";

// Create a new sub-gallery under a parent gallery the user owns.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name, parentId } = await req.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (typeof parentId !== "number") {
    return NextResponse.json({ error: "parentId required" }, { status: 400 });
  }

  const parent = getDb()
    .prepare("SELECT id, user_id FROM galleries WHERE id = ?")
    .get(parentId) as Pick<GalleryRow, "id" | "user_id"> | undefined;
  if (!parent || parent.user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const token = nanoid(32);
  const result = getDb()
    .prepare(
      "INSERT INTO galleries (user_id, name, parent_id, share_token) VALUES (?, ?, ?, ?)"
    )
    .run(user.id, name.trim().slice(0, 60), parentId, token);

  return NextResponse.json({ id: result.lastInsertRowid });
}
