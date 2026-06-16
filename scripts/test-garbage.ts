/**
 * Crash-safety test: feed MALFORMED primitive props through the full validate+render
 * path. Must produce an mp4 (degraded), never abort. Run: npx tsx scripts/test-garbage.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { validateStoryboard } from "../src/shared/validate-storyboard.js";
import { renderTrailer } from "../src/render/render-trailer.js";

const sb = {
  meta: {
    title: "Garbage", fps: 30, width: 1920, height: 1080, theme: "cinematic-dark",
    accent: "#6ea8fe", accent2: "#f59e0b", totalSeconds: 46,
    design: { mode: "dark", glass: true, radius: 16, font: "Inter",
      palette: { bg: "#0a0f1e", surface: "#161f38", text: "#eef2fb", dim: "#93a0b8", accent: "#6ea8fe", accent2: "#c084fc" } },
  },
  scenes: [
    { type: "title", durationInFrames: 80, text: "Garbage props test" },
    { type: "problem", durationInFrames: 80, lines: ["Bad props should not crash."] },
    { type: "ui-bento", durationInFrames: 200, cols: 3, caption: "malformed tiles", tiles: [
      { primitive: "bar-chart", props: { values: "not-an-array" } },
      { primitive: "code-snippet", props: { code: 42, lang: 7 } },
      { primitive: "api-exchange", props: { method: null } },
      { primitive: "donut-chart", props: { percent: "x" } },
      { primitive: "table", props: {} },
      { primitive: "pricing-tiers", props: { tiers: "nope" } },
    ] },
    { type: "ui-sequence", durationInFrames: 180, caption: "bad steps", steps: [
      { primitive: "terminal", props: {} },
      { primitive: "chat-bubble", props: { bullets: "x" } },
    ] },
    { type: "techstack", durationInFrames: 90, items: [{ name: "TypeScript" }] },
    { type: "stat", durationInFrames: 80, value: "100%", label: "no crash" },
    { type: "outro", durationInFrames: 90, text: "Survived", cta: "ok" },
  ],
};

const v = validateStoryboard(sb);
console.log("valid:", v.ok, "errors:", v.errors);
if (!v.ok) process.exit(1);
mkdirSync("out", { recursive: true });
mkdirSync("/tmp/ad-empty", { recursive: true });
await renderTrailer(v.storyboard!, { outPath: path.resolve("out/garbage.mp4"), mediaDir: "/tmp/ad-empty", onProgress: (r) => process.stdout.write(`\r  ${(r * 100).toFixed(0)}%   `) });
console.log("\n✓ rendered despite garbage props — no abort");
