import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, UserRow } from "@/lib/db";
import { createSession } from "@/lib/auth";

const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_FAILS = 10;

function clientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function logEvent(opts: {
  user_id: number | null;
  username_attempted: string;
  success: boolean;
  ip: string;
  user_agent: string;
}) {
  getDb()
    .prepare(
      "INSERT INTO login_events (user_id, username_attempted, success, ip, user_agent) VALUES (?, ?, ?, ?, ?)"
    )
    .run(opts.user_id, opts.username_attempted, opts.success ? 1 : 0, opts.ip, opts.user_agent);
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const u = username.trim().toLowerCase();
  const ip = clientIp(req);
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

  const since = Math.floor(Date.now() / 1000) - RATE_LIMIT_WINDOW_SECONDS;
  const recentFails = getDb()
    .prepare(
      "SELECT COUNT(*) as n FROM login_events WHERE username_attempted = ? AND success = 0 AND created_at >= ?"
    )
    .get(u, since) as { n: number };

  if (recentFails.n >= RATE_LIMIT_MAX_FAILS) {
    logEvent({ user_id: null, username_attempted: u, success: false, ip, user_agent: ua });
    return NextResponse.json(
      { error: "Too many tries — wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  const user = getDb()
    .prepare("SELECT id, password_hash FROM users WHERE username = ?")
    .get(u) as Pick<UserRow, "id" | "password_hash"> | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    logEvent({ user_id: user?.id ?? null, username_attempted: u, success: false, ip, user_agent: ua });
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }

  logEvent({ user_id: user.id, username_attempted: u, success: true, ip, user_agent: ua });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
