/**
 * Render the hand-written fixture storyboard to out/fixture.mp4.
 * Validates first (must pass), then renders. Run: npx tsx scripts/render-fixture.ts
 */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { validateStoryboard } from "../src/shared/validate-storyboard.js";
import { renderTrailer } from "../src/render/render-trailer.js";

const root = path.resolve(".");
const raw = JSON.parse(readFileSync(path.join(root, "fixtures/hand-storyboard.json"), "utf8"));

const result = validateStoryboard(raw);
console.log("validate ok:", result.ok);
if (result.warnings.length) console.log("warnings:", result.warnings);
if (!result.ok) {
  console.error("errors:", result.errors);
  process.exit(1);
}

mkdirSync(path.join(root, "out"), { recursive: true });
const outPath = path.join(root, "out/fixture.mp4");

console.log("rendering → out/fixture.mp4 ...");
await renderTrailer(result.storyboard!, {
  outPath,
  onProgress: (r) => process.stdout.write(`\r  ${(r * 100).toFixed(0)}%   `),
});
console.log(`\n✓ done: ${outPath}`);
