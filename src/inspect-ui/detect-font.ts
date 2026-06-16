import { readFileSync } from "node:fs";
import type { RepoTree } from "../analyze/walk-repo.js";

/**
 * Detect the project's primary font from next/font, Google Fonts links, or
 * @font-face. Returns a font family name (Google-font-loadable when possible),
 * defaulting to "Inter". tailwind fontFamily is handled in parse-tailwind.
 */

// scan a handful of likely files (layout/app/_document/html/css)
const PREFER = ["layout.tsx", "layout.ts", "_app.tsx", "_document.tsx", "index.html", "app.tsx", "main.tsx"];

export function detectFont(tree: RepoTree, tailwindFont?: string): string {
  if (tailwindFont && tailwindFont.toLowerCase() !== "sans-serif") return tailwindFont;

  const candidates = tree.files
    .filter((f) => PREFER.some((p) => f.relPath.toLowerCase().endsWith(p)) || f.relPath.toLowerCase().endsWith(".css"))
    .slice(0, 8);

  for (const f of candidates) {
    let src = "";
    try {
      src = readFileSync(f.absPath, "utf8");
    } catch {
      continue;
    }
    // next/font/google: import { Inter } from "next/font/google"
    let m = /next\/font\/google["'];?\s*[\s\S]{0,200}?\b([A-Z][A-Za-z_]+)\s*\(/.exec(src) || /import\s*\{\s*([A-Z][A-Za-z_]+)\s*\}\s*from\s*["']next\/font\/google/.exec(src);
    if (m) return m[1].replace(/_/g, " ");
    // Google Fonts <link href="...family=Roboto+Mono...">
    m = /fonts\.googleapis\.com\/css2?\?family=([A-Za-z0-9+]+)/.exec(src);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, " ")).split(":")[0];
    // @font-face { font-family: "Foo" }
    m = /@font-face\s*\{[^}]*font-family\s*:\s*["']([^"']+)["']/.exec(src);
    if (m) return m[1];
  }
  return "Inter";
}
