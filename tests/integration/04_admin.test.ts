import { describe, it, expect } from "vitest";
import { Client, asLoggedInUser } from "../helpers/client";

describe("admin: role gate", () => {
  it("redirects a kid away from /admin", async () => {
    const alva = await asLoggedInUser("alva");
    const r = await alva.fetch("/admin");
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).not.toContain("/admin");
  });

  it("redirects an unauthenticated visitor to /login", async () => {
    const c = new Client();
    const r = await c.fetch("/admin");
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toContain("/login");
  });

  it("admin reaches every admin page", async () => {
    const admin = await asLoggedInUser("admin");
    for (const p of ["/admin", "/admin/users", "/admin/logins", "/admin/shares", "/admin/audit"]) {
      const r = await admin.fetch(p);
      expect(r.status, `for ${p}`).toBe(200);
    }
  });
});

describe("admin: reset password", () => {
  it("rejects a kid hitting the reset endpoint", async () => {
    const alva = await asLoggedInUser("alva");
    // Try to reset alsa (whoever has id != alva)
    const r = await alva.fetch("/api/admin/users/3/reset-password", { method: "POST" });
    expect([401, 403]).toContain(r.status);
  });

  it("admin reset returns a fresh password and forces the kid back into change-pw flow", async () => {
    // We use alsa here — auth.test.ts rate-limited her, so don't touch her again afterwards.
    // Instead, reset alva (after this test alva can no longer log in with the test pw).
    const admin = await asLoggedInUser("admin");
    // Find alva's user id by listing the admin/users page (server-side rendered so no JSON API).
    // Simpler: trust the seed order — admin=1, alva=2, alsa=3.
    const r = await admin.postJson<{ password: string }>("/api/admin/users/2/reset-password", {});
    expect(r.status).toBe(200);
    expect(r.body.password).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);

    // Alva's old test password no longer works.
    const c = new Client();
    const old = await c.login("alva", "test-alva-pw-1");
    expect(old.status).toBe(401);

    // The new password works AND triggers the must-change-pw flow.
    const fresh = await c.login("alva", r.body.password);
    expect(fresh.status).toBe(200);
    const root = await c.fetch("/");
    expect(root.headers.get("location")).toContain("/change-password?forced=1");
  });
});
