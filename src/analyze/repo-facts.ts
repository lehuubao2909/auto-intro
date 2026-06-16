import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { walkRepo } from "./walk-repo.js";
import { detectTechStack } from "./detect-tech-stack.js";
import { detectRunnable } from "./detect-runnable.js";
import { detectUsageType } from "./detect-usage-type.js";
import { triageAndSummarize } from "./triage-and-summarize.js";
import { readJsonSafe } from "./read-json-safe.js";
import { RepoFacts, type RepoFacts as RepoFactsT } from "../shared/types.js";
import { config } from "../shared/config.js";

/**
 * Orchestrate repo analysis → RepoFacts. Combines deterministic detection
 * (tech stack, runnable, screenshots) with the Gemini narrative summary, then
 * persists to <repo>/.auto-intro/repo-facts.json.
 */
export async function analyzeRepo(repoRoot: string): Promise<RepoFactsT> {
  const root = path.resolve(repoRoot);
  const tree = walkRepo(root);

  const techStack = detectTechStack(tree);
  const runnable = detectRunnable(tree);
  const { usageType, install } = detectUsageType(tree);
  const summary = await triageAndSummarize(tree);

  const pkgFile = tree.files.find((f) => f.relPath === "package.json");
  const pkg = pkgFile ? readJsonSafe<{ name?: string; repository?: { url?: string } | string }>(pkgFile.absPath) : null;
  const name = pkg?.name ?? path.basename(root);
  const repoUrl = (typeof pkg?.repository === "string" ? pkg.repository : pkg?.repository?.url)
    ?.replace(/^git\+/, "")
    .replace(/\.git$/, "");

  // Links: only REAL ones (never invented downstream).
  const links: { url?: string; repo?: string } = {};
  if (runnable.liveUrl) links.url = runnable.liveUrl;
  if (repoUrl) links.repo = repoUrl;

  const facts: RepoFactsT = RepoFacts.parse({
    name,
    identity: summary.identity || name,
    problem: summary.problem || "",
    whatItDoes: summary.whatItDoes || summary.identity || "",
    features: summary.features ?? [],
    techStack,
    howItWorks: summary.howItWorks,
    usageType,
    install,
    links,
    runnable,
    repoUrl,
  });

  // persist
  const outDir = path.join(root, config.workDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "repo-facts.json"), JSON.stringify(facts, null, 2));

  return facts;
}
