# Phase 04 — Apply stagger + parallax + combined entrances to UI/content scenes

**Priority:** P1 · **Status:** completed · **Depends on:** P02 (and P03 for captions)
**Context:** research report §3 (apply) + §7. This is where the animation budget moves INTO the content.

## Current
- `ui-recreation-scenes.tsx`: `UiBento` staggers tiles `delay + i*3` (good start); `UiSequence` shows
  steps one-at-a-time cross-fade; `UiShowcase` single element + `GlowPulse` (remove glow per P01).
- `graphics-scenes.tsx` (feature-montage, architecture, techstack) — check stagger usage.
- `ui-kit/*` primitives accept a `delay` prop already (entrance offset).

## Target
- **Stagger everywhere multi-element**: bento tiles, feature-montage items, techstack chips, table rows,
  list/feed items → `stagger(i)` instead of ad-hoc `i*3`.
- **Depth parallax on heroes**: in `UiShowcase`/`UiBento`/`UiSequence`, give the main panel a small
  `parallaxY(depth≈0.3)` while captions/badges use a faster depth (≈0.5) → tangible layering.
- **Combined entrances**: panels enter with `composeEnter` (fade + slide + rise), not plain fade.
- Remove `GlowPulse` calls (P01). Keep `DrawPath` for architecture edges (purposeful).

## Related code files
- Modify: `src/render/scenes/ui-recreation-scenes.tsx` — `renderEl` delay → `stagger`; wrap hero in a
  parallax container; `UiShowcase` drop glow; captions via P03 components.
- Modify: `src/render/scenes/graphics-scenes.tsx` — feature-montage items staggered + composeEnter;
  techstack chips staggered; architecture nodes draw-in (DrawPath) + staggered labels.
- Modify (light): `src/render/ui-kit/*` only where a primitive renders a LIST internally (table rows,
  feed, leaderboard, settings-list) → stagger internal rows by index. Keep changes minimal/DRY.
- Reuse: `lib/motion.ts` helpers from P02.

## Implementation steps
1. Replace `(scene.sidebar ? 8 : 4) + i*3` with `stagger(i, base, step)` in `UiBento`/`renderEl`.
2. Add a `ParallaxLayer({depth, children})` thin wrapper (local or in motion lib) using `parallaxY`;
   wrap hero panels + captions at different depths. Verify frame origin inside `<Sequence>` (P02 risk).
3. feature-montage: each item `composeEnter` + `stagger`; architecture: `DrawPath` edges + staggered node
   labels; techstack: chips `springEnter` + `stagger`.
4. Remove remaining `GlowPulse`/`ParticleBurst` imports in these scene files.
5. For list-rendering primitives, add internal row stagger (small, capped). `npx tsc --noEmit` clean.

## Todo
- [ ] bento/montage/techstack/table use `stagger`
- [ ] hero panels + captions parallax depths
- [ ] panels enter via `composeEnter`
- [ ] internal list-row stagger (table/feed/leaderboard/settings-list)
- [ ] drop GlowPulse/ParticleBurst from UI scenes
- [ ] verify spring/parallax frame origin in Sequence
- [ ] typecheck

## Success criteria
UI scenes show ordered reveals + subtle depth (not everything popping at once, not flat). Re-render a
ui-bento and a ui-sequence scene; confirm visible stagger + layering, no glow wash.

## Risks
Too much per-element motion = new noise. Keep amplitudes subtle (parallax 0.2–0.5, stagger step 3–4f).
Internal list stagger must be capped so long tables don't animate for seconds.
