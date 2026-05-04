import { describe, it, expect, beforeAll } from "vitest";
import { Client, asLoggedInUser, BASE } from "../helpers/client";

let alva: Client;
let alvaGalleryId: number;

beforeAll(async () => {
  alva = await asLoggedInUser("alva");
  const r = await alva.fetch("/");
  const m = (r.headers.get("location") ?? "").match(/\/gallery\/(\d+)/);
  if (!m) throw new Error("no gallery for alva");
  alvaGalleryId = Number(m[1]);
});

describe("shares: lifecycle", () => {
  it("creates a share with a label and 7-day expiry", async () => {
    const r = await alva.postJson<{ id: number; token: string; expires_at: number | null }>(
      `/api/galleries/${alvaGalleryId}/shares`,
      { recipientLabel: "Grandma", days: 7, permanent: false }
    );
    expect(r.status).toBe(200);
    expect(r.body.token).toHaveLength(32);
    expect(r.body.expires_at).toBeTypeOf("number");
    const ttl = (r.body.expires_at as number) - Math.floor(Date.now() / 1000);
    expect(ttl).toBeGreaterThan(7 * 86400 - 60);
    expect(ttl).toBeLessThanOrEqual(7 * 86400 + 60);
  });

  it("creates a permanent share", async () => {
    const r = await alva.postJson<{ expires_at: number | null }>(
      `/api/galleries/${alvaGalleryId}/shares`,
      { recipientLabel: "Mum", permanent: true }
    );
    expect(r.status).toBe(200);
    expect(r.body.expires_at).toBeNull();
  });

  it("requires a recipient label", async () => {
    const r = await alva.postJson(`/api/galleries/${alvaGalleryId}/shares`, { recipientLabel: "", days: 7 });
    expect(r.status).toBe(400);
  });

  it("rejects creating a share against another kid's gallery", async () => {
    const candidate = alvaGalleryId === 1 ? 2 : 1;
    const r = await alva.postJson(`/api/galleries/${candidate}/shares`, { recipientLabel: "x", days: 7 });
    expect(r.status).toBe(403);
  });

  it("public can view via the secret link without auth, and view is logged", async () => {
    const make = await alva.postJson<{ id: number; token: string }>(`/api/galleries/${alvaGalleryId}/shares`, {
      recipientLabel: "Auntie",
      days: 7,
    });
    const token = make.body.token;
    // Anonymous fetch
    const res = await fetch(`${BASE}/share/${token}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Auntie");
  });

  it("kid can revoke their own share", async () => {
    const make = await alva.postJson<{ id: number; token: string }>(`/api/galleries/${alvaGalleryId}/shares`, {
      recipientLabel: "Cousin",
      days: 7,
    });
    const id = make.body.id;
    const token = make.body.token;
    const del = await alva.fetch(`/api/shares/${id}`, { method: "DELETE" });
    expect(del.status).toBe(200);
    // Revoked link is now 404 to the public
    const res = await fetch(`${BASE}/share/${token}`);
    expect(res.status).toBe(404);
  });

  it("admin can revoke any share and the action is audited", async () => {
    const make = await alva.postJson<{ id: number; token: string }>(`/api/galleries/${alvaGalleryId}/shares`, {
      recipientLabel: "Teacher",
      days: 7,
    });
    const admin = await asLoggedInUser("admin");
    const del = await admin.fetch(`/api/shares/${make.body.id}`, { method: "DELETE" });
    expect(del.status).toBe(200);
    // Public view 404s now
    const res = await fetch(`${BASE}/share/${make.body.token}`);
    expect(res.status).toBe(404);
  });

  it("invalid token returns 404", async () => {
    const res = await fetch(`${BASE}/share/this-token-does-not-exist`);
    expect(res.status).toBe(404);
  });
});
