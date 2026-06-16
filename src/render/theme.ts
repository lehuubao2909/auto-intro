/**
 * Visual tokens for the trailer (code-trailer skill: cinematic-dark default).
 * One dominant accent (#41A3EF) + sparing secondary (#FCCE50). High-contrast text.
 */
import type React from "react";
import type { StoryboardMeta } from "../shared/storyboard-schema.js";
import type { DesignProfile } from "../shared/types.js";

export interface Theme {
  bg: string;
  bgElevated: string; // glass/elevated surface
  text: string;
  textDim: string;
  accent: string;
  accent2: string;
  /** Harmonious multi-hue ramp derived from the accent — used so DATA isn't one color. */
  series: string[];
  fontFamily: string;
  radius: number; // base corner radius (px)
  mode: "dark" | "light";
  glass: boolean;
}

function fontStack(name: string): string {
  return `"${name}", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
}
const FONT = fontStack("Inter");

export function themeFromMeta(meta: StoryboardMeta): Theme {
  const light = meta.theme === "brand-light";
  return {
    bg: light ? "#F7F9FC" : "#080B12",
    bgElevated: light ? "#FFFFFF" : "#10151F",
    text: light ? "#0B1220" : "#F4F7FB",
    textDim: light ? "#5A6573" : "#9AA7B8",
    accent: meta.accent,
    accent2: meta.accent2,
    series: buildSeries(meta.accent, meta.accent2, light),
    fontFamily: FONT,
    radius: 16,
    mode: light ? "light" : "dark",
    glass: true,
  };
}

/** Build the render Theme from an extracted per-project DesignProfile (v2). */
export function themeFromProfile(p: DesignProfile): Theme {
  return {
    bg: p.palette.bg,
    bgElevated: p.palette.surface,
    text: p.palette.text,
    textDim: p.palette.dim,
    accent: p.palette.accent,
    accent2: p.palette.accent2,
    series: buildSeries(p.palette.accent, p.palette.accent2, p.mode === "light"),
    fontFamily: fontStack(p.font),
    radius: p.radius,
    mode: p.mode,
    glass: p.glass,
  };
}

// --- Multi-hue ramp -------------------------------------------------------
// A harmonious 6-color set derived from the accent hue. Accent stays dominant
// (anchored to brand); the rest rotate around the wheel at vivid S/L so charts,
// tiles and icons read as colorful rather than one-accent monochrome.

interface HSL { h: number; s: number; l: number; }

function hexToHsl(hex: string): HSL {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return { h: 210, s: 0.7, l: 0.6 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * 6 harmonious hues rotated off the accent. Accent (index 0) and accent2 (index 5)
 * are kept verbatim so brand colors stay exact; the middle four rotate the wheel
 * (+35°, +90°, +170°, +205°) at vivid saturation/lightness tuned per mode.
 */
export function buildSeries(accent: string, accent2: string, light: boolean): string[] {
  const base = hexToHsl(accent);
  const s = Math.max(base.s, light ? 0.62 : 0.72);
  const l = light ? 0.52 : 0.62;
  const rot = (deg: number) => hslToHex(base.h + deg, s, l);
  return [accent, rot(35), rot(90), rot(170), rot(205), accent2];
}

/** Pick a ramp color by index (wraps). Safe if series missing. */
export function seriesColor(theme: Theme, i: number): string {
  const s = theme.series && theme.series.length ? theme.series : [theme.accent, theme.accent2];
  return s[((i % s.length) + s.length) % s.length];
}

/** Glassmorphism surface style for a theme (used by panels/cards). */
export function glassSurface(theme: Theme, alpha = 0.55): React.CSSProperties {
  const base = theme.bgElevated;
  return {
    background: theme.glass ? hexA(base, alpha) : base,
    backdropFilter: theme.glass ? "blur(18px)" : undefined,
    WebkitBackdropFilter: theme.glass ? "blur(18px)" : undefined,
    border: `1px solid ${hexA(theme.text, 0.1)}`,
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  };
}

/** Apply alpha to a #rrggbb hex → rgba() string (passes through non-hex). */
export function hexA(hex: string, alpha: number): string {
  if (typeof hex !== "string") return `rgba(127,127,127,${alpha})`;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Inner safe zone (~90%) — keep essential content inside this. */
export const SAFE_INSET = "5%";

/** Type scale (px @ 1080p). */
export const TYPE = {
  hero: 96,
  h1: 72,
  h2: 54,
  body: 36,
  label: 28,
  mono: 30,
} as const;
