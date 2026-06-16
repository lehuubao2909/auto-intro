import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme.js";
import { pop } from "../lib/timing.js";

/** Tech-stack / generic badges that spring in with a stagger. */
export const BadgeRow: React.FC<{
  items: Array<{ name: string; icon?: string }>;
  theme: Theme;
  startDelay?: number;
  stagger?: number;
}> = ({ items, theme, startDelay = 6, stagger = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 22,
        justifyContent: "center",
        alignItems: "center",
        maxWidth: "90%",
      }}
    >
      {items.map((it, i) => {
        const s = pop(frame, fps, startDelay + i * stagger);
        return (
          <div
            key={it.name + i}
            style={{
              transform: `scale(${s})`,
              opacity: s,
              padding: "18px 32px",
              borderRadius: 16,
              background: theme.bgElevated,
              border: `1px solid ${theme.accent}40`,
              color: theme.text,
              fontSize: 34,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {it.icon ? <span style={{ color: theme.accent }}>{it.icon}</span> : null}
            {it.name}
          </div>
        );
      })}
    </div>
  );
};
