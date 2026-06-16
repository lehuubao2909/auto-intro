import React from "react";
import type { Theme } from "../theme.js";
import { TYPE } from "../theme.js";
import { SceneFrame } from "../components/scene-frame.js";
import { AnimatedLine } from "../components/animated-text.js";
import { CodeBlock } from "../components/code-block.js";
import type { Scene } from "../../shared/storyboard-schema.js";

type S<T extends Scene["type"]> = Extract<Scene, { type: T }>;

/** Optional code scene — only when the code IS the selling point (≤14 lines). */
export const Code: React.FC<{ scene: S<"code">; theme: Theme }> = ({ scene, theme }) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn}>
    <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", width: "100%" }}>
      {scene.caption ? (
        <AnimatedLine size={TYPE.h2} color={theme.textDim} weight={600}>
          {scene.caption}
        </AnimatedLine>
      ) : null}
      <CodeBlock code={scene.code} lang={scene.lang} theme={theme} highlight={scene.highlight} />
    </div>
  </SceneFrame>
);
