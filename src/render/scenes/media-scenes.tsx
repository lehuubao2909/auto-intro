import React from "react";
import { OffthreadVideo, useCurrentFrame } from "remotion";
import type { Theme } from "../theme.js";
import { TYPE } from "../theme.js";
import { SceneFrame } from "../components/scene-frame.js";
import { KenBurnsImg } from "../components/ken-burns-img.js";
import { BrowserFrame } from "../components/browser-frame.js";
import { entrance } from "../lib/timing.js";
import type { Scene } from "../../shared/storyboard-schema.js";

type S<T extends Scene["type"]> = Extract<Scene, { type: T }>;

const Caption: React.FC<{ text?: string; theme: Theme }> = ({ text, theme }) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: "8%",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: TYPE.label,
        fontWeight: 600,
        color: theme.text,
        opacity: entrance(frame, 8),
        textShadow: "0 2px 20px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
};

/** UI still (hero beat). Optionally wrapped in a browser/device frame. */
export const Ui: React.FC<{ scene: S<"ui">; theme: Theme; mediaSrc?: string }> = ({
  scene,
  theme,
  mediaSrc,
}) => {
  const inner = (
    <KenBurnsImg src={mediaSrc} durationInFrames={scene.durationInFrames} direction={scene.kenBurns ?? "in"} theme={theme} radius={scene.frame && scene.frame !== "none" ? 0 : 18} />
  );
  return (
    <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn ?? "fade"} center>
      <div style={{ width: "82%", height: "72%" }}>
        {scene.frame === "browser" ? <BrowserFrame theme={theme}>{inner}</BrowserFrame> : inner}
      </div>
      <Caption text={scene.caption} theme={theme} />
    </SceneFrame>
  );
};

/** Demo clip (real interaction). Falls back to a placeholder when missing. */
export const Demo: React.FC<{ scene: S<"demo">; theme: Theme; mediaSrc?: string }> = ({
  scene,
  theme,
  mediaSrc,
}) => (
  <SceneFrame theme={theme} durationInFrames={scene.durationInFrames} transitionIn={scene.transitionIn ?? "fade"} center>
    <div style={{ width: "82%", height: "72%" }}>
      <BrowserFrame theme={theme}>
        {mediaSrc ? (
          <OffthreadVideo src={mediaSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
        ) : (
          <KenBurnsImg durationInFrames={scene.durationInFrames} theme={theme} radius={0} />
        )}
      </BrowserFrame>
    </div>
    <Caption text={scene.caption} theme={theme} />
  </SceneFrame>
);
