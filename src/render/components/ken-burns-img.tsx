import React from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import type { Theme } from "../theme.js";

/**
 * UI still with a gentle Ken-Burns (1.0→1.06). Falls back to a themed gradient
 * placeholder when the media file is missing (lets graphics-only arcs + tests render).
 */
export const KenBurnsImg: React.FC<{
  src?: string;
  durationInFrames: number;
  direction?: "in" | "out";
  theme: Theme;
  radius?: number;
}> = ({ src, durationInFrames, direction = "in", theme, radius = 18 }) => {
  const frame = useCurrentFrame();
  const from = direction === "in" ? 1.0 : 1.06;
  const to = direction === "in" ? 1.06 : 1.0;
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const common: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: radius,
    transform: `scale(${scale})`,
  };

  if (!src) {
    return (
      <div
        style={{
          ...common,
          transform: `scale(${scale})`,
          background: `linear-gradient(135deg, ${theme.bgElevated}, ${theme.accent}33)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.textDim,
          fontSize: 28,
        }}
      >
        UI preview
      </div>
    );
  }
  return <Img src={src} style={common} />;
};
