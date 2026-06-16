import type { RepoTree } from "./walk-repo.js";
import { readJsonSafe } from "./read-json-safe.js";
import type { UsageType } from "../shared/types.js";

/**
 * Detect HOW the product is consumed so the trailer's flow matches reality
 * (SDK ≠ CLI ≠ web app ≠ API). Deterministic signals; LLM can refine later.
 * Also returns a REAL install/run hint only when confident (else null).
 */

interface Pkg {
  name?: string;
  bin?: unknown;
  main?: string;
  module?: string;
  exports?: unknown;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function has(deps: Record<string, string>, ...names: string[]): boolean {
  return names.some((n) => n in deps);
}

export function detectUsageType(tree: RepoTree): { usageType: UsageType; install: string | null } {
  // union deps across package.json files (monorepo-aware)
  const pkgFiles = tree.files.filter((f) => f.relPath.split("/").pop() === "package.json").slice(0, 30);
  let rootPkg: Pkg | null = null;
  const deps: Record<string, string> = {};
  for (const pf of pkgFiles) {
    const pkg = readJsonSafe<Pkg>(pf.absPath);
    if (!pkg) continue;
    if (pf.relPath === "package.json") rootPkg = pkg;
    Object.assign(deps, pkg.dependencies ?? {}, pkg.devDependencies ?? {});
  }
  // Keep the FULL package name (incl. scope) — `npx @scope/pkg` / `npm i @scope/pkg` are correct.
  const name = rootPkg?.name ?? "";
  const rel = new Set(tree.files.map((f) => f.relPath.toLowerCase()));
  const hasFile = (sub: string) => [...rel].some((p) => p.includes(sub));

  // CLI: a bin entry (run via npx)
  if (rootPkg?.bin) return { usageType: "cli", install: name ? `npx ${name}` : null };

  // Mobile / desktop
  if (has(deps, "react-native", "expo", "@expo/cli")) return { usageType: "mobile", install: null };
  if (has(deps, "electron", "@tauri-apps/api", "@tauri-apps/cli")) return { usageType: "desktop", install: null };

  // Web app frameworks
  if (has(deps, "next", "nuxt", "@remix-run/react", "astro", "@sveltejs/kit", "vite", "react-scripts"))
    return { usageType: "web-app", install: null };

  // API server (no obvious frontend)
  const frontend = has(deps, "react", "vue", "svelte", "@angular/core");
  if (has(deps, "express", "fastify", "@nestjs/core", "hono", "koa", "@hapi/hapi") && !frontend)
    return { usageType: "api", install: null };

  // SDK / library: published package shape (exports/main/module) with a src/index, no app
  const libraryShape = Boolean(rootPkg?.exports || rootPkg?.module || rootPkg?.main) || hasFile("src/index.");
  if (libraryShape && !hasFile("app/") && !hasFile("pages/")) {
    return { usageType: name ? "sdk" : "library", install: name ? `npm i ${name}` : null };
  }

  // Non-JS hints
  if (rel.has("requirements.txt") || rel.has("pyproject.toml")) return { usageType: "library", install: null };
  if (rel.has("go.mod")) return { usageType: "cli", install: null };

  if (frontend) return { usageType: "web-app", install: null };
  return { usageType: "unknown", install: null };
}
