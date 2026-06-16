import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme.js";
import { SAFE_INSET } from "../theme.js";
import type { TransitionInValue } from "../../shared/storyboard-schema.js";
import { entrance } from "../lib/timing.js";
import { SceneBackground } from "../background/scene-background.js";

/**
 * Common scene shell: full-bleed background + safe-zone padding + a transitionIn.
 * Every scene component renders its content inside this.
 */
export const SceneFrame: React.FC<{
  theme: Theme;
  durationInFrames: number;
  transitionIn?: TransitionInValue;
  bg?: string;
  center?: boolean;
  /** background richness 0..1 (text scenes subtle, UI scenes richer) */
  intensity?: number;
  children: React.ReactNode;
}> = ({ theme, transitionIn, bg, center = true, intensity = 0.45, children }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Entrance transition (cut = none). Varied so a trailer isn't all cross-fades.
  const t = entrance(frame, 0, 16);
  let opacity = 1;
  let transform = "none";
  let clipPath: string | undefined;
  switch (transitionIn) {
    case "fade":
      opacity = t;
      break;
    case "slide":
      opacity = t;
      transform = `translateX(${(1 - t) * width * 0.06}px)`;
      break;
    case "push":
      opacity = t;
      transform = `translateY(${(1 - t) * 60}px)`;
      break;
    case "zoom":
      opacity = t;
      transform = `scale(${0.92 + t * 0.08})`;
      break;
    case "wipe":
    case "clip":
      clipPath = `inset(0 ${(1 - t) * 100}% 0 0)`;
      break;
    // "cut" → instant
  }

  return (
    <AbsoluteFill style={{ backgroundColor: bg ?? theme.bg, fontFamily: theme.fontFamily }}>
      <SceneBackground theme={theme} intensity={intensity} />
      <AbsoluteFill
        style={{
          padding: SAFE_INSET,
          opacity,
          transform,
          clipPath,
          display: "flex",
          flexDirection: "column",
          justifyContent: center ? "center" : "flex-start",
          alignItems: center ? "center" : "stretch",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
