import DOMPurify from "isomorphic-dompurify";

// Server-side SVG sanitiser. Returns the cleaned SVG string, or null if the
// input doesn't look like an SVG after sanitisation.
export function sanitizeSvg(input: string): string | null {
  const cleaned = DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
    FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover"],
  });
  if (!cleaned || !cleaned.includes("<svg")) return null;
  return cleaned;
}
