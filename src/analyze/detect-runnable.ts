import { readFileSync } from "node:fs";
import path from "node:path";
import type { RepoTree } from "./walk-repo.js";
import { readJsonSafe } from "./read-json-safe.js";
import type { RunnableInfo } from "../shared/types.js";

/**
 * Detect whether the app is runnable as a web UI, its dev command + port, a live
 * URL, and any existing screenshots. Deterministic — feeds capture (P4) + director.
 */

interface Pkg {
  scripts?: Record<string, string>;
  homepage?: string;
  bin?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// framework dep → default dev port
const FRAMEWORK_PORTS: Array<[string, number]> = [
  ["next", 3000],
  ["nuxt", 3000],
  ["@remix-run/dev", 3000],
  ["react-scripts", 3000],
  ["vite", 5173],
  ["@sveltejs/kit", 5173],
  ["astro", 4321],
];

const WEB_FRAMEWORK_DEPS = ["next", "nuxt", "react", "vue", "svelte", "@sveltejs/kit", "astro", "vite", "react-scripts", "@remix-run/react"];

const IMG_RE = /\.(png|jpe?g|gif|webp|avif)$/i;
const SCREENSHOT_DIRS = ["public", "assets", "docs", "screenshots", ".github"];

function findScreenshots(tree: RepoTree, readmeText: string): string[] {
  const out = new Set<string>();
  for (const f of tree.files) {
    if (f.kind !== "asset" || !IMG_RE.test(f.relPath)) continue;
    const top = f.relPath.split(path.sep)[0].toLowerCase();
    if (SCREENSHOT_DIRS.includes(top)) out.add(f.relPath);
  }
  // README image refs (markdown + html), local paths only
  for (const m of readmeText.matchAll(/!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']/g)) {
    const src = (m[1] ?? m[2] ?? "").trim();
    if (src && !src.startsWith("http") && IMG_RE.test(src)) out.add(src.replace(/^\.?\//, ""));
  }
  return [...out];
}

function findLiveUrl(homepage: string | undefined, readmeText: string): string | undefined {
  if (homepage && /^https?:\/\//.test(homepage)) return homepage;
  // README links near "demo"/"live", or known hosts
  const linkRe = /\[([^\]]*(?:demo|live|app|try)[^\]]*)\]\((https?:\/\/[^)]+)\)/gi;
  const m = linkRe.exec(readmeText);
  if (m) return m[2];
  const host = readmeText.match(/https?:\/\/[^\s)]+\.(?:vercel\.app|netlify\.app|pages\.dev|github\.io)[^\s)]*/i);
  return host?.[0];
}

export function detectRunnable(tree: RepoTree): RunnableInfo {
  const pkgFile = tree.files.find((f) => f.relPath === "package.json");
  const readmeFile = tree.files.find((f) => f.kind === "readme");
  let readmeText = "";
  try {
    if (readmeFile) readmeText = readFileSync(readmeFile.absPath, "utf8");
  } catch {
    /* ignore */
  }

  const pkg = pkgFile ? readJsonSafe<Pkg>(pkgFile.absPath) : null;
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const hasWebFramework = WEB_FRAMEWORK_DEPS.some((d) => d in deps);

  let devCommand: string | undefined;
  const scripts = pkg?.scripts ?? {};
  if (scripts.dev) devCommand = "npm run dev";
  else if (scripts.start) devCommand = "npm run start";

  let port: number | undefined;
  for (const [dep, p] of FRAMEWORK_PORTS) if (dep in deps) { port = p; break; }

  const screenshots = findScreenshots(tree, readmeText);
  const liveUrl = findLiveUrl(pkg?.homepage, readmeText);

  // hasUi: a web framework, OR a live URL / screenshots exist (something visual to show).
  const hasUi = hasWebFramework || Boolean(liveUrl) || screenshots.length > 0;

  return { hasUi, devCommand, port, liveUrl, screenshots };
}
