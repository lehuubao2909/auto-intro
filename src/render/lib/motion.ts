import { interpolate, Easing } from "remotion";
import type React from "react";

/**
 * Reusable, deterministic motion helpers (frame-driven). Entrance VARIANTS return a
 * CSS style; plus count-up / typewriter / tilt / parallax. Used to make motion varied
 * and expressive (not just cross-fades). No Date/random (Remotion-safe).
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

/** Parallax offset (px) for a layer of given depth (0..1), drifting with frame. */
export function parallax(frame: number, depth = 0.5, amp = 30): number {
  return Math.sin(frame / 60) * amp * depth;
}
