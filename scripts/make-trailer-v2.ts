/**
 * v2 pipeline (UI recreation): analyze → inspect design → component inventory →
 * direct → render. No capture. Run: npx tsx scripts/make-trailer-v2.ts [repoPath]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyzeRepo } from "../src/analyze/repo-facts.js";
import { inspectDesign } from "../src/inspect-ui/design-profile.js";
import { buildComponentInventory } from "../src/inspect-ui/component-inventory.js";
import { buildBrief } from "../src/brief/build-brief.js";
import { direct } from "../src/direct/director.js";
import { renderTrailer } from "../src/render/render-trailer.js";

const target = process.argv[2] ?? ".";

console.log("1/5 analyzing repo ...");
const facts = await analyzeRepo(target);
console.log(`    ${facts.identity} (usageType=${facts.usageType})`);

console.log("2/5 extracting design profile ...");
const design = inspectDesign(target);
console.log(`    mode=${design.mode} accent=${design.palette.accent} font=${design.font}`);

console.log("3/5 building component inventory + brief ...");
const inventory = await buildComponentInventory(target, facts);
const brief = await buildBrief(facts);
console.log(`    surfaces: ${inventory.items.map((i) => `${i.primitive}:${i.label}`).join(", ")}`);
console.log(`    brief: ${brief.oneLiner} | cta-link: ${brief.links.url ?? brief.links.repo ?? "(none)"}`);

console.log("4/5 directing storyboard (Gemini) ...");
const { storyboard, repaired, validation } = await direct(brief, design, inventory);
console.log(`    scenes: ${storyboard.scenes.length} | repairs: ${repaired} | warnings: ${validation.warnings.length}`);
console.log(`    arc: ${storyboard.scenes.map((s) => s.type).join(" → ")}`);

mkdirSync("out", { recursive: true });
writeFileSync("out/storyboard-v2.json", JSON.stringify(storyboard, null, 2));
mkdirSync("/tmp/ad-empty", { recursive: true });
const outPath = path.resolve("out/trailer-v2.mp4");
console.log("5/5 rendering ...");
await renderTrailer(storyboard, { outPath, mediaDir: "/tmp/ad-empty", onProgress: (r) => process.stdout.write(`\r    ${(r * 100).toFixed(0)}%   `) });
console.log(`\n✓ ${outPath}`);
