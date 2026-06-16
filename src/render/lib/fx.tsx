import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { Theme } from "../theme.js";
import { hexA } from "../theme.js";

/**
 * Visual-effect components (frame-driven, deterministic). Tasteful "tech" polish:
 * SVG path draw, a moving shimmer sweep, a scan line, particle bursts, glow pulse.
 * Keep counts/blur modest for render perf.
 */

/** An SVG path that draws itself in via stroke-dashoffset. */
export const DrawPath: React.FC<{ d: string; stroke: string; width?: number; start?: number; dur?: number; len?: number }> = ({
  d, stroke, width = 3, start = 0, dur = 32, len = 1400,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />;
};

/** A diagonal highlight that sweeps across once (glass "shine"). */
export const ShimmerSweep: React.FC<{ theme: Theme; start?: number; dur?: number }> = ({ theme, start = 0, dur = 50 }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [start, start + dur], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent ${x - 16}%, ${hexA(theme.accent, 0.32)} ${x}%, transparent ${x + 16}%)` }} />
    </AbsoluteFill>
  );
};

/** A faint horizontal scan line drifting down (tech texture). */
export const ScanLine: React.FC<{ theme: Theme; speed?: number }> = ({ theme, speed = 1.4 }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const y = (frame * speed) % height;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 2, background: hexA(theme.accent, 0.3), boxShadow: `0 0 28px ${hexA(theme.accent, 0.65)}` }} />
    </AbsoluteFill>
  );
};

/** Particles bursting outward from center once (on a beat). */
export const ParticleBurst: React.FC<{ theme: Theme; start?: number; count?: number }> = ({ theme, start = 0, count = 18 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, start + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ramp = theme.series && theme.series.length ? theme.series : [theme.accent, theme.accent2];
  const n = Math.min(count, 28); // perf cap
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const r = t * 260;
        const c = ramp[i % ramp.length];
        return <div key={i} style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: c, opacity: (1 - t) * 0.95, boxShadow: `0 0 12px ${hexA(c, 0.8)}`, transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** Soft pulsing radial glow behind a focal element (bold enough to read on screen). */
export const GlowPulse: React.FC<{ theme: Theme; color?: string }> = ({ theme, color }) => {
  const frame = useCurrentFrame();
  const s = interpolate(Math.sin(frame / 22), [-1, 1], [0.9, 1.15]);
  const c = color ?? theme.accent;
  return <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(circle at 50% 50%, ${hexA(c, 0.4)} 0%, transparent ${48 * s}%)` }} />;
};
