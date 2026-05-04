import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { getDb, UserRow } from "@/lib/db";
import { generateFriendlyPassword } from "@/lib/passwords";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);
  const target = getDb()
    .prepare("SELECT id, username FROM users WHERE id = ?")
    .get(userId) as Pick<UserRow, "id" | "username"> | undefined;
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newPassword = generateFriendlyPassword();
  const hash = await bcrypt.hash(newPassword, 10);
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(hash, userId);
  // End all active sessions for the target — they need to log in again.
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  db.prepare(
    "INSERT INTO admin_actions (admin_id, action_type, target_user_id, details) VALUES (?, 'reset_password', ?, ?)"
  ).run(me.id, userId, `Reset password for ${target.username}`);

  return NextResponse.json({ password: newPassword });
}
