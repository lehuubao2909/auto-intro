# Phase 01 — Calm background + demote decorative FX

**Priority:** P0 (highest perceived-quality gain, lowest effort) · **Status:** completed
**Context:** research report §2 + §1. The "màu mè gây rối mắt" is almost entirely the background layer.

## Problem
`background/scene-background.tsx` (205 LOC) stacks up to 6 moving layers (treatment + always-on `LightRays`
+ `GridBg` + `DotField` motion + `ScanLine` + `ShimmerSweep`) AND hue-shifts every scene ±20–40°.
`text-scenes.tsx` also paints `GlowPulse` + `ParticleBurst` on Title/Stat. All decorative, all competing
with content.

## Target (user decisions #1, #2)
- Near-flat base: ONE soft static gradient + ONE static low-opacity grid (~0.22). Optional: a single
  **slow** accent treatment (e.g. one gentle aurora) at low opacity — no rotation, no churn.
- Hue variation **moderate** (±8–12°) and applied **per-section, not per-scene** (e.g. shift only on act
  changes) so the palette reads brand-stable.
- Remove always-on motion: kill `ScanLine`, `ShimmerSweep`, animated `DotField`, `Streaks` translate,
  `Mesh`/`Aurora` drift from the global background. Keep them only as **opt-in** props (default off).

## Related code files
- Modify: `src/render/background/scene-background.tsx` — collapse 5 treatments → 1 calm base; drop
  `HUE_STEPS` churn (keep a small moderate shift keyed to act/section); remove animated layers.
- Modify: `src/render/lib/fx.tsx` — keep `DrawPath`; make `ScanLine`/`ShimmerSweep`/`ParticleBurst`/
  `GlowPulse` opt-in (no behavior change to the components themselves, just stop calling them globally).
- Modify: `src/render/scenes/text-scenes.tsx` — remove `GlowPulse`+`ParticleBurst` from `Title`/`Stat`
  (keep a single restrained accent at most).
- Modularize: if `scene-background.tsx` stays >200 LOC, split treatments into
  `background/treatments.tsx` + keep the composer in `scene-background.tsx`.

## Implementation steps
1. Rewrite `SceneBackground`: `bg` color + static `GridBg(opacity≈0.22)` + ONE static/very-slow base
   (single radial or soft gradient). Remove `treatment = idx % 5` rotation.
2. Replace `HUE_STEPS` (±20–40 per scene) with a `sectionHue(sceneIdx)` returning ±8–12° that changes
   only every N scenes (act boundaries). Keep `shiftHue` util (reuse).
3. Delete global calls to `ScanLine`, `ShimmerSweep`, `DotField`(animated), `LightRays`(always-on). If
   keeping one accent, render it static (no `Math.sin(frame/…)` drift) or very low-amplitude.
4. In `fx.tsx`, leave components but ensure none are imported by the background composer; add a short
   doc-comment "opt-in only — do not add to global background".
5. Strip `GlowPulse`/`ParticleBurst` from `text-scenes.tsx` Title/Stat.
6. `npx tsc --noEmit` clean.

## Todo
- [ ] Collapse background to calm base + static grid
- [ ] Moderate per-section hue (±8–12°), not per-scene
- [ ] Remove always-on animated bg layers
- [ ] fx.tsx effects opt-in only
- [ ] Remove GlowPulse/ParticleBurst from text scenes
- [ ] typecheck clean

## Success criteria
Background is visually calm and brand-stable across the whole video; no per-scene color churn; eye lands
on content. Render a 2–3 scene smoke test and confirm no flashing/hue jumps.

## Risks
Over-flattening → looks dead. Mitigation: keep grid + one subtle base; depth comes from content motion
(P02/P04), not background. Don't remove `shiftHue` util (still used for the moderate shift).
