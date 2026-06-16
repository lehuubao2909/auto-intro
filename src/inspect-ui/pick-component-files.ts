import { readFileSync, statSync } from "node:fs";
import type { RepoTree, RepoFile } from "../analyze/walk-repo.js";

/**
 * Heuristically rank the repo's most "UI-defining" source files so the classifier
 * only reads a handful (token budget). Prefers files under components/ui/app/pages,
 * names that hint at notable surfaces, and JSX/markup density.
 */

const UI_DIRS = ["components/", "ui/", "app/", "pages/", "src/components", "views/", "screens/", "widgets/"];
const NAME_HINTS = ["dashboard", "chat", "pricing", "board", "kanban", "table", "hero", "nav", "sidebar", "card", "chart", "stat", "feed", "settings", "profile", "editor", "form", "calendar", "analytics"];
const UI_EXT = /\.(tsx|jsx|vue|svelte)$/i;

function score(f: RepoFile): number {
  const p = f.relPath.toLowerCase();
  let s = 0;
  if (UI_DIRS.some((d) => p.includes(d))) s += 6;
  if (NAME_HINTS.some((h) => p.includes(h))) s += 8;
  if (UI_EXT.test(p)) s += 3;
  // shallower paths slightly preferred
  s -= p.split("/").length * 0.3;
  return s;
}

export function pickComponentFiles(tree: RepoTree, max = 12): RepoFile[] {
  const candidates = tree.files
    .filter((f) => UI_EXT.test(f.relPath) && f.size < 60_000)
    .map((f) => ({ f, s: score(f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((x) => x.f);
  return candidates;
}

/** A compact, scrubbed digest of a file: path + a JSX-heavy slice. */
export function fileDigest(f: RepoFile, maxChars = 1500): string {
  try {
    const raw = readFileSync(f.absPath, "utf8");
    statSync(f.absPath);
    return `// ${f.relPath}\n${raw.slice(0, maxChars)}`;
  } catch {
    return `// ${f.relPath} (unreadable)`;
  }
}
