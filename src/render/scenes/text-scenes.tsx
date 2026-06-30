import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme.js";
import { TYPE } from "../theme.js";
import { SceneFrame } from "../components/scene-frame.js";
import { AnimatedLine, AnimatedWords, MaskedReveal } from "../components/animated-text.js";
import { KenBurnsImg } from "../components/ken-burns-img.js";
import { pop } from "../lib/timing.js";
import type { Scene } from "../../shared/storyboard-schema.js";

/** Narrow the Scene union by its discriminant. */
type S<T extends Scene["type"]> = Extract<Scene, { type: T }>;

export const Title: React.FC<{ scene: S<"title">; theme: Theme; mediaSrc?: string }> = ({
  scene,
  theme,
  mediaSrc,
}) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn}>
    {scene.media ? (
      <div style={{ position: "absolute", inset: "8%", opacity: 0.22 }}>
        <KenBurnsImg src={mediaSrc} durationInFrames={scene.durationInFrames} theme={theme} />
      </div>
    ) : null}
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", zIndex: 1 }}>
      <AnimatedWords text={scene.text} size={TYPE.hero} color={theme.text} weight={800} />
      {scene.sub ? (
        <AnimatedLine delay={10} size={TYPE.label} color={theme.accent} weight={600}>
          {scene.sub}
        </AnimatedLine>
      ) : null}
    </div>
  </SceneFrame>
);

export const Problem: React.FC<{ scene: S<"problem">; theme: Theme }> = ({ scene, theme }) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn}>
    <MaskedReveal
      lines={scene.lines}
      colors={scene.lines.map((_, i) => (i === 0 ? theme.text : theme.textDim))}
      color={theme.text}
      size={TYPE.h1}
      weight={700}
      step={10}
      gap={28}
    />
  </SceneFrame>
);

export const Stat: React.FC<{ scene: S<"stat">; theme: Theme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isNum = typeof scene.value === "number";
  const s = pop(frame, fps, 4);
  const display = isNum ? Math.round((scene.value as number) * Math.min(1, s)).toString() : String(scene.value);
  return (
    <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", zIndex: 1 }}>
        <div style={{ fontSize: 180, fontWeight: 900, color: theme.accent, transform: `scale(${0.8 + s * 0.2})` }}>
          {display}
        </div>
        <AnimatedLine delay={6} size={TYPE.h2} color={theme.text}>
          {scene.label}
        </AnimatedLine>
        {scene.sub ? (
          <AnimatedLine delay={12} size={TYPE.body} color={theme.textDim} weight={500}>
            {scene.sub}
          </AnimatedLine>
        ) : null}
      </div>
    </SceneFrame>
  );
};

export const Outro: React.FC<{ scene: S<"outro">; theme: Theme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaPop = pop(frame, fps, 14);
  return (
    <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
        <AnimatedWords text={scene.text} size={TYPE.hero} color={theme.text} weight={800} />
        {scene.sub ? (
          <AnimatedLine delay={10} size={TYPE.body} color={theme.textDim} weight={500}>
            {scene.sub}
          </AnimatedLine>
        ) : null}
        <div
          style={{
            marginTop: 18,
            padding: "20px 44px",
            borderRadius: 999,
            background: theme.accent,
            color: theme.bg,
            fontSize: TYPE.label,
            fontWeight: 700,
            transform: `scale(${ctaPop})`,
            opacity: ctaPop,
          }}
        >
          {scene.cta}
        </div>
      </div>
    </SceneFrame>
  );
};
