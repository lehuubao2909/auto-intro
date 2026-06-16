import { readFileSync } from "node:fs";
import type { RepoTree } from "../analyze/walk-repo.js";
import { toHex } from "./color-utils.js";

/**
 * Extract design tokens from CSS custom properties (:root { --… }). Handles both
 * shadcn HSL-triplet vars (--background, --primary, --radius) and direct hex vars
 * (--bg, --accent, --text). Returns a partial palette + radius (best-effort).
 */

export interface CssTokens {
  bg?: string;
  surface?: string;
  text?: string;
  dim?: string;
  accent?: string;
  accent2?: string;
  radius?: number;
}

// token role → candidate CSS var names (first match wins)
const ROLE_VARS: Record<keyof Omit<CssTokens, "radius">, string[]> = {
  bg: ["--background", "--bg", "--color-bg", "--color-background", "--body-bg"],
  surface: ["--card", "--surface", "--panel", "--popover", "--bg2", "--elevated", "--color-surface"],
  text: ["--foreground", "--text", "--color-text", "--color-foreground", "--body-color"],
  dim: ["--muted-foreground", "--dim", "--text-dim", "--text-muted", "--color-muted"],
  accent: ["--primary", "--accent", "--brand", "--color-primary", "--color-accent", "--ring"],
  accent2: ["--secondary", "--accent2", "--accent-2", "--color-secondary"],
};

const CSS_PREFER = ["globals.css", "index.css", "app.css", "styles.css", "theme.css", "global.css", "main.css"];

function pickCssFiles(tree: RepoTree): string[] {
  const css = tree.files.filter((f) => f.relPath.toLowerCase().endsWith(".css"));
  css.sort((a, b) => {
    const ai = CSS_PREFER.findIndex((n) => a.relPath.toLowerCase().endsWith(n));
    const bi = CSS_PREFER.findIndex((n) => b.relPath.toLowerCase().endsWith(n));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.relPath.length - b.relPath.length;
  });
  return css.slice(0, 5).map((f) => f.absPath);
}

export function parseCssTokens(tree: RepoTree): CssTokens {
  const vars = new Map<string, string>(); // name(lower) → raw value
  for (const abs of pickCssFiles(tree)) {
    let css = "";
    try {
      css = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      const name = m[1].toLowerCase();
      if (!vars.has(name)) vars.set(name, m[2].trim());
    }
  }

  const out: CssTokens = {};
  for (const [role, names] of Object.entries(ROLE_VARS) as [keyof typeof ROLE_VARS, string[]][]) {
    for (const n of names) {
      const v = vars.get(n);
      const hex = v ? toHex(v) : null;
      if (hex) {
        out[role] = hex;
        break;
      }
    }
  }
  const r = vars.get("--radius");
  if (r) {
    const num = parseFloat(r);
    if (Number.isFinite(num)) out.radius = r.includes("rem") ? num * 16 : num;
  }
  return out;
}
