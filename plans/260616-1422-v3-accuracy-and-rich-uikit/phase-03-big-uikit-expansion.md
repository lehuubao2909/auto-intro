# Phase 3 — Big UI-kit expansion (+~24 primitives)

**Priority:** P0 (expressiveness) · **Status:** pending · **Depends:** none

## Overview
Grow the ui-kit from 16 → ~40 so the Director can describe ANY project type without force-fitting. Built
upfront (not LLM-generated) for token-cheap, deterministic, on-brand recreation.

## Key insights
- Coverage by project type is the goal: dev-tool/SDK, API, web app, mobile, analytics, content, commerce.
- All theme-driven (DesignProfile), glassmorphism, with build-in animation; props simple for the Director.
- Frames (mobile/browser) WRAP other primitives → huge expressiveness for little code.

## New primitives (grouped)
- **Frames:** `mobile-frame`, `browser-window` (wrap a child primitive in device/browser chrome).
- **Dev / API:** `code-snippet` (real SDK import/usage, Shiki, line-highlight), `api-exchange`
  (METHOD /endpoint → JSON response, typed), `log-stream` (streaming log lines), `file-tree`,
  `code-diff` (add/remove lines), `command-palette`.
- **Data / analytics:** `world-map` (dots/arcs), `sparkline`, `metric-grid` (mini KPI cluster), `gauge`,
  `leaderboard`, `heatmap`.
- **App surfaces:** `feed` (activity items), `calendar`, `profile-card`, `notification-toast`,
  `pricing-tiers`, `product-card`, `settings-list`, `tabs`, `modal`, `form`, `step-wizard`, `comparison`.

## Related files
- Create: `src/render/ui-kit/{frames,dev,data-extra,surfaces}.tsx` (grouped, <200 lines each).
- Edit: `src/shared/primitive-names.ts` (add names), `src/render/ui-kit/index.ts` (register).
- Update Director catalog (P5) + a kitchen-sink showcase per group for visual QA.

## Implementation steps
1. Frames first (mobile-frame, browser-window) — reused by many.
2. Dev/API group (code-snippet is the SDK-accuracy unlock; api-exchange for API products).
3. Data + surfaces groups.
4. Register all in primitive-names + UI_KIT (keep registry↔names test green; bump expected count).
5. Showcase frames per group → render stills → eyeball each.

## Todo
- [ ] frames: mobile-frame, browser-window
- [ ] dev/api: code-snippet, api-exchange, log-stream, file-tree, code-diff, command-palette
- [ ] data: world-map, sparkline, metric-grid, gauge, leaderboard, heatmap
- [ ] surfaces: feed, calendar, profile-card, notification-toast, pricing-tiers, product-card, settings-list, tabs, modal, form, step-wizard, comparison
- [ ] register + update count test
- [ ] showcase stills per group

## Success criteria
- ~40 primitives registered; each renders themed + animated; registry matches PRIMITIVE_NAMES.
- An SDK project can be shown via code-snippet; an API via api-exchange; a mobile app in a phone frame.

## Risks
- Scope blow-up → group files, keep each primitive compact; reuse Panel/glass + icons.
- Render perf with many heavy primitives → only a few per scene; caps in validator.
