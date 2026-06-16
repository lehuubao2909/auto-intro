# Research: pivot from UI-capture → UI-recreation ("rebuild the UI, don't record it")

**Date:** 2026-06-15 17:42
**Trigger:** drop Playwright screen capture (uncontrollable: auth/env/flow). Reference: NeuraFlow SaaS video (20s).
**Mode:** research only — no implementation yet.

## 1. What the reference (NeuraFlow) actually does

Gemini frame-analysis verdict: **UI is 100% RECREATED as vector mockups — zero screenshots/recordings.** Carried by:
- Recreated UI components (glass panels, sidebar nav, cards, charts, chat bubbles, buttons) — pure CSS/SVG.
- Abstract SVG (grids, concentric circles, connectors), minimalist SVG icons (line/solid).
- Kinetic typography (fade/scale/typing/sequential reveal).
- Layered animated backgrounds (particles, light rays, gradient glows), glassmorphism, occasional 3D card rotation + camera move.
- Palette: dark navy + 1 dominant blue accent, shifts to purple in one beat. Low text density.

Techniques (Gemini, condensed): vector UI component lib · orchestrated build-ins (Sequence + spring/stagger) · animated SVG (stroke-dashoffset draw, growing bars/arcs) · kinetic type · layered particle/light backgrounds · CSS 3D transforms + camera · global theme tokens.

→ This is EXACTLY the model you described. Confirmed feasible in Remotion.

## 2. The pivot

**OLD (current build):** run the app (Playwright) → screenshot/clip → `ui`/`demo` scenes show captured media.
Problems (your points): auth/env/flow setup, fragile, "soulless" footage, can't control.

**NEW:** read the project's frontend SOURCE → extract its **style** + its **key UI components** → **rebuild those components as animated vector primitives** in Remotion, themed to the project. No running the app, no flow-guessing. UI = the hero, but recreated/skeleton, not recorded.

```
analyze repo ──► DESIGN PROFILE (tokens: palette, font, radius, glass/flat)
            └──► COMPONENT INVENTORY (nav, card, dashboard, chart, form, chat, kanban, pricing, hero…)
                       │
                Director ──► storyboard using a LIBRARY OF ANIMATED UI PRIMITIVES,
                             styled by the project's tokens, labeled with real content
                       │
                Remotion render ──► .mp4 (looks like THIS project, varied, on-brand)
```

## 3. What changes in the codebase (vs what we keep)

KEEP (no rework): pipeline scaffold (analyze→direct→render→server→cli), RepoFacts, storyboard contract + validator (extend), Gemini director loop, Remotion render harness, server/UI, secret scrubbing.

REPLACE / ADD:
| Area | Change |
|---|---|
| `capture/` (Playwright) | **Remove/deprecate.** Drop run-app, capture-playwright, screenshot-collect. (Optionally keep ONLY: grab logo/og-image for the brand mark.) Removes the chromium-for-capture dependency + all auth/env/flow fragility. |
| NEW `inspect-ui/` | Extract **design tokens** (parse tailwind.config, CSS custom props, theme files, package fonts) + **component inventory** (Gemini classifies key components from `components/`, `app/`, `src/`: type + label + notable bits). |
| NEW render `ui-kit/` | **Animated vector UI primitive library** (the core new asset): Panel, SidebarNav, Card, StatTile, BarChart, LineChart, DonutChart, ChatBubble, InputField, Button, Toggle, Avatar, Table, KanbanColumn, Modal, Badge, CodeCard… pure CSS/SVG, theme-driven, glassmorphism, build-in animations (skeleton→content, stagger, stroke-draw). |
| Scene types | Replace `ui`/`demo` with **`ui-showcase`** (one component builds in), **`ui-bento`** (multi-tile grid à la NeuraFlow dashboard), optional **`ui-sequence`** (2-3 panels). Upgrade `feature-montage`/`architecture`/`techstack`/`stat` visuals. |
| Icons | **Bundle SVG icon sets — NO emoji.** lucide (UI/line icons) + simple-icons (tech-stack brand logos). Director references icon names; render as inline SVG with draw/scale animation. |
| Theme | **Dynamic per-project** (extracted tokens) instead of fixed brand dark. Add background layers: particle field, light rays, gradient glow, subtle grid. `cinematic-dark` becomes the fallback when no tokens found. |
| Fonts | Load the project's font via `@remotion/google-fonts` when identifiable; sensible fallback otherwise. |
| Director prompt | Rewrite: input = DesignProfile + ComponentInventory + RepoFacts; output = scenes choosing UI primitives + real labels. No media ids, no flow. |

## 4. Why this is better (maps to your asks)

- **Controllable & deterministic** — no auth/env/running; pure render. (Your #1 pain, gone.)
- **Style follows the project** — token extraction → trailer looks like the product, not a fixed theme.
- **Visual variety** — large primitive set + SVG + bento + particles + 3D → never one-note.
- **No emoji** — real SVG icon system.
- **No flow-guessing** — showcase important components/elements, not click-throughs.
- **Matches the proven reference style** (NeuraFlow) which markets with recreated UI, not recordings.

## 5. Trade-offs / risks (honest)

- **Recreated ≠ pixel-perfect real product.** It's a representative/idealized rebuild (exactly what NeuraFlow does). For a *marketing trailer* this is usually BETTER (clean, on-brand, no messy empty/loading states) — but it is NOT a literal screen demo. If a viewer expects "this is the exact app," set expectation as "stylized showcase."
- **Primitive library is the bulk of new work** (~12–18 components). One-time, reusable across all projects. Biggest effort line.
- **Component-classification accuracy** depends on the LLM reading source. Messy/obfuscated repos → fall back to generic primitives driven by RepoFacts features (still produces a good trailer).
- **Token extraction coverage**: tailwind/CSS-vars/theme-file patterns cover most modern web repos; non-standard styling → fall back to a derived palette (e.g. from logo/og-image) or default theme.
- **Glass/particles/3D in Remotion**: backdrop-filter + many divs + CSS 3D all render in headless Chromium (confirmed by reference analysis). Cost: heavier frames → watch render time/disk.
- Throwaway: the Playwright capture work from P4 is largely retired (run-app/capture-playwright). The KenBurns/BrowserFrame components can be repurposed or dropped.

## 6. Proposed phases (the pivot, not from scratch)

1. **UI primitive library** (Remotion `ui-kit/`) — theme-driven animated components. *The core asset; build first, it's the guaranteed visual win (same de-risk logic as original P1).*
2. **Icon system** — bundle lucide + simple-icons; SVG renderer with animation; purge emoji.
3. **Dynamic theme + background layers** — token→theme mapping; particles/light-rays/glass/grid; per-project font loading.
4. **Design-token extraction** (`inspect-ui/`) — tailwind/CSS-vars/theme parse → DesignProfile.
5. **Component inventory** — Gemini classifies key components from source → typed inventory.
6. **New scene types** (`ui-showcase`, `ui-bento`, `ui-sequence`) wired into renderer + validator.
7. **Rewrite Director** prompt for UI-recreation; end-to-end on a real repo; iterate to NeuraFlow-level polish.
8. Deprecate `capture/`; update docs.

## 7. Open questions (need your call before planning)

1. **Faithfulness:** representative/idealized UI (NeuraFlow-style, recommended) vs. try to mirror the project's exact layout closely? The former is far more robust.
2. **Keep ANY real asset?** Recommend keeping only logo/og-image for the brand mark + maybe deriving palette from it. Drop all screenshots/clips? Or keep repo-screenshot as a rare optional still?
3. **Remove Playwright entirely** (lighter install, no chromium-for-capture) — OK? (Remotion still uses its own headless chromium for rendering; that stays.)
4. **Animation ambition for v1:** glassmorphism + build-ins + SVG draw + particles (high value, moderate effort) — include 3D card rotation + camera moves now, or defer to v2?
5. **Style source priority** when signals conflict: tailwind config > CSS vars > logo-derived > default?
