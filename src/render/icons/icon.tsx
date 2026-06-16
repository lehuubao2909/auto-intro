import React from "react";
import { useCurrentFrame } from "remotion";
import { icons as lucideIcons } from "lucide-react";
import { entrance } from "../lib/timing.js";

/**
 * UI icon (lucide line-icon) with a scale/draw-in animation. NO emoji anywhere.
 * `name` is a lucide icon name in PascalCase (e.g. "LayoutDashboard", "Search").
 * Falls back to a dot if the name is unknown so a bad name never breaks a render.
 */
export const Icon: React.FC<{
  name: string;
  size?: number;
  color: string;
  strokeWidth?: number;
  delay?: number;
  animate?: boolean;
}> = ({ name, size = 40, color, strokeWidth = 2, delay = 0, animate = true }) => {
  const frame = useCurrentFrame();
  const t = animate ? entrance(frame, delay, 14) : 1;
  const Cmp = (lucideIcons as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[name];
  const style: React.CSSProperties = { transform: `scale(${0.6 + t * 0.4})`, opacity: t, display: "inline-flex" };
  if (!Cmp) {
    return <span style={{ ...style, width: size, height: size, borderRadius: "50%", background: color }} />;
  }
  return (
    <span style={style}>
      <Cmp size={size} color={color} strokeWidth={strokeWidth} />
    </span>
  );
};
