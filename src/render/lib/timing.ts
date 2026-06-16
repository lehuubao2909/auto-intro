/**
 * Motion helpers — everything driven by useCurrentFrame(). Entrances ease-out,
 * exits ease-in, never linear (code-trailer motion rules).
 */
import { interpolate, spring, Easing } from "remotion";

/** Ease-out entrance value 0→1 over `dur` frames starting at `start`. */
export function entrance(frame: number, start = 0, dur = 18): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** Ease-in exit value 1→0 over the last `dur` frames of a scene. */
export function exit(frame: number, sceneDuration: number, dur = 14): number {
  return interpolate(frame, [sceneDuration - dur, sceneDuration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
}

/** Combined in+out opacity for a scene element. */
export function inOut(frame: number, sceneDuration: number, start = 0): number {
  return Math.min(entrance(frame, start), exit(frame, sceneDuration));
}

/** Springy pop (for badges, stats). */
export function pop(frame: number, fps: number, delay = 0): number {
  return spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });
}

/** Translate-up entrance in px. */
export function riseY(frame: number, start = 0, dur = 18, distance = 28): number {
  return (1 - entrance(frame, start, dur)) * distance;
}
