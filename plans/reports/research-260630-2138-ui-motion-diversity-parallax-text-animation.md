# Research Report: UI Diversity + Parallax/Text Motion, Less Flashy Background

> Conducted 2026-06-30 21:38 · Branch `main` · Engine: Remotion render layer (`src/render/**`)

## Executive Summary

Goal (user): more diverse UI templates; smooth motion combining **fade + parallax (up/down) + slide-in**; faster layout/pacing for short-text scenes; **cut the flashy background + color animations** ("màu mè gây rối mắt"); put the animation budget into **UI elements, content presentation, and text** instead.

Diagnosis: the engine is **over-decorated at the background layer and under-animated at the content layer**. `scene-background.tsx` stacks up to 6 simultaneous moving layers (treatment + always-on `LightRays` + `GridBg` + `DotField` + `ScanLine` + `ShimmerSweep`) and **hue-shifts every scene ±20–40°** — this is the visual noise. Meanwhile content motion is thin: one entrance per element (`enter()`), no **stagger**, no real **depth parallax** (the existing `parallax()` is a global sine-drift, not layered/entrance), and text only does line rise+fade (`animated-text.tsx`) — no word/char stagger, no masked reveal.

Recommendation: **(1)** strip background to one calm treatment + static grid, kill per-scene hue rotation and most fx; **(2)** add a stagger + composable-transform motion core (fade∘slide∘parallax); **(3)** upgrade text to word/line split + stagger + masked clip reveal; **(4)** tighten short-text scene pacing; **(5)** add ~8–12 layout-template primitives for variety. Industry principle confirms the direction: *"when every element animates simultaneously, the viewer cannot focus on any of them"* — animate **in order**, not all at once.

---

## Table of Contents
1. Current-State Audit
2. Finding 1 — Background: cut the noise
3. Finding 2 — Motion core: stagger + composable transforms + real parallax
4. Finding 3 — Text animation upgrade
5. Finding 4 — Pacing for short-text scenes
6. Finding 5 — UI template diversity
7. Implementation Recommendations (file-mapped)
8. Code Patterns & Numeric Defaults
9. Risks / Pitfalls
10. Sources
11. Open Questions

---

## 1. Current-State Audit

| Layer | File | State | Verdict |
|-------|------|-------|---------|
| Background | `background/scene-background.tsx` (205 LOC) | 5 treatments + always-on LightRays + GridBg + DotField + ScanLine + ShimmerSweep; **per-scene hue shift ±20–40°** | **Too busy — this is the "màu mè"** |
| FX | `lib/fx.tsx` | DrawPath, ShimmerSweep, ScanLine, ParticleBurst, GlowPulse | Mostly decorative; keep DrawPath, demote rest |
| Motion | `lib/motion.ts` | `enter()` 7 variants, countUp, typewriter, tilt3d, `parallax()` = sine-drift | No stagger; parallax is fake (global drift, not depth/entrance) |
| Text | `components/animated-text.tsx` | single line rise+fade only | No word/line split, no stagger, no masked reveal |
| Primitives | `shared/primitive-names.ts` | 42 primitives (panel…comparison) | Good breadth; **lacks layout-template & editorial variety** |
| Timing | `lib/timing.ts` | `entrance`, `riseY` helpers | Fine base; needs `stagger()` + spring helpers |

Strengths to keep: deterministic frame-driven (no Date/random) → Remotion-safe; 42 primitives is solid; theme/palette injection works.

---

## 2. Finding 1 — Background: cut the noise (highest impact)

The flashy feel is almost entirely `scene-background.tsx`. Industry guidance: classify assets into **story-driven / message / decorative** and *"animate only what supports comprehension"*; *"limiting simultaneous moves protects hierarchy."* The background is 100% decorative and currently fights the content.

**Actions:**
- **Kill per-scene hue rotation** (`HUE_STEPS`, `shiftHue`). Hue-shifting every scene is the single biggest "rối mắt" source. Keep one brand palette across the whole video.
- **One calm treatment, not five.** Replace the `treatment = sceneIdx % 5` rotation with a single static/near-static base: a soft single-direction gradient or a very low-contrast static grid. Remove `Aurora` drift, `Streaks` translate, `DotField` motion, `Mesh` blob-shift.
- **Remove always-on `LightRays`, `ScanLine`, `ShimmerSweep`, `ParticleBurst`, `GlowPulse` pulsing** from the global background. Demote them to *opt-in, single-use* accents (e.g. one DrawPath on the architecture scene).
- **Static grid only** (`GridBg`) at low opacity (~0.25), no animation — gives "tech" texture without movement.
- Background animation, if any, must be **slower than content and lower contrast** — it should never compete. (*"calm UI prefers softer curves"*.)

Result: the eye lands on UI/text, not the wallpaper.

---

## 3. Finding 2 — Motion core: stagger + composable transforms + real parallax

Three gaps, three additions to `lib/motion.ts`:

**(a) Stagger** — the #1 missing primitive. *"Staggered entrances tell viewers what to read first, second, third… a small delay reduces clutter and guides attention."* Add a `stagger(index, base, step)` helper and apply to every multi-element scene (bento tiles, feature-montage items, table rows, list items, techstack chips). Remotion idiom: per-item delay `index * 5` frames (interpolate) or `index * 20` (spring).

**(b) Composable transforms** — user wants fade **+** parallax **+** slide-in *combined*, not picked one-at-a-time. Current `enter()` returns one style per variant. Add a `compose()` that multiplies transforms: `translateY (parallax depth) ∘ translateX (slide-in) ∘ opacity (fade)` into a single style. Entrance = slide+fade; ongoing = subtle parallax drift by depth.

**(c) Real layered parallax (up/down)** — replace the sine-drift `parallax()`. True parallax = layers move at **different speeds by depth**: background layer mult ~0.15, mid ~0.3, foreground ~0.5 (best-practice range **0.2–0.5**, keep subtle). Drive by frame progress within the scene, `translateY` per depth, add `willChange: transform`. Use for: hero UI panels rising at one speed while captions/badges rise faster → tangible depth without color noise.

Spring vs interpolate: *"spring() models physics → natural overshoot/settle (organic); interpolate() → exact eased transitions."* Use **spring** for hero/UI entrances (pop/settle), **interpolate+Easing.out(cubic)** for text and subtle parallax (controlled, no bounce).

---

## 4. Finding 3 — Text animation upgrade

`animated-text.tsx` is the weakest content layer. Upgrade to a split + stagger model (Remotion's own `AnimatedText` pattern: split by **char / word / line**, animate each with `stagger`/`splitStagger` + `staggerDirection`).

**Add modes:**
- **Word-stagger reveal** (headlines/titles): split to words, each fades+rises with delay `index*` step. Spring per word: `damping 30, stiffness 60` (gentle, slight settle).
- **Line-stagger** (problem lines, captions): current rise+fade but staggered per line, not simultaneous.
- **Masked clip reveal** (title hero): wrap each line in `overflow:hidden`, animate child `translateY 100%→0` — clean "wipe up" without opacity flicker. (You already have `clip-up`/`clip-left` in `enter()` — extend to per-line masks.)
- **Typewriter** (terminal/code captions): **keep** — but the rule is firm: *"Always use string slicing for typewriter. Never use per-character opacity."* Your `typewriter()` already slices ✅ — do not regress to per-char opacity.

**Hard performance rule (official):** never apply opacity to individual characters — split to words/lines max for opacity; reserve char-level for string-slice typewriter only.

---

## 5. Finding 4 — Pacing for short-text scenes

User: "Thiết kế layout bố cục nhanh chút những phần text ngắn." Short-text scenes (`title`, `problem`, `stat`, `outro` — the `TEXT_ONLY_SCENES` set) currently use the same generous durations as content scenes (e.g. title 100f, problem 110f ≈ 3.3–3.7s). For a 60s intro that wastes the budget on near-empty frames.

**Actions:**
- Shorten text-only scene durations ~25–35% (title ~70f, problem ~80f, stat ~70f) and **front-load the entrance** (settle by ~12–15f) so the held state is short — text should *snap in, hold briefly, leave*.
- Faster easing on text scenes (*"snappy ads use tighter easing"*); reserve softer/longer easing for UI-content scenes where the viewer reads a dashboard.
- Reallocate the saved seconds to UI-recreation scenes (`ui-bento`, `ui-sequence`, `ui-showcase`) where the actual product story lives.

This is a director-side change (scene `durationInFrames` defaults in the storyboard) + a per-scene-type pacing table in the renderer.

---

## 6. Finding 5 — UI template diversity

42 primitives cover components well but the **layouts repeat** (mostly bento grid + sequence). Add layout-template + editorial primitives for variety (these are compositional, not just new widgets):

Proposed additions (~10):
- `split-hero` — left copy / right UI panel (classic landing split)
- `stacked-timeline` — vertical step timeline (great for "how it works")
- `metric-banner` — full-width row of 3–4 big animated counters
- `quote-card` — testimonial / callout with avatar
- `before-after` — slider/wipe comparison (you have `comparison`; this is the animated wipe variant)
- `device-mockup-trio` — 3 device frames at parallax depths
- `tab-switcher` — animated tab content swap (shows multi-view apps)
- `map-pins` — you have `world-map`; add animated pin-drop sequence
- `code-to-ui` — split: code snippet left → rendered UI right (strong for SDK/dev tools)
- `feature-spotlight` — one big primitive + orbiting labels (parallax depths)

Pair each with the new stagger/parallax core so the *same* data feels fresh across scenes. Diversity comes as much from **layout templates + motion variety** as from new widgets.

---

## 7. Implementation Recommendations (file-mapped)

| # | Change | File(s) | Effort |
|---|--------|---------|--------|
| 1 | Strip background to 1 calm treatment + static grid; remove hue rotation & global fx | `background/scene-background.tsx` | M |
| 2 | Demote ScanLine/Shimmer/Particle/Glow to opt-in props (default off) | `lib/fx.tsx`, scene callers | S |
| 3 | Add `stagger()`, `compose()` (fade∘slide∘parallax), real `parallaxDepth()`, `springEnter()` | `lib/motion.ts` | M |
| 4 | Apply stagger to all multi-element scenes (bento/montage/table/techstack/sequence) | `scenes/*.tsx`, `ui-kit/*` | M |
| 5 | Rewrite `animated-text` → split word/line + stagger + masked clip reveal modes | `components/animated-text.tsx` | M |
| 6 | Per-scene-type pacing table; shorten text-only durations; tighter easing | `scenes/text-scenes.tsx`, director defaults | S |
| 7 | Add ~10 layout-template primitives | `shared/primitive-names.ts`, `ui-kit/*`, schema enum, director prompt | L |

Suggested order: **1 → 2 → 3 → 5 → 4 → 6 → 7**. Items 1–2 give the biggest perceived-quality jump for least effort (kill the noise first), 3+5 build the new motion vocabulary, 4+6 apply it, 7 expands range.

Keep all helpers **frame-deterministic** (no Date/random) — non-negotiable for Remotion render correctness. Mind the 200-LOC modularization rule: `scene-background.tsx` is already 205 — splitting treatments out is a good moment to modularize.

---

## 8. Code Patterns & Numeric Defaults

```ts
// stagger: per-item start frame
const stagger = (i: number, base = 6, step = 4) => base + i * step;

// composable entrance: fade ∘ slide-in ∘ parallax-rise (single style)
function composeEnter(frame: number, opts: {
  start?: number; dur?: number; slideX?: number; riseY?: number;
}): React.CSSProperties {
  const { start = 0, dur = 16, slideX = 0, riseY = 28 } = opts;
  const t = interpolate(frame, [start, start + dur], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return {
    opacity: t,
    transform: `translate(${(1 - t) * slideX}px, ${(1 - t) * riseY}px)`,
    willChange: "transform, opacity",
  };
}

// real layered parallax (subtle, depth-driven): mult 0.15 / 0.3 / 0.5
const parallaxY = (frame: number, sceneDur: number, depth = 0.3, amp = 40) =>
  (frame / sceneDur) * amp * depth;   // foreground depth larger → moves more

// spring entrance (UI hero — organic pop/settle)
const s = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 60 } });
// list items: spring({ ..., config: { damping: 12, stiffness: 100 } }), delay = i * 5

// masked line reveal (no per-char opacity)
// <div style={{ overflow: "hidden" }}>
//   <span style={{ display: "inline-block",
//     transform: `translateY(${(1 - t) * 100}%)` }}>{line}</span></div>
```

Defaults distilled from sources: parallax speed mult **0.2–0.5**; word-spring **damping 30 / stiffness 60**; list-spring **damping 12 / stiffness 100**; stagger **index×5f** (interpolate) or **index×20f** (spring); always `willChange: transform`; **never per-character opacity** (string-slice typewriter only).

---

## 9. Risks / Pitfalls

- **Over-correction**: stripping background fully can look flat. Keep *one* subtle base + static grid, not pure flat color.
- **Stagger + short durations** can collide: if you both shorten text scenes and stagger words, last word may not finish — cap total stagger span < (sceneDur − holdMin).
- **Spring at scene cut**: `spring()` keyed off `useCurrentFrame()` is fine inside a Sequence (frame resets per Sequence) — verify scenes are wrapped in `<Sequence>` so `frame` is scene-local, else delays drift.
- **Schema/validator/director sync**: adding primitives touches `primitive-names.ts` → enum → validator → director prompt → tests (319). Same discipline as the prior 42-primitive add.
- **Modularization**: don't let `motion.ts`/`scene-background.tsx` blow past 200 LOC — split treatments and motion families into focused files.

---

## 10. Sources

- [Remotion — Animating properties](https://www.remotion.dev/docs/animating-properties)
- [Remotion — spring()](https://www.remotion.dev/docs/spring) · [interpolate()](https://www.remotion.dev/docs/interpolate) · [Easing](https://www.remotion.dev/docs/easing)
- [Remotion skills — text-animations rules](https://github.com/remotion-dev/skills/blob/main/skills/remotion/rules/text-animations.md) (string-slice typewriter; never per-char opacity)
- [Remotion Bits — AnimatedText (split char/word/line + stagger)](https://remotion-bits.dev/docs/reference/animated-text/)
- [Motion.dev — React parallax tutorial](https://motion.dev/tutorials/react-parallax)
- [PixelFreeStudio — Parallax in motion design](https://blog.pixelfreestudio.com/how-to-implement-parallax-effects-in-motion-design/) · [Timing & easing in motion design](https://blog.pixelfreestudio.com/the-importance-of-timing-and-easing-in-motion-design/)
- [VMG Studios — 10 principles of motion design](https://blog.vmgstudios.com/10-principles-motion-design)
- [Builder.io — Parallax scrolling (speed mult 0.2–0.5, willChange, transform)](https://www.builder.io/blog/parallax-scrolling-effect)
- [OpenReplay — Staggered text animations](https://blog.openreplay.com/staggered-text-animations-with-framer/)

---

## 11. Open Questions

1. **Background floor**: acceptable to go near-flat (single gradient + static grid), or keep one *slow* moving accent (e.g. a single soft aurora) for life?
2. **Brand hue lock**: confirm killing per-scene hue rotation entirely — single palette for the whole video?
3. **Length target**: keep 60s and reallocate freed seconds to UI scenes, or shorten total to ~45s?
4. **Primitive scope**: all ~10 new layout templates, or a prioritized subset first (e.g. `split-hero`, `stacked-timeline`, `metric-banner`, `code-to-ui`)?
5. **spring() everywhere vs interpolate**: OK to introduce `spring()` (adds slight bounce) for UI heroes, or keep strictly eased interpolate for a flatter, corporate feel?
