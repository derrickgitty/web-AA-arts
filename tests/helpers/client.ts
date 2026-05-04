// Minimal fetch wrapper with cookie-jar behaviour. Each Client instance keeps its
// own cookies, so tests can have multiple "users" simultaneously.

import fs from "fs";
import path from "path";

const PORT = process.env.TEST_PORT || "3010";
export const BASE = `http://localhost:${PORT}`;

export class Client {
  private cookies = new Map<string, string>();

  url(p: string) {
    return p.startsWith("http") ? p : BASE + p;
  }

  private cookieHeader() {
    if (this.cookies.size === 0) return undefined;
    return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private absorb(res: Response) {
    // Node's Response.headers.getSetCookie() returns each Set-Cookie line.
    const setters = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    for (const line of setters) {
      const [pair] = line.split(";");
      const idx = pair.indexOf("=");
      if (idx === -1) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (value === "" || value === "deleted") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return res;
  }

  async fetch(p: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const cookie = this.cookieHeader();
    if (cookie) headers.set("cookie", cookie);
    const res = await fetch(this.url(p), { ...init, headers, redirect: "manual" });
    return this.absorb(res);
  }

  async json<T = unknown>(p: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
    const res = await this.fetch(p, init);
    let body: T;
    try { body = (await res.json()) as T; } catch { body = undefined as T; }
    return { status: res.status, body };
  }

  async postJson<T = unknown>(p: string, payload: unknown) {
    return this.json<T>(p, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async login(username: string, password: string) {
    return this.postJson<{ ok?: true; error?: string }>("/api/login", { username, password });
  }
}

export function readSeedPasswords(): Record<string, string> {
  const file = path.resolve(process.cwd(), "tests/.seed-output.txt");
  const text = fs.readFileSync(file, "utf8");
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    // Lines look like:  alva     (kid  )  →  bunny-pearl-700
    const m = line.match(/^\s*(\w+)\s+\(\w+\s*\)\s+→\s+(\S+)/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export const TEST_PW = (username: string) => `test-${username}-pw-1`;

// Seed order is admin=1, alva=2, alsa=3 — see scripts/seed.ts.
const USER_IDS: Record<string, number> = { admin: 1, alva: 2, alsa: 3 };

async function changePw(c: Client, currentPassword: string, newPassword: string) {
  return c.postJson("/api/me/password", { currentPassword, newPassword });
}

// Idempotent across vitest file orderings: will recover whether the kid still
// has the seed pw, has been changed to the test pw, or has been admin-reset
// by another test mid-suite.
export async function asLoggedInUser(username: string): Promise<Client> {
  const c = new Client();
  const testPw = TEST_PW(username);

  // Path 1: test pw works (most common — already changed once)
  let r = await c.login(username, testPw);
  if (r.status === 200) return c;

  // Path 2: seed pw works (fresh out of globalSetup)
  const seedPw = readSeedPasswords()[username];
  if (seedPw) {
    r = await c.login(username, seedPw);
    if (r.status === 200) {
      const change = await changePw(c, seedPw, testPw);
      if (change.status === 200) return c;
    }
  }

  // Path 3: kid was reset by admin in another test — bootstrap via admin reset.
  if (username !== "admin") {
    const admin = await asLoggedInUser("admin");
    const id = USER_IDS[username];
    if (!id) throw new Error(`No known user id for '${username}'`);
    const reset = await admin.postJson<{ password: string }>(`/api/admin/users/${id}/reset-password`, {});
    if (reset.status !== 200) throw new Error(`admin reset failed: ${reset.status}`);
    const tempPw = reset.body.password;
    const c2 = new Client();
    const fresh = await c2.login(username, tempPw);
    if (fresh.status !== 200) throw new Error(`login after admin reset failed: ${fresh.status}`);
    const change = await changePw(c2, tempPw, testPw);
    if (change.status !== 200) throw new Error(`pw change after admin reset failed: ${change.status}`);
    return c2;
  }

  throw new Error(`Cannot recover login for '${username}'`);
}
