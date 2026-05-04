import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, UserRow } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const user = getDb()
    .prepare("SELECT id, password_hash FROM users WHERE username = ?")
    .get(username.trim().toLowerCase()) as Pick<UserRow, "id" | "password_hash"> | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
