import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { walkRepo } from "../analyze/walk-repo.js";
import { parseCssTokens, type CssTokens } from "./parse-css-tokens.js";
import { parseTailwind } from "./parse-tailwind.js";
import { detectFont } from "./detect-font.js";
import { grabBrand } from "./grab-brand.js";
import { isLight, mix, chroma, contrast } from "./color-utils.js";
import { DesignProfile, type DesignProfile as DesignProfileT } from "../shared/types.js";
import { config } from "../shared/config.js";

/**
 * Build a per-project DesignProfile by merging extracted tokens (CSS vars first —
 * most explicit; then Tailwind; then brand-SVG accent), filling gaps with computed
 * defaults. Persists to <repo>/.auto-intro/design-profile.json.
 */

function pick<K extends keyof CssTokens>(role: K, ...sources: CssTokens[]): CssTokens[K] | undefined {
  for (const s of sources) if (s[role] != null) return s[role];
  return undefined;
}

export function inspectDesign(repoRoot: string): DesignProfileT {
  const root = path.resolve(repoRoot);
  const tree = walkRepo(root);
  const workDir = path.join(root, config.workDir);

  const css = parseCssTokens(tree);
  const tw = parseTailwind(tree);
  const brand = grabBrand(tree, workDir);
  const font = detectFont(tree, tw.font);

  // accent: prefer explicit tokens, then brand-derived, then default.
  const bg = pick("bg", css, tw.tokens) ?? "#0a0f1e";
  const mode = isLight(bg) ? "light" : "dark";
  const text = pick("text", css, tw.tokens) ?? (mode === "dark" ? "#eef2fb" : "#0b1220");
  let surface = pick("surface", css, tw.tokens) ?? mix(bg, text, 0.07);
  const dim = pick("dim", css, tw.tokens) ?? mix(text, bg, 0.45);
  const radius = pick("radius", css, tw.tokens) ?? 16;

  let accent = pick("accent", css, tw.tokens) ?? brand.accent ?? (mode === "dark" ? "#6ea8fe" : "#4f46e5");
  let accent2 = pick("accent2", css, tw.tokens) ?? "#f59e0b";

  // --- sanitize for a TRAILER (extracted tokens are often unusable as-is) ----
  // Panels need to separate from the bg (shadcn light often sets surface == bg).
  if (contrast(surface, bg) < 1.06) surface = mix(bg, text, mode === "dark" ? 0.1 : 0.06);
  // Accent must be vivid + visible — many themes' --primary is near-black/near-white.
  const accentBad = chroma(accent) < 0.12 || contrast(accent, bg) < 1.45;
  if (accentBad) {
    accent = brand.accent && chroma(brand.accent) > 0.15 ? brand.accent : mode === "dark" ? "#6ea8fe" : "#4f46e5";
  }
  // Secondary must be distinct from bg and the accent.
  if (chroma(accent2) < 0.12 || contrast(accent2, bg) < 1.25) accent2 = mode === "dark" ? "#fbbf24" : "#f59e0b";

  const profile = DesignProfile.parse({
    mode,
    glass: true,
    radius,
    font,
    palette: { bg, surface, text, dim, accent, accent2 },
    logo: brand.logoPath,
  });

  mkdirSync(workDir, { recursive: true });
  writeFileSync(path.join(workDir, "design-profile.json"), JSON.stringify(profile, null, 2));
  return profile;
}
