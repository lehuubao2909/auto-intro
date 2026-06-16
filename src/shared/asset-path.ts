import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve bundled assets (the vendored skill + the UI html) reliably in BOTH
 * dev (tsx, running from src/) and prod (bundled dist/, installed via npm).
 * Strategy: find the package root (nearest dir with package.json) by walking up
 * from this module, then resolve known asset locations with dev/prod fallbacks.
 */

let cachedRoot: string | null = null;

export function packageRoot(): string {
  if (cachedRoot) return cachedRoot;
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "package.json"))) {
      cachedRoot = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  cachedRoot = process.cwd();
  return cachedRoot;
}

function firstExisting(candidates: string[], fallback: string): string {
  return candidates.find((c) => existsSync(c)) ?? fallback;
}

/** The vendored code-trailer example storyboard (few-shot for the Director). */
export function skillExamplePath(): string {
  return path.join(packageRoot(), "skill", "code-trailer", "assets", "example-storyboard.json");
}

/** The control-panel UI html — dist/ui in prod, src/ui in dev. */
export function uiIndexPath(): string {
  const root = packageRoot();
  return firstExisting(
    [path.join(root, "dist", "ui", "index.html"), path.join(root, "src", "ui", "index.html")],
    path.join(root, "src", "ui", "index.html"),
  );
}
