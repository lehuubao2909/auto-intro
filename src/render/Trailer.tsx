import React from "react";
import { AbsoluteFill, Series, staticFile, Audio } from "remotion";
import type { Storyboard, Scene, MediaRegistry } from "../shared/storyboard-schema.js";
import { themeFromMeta, themeFromProfile, type Theme } from "./theme.js";
import { Title, Problem, Stat, Outro } from "./scenes/text-scenes.js";
import { Ui, Demo } from "./scenes/media-scenes.js";
import { FeatureMontage, Architecture, Techstack } from "./scenes/graphics-scenes.js";
import { Code } from "./scenes/code-scene.js";
import { UiShowcase, UiBento, UiSequence } from "./scenes/ui-recreation-scenes.js";
import { RenderBoundary } from "./components/error-boundary.js";
import { SceneProvider } from "./scene-context.js";
import type { TransitionInValue } from "../shared/storyboard-schema.js";

/** Rotate transitions by index so beats don't all cross-fade the same way. */
const TRANSITION_CYCLE: TransitionInValue[] = ["fade", "zoom", "push", "slide", "clip"];

/** Ensure a scene has a transitionIn: respect an explicit one, else assign by index. */
function withTransition(scene: Scene, i: number): Scene {
  if (scene.transitionIn) return scene;
  return { ...scene, transitionIn: TRANSITION_CYCLE[i % TRANSITION_CYCLE.length] } as Scene;
}

/** Resolve a media-registry id to a loadable URL (relative to Remotion publicDir). */
function makeResolver(registry: MediaRegistry) {
  return (id?: string): string | undefined => {
    if (!id) return undefined;
    const item = registry[id];
    if (!item?.src) return undefined;
    try {
      return staticFile(item.src);
    } catch {
      return undefined;
    }
  };
}

function renderScene(scene: Scene, theme: Theme, resolve: (id?: string) => string | undefined) {
  switch (scene.type) {
    case "ui-showcase":
      return <UiShowcase scene={scene} theme={theme} />;
    case "ui-bento":
      return <UiBento scene={scene} theme={theme} />;
    case "ui-sequence":
      return <UiSequence scene={scene} theme={theme} />;
    case "title":
      return <Title scene={scene} theme={theme} mediaSrc={resolve(scene.media)} />;
    case "problem":
      return <Problem scene={scene} theme={theme} />;
    case "ui":
      return <Ui scene={scene} theme={theme} mediaSrc={resolve(scene.media)} />;
    case "demo":
      return <Demo scene={scene} theme={theme} mediaSrc={resolve(scene.media)} />;
    case "feature-montage":
      return <FeatureMontage scene={scene} theme={theme} overSrc={resolve(scene.over)} />;
    case "architecture":
      return <Architecture scene={scene} theme={theme} />;
    case "techstack":
      return <Techstack scene={scene} theme={theme} />;
    case "code":
      return <Code scene={scene} theme={theme} />;
    case "stat":
      return <Stat scene={scene} theme={theme} />;
    case "outro":
      return <Outro scene={scene} theme={theme} />;
  }
}

export const Trailer: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const { meta, scenes } = storyboard;
  // v2: theme from the per-project DesignProfile when present; else legacy meta theme.
  const theme = meta.design ? themeFromProfile(meta.design) : themeFromMeta(meta);
  const resolve = makeResolver(meta.media ?? {});
  // Audio is deferred (ships silent). If a music asset is ever provided, play it.
  const musicSrc = meta.music && meta.media?.[meta.music]?.src ? resolve(meta.music) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Series>
        {scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationInFrames}>
            <SceneProvider value={i}>
              <RenderBoundary>{renderScene(withTransition(scene, i), theme, resolve)}</RenderBoundary>
            </SceneProvider>
          </Series.Sequence>
        ))}
      </Series>
      {musicSrc ? <Audio src={musicSrc} volume={0.6} /> : null}
    </AbsoluteFill>
  );
};
