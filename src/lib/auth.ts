import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { getDb } from "./db";

const SESSION_COOKIE = "aa_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type CurrentUser = {
  id: number;
  username: string;
  displayName: string;
};

export async function createSession(userId: number) {
  const id = nanoid(40);
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  getDb()
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(id, userId, expires);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username, u.display_name, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(id) as
    | { id: number; username: string; display_name: string; expires_at: number }
    | undefined;
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return null;
  }
  return { id: row.id, username: row.username, displayName: row.display_name };
}
