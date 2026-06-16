# Phase 2 — Brief approval gate (pipeline + web UI)

**Priority:** P0 · **Status:** pending · **Depends:** 1

## Overview
Insert a human approval step between understanding and rendering. Open-source friendly: review/edit the
brief in the web UI (the browser already opens), or skip with `--yes`. Saves tokens + guarantees accuracy.

## Key insights
- Pipeline becomes two-stage: (A) analyze→inspect→**brief** then STOP; (B) on approve → direct→render.
- Brief is editable; the EDITED brief is what the Director consumes (user controls the story).
- Headless/power users: `--yes` auto-approves; `brief.md` editable on disk too.

## Requirements
- `runAnalysisStage(repo)` → {facts, design, inventory, brief} (no render). `runRenderStage(repo, brief)` → video.
- Server: `POST /api/analyze` (stage A, SSE), `GET/POST /api/brief` (fetch/save edited brief),
  `POST /api/approve` (stage B with the saved brief). Keep existing rerender.
- Web UI: after analyze, show Brief panel (editable fields: oneLiner, whatItDoes, features, beats) +
  "Generate trailer" (approve) button. Then progress → preview as before.
- CLI: `autodemo <repo>` opens UI at the brief step; `--yes` runs straight through.

## Related files
- Edit: `src/server/pipeline.ts` (split into analysis + render stages), `src/server/server.ts` (routes),
  `src/ui/index.html` (brief panel + approve), `src/cli/index.ts` (`--yes`).

## Implementation steps
1. Split pipeline: `runAnalysis` (facts/design/inventory/brief, persist) + `runRender` (direct+render from a brief).
2. Server routes: analyze (SSE), brief GET/POST (save edits → re-persist brief.json), approve (render).
3. UI: render the brief for review/edit; Approve triggers /api/approve; reuse progress+preview+storyboard editor.
4. CLI `--yes`: call analysis then render without waiting.
5. Smoke test: analyze a repo → edit brief → approve → trailer reflects edits.

## Todo
- [ ] Split pipeline into analysis + render stages
- [ ] Server: /api/analyze, /api/brief (GET/POST), /api/approve
- [ ] UI brief panel (edit + approve) before render
- [ ] CLI --yes auto-approve
- [ ] Verify editing brief changes the trailer

## Success criteria
- `npx autodemo <repo>` → browser shows an editable brief → Approve → trailer; edits to the brief change output.
- `--yes` renders end-to-end with no pause.

## Risks
- Two-stage SSE/state in single-job server → keep one job, add a `phase` field (analyzing|awaiting-approval|rendering).
