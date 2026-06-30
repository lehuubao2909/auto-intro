import React from "react";
import { AbsoluteFill } from "remotion";
import type { Theme } from "../theme.js";
import { hexA, shiftHue } from "../theme.js";
import { useSceneIndex } from "../scene-context.js";

/**
 * Calm, near-flat background. Replaces the old multi-treatment, multi-hue, frame-animated
 * stack (spotlight/aurora/dot-field/streaks/mesh + light-rays + scan-line + shimmer), which
 * read as visual noise ("màu mè gây rối mắt"). Now: solid bg + ONE soft STATIC glow + a
 * static low-opacity grid. Hue varies only MODERATELY per SECTION (act), not per scene, so
 * the palette stays brand-stable. No frame-driven motion here on purpose — the animation
 * budget lives in the content (text + UI), not the wallpaper.
 *
 * Decorative FX (ScanLine/ShimmerSweep/ParticleBurst/GlowPulse in `lib/fx.tsx`) are now
 * OPT-IN per scene only — never painted globally here.
 */

// Hue math lives in theme.ts (shiftHue) — single tested source, reused here.

// Moderate per-SECTION hue (±~10°), changes every 3 scenes (act) — NOT per scene.
const SECTION_HUES = [0, 9, -7, 11, -9, 6];
const sectionHue = (sceneIdx: number) => SECTION_HUES[Math.floor(sceneIdx / 3) % SECTION_HUES.length];

/** Static low-opacity grid — tech texture without motion. */
const GridBg: React.FC<{ theme: Theme; opacity: number }> = ({ theme, opacity }) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `linear-gradient(${hexA(theme.text, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${hexA(theme.text, 0.06)} 1px, transparent 1px)`,
      backgroundSize: "64px 64px",
      maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 78%)",
      WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 78%)",
    }}
  />
);

/** One soft, STATIC radial glow — gives depth without any frame-driven motion. */
const CalmGlow: React.FC<{ c1: string; c2: string; opacity: number }> = ({ c1, c2, opacity }) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `radial-gradient(circle at 50% 30%, ${hexA(c1, 0.3)} 0%, transparent 55%), radial-gradient(circle at 82% 88%, ${hexA(c2, 0.16)} 0%, transparent 50%)`,
    }}
  />
);

export const SceneBackground: React.FC<{ theme: Theme; intensity?: number }> = ({
  theme,
  intensity = 0.6,
}) => {
  const sceneIdx = useSceneIndex();
  const i = Math.max(0, Math.min(1, intensity));
  // Moderate, section-stable hue so consecutive scenes don't churn color.
  const hue = sectionHue(sceneIdx);
  const c1 = shiftHue(theme.accent, hue);
  const c2 = shiftHue(theme.accent2, hue * 0.5 + 6);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <CalmGlow c1={c1} c2={c2} opacity={0.45 + i * 0.3} />
      <GridBg theme={theme} opacity={0.16 + i * 0.12} />
    </AbsoluteFill>
  );
};
