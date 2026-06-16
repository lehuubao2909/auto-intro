import { readFileSync } from "node:fs";
import { z } from "zod";
import type { RepoTree, RepoFile } from "./walk-repo.js";
import { scrubSecrets } from "./scrub-secrets.js";
import { readJsonSafe } from "./read-json-safe.js";
import { generateJson } from "../shared/gemini-client.js";
import { config } from "../shared/config.js";

/**
 * Triage: pick the few most informative files (README + manifest + entry sources),
 * scrub secrets, and ask Gemini (triage model) for the narrative facts. Falls back
 * to a deterministic summary (package.json + README) when no API key is present.
 */

export const RepoSummary = z.object({
  identity: z.string(),
  problem: z.string(),
  whatItDoes: z.string(),
  features: z.array(z.string()).max(6).default([]),
  howItWorks: z.string().optional(),
});
export type RepoSummary = z.infer<typeof RepoSummary>;

const ENTRY_HINTS = ["src/index", "src/main", "src/app", "index", "main", "app", "src/cli"];
const PER_FILE_CHARS = 4000;

function pickTriageFiles(tree: RepoTree): RepoFile[] {
  const picked: RepoFile[] = [];
  const readme = tree.files.find((f) => f.kind === "readme");
  if (readme) picked.push(readme);
  const pkg = tree.files.find((f) => f.relPath === "package.json");
  if (pkg) picked.push(pkg);

  // entry-ish source files
  const sources = tree.files.filter((f) => f.kind === "source");
  for (const hint of ENTRY_HINTS) {
    const hit = sources.find((f) => f.relPath.replace(/\.[^.]+$/, "").endsWith(hint));
    if (hit && !picked.includes(hit)) picked.push(hit);
    if (picked.length >= config.analyze.maxFullReadFiles) break;
  }
  // top a few remaining sources by shallowest path
  for (const f of sources.sort((a, b) => a.relPath.split("/").length - b.relPath.split("/").length)) {
    if (picked.length >= config.analyze.maxFullReadFiles) break;
    if (!picked.includes(f)) picked.push(f);
  }
  return picked;
}

function buildBundle(files: RepoFile[]): string {
  const parts: string[] = [];
  for (const f of files) {
    try {
      const raw = readFileSync(f.absPath, "utf8").slice(0, PER_FILE_CHARS);
      parts.push(`--- FILE: ${f.relPath} ---\n${scrubSecrets(raw)}`);
    } catch {
      /* skip unreadable */
    }
  }
  return parts.join("\n\n");
}

/** Deterministic fallback when Gemini is unavailable. */
function fallbackSummary(tree: RepoTree): RepoSummary {
  const pkgFile = tree.files.find((f) => f.relPath === "package.json");
  const pkg = pkgFile ? readJsonSafe<{ name?: string; description?: string }>(pkgFile.absPath) : null;
  const readmeFile = tree.files.find((f) => f.kind === "readme");
  let firstLine = "";
  try {
    if (readmeFile) {
      const txt = readFileSync(readmeFile.absPath, "utf8");
      firstLine = (txt.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "").trim();
    }
  } catch {
    /* ignore */
  }
  const name = pkg?.name ?? "this project";
  const desc = pkg?.description || firstLine || `${name} — a software project.`;
  return {
    identity: desc,
    problem: "",
    whatItDoes: desc,
    features: [],
  };
}

export async function triageAndSummarize(tree: RepoTree): Promise<RepoSummary> {
  if (!config.gemini.apiKey) return fallbackSummary(tree);

  const bundle = buildBundle(pickTriageFiles(tree));
  const prompt = [
    "You are analyzing a code repository to make a short demo trailer.",
    "From the files below, extract the project's facts. Be concrete and specific, not generic.",
    "- identity: one line — what the project IS (name + what it is).",
    "- problem: the problem it solves (1 sentence).",
    "- whatItDoes: its core behavior (1-2 sentences).",
    "- features: 3-5 key features, each 2-5 words.",
    "- howItWorks: one brief mechanism sentence (optional).",
    "",
    bundle,
  ].join("\n");

  try {
    return await generateJson(prompt, RepoSummary, { model: config.gemini.triageModel, temperature: 0.2 });
  } catch {
    return fallbackSummary(tree);
  }
}
