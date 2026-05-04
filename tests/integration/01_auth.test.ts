import { describe, it, expect } from "vitest";
import { Client, asLoggedInUser, readSeedPasswords, TEST_PW } from "../helpers/client";

describe("auth: login + force-password-change + rate limit", () => {
  it("rejects wrong passwords", async () => {
    const c = new Client();
    const r = await c.login("alva", "definitely-wrong");
    expect(r.status).toBe(401);
  });

  it("after a fresh password the kid is forced through /change-password before reaching /", async () => {
    // Pre-condition: put alva back into must_change_password=1 by having admin reset her.
    // Makes the test independent of file-execution order.
    const admin = await asLoggedInUser("admin");
    const reset = await admin.postJson<{ password: string }>("/api/admin/users/2/reset-password", {});
    expect(reset.status).toBe(200);
    const tempPw = reset.body.password;

    const c = new Client();
    const ok = await c.login("alva", tempPw);
    expect(ok.status).toBe(200);

    // Until pw is changed, /  ->  /change-password?forced=1
    const root = await c.fetch("/");
    expect(root.status).toBe(307);
    expect(root.headers.get("location")).toContain("/change-password?forced=1");

    // After changing pw, /  ->  /gallery/<id>
    const change = await c.postJson("/api/me/password", {
      currentPassword: tempPw,
      newPassword: TEST_PW("alva"),
    });
    expect(change.status).toBe(200);

    const root2 = await c.fetch("/");
    expect(root2.status).toBe(307);
    expect(root2.headers.get("location")).toMatch(/\/gallery\/\d+/);
  });

  it("rate-limits a username after 10 failed attempts", async () => {
    // alsa is the canary — only this test touches her, so rate-limit pollution
    // doesn't leak into other suites.
    const c = new Client();
    let last = 0;
    for (let i = 0; i < 10; i++) {
      const r = await c.login("alsa", "wrong-on-purpose");
      last = r.status;
    }
    expect(last).toBe(401);
    const blocked = await c.login("alsa", "wrong-again");
    expect(blocked.status).toBe(429);
    // Even the correct password is blocked while the lockout is active.
    const passwords = readSeedPasswords();
    const blockedCorrect = await c.login("alsa", passwords.alsa);
    expect(blockedCorrect.status).toBe(429);
  });
});
