import { readFileSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import type { RepoTree } from "../analyze/walk-repo.js";
import { toHex, luminance } from "./color-utils.js";

/**
 * Find the brand mark (logo / og-image) — the ONLY real asset v2 keeps — copy it
 * into the work dir, and if it's an SVG, derive a brand accent from its fill colors
 * (dependency-free; PNG color extraction is intentionally skipped).
 */

const LOGO_HINTS = ["logo", "brand", "icon", "mark", "wordmark"];
const OG_HINTS = ["og-image", "og_image", "opengraph", "og.", "social"];
const IMG_RE = /\.(svg|png|jpe?g|webp)$/i;

export interface BrandResult {
  logoPath?: string; // copied into work dir (basename)
  accent?: string; // derived from SVG fills when available
}

function rank(relPath: string): number {
  const p = relPath.toLowerCase();
  let score = 0;
  if (LOGO_HINTS.some((h) => p.includes(h))) score += 10;
  if (OG_HINTS.some((h) => p.includes(h))) score += 6;
  if (p.endsWith(".svg")) score += 4; // prefer svg (scalable + color-derivable)
  if (p.startsWith("public/") || p.startsWith("assets/") || p.startsWith("static/")) score += 2;
  return score;
}

/** Most prominent non-neutral hex fill in an SVG (skips black/white/grey). */
function deriveAccentFromSvg(absPath: string): string | undefined {
  let svg = "";
  try {
    svg = readFileSync(absPath, "utf8");
  } catch {
    return undefined;
  }
  const counts = new Map<string, number>();
  for (const m of svg.matchAll(/(?:fill|stop-color)\s*[:=]\s*["']?(#[0-9a-fA-F]{3,6})/g)) {
    const hex = toHex(m[1]);
    if (!hex) continue;
    const lum = luminance(hex);
    if (lum < 0.06 || lum > 0.94) continue; // skip near-black/white
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  let best: string | undefined;
  let max = 0;
  for (const [hex, n] of counts) if (n > max) { max = n; best = hex; }
  return best;
}

export function grabBrand(tree: RepoTree, workDir: string): BrandResult {
  const imgs = tree.files
    .filter((f) => IMG_RE.test(f.relPath) && rank(f.relPath) > 0)
    .sort((a, b) => rank(b.relPath) - rank(a.relPath));
  if (imgs.length === 0) return {};

  const top = imgs[0];
  const out: BrandResult = {};
  mkdirSync(workDir, { recursive: true });
  const dest = `logo${path.extname(top.relPath).toLowerCase()}`;
  try {
    copyFileSync(top.absPath, path.join(workDir, dest));
    out.logoPath = dest;
  } catch {
    /* ignore copy failure */
  }
  // derive accent from the best SVG among candidates (not necessarily the copied one)
  const svg = imgs.find((f) => f.relPath.toLowerCase().endsWith(".svg"));
  if (svg) out.accent = deriveAccentFromSvg(svg.absPath);
  return out;
}
