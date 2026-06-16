# Phase 4 — UI capture (Playwright, fallback-first)

**Priority:** P1 · **Status:** pending · **Depends:** P1

## Overview

Populate the `media` registry with real UI footage. **Fallback-first**: implement reliable paths
before flaky ones so the pipeline NEVER blocks — repo screenshots → auto-run capture → no-UI graphics.

## Key insights

- Playwright records native `.webm` (VP8), headless OK → compatible with Remotion `<OffthreadVideo>`.
- Auto-running arbitrary repos is inherently flaky → it's an *enhancement*, not a dependency.
- Treat footage as "product": round corners + browser frame (P1 component), gentle Ken-Burns, crop to
  meaningful region, capture @ 1920×1080 / 30fps, seeded/sample data if possible.

## Requirements (priority order)

1. **Repo screenshots** (reliable, build FIRST): glob `public/ assets/ docs/ screenshots/` + README
   image refs → copy into `captures/`, register as `still`.
2. **Auto-run capture**: start detected dev command, wait-for-port/ready, Playwright load + short
   interaction (2–3 views/actions) → stills + one trimmed clip.
3. **No-UI**: if neither, emit nothing → Director uses graphics-only arc (P3).

## Architecture

```
src/capture/
  collect-repo-screenshots.ts  # path 1 (reliable)
  run-app.ts                   # spawn dev cmd, wait-for-ready, teardown
  capture-playwright.ts        # path 2: stills + interaction clip (webm)
  media-registry.ts            # write captures/ + registry JSON for Director/renderer
  capture.ts                   # orchestrate fallbacks, never throw fatal
```

## Related code files

- Create: `src/capture/**`. Install `playwright` (+ `npx playwright install chromium`).
- Read: `skill/code-trailer/references/ui-capture.md`; `RepoFacts` runnable hints (P2).

## Implementation steps

1. `collect-repo-screenshots.ts`: find + copy images → registry `still` entries. (Ship this first.)
2. `run-app.ts`: spawn `dev`/`start` in repo, wait for port (timeout + retries), expose URL, ensure kill.
3. `capture-playwright.ts`: `browser.newContext({ recordVideo:{dir,size:1920x1080}, viewport })`; load
   URL; take 2–4 `page.screenshot()` stills; do one short interaction; close → trimmed `.webm` clip.
4. `media-registry.ts`: write `captures/*` + `media` JSON (ids → {kind, src, durationInFrames}).
5. `capture.ts`: try auto-run → on any failure fall to screenshots → else empty (no-UI). Log which path.
6. Full auto run on a real Next.js repo end-to-end into the registry.

## Todo

- [ ] collect-repo-screenshots (reliable path, first)
- [ ] run-app (spawn + wait-for-ready + guaranteed teardown)
- [ ] capture-playwright (stills + interaction clip → webm)
- [ ] media-registry writer
- [ ] capture orchestrator (fallback chain, never fatal)
- [ ] End-to-end on real Next.js repo

## Success criteria

- For a runnable repo: ≥2 stills + 1 clip in registry, render-able by P1.
- For a non-runnable repo: screenshots path works; if none, returns empty cleanly → no-UI arc renders.
- Dev process always torn down (no orphan ports).

## Risks

- Hang on app start → strict timeout + kill; fall to screenshots.
- webm/codec edge cases in `<OffthreadVideo>` → verify with a real clip in P1 render early.

## Next

P5 surfaces capture progress + lets user re-trigger; P3 Director uses the populated registry.
