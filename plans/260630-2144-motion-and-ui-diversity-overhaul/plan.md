---
title: Motion & UI Diversity Overhaul (v4 — calm bg, rich content motion, adaptive director)
status: completed
created: 2026-06-30
completed: 2026-06-30
mode: auto
predecessors: [260616-1422-v3-accuracy-and-rich-uikit]   # completed; this extends it
blockedBy: []
blocks: []
---

# Motion & UI Diversity Overhaul (v4)

Make intros feel **calm in the background, alive in the content**: cut the flashy/multi-hue background
& decorative FX, put the animation budget into UI elements + text (stagger, combined fade∘slide∘parallax,
masked text reveals), and make the storyboard **adapt to each project** (scene mix + pacing + 45–60s length
driven by the project's real content — not one fixed barem). Add ~10 layout-template primitives.

Source research: `plans/reports/research-260630-2138-ui-motion-diversity-parallax-text-animation.md`

## User decisions (locked)
1. Background may go **near-flat** (single soft base + static grid).
2. Per-scene hue variation **moderate** (±8–12°, not ±20–40°) — palette stays brand-stable.
3. Length **adaptive 45–60s per project**; scene mix + presentation must fit the project (CLI vs dashboard
   vs content app tell different stories). **No fixed template, no padding to hit a length.**
4. Add **all ~10** layout-template primitives.
5. `spring()` allowed for UI heroes where it doesn't hurt the flat/corporate feel.

## Phases
| # | Phase | Status | Key files |
|---|-------|--------|-----------|
| 01 | [Calm background + demote decorative FX](phase-01-calm-background-and-fx-demotion.md) | ✅ done | `background/scene-background.tsx`, `lib/fx.tsx`, scene callers |
| 02 | [Motion core: stagger + composable + parallax + spring](phase-02-motion-core.md) | ✅ done | `lib/motion.ts`, `lib/timing.ts` |
| 03 | [Text animation: split/stagger/masked reveal](phase-03-text-animation-upgrade.md) | ✅ done | `components/animated-text.tsx`, `scenes/text-scenes.tsx` |
| 04 | [Apply motion to UI/content scenes](phase-04-apply-motion-to-ui-scenes.md) | ✅ done | `scenes/ui-recreation-scenes.tsx`, `scenes/graphics-scenes.tsx`, `ui-kit/*` |
| 05 | [~10 new layout-template primitives](phase-05-new-layout-primitives.md) | ✅ done | `shared/primitive-names.ts`, `ui-kit/templates.tsx`, `ui-kit/index.ts`, tests |
| 06 | [Adaptive director + per-type pacing](phase-06-adaptive-director-and-pacing.md) | ✅ done | `direct/build-director-prompt.ts` |
| 07 | [Tests + meta-demo + docs](phase-07-tests-meta-demo-docs.md) | ✅ done | `tests/*`, `fixtures/*`, `docs/*` |

**Outcome:** 333 tests pass (15 files) · tsc clean · 52 primitives · calm static background · word-stagger + wipe-up text · depth parallax · adaptive 45–60s director. Code review (DONE_WITH_CONCERNS) found 1 CRITICAL hue-math bug (`shiftHue` channel swap for purple accents) — fixed via DRY refactor to reuse `theme.ts` helpers + regression test added. Meta-demo re-rendered; stills confirm calm bg + content-focused motion.

## Dependencies
```
P01 (independent) ─┐
P02 ──► P03 ──► P04 ┤
P05 (primitives) ──┼─► P06 (director references full catalog) ──► P07
```
- P02 (motion core) must land before P03/P04 (they consume `stagger`/`composeEnter`/`parallaxY`).
- P05 (new primitives) before P06 so the director catalog + pacing can reference them.
- P07 last: 319 existing tests green + new tests + regenerate AutoIntro's own intro as visual proof.

## Guardrails (all phases)
- **Frame-deterministic only** — no `Date`/`Math.random` in render (Remotion correctness). Vary by index/frame.
- **Never per-character opacity** — typewriter via string slicing only (official Remotion rule).
- **≤200 LOC/file** — split `scene-background.tsx` (already 205) and any motion file that grows.
- **319 tests stay green**; schema/validator/director/tests move together when primitives change.
- **No new "enhanced" files** — edit existing modules in place.

## Definition of done
Backgrounds read calm (no multi-hue churn); content/text carry the motion (visible stagger, depth parallax,
masked text reveals); a CLI repo and a dashboard repo produce **visibly different** storyboards & lengths;
all tests green; AutoIntro's own intro re-rendered and reviewed.
