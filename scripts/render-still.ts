/** Render a single still of a composition. Run: npx tsx scripts/render-still.ts <compId> <frame> <out.png> */
import path from "node:path";
import { mkdirSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import { packageRoot } from "../src/shared/asset-path.js";

const id = process.argv[2] ?? "Showcase";
const frame = Number(process.argv[3] ?? 60);
const out = path.resolve(process.argv[4] ?? `out/${id}-${frame}.png`);

const serveUrl = await bundle({
  entryPoint: path.join(packageRoot(), "src", "render", "index.ts"),
  webpackOverride: (c) => ({
    ...c,
    resolve: { ...c.resolve, extensionAlias: { ".js": [".ts", ".tsx", ".js"], ".jsx": [".tsx", ".jsx"] } },
  }),
});
const composition = await selectComposition({ serveUrl, id });
mkdirSync(path.dirname(out), { recursive: true });
await renderStill({ composition, serveUrl, output: out, frame, overwrite: true });
console.log(`✓ ${out}`);
