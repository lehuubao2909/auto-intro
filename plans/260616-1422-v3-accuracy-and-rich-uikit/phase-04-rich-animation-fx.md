# Phase 4 — Rich animation & FX system

**Priority:** P1 (polish that sells) · **Status:** pending · **Depends:** 3

## Overview
Make motion impressive + varied — component-level animations + tech FX + diverse transitions, not just
cross-fades. The difference between "looks templated" and "looks produced".

## Key insights
- Reusable motion helpers > per-primitive bespoke code (DRY). Primitives opt into entrance variants.
- Determinism: all from `useCurrentFrame()` (no Date/random). Cap particle counts for render perf.
- Variety per scene/transition keeps a 50s video from feeling repetitive.

## Requirements
- `src/render/lib/motion.ts` — entrance variants: `fadeUp, scaleIn, blurIn, clipReveal(left/up), maskWipe,
  springPop`; helpers: `countUp`, `typewriter`, `tilt3d` (perspective rotate), `parallax(depth)`.
- `src/render/lib/fx.tsx` — `DrawPath` (SVG stroke-dashoffset draw), `ShimmerSweep`, `ScanLine`,
  `ParticleBurst` (on-appear), `GlowPulse`, `ConnectorDraw` (animated link between elements).
- Scene transitions beyond fade: `wipe`, `push`, `zoom` (extend SceneFrame `transitionIn` handling).
- Primitives accept an optional `anim` prop to choose entrance variant; sensible per-primitive defaults.
- Background: add 1-2 "tech" background variants (animated mesh/gradient, scanning grid) selectable by intensity/theme.

## Related files
- Create: `src/render/lib/motion.ts`, `src/render/lib/fx.tsx`.
- Edit: `src/render/components/scene-frame.tsx` (more transitions), key primitives (opt-in anim),
  `src/render/background/scene-background.tsx` (tech variants), `src/render/lib/timing.ts` (reuse/extend).

## Implementation steps
1. `motion.ts` entrance variants + countUp/typewriter/tilt/parallax (pure, frame-driven).
2. `fx.tsx` DrawPath/Shimmer/ScanLine/ParticleBurst/GlowPulse/ConnectorDraw.
3. Wire variants into Panel/Card/charts/frames (defaults + `anim` prop).
4. Extend SceneFrame transitions (wipe/push/zoom) + add tech background variant.
5. Showcase render exercising several variants → eyeball smoothness; check render time.

## Todo
- [ ] motion.ts entrance variants + countUp/typewriter/tilt/parallax
- [ ] fx.tsx (DrawPath, Shimmer, ScanLine, ParticleBurst, GlowPulse, ConnectorDraw)
- [ ] opt-in anim on primitives + per-type defaults
- [ ] SceneFrame transitions (wipe/push/zoom) + tech bg variant
- [ ] showcase render + perf check

## Success criteria
- Components animate in with varied, smooth, eased motion + tasteful FX; transitions vary across scenes.
- Render time/disk still acceptable (note caps).

## Risks
- Over-animation → keep tasteful defaults; one focal motion per beat. Perf → cap particles/blur.
