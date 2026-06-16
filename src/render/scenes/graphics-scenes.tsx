import React from "react";
import { useCurrentFrame, useVideoConfig, Sequence } from "remotion";
import type { Theme } from "../theme.js";
import { TYPE, seriesColor } from "../theme.js";
import { SceneFrame } from "../components/scene-frame.js";
import { GlowPulse } from "../lib/fx.js";
import { AnimatedLine } from "../components/animated-text.js";
import { FlowDiagram } from "../components/flow-diagram.js";
import { KenBurnsImg } from "../components/ken-burns-img.js";
import { Icon } from "../icons/icon.js";
import { TechIcon, hasTechIcon } from "../icons/tech-icon.js";
import { pop } from "../lib/timing.js";
import { parseMermaid, type Flow } from "../lib/parse-mermaid.js";
import type { Scene } from "../../shared/storyboard-schema.js";

type S<T extends Scene["type"]> = Extract<Scene, { type: T }>;

/** Feature montage — rapid cards (icon + 2–4 words) each shown for perItemFrames. */
export const FeatureMontage: React.FC<{ scene: S<"feature-montage">; theme: Theme; overSrc?: string }> = ({
  scene,
  theme,
  overSrc,
}) => {
  const per = scene.perItemFrames ?? 30;
  return (
    <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn} center>
      {scene.over ? (
        <div style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
          <KenBurnsImg src={overSrc} durationInFrames={scene.durationInFrames} theme={theme} radius={0} />
        </div>
      ) : null}
      {scene.items.map((it, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per} layout="none">
          <MontageCard icon={it.icon} text={it.text} theme={theme} color={seriesColor(theme, i)} />
        </Sequence>
      ))}
    </SceneFrame>
  );
};

const MontageCard: React.FC<{ icon: string; text: string; theme: Theme; color?: string }> = ({ icon, text, theme, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 0);
  const c = color ?? theme.accent;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 24, alignItems: "center", justifyContent: "center" }}>
      <GlowPulse theme={theme} color={c} />
      <div style={{ transform: `scale(${s})`, zIndex: 1 }}>
        <Icon name={icon} size={72} color={c} animate={false} />
      </div>
      <div style={{ fontSize: TYPE.h1, fontWeight: 800, color: theme.text, transform: `scale(${s})`, opacity: s, zIndex: 1 }}>
        {text}
      </div>
    </div>
  );
};

/** Architecture — one mechanism, built left-to-right from graph or parsed mermaid. */
export const Architecture: React.FC<{ scene: S<"architecture">; theme: Theme }> = ({ scene, theme }) => {
  let flow: Flow = { nodes: [], edges: [] };
  if (scene.graph) {
    flow = {
      nodes: scene.graph.nodes.map((n) => ({ id: n.id, label: n.label ?? n.id })),
      edges: scene.graph.edges,
    };
  } else if (scene.mermaid) {
    flow = parseMermaid(scene.mermaid);
  }
  return (
    <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn ?? "slide"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 48, alignItems: "center", width: "100%" }}>
        {scene.caption ? (
          <AnimatedLine size={TYPE.h2} color={theme.textDim} weight={600}>
            {scene.caption}
          </AnimatedLine>
        ) : null}
        <FlowDiagram flow={flow} theme={theme} />
      </div>
    </SceneFrame>
  );
};

/** Tech stack — real brand logos (simple-icons) + name, fallback to a text chip. */
export const Techstack: React.FC<{ scene: S<"techstack">; theme: Theme }> = ({ scene, theme }) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn} intensity={0.55}>
    <div style={{ display: "flex", flexDirection: "column", gap: 48, alignItems: "center", width: "100%" }}>
      <AnimatedLine size={TYPE.h2} color={theme.textDim} weight={600}>
        {scene.caption ?? "built with"}
      </AnimatedLine>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "center", alignItems: "center", maxWidth: "88%" }}>
        {scene.items.map((it, i) => (
          <div key={it.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {hasTechIcon(it.name) ? (
              <TechIcon name={it.name} size={64} delay={6 + i * 4} />
            ) : (
              <Icon name="Box" size={56} color={theme.accent} delay={6 + i * 4} />
            )}
            <span style={{ color: theme.text, fontSize: 24, fontWeight: 600 }}>{it.name}</span>
          </div>
        ))}
      </div>
    </div>
  </SceneFrame>
);
