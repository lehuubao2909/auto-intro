import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { Theme } from "../theme.js";
import { hexA } from "../theme.js";
import { ScanLine, ShimmerSweep } from "../lib/fx.js";
import { useSceneIndex } from "../scene-context.js";

/**
 * Layered animated background (NeuraFlow style). Per-scene VARIETY: each scene index
 * gets (a) a hue SHIFT off the accent (±20–40°) so scenes feel different, and (b) one
 * of 5 background TREATMENTS rotated by index: spotlight, aurora, dot-field, streaks,
 * mesh. Deterministic from useCurrentFrame + scene index — no Date/random.
 */

// Shift a #rrggbb hex's hue by `deg` (keeps it brand-adjacent, just varied per scene).
function shiftHue(hex: string, deg: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  h = ((h + deg) % 360 + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let rr = 0, gg = 0, bb = 0;
  if (h < 60) { rr = c; gg = x; } else if (h < 120) { rr = x; gg = c; }
  else if (h < 180) { gg = c; bb = x; } else if (h < 240) { gg = x; bb = c; }
  else if (h < 300) { rr = c; bb = x; } else { rr = c; bb = x; }
  const to = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, "0");
  return `#${to(rr)}${to(gg)}${to(bb)}`;
}

const HUE_STEPS = [0, 28, -24, 38, -32, 20, -18]; // per-scene hue rotation
const ANGLE_STEPS = [50, 28, 72, 14, 60]; // spotlight/glow position variety

const GridBg: React.FC<{ theme: Theme; opacity: number }> = ({ theme, opacity }) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `linear-gradient(${hexA(theme.text, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${hexA(theme.text, 0.07)} 1px, transparent 1px)`,
      backgroundSize: "64px 64px",
      maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 75%)",
      WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 75%)",
    }}
  />
);

// --- 5 background treatments ---------------------------------------------

/** 0: radial spotlight glow (bold pulsing). */
const Spotlight: React.FC<{ c1: string; c2: string; opacity: number; posX: number }> = ({ c1, c2, opacity, posX }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 38), [-1, 1], [0.9, 1.18]);
  return (
    <AbsoluteFill
      style={{
        opacity,
        background: `radial-gradient(circle at ${posX}% 30%, ${hexA(c1, 0.42)} 0%, transparent ${52 * pulse}%), radial-gradient(circle at ${100 - posX}% 80%, ${hexA(c2, 0.22)} 0%, transparent 55%)`,
      }}
    />
  );
};

/** 1: aurora — soft drifting multi-hue gradient bands. */
const Aurora: React.FC<{ c1: string; c2: string; opacity: number }> = ({ c1, c2, opacity }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 16;
  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `linear-gradient(${115 + drift}deg, ${hexA(c1, 0.4)} 0%, transparent 40%, ${hexA(c2, 0.34)} 70%, transparent 100%)`,
          filter: "blur(70px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** 2: drifting dot/particle field. */
const DotField: React.FC<{ c1: string; c2: string; count: number }> = ({ c1, c2, count }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dots = [];
  for (let i = 0; i < count; i++) {
    const rx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const ry = (Math.sin(i * 78.233) * 12345.678) % 1;
    const x = (Math.abs(rx) * width) % width;
    const baseY = Math.abs(ry) * height;
    const drift = (frame * (0.2 + Math.abs(rx) * 0.4)) % height;
    const y = (baseY + drift) % height;
    const size = 2 + Math.abs(rx) * 3.5;
    const alpha = 0.22 + Math.abs(ry) * 0.4;
    const col = i % 5 === 0 ? c2 : c1;
    dots.push(
      <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: col, opacity: alpha, boxShadow: `0 0 ${size * 3}px ${hexA(col, 0.7)}` }} />,
    );
  }
  return <AbsoluteFill>{dots}</AbsoluteFill>;
};

/** 3: diagonal light streaks. */
const Streaks: React.FC<{ c1: string; c2: string; opacity: number }> = ({ c1, c2, opacity }) => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.6) % 100;
  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          background: `repeating-linear-gradient(115deg, transparent 0px, transparent 120px, ${hexA(c1, 0.16)} 122px, ${hexA(c2, 0.12)} 150px, transparent 180px)`,
          transform: `translateX(${shift}px)`,
          filter: "blur(2px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** 4: mesh — overlapping color blobs (mesh-gradient look). */
const Mesh: React.FC<{ c1: string; c2: string; opacity: number }> = ({ c1, c2, opacity }) => {
  const frame = useCurrentFrame();
  const b = Math.sin(frame / 50) * 6;
  return (
    <AbsoluteFill
      style={{
        opacity,
        background: `radial-gradient(circle at ${20 + b}% 25%, ${hexA(c1, 0.5)} 0%, transparent 40%), radial-gradient(circle at 80% ${30 - b}%, ${hexA(c2, 0.4)} 0%, transparent 42%), radial-gradient(circle at 55% 85%, ${hexA(c1, 0.32)} 0%, transparent 45%)`,
        filter: "blur(20px)",
      }}
    />
  );
};

/** Bold light rays (always present, sits behind treatment). */
const LightRays: React.FC<{ c1: string; c2: string; opacity: number }> = ({ c1, c2, opacity }) => (
  <AbsoluteFill style={{ opacity }}>
    <div
      style={{
        position: "absolute",
        top: "-30%",
        left: "50%",
        width: "140%",
        height: "90%",
        transform: "translateX(-50%)",
        background: `conic-gradient(from 180deg at 50% 0%, transparent 0deg, ${hexA(c1, 0.26)} 18deg, transparent 36deg, ${hexA(c2, 0.18)} 60deg, transparent 90deg)`,
        filter: "blur(8px)",
      }}
    />
  </AbsoluteFill>
);

export const SceneBackground: React.FC<{ theme: Theme; intensity?: number }> = ({
  theme,
  intensity = 0.6,
}) => {
  const sceneIdx = useSceneIndex();
  const i = Math.max(0, Math.min(1, intensity));
  // Per-scene hue-shifted palette so consecutive scenes feel distinct.
  const hue = HUE_STEPS[sceneIdx % HUE_STEPS.length];
  const c1 = shiftHue(theme.accent, hue);
  const c2 = shiftHue(theme.accent2, hue * 0.6 + 14);
  const treatment = sceneIdx % 5;
  const posX = ANGLE_STEPS[sceneIdx % ANGLE_STEPS.length];

  const glowOp = 0.6 + i * 0.4;
  const rayOp = 0.45 + i * 0.45;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {treatment === 0 ? <Spotlight c1={c1} c2={c2} opacity={glowOp} posX={posX} /> : null}
      {treatment === 1 ? <Aurora c1={c1} c2={c2} opacity={glowOp} /> : null}
      {treatment === 2 ? <Spotlight c1={c1} c2={c2} opacity={glowOp * 0.7} posX={posX} /> : null}
      {treatment === 3 ? <Spotlight c1={c1} c2={c2} opacity={glowOp * 0.8} posX={posX} /> : null}
      {treatment === 4 ? <Mesh c1={c1} c2={c2} opacity={glowOp} /> : null}

      <GridBg theme={theme} opacity={0.4 + i * 0.4} />
      <LightRays c1={c1} c2={c2} opacity={rayOp} />

      {treatment === 1 ? <DotField c1={c1} c2={c2} count={Math.round(24 + i * 40)} /> : null}
      {treatment === 2 ? <DotField c1={c1} c2={c2} count={Math.round(30 + i * 46)} /> : null}
      {treatment === 3 ? <Streaks c1={c1} c2={c2} opacity={rayOp} /> : null}
      {treatment === 4 ? <DotField c1={c1} c2={c2} count={Math.round(20 + i * 30)} /> : null}
      {treatment === 0 ? <DotField c1={c1} c2={c2} count={Math.round(18 + i * 30)} /> : null}

      {/* tech FX on richer (UI) scenes only */}
      {i >= 0.7 ? <ScanLine theme={theme} /> : null}
      {i >= 0.7 ? <ShimmerSweep theme={theme} start={6} dur={55} /> : null}
    </AbsoluteFill>
  );
};
