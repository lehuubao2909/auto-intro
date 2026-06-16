# Phase 1 — UI-kit foundation: theme + backgrounds + icons

**Priority:** P0 (visual foundation) · **Status:** pending · **Depends:** none

## Overview
The styling + atmosphere layer every recreated-UI scene sits on: a dynamic theme driven by a
`DesignProfile`, NeuraFlow-style animated background layers, and an SVG icon system (NO emoji).

## Key insights
- Theme must be **data-driven** (per-project tokens), not hardcoded. `cinematic-dark` = fallback.
- Glassmorphism = `backdrop-filter: blur()` + `rgba` surface + soft shadow + 1px hairline border.
- Backgrounds carry the "produced" feel: particle field + light rays + radial glow + subtle grid.
- Icons: lucide (UI line icons) + simple-icons (tech brand logos) as inline SVG, animatable (draw/scale).

## Requirements
- `Theme` type extended: surfaces, glass alpha, accent + accent2, radius, font family, mode (dark/light).
- `themeFromProfile(profile)` → Theme; `themeFromMeta` kept as fallback.
- Background components (Remotion, frame-driven): `ParticleField`, `LightRays`, `GradientGlow`, `GridBg`,
  composed in a `SceneBackground` that reads theme + intensity.
- Icon system: bundle a curated subset of lucide + simple-icons SVGs (or a small dependency); `Icon`
  component renders by name with draw-in (`stroke-dashoffset`) / scale animation. Helper to map a
  tech-stack name → simple-icons slug.

## Related files
- Edit: `src/render/theme.ts` (extend), `src/shared/storyboard-schema.ts` (DesignProfile-ish meta fields later).
- Create: `src/render/background/{particle-field,light-rays,gradient-glow,grid-bg,scene-background}.tsx`,
  `src/render/icons/{icon.tsx,icon-registry.ts,tech-slug-map.ts}`, `assets/icons/` (bundled SVGs).
- Remove emoji usage from existing scenes (montage etc.) → Icon.

## Implementation steps
1. Extend `Theme` + add `themeFromProfile`. Define a `DesignProfile` shape (palette, font, radius, mode, glass).
2. Build background layers (deterministic from `useCurrentFrame`; cap particle count ~40–60 for perf).
3. `SceneBackground` composing layers by theme + a per-scene intensity prop.
4. Icon system: vendor SVGs, `Icon` with name + animate prop; tech-slug map for techstack logos.
5. Demo harness: render a static frame using theme + background + a row of icons → eyeball.

## Todo
- [ ] Theme extension + themeFromProfile + DesignProfile type
- [ ] Background layers (particle/light-rays/glow/grid) + SceneBackground
- [ ] SVG icon system (lucide + simple-icons) + tech-slug map
- [ ] Purge emoji from existing scene components
- [ ] Eyeball demo frame

## Success criteria
- A test frame shows glassy dark bg with particles/light-rays + crisp SVG icons, themable by swapping a profile.
- Zero emoji remain in render components.

## Risks
- Bundling full icon sets bloats package → vendor only a curated subset + lazy-load by name.
- backdrop-filter perf in headless chromium → keep blur radii modest; test render time in P2.
