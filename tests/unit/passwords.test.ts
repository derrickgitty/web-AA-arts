import { describe, it, expect } from "vitest";
import { generateFriendlyPassword, shareToken } from "@/lib/passwords";

describe("generateFriendlyPassword", () => {
  it("returns a kid-friendly word-word-NNN format", () => {
    const pw = generateFriendlyPassword();
    expect(pw).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
  });

  it("produces varied output across many calls", () => {
    const set = new Set<string>();
    for (let i = 0; i < 20; i++) set.add(generateFriendlyPassword());
    // 20 random picks should almost certainly produce >5 distinct values
    expect(set.size).toBeGreaterThan(5);
  });

  it("generated passwords meet the 8-char minimum enforced by /api/me/password", () => {
    for (let i = 0; i < 5; i++) {
      expect(generateFriendlyPassword().length).toBeGreaterThanOrEqual(8);
    }
  });
});

describe("shareToken", () => {
  it("is exactly 32 chars from a URL-safe alphabet", () => {
    const t = shareToken();
    expect(t).toHaveLength(32);
    expect(t).toMatch(/^[A-HJ-NP-Za-hj-km-np-z2-9]{32}$/);
  });

  it("is unique across many calls", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(shareToken());
    expect(set.size).toBe(100);
  });
});
