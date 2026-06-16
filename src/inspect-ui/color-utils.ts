/** Small dependency-free color helpers for building a DesignProfile palette. */

export function clamp(n: number, lo = 0, hi = 255): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Normalize any of #rgb / #rrggbb / hsl() / "h s% l%" (shadcn) → #rrggbb, or null. */
export function toHex(input: string): string | null {
  const s = input.trim();
  // #rgb / #rrggbb
  let m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return `#${h.toLowerCase()}`;
  }
  // hsl(h, s%, l%) or shadcn "h s% l%"
  m = /(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%/.exec(s);
  if (m) return hslToHex(+m[1], +m[2], +m[3]);
  // rgb(r,g,b)
  m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
  if (m) return rgbToHex(+m[1], +m[2], +m[3]);
  return null;
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255));
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => clamp(Math.round(x)).toString(16).padStart(2, "0")).join("")}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance 0..1 (for dark/light decisions + readable text picks). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Mix two hex colors by t (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export const isLight = (hex: string): boolean => luminance(hex) > 0.5;

/** Chroma 0..1 (colorfulness). Near-0 = grayscale/neutral. */
export function chroma(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/** WCAG-ish contrast ratio between two colors (1 = identical, 21 = max). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
