import React from "react";
import { useCurrentFrame } from "remotion";
import { entrance, riseY } from "../lib/timing.js";

/** A single line that rises + fades in, with an optional start delay (frames). */
export const AnimatedLine: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size: number;
  color: string;
  weight?: number;
  align?: "center" | "left";
  maxWidth?: number | string;
}> = ({ children, delay = 0, size, color, weight = 700, align = "center", maxWidth = "85%" }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        opacity: entrance(frame, delay),
        transform: `translateY(${riseY(frame, delay)}px)`,
        fontSize: size,
        lineHeight: 1.1,
        fontWeight: weight,
        color,
        textAlign: align,
        maxWidth,
        letterSpacing: -0.5,
      }}
    >
      {children}
    </div>
  );
};
