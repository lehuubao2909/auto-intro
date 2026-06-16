import { defineConfig } from "tsup";

// Bundle the Node side (cli/server/analyze/capture/direct/render entry).
// The Remotion composition (src/render/Root.tsx) is bundled separately by
// Remotion's own bundler at render time, and the UI by Vite — both excluded here.
export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  // Heavy/native deps stay external (installed in the published package).
  external: ["@remotion/renderer", "@remotion/bundler", "fastify", "@fastify/static", "open", "get-port"],
});
