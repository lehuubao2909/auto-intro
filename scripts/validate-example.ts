/**
 * Dev check: run the storyboard validator against the vendored skill example
 * (should pass with only warnings) and a deliberately broken board (should fail).
 * Run: npx tsx scripts/validate-example.ts
 */
import { readFileSync } from "node:fs";
import { validateStoryboard } from "../src/shared/validate-storyboard.js";

const example = JSON.parse(
  readFileSync(new URL("../skill/code-trailer/assets/example-storyboard.json", import.meta.url), "utf8"),
);

console.log("=== vendored example-storyboard.json ===");
const a = validateStoryboard(example);
console.log("ok:", a.ok);
console.log("errors:", a.errors);
console.log("warnings:", a.warnings);

console.log("\n=== deliberately broken (no techstack, 3 text in a row, short) ===");
const bad = {
  meta: { title: "X", totalSeconds: 30 },
  scenes: [
    { type: "title", durationInFrames: 10, text: "A very long title that needs much more time to read" },
    { type: "problem", durationInFrames: 30, lines: ["one"] },
    { type: "stat", durationInFrames: 30, value: 5, label: "things" },
    { type: "ui", durationInFrames: 60, media: "nope" },
  ],
};
const b = validateStoryboard(bad);
console.log("ok:", b.ok);
console.log("errors:", b.errors);
