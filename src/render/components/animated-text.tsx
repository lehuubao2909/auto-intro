import React from "react";
import { useCurrentFrame } from "remotion";
import { entrance, riseY } from "../lib/timing.js";
import { composeEnter, stagger } from "../lib/motion.js";

/**
 * Text-animation components. The animation budget for text lives here (per the v4 brief):
 * - AnimatedLine  — one line rises + fades (back-compat; used for sub-text / captions).
 * - AnimatedWords — headline split into WORDS, each staggered (fade ∘ rise). Word-level
 *   opacity only (never per-character — that's the typewriter's job via string slicing).
 * - MaskedReveal  — per-line "wipe up" inside overflow:hidden (clean, no opacity flicker).
 * All frame-driven + deterministic (Remotion-safe).
 */

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

/** Headline revealed WORD BY WORD (staggered fade ∘ rise). Lively hero text. */
export const AnimatedWords: React.FC<{
  text: string;
  size: number;
  color: string;
  weight?: number;
  align?: "center" | "left";
  delay?: number;
  step?: number;
  maxWidth?: number | string;
}> = ({ text, size, color, weight = 800, align = "center", delay = 0, step = 3, maxWidth = "90%" }) => {
  const frame = useCurrentFrame();
  const words = String(text ?? "").split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: size * 0.28,
        rowGap: size * 0.12,
        justifyContent: align === "center" ? "center" : "flex-start",
        maxWidth,
        fontSize: size,
        lineHeight: 1.1,
        fontWeight: weight,
        color,
        letterSpacing: -0.5,
        textAlign: align,
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{ display: "inline-block", ...composeEnter(frame, { start: delay + stagger(i, 0, step), dur: 14, riseY: size * 0.5 }) }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};

/** Per-line "wipe up": each line sits in an overflow-hidden box and slides up into view. */
export const MaskedReveal: React.FC<{
  lines: string[];
  size: number;
  color: string;
  colors?: string[]; // optional per-line color (falls back to `color`)
  weight?: number;
  align?: "center" | "left";
  delay?: number;
  step?: number;
  gap?: number;
}> = ({ lines, size, color, colors, weight = 800, align = "center", delay = 0, step = 8, gap = 0 }) => {
  const frame = useCurrentFrame();
  const arr = Array.isArray(lines) ? lines : [String(lines ?? "")];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, alignItems: align === "center" ? "center" : "flex-start" }}>
      {arr.map((line, i) => {
        const t = entrance(frame, delay + i * step, 16);
        return (
          <div key={i} style={{ overflow: "hidden", lineHeight: 1.14, padding: "0 0.06em" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - t) * 105}%)`,
                fontSize: size,
                fontWeight: weight,
                color: colors?.[i] ?? color,
                textAlign: align,
                letterSpacing: -0.5,
                willChange: "transform",
              }}
            >
              {line}
            </span>
          </div>
        );
      })}
    </div>
  );
};
