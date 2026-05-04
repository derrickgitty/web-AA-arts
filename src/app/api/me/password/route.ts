import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { getDb, UserRow } from "@/lib/db";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (typeof currentPassword !== "string") {
    return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  }

  const row = getDb()
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(me.id) as Pick<UserRow, "password_hash"> | undefined;
  if (!row || !(await bcrypt.compare(currentPassword, row.password_hash))) {
    return NextResponse.json({ error: "Current password is wrong." }, { status: 401 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  getDb()
    .prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?")
    .run(hash, me.id);

  return NextResponse.json({ ok: true });
}
