#!/usr/bin/env node
/**
 * AutoIntro CLI: `npx auto-intro [repoPath]`.
 * Resolves the target repo, starts the local server on a free port, opens the browser.
 */
import path from "node:path";
import { existsSync } from "node:fs";
import getPort from "get-port";
import open from "open";
import { startServer } from "../server/server.js";
import { runPipeline } from "../server/pipeline.js";
import { config } from "../shared/config.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const autoYes = args.includes("--yes") || args.includes("-y");
  const repoArg = args.find((a) => !a.startsWith("-")) ?? process.cwd();
  const repoRoot = path.resolve(repoArg);
  if (!existsSync(repoRoot)) {
    console.error(`Repo path does not exist: ${repoRoot}`);
    process.exit(1);
  }

  if (!config.gemini.apiKey) {
    console.warn("⚠  GEMINI_API_KEY not set — analysis/director will use the offline fallback.");
    console.warn("   Set it (or a .env file) for best results: https://aistudio.google.com/apikey\n");
  }

  // Headless one-shot: analyze → brief → render with no approval gate.
  if (autoYes) {
    console.log(`AutoIntro (--yes): ${repoRoot}\n`);
    const { videoPath } = await runPipeline(repoRoot, (e) => console.log(`  [${e.stage}/${e.status}] ${e.message}`));
    console.log(`\n✓ Trailer: ${videoPath}`);
    return;
  }

  const port = await getPort({ port: [config.server.port || 0, 4747, 4748, 4749] });
  const url = await startServer(repoRoot, port);

  console.log(`\n  AutoIntro running:  ${url}`);
  console.log(`  Target repo:       ${repoRoot}`);
  console.log(`  Director / triage: ${config.gemini.directorModel} / ${config.gemini.triageModel}`);
  console.log(`  Flow: Analyze → review brief → approve → render  (add --yes to skip the gate)\n`);
  console.log("  (Ctrl+C to stop)\n");

  await open(url).catch(() => console.log(`  Open ${url} in your browser.`));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
