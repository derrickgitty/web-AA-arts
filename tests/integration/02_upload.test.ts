import { describe, it, expect, beforeAll } from "vitest";
import sharp from "sharp";
import { Client, asLoggedInUser } from "../helpers/client";

let alva: Client;
let alvaGalleryId: number;

async function pngBuffer(width = 200, height = 200): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 255, g: 200, b: 220 } } }).png().toBuffer();
}

async function uploadFile(c: Client, galleryId: number, content: Buffer | string, name: string, type: string, title = name) {
  const fd = new FormData();
  fd.append("galleryId", String(galleryId));
  fd.append("title", title);
  const blob = typeof content === "string" ? new Blob([content], { type }) : new Blob([new Uint8Array(content)], { type });
  fd.append("file", blob, name);
  return c.fetch("/api/upload", { method: "POST", body: fd });
}

beforeAll(async () => {
  alva = await asLoggedInUser("alva");
  // Find Alva's main gallery via the redirect from /
  const r = await alva.fetch("/");
  const loc = r.headers.get("location") ?? "";
  const m = loc.match(/\/gallery\/(\d+)/);
  if (!m) throw new Error(`Couldn't find Alva's gallery: ${loc}`);
  alvaGalleryId = Number(m[1]);
});

describe("upload: file types", () => {
  it("accepts a PNG and re-encodes to JPEG", async () => {
    const buf = await pngBuffer(300, 200);
    const res = await uploadFile(alva, alvaGalleryId, buf, "test_pic.png", "image/png");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("image");
    expect(body.fileUrl).toMatch(/\.jpg$/);
  });

  it("accepts a PDF and stores it with a generated thumbnail", async () => {
    const minimalPdf =
      "%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 100 100]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000050 00000 n\n0000000093 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n145\n%%EOF";
    const res = await uploadFile(alva, alvaGalleryId, minimalPdf, "test_doc.pdf", "application/pdf");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("pdf");
    expect(body.fileUrl).toMatch(/\.pdf$/);
    expect(body.thumbUrl).toMatch(/\.jpg$/);
  });

  it("sanitises a malicious SVG and stores it without scripts", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><script>alert(1)</script><circle cx="25" cy="25" r="20" fill="red"/></svg>`;
    const res = await uploadFile(alva, alvaGalleryId, svg, "test_bad.svg", "image/svg+xml");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("image");
    // Stored SVG must not contain <script>
    const stored = await fetch(`http://localhost:${process.env.TEST_PORT || 3010}${body.fileUrl}`);
    const text = await stored.text();
    expect(text).not.toMatch(/<script/i);
  });

  it("rejects an unknown content type", async () => {
    const res = await uploadFile(alva, alvaGalleryId, "hello", "test_x.txt", "text/plain");
    expect(res.status).toBe(400);
  });
});

describe("upload: authorization", () => {
  it("rejects unauthenticated upload", async () => {
    const buf = await pngBuffer();
    const c = new Client();
    const res = await uploadFile(c, alvaGalleryId, buf, "test_anon.png", "image/png");
    expect(res.status).toBe(401);
  });

  it("rejects upload to another kid's gallery", async () => {
    // Alsa's gallery — find it via DB id pattern (alva is gallery 2 from seed order; alsa is 3)
    // Safer: query by listing... but no such endpoint for kids. Try gallery id != alva's;
    // we know seed creates two top-level galleries for kids only, ids 1 and 2 (admin doesn't get one).
    const candidate = alvaGalleryId === 1 ? 2 : 1;
    const buf = await pngBuffer();
    const res = await uploadFile(alva, candidate, buf, "test_intrude.png", "image/png");
    expect(res.status).toBe(403);
  });

  it("blocks the admin from uploading at all", async () => {
    const admin = await asLoggedInUser("admin");
    const buf = await pngBuffer();
    const res = await uploadFile(admin, alvaGalleryId, buf, "test_admin.png", "image/png");
    expect(res.status).toBe(403);
  });
});
