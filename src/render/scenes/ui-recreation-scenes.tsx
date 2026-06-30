import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import type { Theme } from "../theme.js";
import { TYPE } from "../theme.js";
import { SceneFrame } from "../components/scene-frame.js";
import { AnimatedLine } from "../components/animated-text.js";
import { UI_KIT } from "../ui-kit/index.js";
import { SidebarNav } from "../ui-kit/chrome.js";
import { BentoGrid } from "../ui-kit/panels.js";
import { entrance } from "../lib/timing.js";
import { stagger, parallaxY } from "../lib/motion.js";
import type { Scene } from "../../shared/storyboard-schema.js";

type S<T extends Scene["type"]> = Extract<Scene, { type: T }>;

/** Isolates a primitive: if it throws on bad props, render nothing (never abort the video). */
class ElementBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Render one primitive element by registry name, spreading its props. */
function renderEl(el: { primitive: string; props?: Record<string, unknown> }, theme: Theme, delay: number) {
  const Cmp = UI_KIT[el.primitive as keyof typeof UI_KIT];
  if (!Cmp) return null;
  return (
    <ElementBoundary>
      <Cmp theme={theme} delay={delay} {...(el.props ?? {})} />
    </ElementBoundary>
  );
}

/** Subtle depth parallax: drifts its child slightly up over the scene (deeper = more drift). */
const ParallaxLayer: React.FC<{ depth?: number; dur: number; amp?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  depth = 0.3,
  dur,
  amp = 26,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ transform: `translateY(${-parallaxY(frame, dur, depth, amp)}px)`, willChange: "transform", ...style }}>
      {children}
    </div>
  );
};

const Caption: React.FC<{ text?: string; theme: Theme }> = ({ text, theme }) =>
  text ? (
    <div style={{ position: "absolute", bottom: "6%", left: 0, right: 0, display: "flex", justifyContent: "center", textAlign: "center" }}>
      <AnimatedLine size={TYPE.h2} color={theme.textDim} weight={600}>{text}</AnimatedLine>
    </div>
  ) : null;

/** Frame with optional app sidebar rail + a content area. */
const AppFrame: React.FC<{ theme: Theme; sidebar?: S<"ui-showcase">["sidebar"]; children: React.ReactNode }> = ({ theme, sidebar, children }) => (
  <div style={{ display: "flex", gap: 20, width: "100%", height: "70%", marginBottom: "4%", alignItems: "stretch" }}>
    {sidebar ? <SidebarNav theme={theme} items={sidebar.items} active={sidebar.active} delay={0} /> : null}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>{children}</div>
  </div>
);

export const UiShowcase: React.FC<{ scene: S<"ui-showcase">; theme: Theme }> = ({ scene, theme }) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn ?? "fade"} intensity={0.8} center>
    <AppFrame theme={theme} sidebar={scene.sidebar}>
      <ParallaxLayer depth={0.3} dur={scene.durationInFrames} style={{ display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1 }}>
        {renderEl(scene.element, theme, scene.sidebar ? 8 : 4)}
      </ParallaxLayer>
    </AppFrame>
    <Caption text={scene.caption} theme={theme} />
  </SceneFrame>
);

export const UiBento: React.FC<{ scene: S<"ui-bento">; theme: Theme }> = ({ scene, theme }) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn ?? "fade"} intensity={0.85} center>
    <AppFrame theme={theme} sidebar={scene.sidebar}>
      <BentoGrid theme={theme} cols={scene.cols ?? 3}>
        {scene.tiles.map((t, i) => (
          <div key={i} style={{ minHeight: 0 }}>{renderEl(t, theme, stagger(i, scene.sidebar ? 8 : 4, 4))}</div>
        ))}
      </BentoGrid>
    </AppFrame>
    <Caption text={scene.caption} theme={theme} />
  </SceneFrame>
);

/** Fades its child in at the start and out near the end of its slot. */
const FadeSlot: React.FC<{ slot: number; children: React.ReactNode }> = ({ slot, children }) => {
  const f = useCurrentFrame();
  const opacity = Math.min(entrance(f, 0, 12), 1 - entrance(f, slot - 12, 12));
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ width: "82%", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </AbsoluteFill>
  );
};

/** Flow narrative: steps shown ONE AT A TIME (cross-fading) — input → process → output. */
export const UiSequence: React.FC<{ scene: S<"ui-sequence">; theme: Theme }> = ({ scene, theme }) => {
  const n = scene.steps.length;
  const slot = Math.floor((scene.durationInFrames - 10) / n);
  return (
    <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn ?? "slide"} intensity={0.8} center>
      {scene.steps.map((s, i) => (
        <Sequence key={i} from={i * slot} durationInFrames={slot + 16}>
          <FadeSlot slot={slot}>{renderEl(s, theme, 2)}</FadeSlot>
        </Sequence>
      ))}
      <Caption text={scene.caption} theme={theme} />
    </SceneFrame>
  );
};
