import { interpolate, spring, Easing } from "remotion";
import type React from "react";

/**
 * Reusable, deterministic ELEMENT-motion helpers (frame-driven). Entrance VARIANTS return
 * a CSS style; plus stagger / composable entrance / depth parallax / spring / count-up /
 * typewriter / tilt. Sits ABOVE the scene-level easing base in `timing.ts`. Used to put the
 * animation budget into content (text + UI). No Date/random (Remotion-safe).
 */

export type EnterVariant = "fade-up" | "scale" | "blur" | "clip-left" | "clip-up" | "spring-pop" | "rise";

const out = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

const overshoot = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.7)) });

/** Entrance style for a variant at `start` over `dur` frames. */
export function enter(frame: number, variant: EnterVariant = "fade-up", start = 0, dur = 18): React.CSSProperties {
  const t = variant === "spring-pop" ? overshoot(frame, start, dur) : out(frame, start, dur);
  switch (variant) {
    case "scale":
      return { opacity: t, transform: `scale(${0.86 + t * 0.14})` };
    case "spring-pop":
      return { opacity: Math.min(1, t * 1.4), transform: `scale(${t})` };
    case "blur":
      return { opacity: t, filter: `blur(${(1 - t) * 12}px)` };
    case "clip-left":
      return { opacity: 1, clipPath: `inset(0 ${(1 - t) * 100}% 0 0)` };
    case "clip-up":
      return { opacity: 1, clipPath: `inset(${(1 - t) * 100}% 0 0 0)` };
    case "rise":
      return { opacity: t, transform: `translateY(${(1 - t) * 40}px)` };
    case "fade-up":
    default:
      return { opacity: t, transform: `translateY(${(1 - t) * 24}px)` };
  }
}

/** Count a number up to `to` over a window. */
export function countUp(frame: number, to: number, start = 0, dur = 26): number {
  return Math.round(to * out(frame, start, dur));
}

/** Reveal text char-by-char from `start`. */
export function typewriter(text: string, frame: number, start = 0, cps = 26, fps = 30): string {
  return text.slice(0, Math.max(0, Math.floor((frame - start) * (cps / fps))));
}

/** Subtle 3D tilt transform that settles to flat. */
export function tilt3d(frame: number, start = 0, dur = 24, deg = 8): string {
  const t = out(frame, start, dur);
  return `perspective(1200px) rotateX(${(1 - t) * deg}deg) rotateY(${(1 - t) * -deg}deg)`;
}

// --- P02: stagger · composable entrance · depth parallax · spring ----------

/** Per-item entrance start frame — reveal in ORDER, not all at once. */
export function stagger(i: number, base = 6, step = 4): number {
  return base + i * step;
}

/**
 * Composable entrance: fade ∘ slide-in ∘ parallax-rise → ONE style. Combine on any
 * element. `slideX` slides in from a side (px), `riseY` is the upward parallax-rise (px).
 */
export function composeEnter(
  frame: number,
  opts: { start?: number; dur?: number; slideX?: number; riseY?: number } = {},
): React.CSSProperties {
  const { start = 0, dur = 16, slideX = 0, riseY = 28 } = opts;
  const t = out(frame, start, dur);
  return {
    opacity: t,
    transform: `translate(${(1 - t) * slideX}px, ${(1 - t) * riseY}px)`,
    willChange: "transform, opacity",
  };
}

/**
 * Real depth parallax: layers at different `depth` (0..1) move at different rates over the
 * scene's progress. Keep subtle — depth ~0.15 (bg) / 0.3 (mid) / 0.5 (foreground).
 */
export function parallaxY(frame: number, sceneDur: number, depth = 0.3, amp = 40): number {
  const p = sceneDur > 0 ? Math.min(1, Math.max(0, frame / sceneDur)) : 0;
  return p * amp * depth;
}

/** Guarded spring entrance 0→1 — gentle config (mild settle; suits a flat/corporate feel). */
export function springEnter(
  frame: number,
  fps: number,
  delay = 0,
  config: { damping?: number; stiffness?: number; mass?: number } = { damping: 30, stiffness: 60 },
): number {
  return spring({ frame: frame - delay, fps, config });
}
