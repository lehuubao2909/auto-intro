import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { isSecretFile } from "./scrub-secrets.js";

/**
 * Gitignore-aware repo walk. KISS: hardcode the common heavy/ignored dirs +
 * read top-level .gitignore for simple dir/prefix patterns (NOT full gitignore spec).
 * Classifies files so the triage step can pick the important ones cheaply.
 */

export type FileKind = "manifest" | "readme" | "source" | "asset" | "other";

export interface RepoFile {
  relPath: string;
  absPath: string;
  kind: FileKind;
  size: number;
}

export interface RepoTree {
  root: string;
  files: RepoFile[];
}

const ALWAYS_SKIP = new Set([
  "node_modules", ".git", "dist", "build", ".next", "out", "coverage",
  "vendor", ".turbo", ".cache", ".vercel", ".svelte-kit", "target", "__pycache__",
  ".venv", "venv", ".idea", ".vscode", ".auto-intro",
]);

const MANIFEST_NAMES = new Set([
  "package.json", "tsconfig.json", "requirements.txt", "pyproject.toml",
  "go.mod", "cargo.toml", "gemfile", "pom.xml", "build.gradle", "composer.json",
  "deno.json", "bun.lockb", "next.config.js", "next.config.mjs", "next.config.ts",
  "vite.config.js", "vite.config.ts", "tailwind.config.js", "tailwind.config.ts",
  "astro.config.mjs", "nuxt.config.ts", "svelte.config.js", "remix.config.js",
]);

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", ".go", ".rs", ".vue", ".svelte", ".rb", ".java", ".kt"]);
const ASSET_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);

function readGitignoreDirs(root: string): Set<string> {
  const ignore = new Set<string>();
  const gi = path.join(root, ".gitignore");
  if (!existsSync(gi)) return ignore;
  for (const raw of readFileSync(gi, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    // Only honor simple directory entries (e.g. "dist/", "build", "/tmp").
    const name = line.replace(/^\//, "").replace(/\/$/, "");
    if (name && !name.includes("*") && !name.includes("/")) ignore.add(name);
  }
  return ignore;
}

function classify(name: string, ext: string): FileKind {
  const lower = name.toLowerCase();
  if (lower.startsWith("readme")) return "readme";
  if (MANIFEST_NAMES.has(lower)) return "manifest";
  if (SOURCE_EXT.has(ext)) return "source";
  if (ASSET_EXT.has(ext)) return "asset";
  return "other";
}

export function walkRepo(root: string, maxFiles = 4000): RepoTree {
  const extraIgnore = readGitignoreDirs(root);
  const files: RepoFile[] = [];

  const visit = (dir: string, depth: number): void => {
    if (files.length >= maxFiles || depth > 8) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith(".") && entry !== ".gitignore" && entry !== ".env.example") {
        // skip dotfiles/dirs except a couple useful ones
        if (ALWAYS_SKIP.has(entry) || entry === ".git") continue;
      }
      if (ALWAYS_SKIP.has(entry) || extraIgnore.has(entry)) continue;
      const abs = path.join(dir, entry);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        visit(abs, depth + 1);
      } else if (st.isFile()) {
        const relPath = path.relative(root, abs);
        if (isSecretFile(relPath)) continue; // never index secret files
        const ext = path.extname(entry).toLowerCase();
        files.push({ relPath, absPath: abs, kind: classify(entry, ext), size: st.size });
      }
      if (files.length >= maxFiles) return;
    }
  };

  visit(root, 0);
  return { root, files };
}
