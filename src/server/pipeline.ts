import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { analyzeRepo } from "../analyze/repo-facts.js";
import { inspectDesign } from "../inspect-ui/design-profile.js";
import { buildComponentInventory } from "../inspect-ui/component-inventory.js";
import { buildBrief } from "../brief/build-brief.js";
import { renderBriefMd } from "../brief/render-brief-md.js";
import { direct } from "../direct/director.js";
import { renderTrailer } from "../render/render-trailer.js";
import { config } from "../shared/config.js";
import type { ProgressFn, DesignProfile, ComponentInventory, ProjectBrief } from "../shared/types.js";
import type { Storyboard } from "../shared/storyboard-schema.js";

/**
 * v3 pipeline, split into two stages around a human APPROVAL gate:
 *   A. runAnalysis: analyze → inspect design → component inventory → brief (STOP for review)
 *   B. runRender:   direct(approved brief) → render
 * `runPipeline` chains both (used by `--yes` / one-shot). Artifacts in <repo>/.auto-intro.
 */

export interface AnalysisResult {
  design: DesignProfile;
  inventory: ComponentInventory;
  brief: ProjectBrief;
}
export interface PipelineResult {
  storyboard: Storyboard;
  videoPath: string;
}

function artifactDir(repoRoot: string): string {
  return path.join(path.resolve(repoRoot), config.workDir);
}

/** Stage A — understand the project + produce the brief for approval. No render. */
export async function runAnalysis(repoRoot: string, onProgress: ProgressFn): Promise<AnalysisResult> {
  const root = path.resolve(repoRoot);
  const outDir = artifactDir(root);
  mkdirSync(outDir, { recursive: true });

  onProgress({ stage: "analyze", status: "start", message: "Analyzing repository…" });
  const facts = await analyzeRepo(root);
  onProgress({ stage: "analyze", status: "ok", message: facts.identity });

  onProgress({ stage: "inspect", status: "start", message: "Reading the project's design…" });
  const design = inspectDesign(root);
  const inventory = await buildComponentInventory(root, facts);
  onProgress({ stage: "inspect", status: "ok", message: `${design.mode} theme · ${inventory.items.length} UI surfaces` });

  onProgress({ stage: "brief", status: "start", message: "Writing project brief…" });
  const brief = await buildBrief(facts);
  writeFileSync(path.join(outDir, "brief.json"), JSON.stringify(brief, null, 2));
  writeFileSync(path.join(outDir, "brief.md"), renderBriefMd(brief));
  onProgress({ stage: "brief", status: "ok", message: `Brief ready (${brief.usageType}) — review & approve` });

  return { design, inventory, brief };
}

/** Stage B — render from the APPROVED (possibly edited) brief. */
export async function runRender(
  repoRoot: string,
  brief: ProjectBrief,
  design: DesignProfile,
  inventory: ComponentInventory,
  onProgress: ProgressFn,
): Promise<PipelineResult> {
  const root = path.resolve(repoRoot);
  const outDir = artifactDir(root);

  onProgress({ stage: "direct", status: "start", message: "Directing storyboard (Gemini)…" });
  const { storyboard, repaired } = await direct(brief, design, inventory);
  writeFileSync(path.join(outDir, "storyboard.json"), JSON.stringify(storyboard, null, 2));
  onProgress({
    stage: "direct",
    status: "ok",
    message: `${storyboard.scenes.length} scenes${repaired ? ` (${repaired} repair${repaired > 1 ? "s" : ""})` : ""}`,
  });

  const videoPath = path.join(outDir, "trailer.mp4");
  onProgress({ stage: "render", status: "start", message: "Rendering video…" });
  await renderTrailer(storyboard, {
    outPath: videoPath,
    mediaDir: outDir,
    onProgress: (r) => onProgress({ stage: "render", status: "ok", message: `Rendering ${Math.round(r * 100)}%` }),
  });
  onProgress({ stage: "done", status: "ok", message: "Trailer ready", artifact: videoPath });
  return { storyboard, videoPath };
}

/** One-shot (no approval gate) — used by `--yes`. */
export async function runPipeline(repoRoot: string, onProgress: ProgressFn): Promise<PipelineResult> {
  const { design, inventory, brief } = await runAnalysis(repoRoot, onProgress);
  return runRender(repoRoot, brief, design, inventory, onProgress);
}

/** Re-render from an (already validated) storyboard without re-analyzing. */
export async function rerender(repoRoot: string, storyboard: Storyboard, onProgress: ProgressFn): Promise<string> {
  const root = path.resolve(repoRoot);
  const videoPath = path.join(artifactDir(root), "trailer.mp4");
  writeFileSync(path.join(artifactDir(root), "storyboard.json"), JSON.stringify(storyboard, null, 2));
  onProgress({ stage: "render", status: "start", message: "Re-rendering video…" });
  await renderTrailer(storyboard, {
    outPath: videoPath,
    mediaDir: artifactDir(root),
    onProgress: (r) => onProgress({ stage: "render", status: "ok", message: `Rendering ${Math.round(r * 100)}%` }),
  });
  onProgress({ stage: "done", status: "ok", message: "Trailer ready", artifact: videoPath });
  return videoPath;
}
