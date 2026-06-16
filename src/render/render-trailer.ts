import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { packageRoot } from "../shared/asset-path.js";
import type { Storyboard } from "../shared/storyboard-schema.js";

export interface RenderOptions {
  /** Output .mp4 path. */
  outPath: string;
  /** Directory whose files back the media registry (becomes Remotion's publicDir). */
  mediaDir?: string;
  onProgress?: (ratio: number) => void;
}

/**
 * Render a Storyboard JSON to an .mp4. Bundles the Remotion entry once, selects the
 * Trailer composition (duration/dims come from the storyboard via calculateMetadata),
 * then renders with CPU-scaled concurrency (capped when video clips are present).
 */
export async function renderTrailer(storyboard: Storyboard, opts: RenderOptions): Promise<string> {
  // Remotion compiles this entry itself (tsx), so it must point at shipped SOURCE
  // — resolve from the package root for both dev (tsx) and prod (installed pkg).
  const entryPoint = path.join(packageRoot(), "src", "render", "index.ts");

  const serveUrl = await bundle({
    entryPoint,
    // Captured media is served from here so staticFile(src) resolves.
    publicDir: opts.mediaDir,
    // Our source uses ESM `.js` import specifiers that map to `.ts(x)` files.
    // Teach Remotion's webpack to resolve them (Node/tsx already do).
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        extensionAlias: {
          ".js": [".ts", ".tsx", ".js"],
          ".jsx": [".tsx", ".jsx"],
        },
      },
    }),
  });

  const inputProps = { storyboard };
  const composition = await selectComposition({ serveUrl, id: "Trailer", inputProps });

  const cpus = os.cpus().length;
  const hasClip = Object.values(storyboard.meta.media ?? {}).some((m) => m.kind === "clip");
  const concurrency = Math.max(1, hasClip ? Math.floor(cpus / 2) : cpus);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: opts.outPath,
    inputProps,
    concurrency,
    onProgress: opts.onProgress ? ({ progress }) => opts.onProgress!(progress) : undefined,
  });

  return opts.outPath;
}
