import { describe, it, expect } from "vitest";
import { sanitizeSvg } from "@/lib/svg";

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">${inner}</svg>`;

describe("sanitizeSvg", () => {
  it("keeps a benign SVG intact", () => {
    const out = sanitizeSvg(wrap('<circle cx="5" cy="5" r="4" fill="pink"/>'));
    expect(out).not.toBeNull();
    expect(out).toContain("<circle");
    expect(out).toContain("<svg");
  });

  it("strips <script> tags", () => {
    const out = sanitizeSvg(wrap("<script>alert(1)</script><circle/>"));
    expect(out).not.toBeNull();
    expect(out).not.toMatch(/<script/i);
  });

  it("strips on* event handlers", () => {
    const out = sanitizeSvg(wrap('<circle onclick="hack()" cx="5" cy="5" r="4"/>'));
    expect(out).not.toBeNull();
    expect(out).not.toMatch(/onclick/i);
  });

  it("rejects input that doesn't contain an SVG root", () => {
    expect(sanitizeSvg("just some text")).toBeNull();
    expect(sanitizeSvg("<html><body>hi</body></html>")).toBeNull();
  });

  it("strips foreignObject (HTML-injection vector)", () => {
    const out = sanitizeSvg(wrap('<foreignObject><iframe src="evil"/></foreignObject>'));
    expect(out).not.toBeNull();
    expect(out).not.toMatch(/foreignObject/i);
    expect(out).not.toMatch(/<iframe/i);
  });

  it("strips javascript: URIs in href attributes", () => {
    const out = sanitizeSvg(wrap('<a href="javascript:alert(1)"><circle/></a>'));
    expect(out).not.toBeNull();
    expect(out).not.toMatch(/javascript:/i);
  });
});
