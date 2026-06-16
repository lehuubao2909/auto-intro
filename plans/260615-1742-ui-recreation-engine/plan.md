---
title: AutoDemo v2 — UI-recreation engine (replace capture)
status: completed
created: 2026-06-15
mode: solo
supersedes: 260615-1338-autodemo-mvp-implementation (capture stage)
blockedBy: []
blocks: []
---

# AutoDemo v2 — UI-recreation engine

Pivot: stop recording the app (Playwright). Instead **read the project's frontend source → rebuild its
key UI as animated vector primitives**, themed to the project, in the NeuraFlow motion-graphics style.

Context: research report
[`research-260615-1742-ui-recreation-approach.md`](../reports/research-260615-1742-ui-recreation-approach.md)
(includes Gemini analysis of the NeuraFlow reference).

## Locked decisions

- **Idealized recreation** (representative/clean, NeuraFlow-style) — NOT pixel-perfect mirroring.
- **Real assets: only logo / og-image** (brand mark + palette derivation). No screenshots/clips.
- **Remove Playwright entirely** (Remotion keeps its own chromium for rendering).
- **v1 animation:** glassmorphism + orchestrated build-ins + SVG stroke-draw + particle/light-ray bg.
  Defer 3D card rotation + camera moves to v2.
- **No emoji** anywhere → SVG icon system (lucide + simple-icons for tech logos).
- **Style is per-project** (dynamic theme from extracted tokens); `cinematic-dark` = fallback.

## Keep from v1 (no rework)

Pipeline scaffold (analyze→direct→render→server→cli), RepoFacts, storyboard contract + validator
(extend), Gemini director loop, Remotion render harness, server + UI, secret scrubbing, vendored skill.

## Phases

| # | Phase | Status | Depends | Guaranteed output |
|---|-------|--------|---------|-------------------|
| 1 | [UI-kit foundation: theme + backgrounds + icons](phase-01-uikit-foundation.md) | ✅ done | — | Verified: themeFromProfile + glass, SceneBackground (particle/glow/rays/grid), lucide+simple-icons (no emoji) — out/p1-foundation.png |
| 2 | [Animated UI primitive library](phase-02-ui-primitive-library.md) | ✅ done | 1 | Verified: 15 primitives + registry; kitchen-sink dashboard renders NeuraFlow-grade — out/p2-kitchen-sink.png |
| 3 | [New scene types + schema/validator](phase-03-scene-types-and-schema.md) | ✅ done | 2 | Verified: ui-showcase/ui-bento/ui-sequence + DesignProfile theming + tech-logo techstack + SceneBackground on all scenes — out/v2-trailer.mp4 (46s, teal theme) |
| 4 | [Inspect-UI: design tokens + brand](phase-04-inspect-ui-design-profile.md) | ✅ done | — | Verified: DesignProfile from CSS vars (Lumino) + shadcn HSL (light-mode detect) + tailwind + SVG-derived accent + logo grab |
| 5 | [Component inventory (Gemini)](phase-05-component-inventory.md) | ✅ done | 4 | Verified: Gemini maps real components→primitives (MetricFlow); RepoFacts fallback (Lumino); primitive coercion + bare-array tolerance |
| 6 | [Rewrite Director for UI-recreation](phase-06-director-rewrite.md) | ✅ done | 3,5 | Verified: Lumino → analyze→design→inventory→direct→render → themed recreated-UI .mp4 (out/trailer-v2.mp4, 0 repairs). Pipeline.ts rewired to v2. |
| 7 | [Remove capture + integrate + meta-demo](phase-07-remove-capture-integrate.md) | ✅ done | 6 | Playwright + src/capture removed; pipeline v2; 198 tests green; docs v2; code-review C1 (prop-crash) fixed + error boundary; Lumino meta-demo |

## Build order (de-risk)

Visual first (same logic as v1): **UI-kit (P1) → primitives (P2) → scene types on a HAND storyboard (P3)** →
a great-looking recreation video exists before any analysis. Then extraction (P4→P5) → Director (P6) →
cleanup (P7).

## Key risks

- **Primitive library scope** (🟡) — biggest effort; cap at ~14 high-value components, generic+themed.
- **Token extraction coverage** (🟡) — tailwind/CSS-vars/theme cover most; fallback = logo-derived palette → default theme.
- **Component classification accuracy** (🟡) — messy repos → fall back to generic primitives driven by RepoFacts features (still a good trailer).
- **Render weight** (🟡) — glass/particles heavier frames; cap particle counts, watch disk/time.

## Success criteria

- From a real repo → 45–60s trailer in the project's style, UI rebuilt as animated vector components,
  SVG icons (no emoji), passes the code-trailer Quality bar. No app run, no flow-guessing.
- Looks visibly closer to the NeuraFlow reference than v1's captured/graphics arc.
- Meta-demos: the todo app (Lumino) and AutoDemo itself.
