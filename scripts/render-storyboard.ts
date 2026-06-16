/**
 * Render a saved storyboard.json to mp4 (no analyze/capture/direct).
 * Run: npx tsx scripts/render-storyboard.ts <storyboard.json> <mediaDir> [out.mp4]
 */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { validateStoryboard } from "../src/shared/validate-storyboard.js";
import { renderTrailer } from "../src/render/render-trailer.js";

const sbPath = process.argv[2];
const mediaDir = process.argv[3];
const outPath = path.resolve(process.argv[4] ?? "out/trailer.mp4");
if (!sbPath || !mediaDir) {
  console.error("usage: render-storyboard.ts <storyboard.json> <mediaDir> [out.mp4]");
  process.exit(1);
}

const v = validateStoryboard(JSON.parse(readFileSync(sbPath, "utf8")));
if (!v.ok) {
  console.error("invalid storyboard:", v.errors);
  process.exit(1);
}
mkdirSync(path.dirname(outPath), { recursive: true });
await renderTrailer(v.storyboard!, {
  outPath,
  mediaDir,
  onProgress: (r) => process.stdout.write(`\r  ${(r * 100).toFixed(0)}%   `),
});
console.log(`\n✓ ${outPath}`);
