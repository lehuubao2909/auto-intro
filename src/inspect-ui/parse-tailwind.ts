import { readFileSync } from "node:fs";
import type { RepoTree } from "../analyze/walk-repo.js";
import { toHex } from "./color-utils.js";
import type { CssTokens } from "./parse-css-tokens.js";

/**
 * Best-effort Tailwind config token extraction WITHOUT eval (regex only — configs
 * are untrusted code). Pulls accent/brand/primary hex + borderRadius from
 * theme.extend.colors. Imperfect by design; design-profile merges + falls back.
 */

const CONFIG_NAMES = ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs", "tailwind.config.cjs"];

/** Grab the hex value assigned to a key like `primary:` (direct or `DEFAULT:` nested). */
function hexForKey(src: string, key: string): string | undefined {
  // key: '#hex'  OR  key: { ... DEFAULT: '#hex' ... }
  const direct = new RegExp(`["']?${key}["']?\\s*:\\s*["'](#[0-9a-fA-F]{3,6})["']`).exec(src);
  if (direct) return toHex(direct[1]) ?? undefined;
  const block = new RegExp(`["']?${key}["']?\\s*:\\s*\\{([^}]*)\\}`).exec(src);
  if (block) {
    const def = /DEFAULT\s*:\s*["'](#[0-9a-fA-F]{3,6})["']/.exec(block[1]) || /["'](#[0-9a-fA-F]{3,6})["']/.exec(block[1]);
    if (def) return toHex(def[1]) ?? undefined;
  }
  return undefined;
}

export function parseTailwind(tree: RepoTree): { tokens: CssTokens; font?: string } {
  const file = tree.files.find((f) => CONFIG_NAMES.includes(f.relPath.split("/").pop()?.toLowerCase() ?? ""));
  if (!file) return { tokens: {} };
  let src = "";
  try {
    src = readFileSync(file.absPath, "utf8");
  } catch {
    return { tokens: {} };
  }

  const tokens: CssTokens = {};
  const accent = hexForKey(src, "primary") ?? hexForKey(src, "brand") ?? hexForKey(src, "accent");
  const accent2 = hexForKey(src, "secondary") ?? hexForKey(src, "accent");
  const bg = hexForKey(src, "background");
  const text = hexForKey(src, "foreground");
  if (accent) tokens.accent = accent;
  if (accent2 && accent2 !== accent) tokens.accent2 = accent2;
  if (bg) tokens.bg = bg;
  if (text) tokens.text = text;

  // borderRadius: theme.extend.borderRadius or a `borderRadius: { ... }` with a px/rem
  const rad = /borderRadius\s*:\s*\{[^}]*?(?:lg|DEFAULT|md)\s*:\s*["']([\d.]+)(rem|px)["']/.exec(src);
  if (rad) tokens.radius = rad[2] === "rem" ? parseFloat(rad[1]) * 16 : parseFloat(rad[1]);

  // fontFamily.sans: ['Inter', ...]
  const font = /fontFamily\s*:\s*\{[^}]*?sans\s*:\s*\[\s*["']([^"']+)["']/.exec(src)?.[1];

  return { tokens, font };
}
