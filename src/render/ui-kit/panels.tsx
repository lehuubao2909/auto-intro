import React from "react";
import { useCurrentFrame } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance, riseY } from "../lib/timing.js";
import { Icon } from "../icons/icon.js";

/** Shared props every primitive accepts. */
export interface PrimitiveProps {
  theme: Theme;
  delay?: number;
}

/** Glass panel container — the backbone surface. */
export const Panel: React.FC<PrimitiveProps & { width?: number | string; height?: number | string; pad?: number; children: React.ReactNode }> = ({
  theme,
  delay = 0,
  width = "100%",
  height = "100%",
  pad = 28,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 16);
  return (
    <div
      style={{
        ...glassSurface(theme),
        width,
        height,
        padding: pad,
        borderRadius: theme.radius + 4,
        opacity: t,
        transform: `translateY(${riseY(frame, delay, 16, 24)}px) scale(${0.98 + t * 0.02})`,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

/** Content card — title + body + optional icon. */
export const Card: React.FC<PrimitiveProps & { title: string; body?: string; icon?: string }> = ({
  theme,
  delay = 0,
  title,
  body,
  icon,
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  return (
    <div
      style={{
        ...glassSurface(theme, 0.4),
        borderRadius: theme.radius,
        padding: 22,
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "100%",
      }}
    >
      {icon ? <Icon name={icon} size={34} color={theme.accent} delay={delay + 2} /> : null}
      <div style={{ color: theme.text, fontSize: 26, fontWeight: 700 }}>{title}</div>
      {body ? <div style={{ color: theme.textDim, fontSize: 19, lineHeight: 1.4 }}>{body}</div> : null}
    </div>
  );
};

/** Bento grid — lays children into a responsive grid with a stagger. */
export const BentoGrid: React.FC<PrimitiveProps & { cols?: number; gap?: number; children: React.ReactNode }> = ({
  cols = 3,
  gap = 20,
  children,
}) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, width: "100%", height: "100%" }}>
    {children}
  </div>
);

/** Small labeled section header used inside panels. */
export const PanelHeader: React.FC<{ theme: Theme; title: string; icon?: string }> = ({ theme, title, icon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    {icon ? <Icon name={icon} size={24} color={theme.accent} animate={false} /> : null}
    <span style={{ color: theme.text, fontSize: 22, fontWeight: 700 }}>{title}</span>
    <span style={{ flex: 1, height: 1, background: hexA(theme.text, 0.08) }} />
  </div>
);
