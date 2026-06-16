# Phase 5 — CLI + server + Web UI

**Priority:** P1 · **Status:** pending · **Depends:** P2, P3, P4

## Overview

Wire the pipeline behind `npx autodemo`: a tiny local server + a React/Vite/Tailwind web UI to pick a
repo, watch progress (analyze → capture → direct → render), preview the `.mp4`, download, and do a
simple storyboard tweak + re-render. No Electron — pure `npx` + open browser.

## Key insights

- Pipeline orchestration = analyze (P2) → capture (P4) → direct (P3) → render (P1). Stream progress.
- Re-render is cheap: edit storyboard JSON → re-run P1 only (bundle cached). Big UX win, low cost.
- Keep UI minimal; if time slips, preview + download suffice (drop tweak editor).

## Requirements

- CLI `autodemo` (bin): resolve repo path (cwd or arg), start server on free port, open browser.
- Server (Fastify): endpoints — `POST /run` (start pipeline), `GET /progress` (SSE/poll), `GET /video`,
  `GET /storyboard`, `POST /storyboard` (save + re-render). Serves built UI + `captures/` + output.
- UI: pick repo (path input; optional File System Access on Chromium), progress steps, video player,
  download button, storyboard JSON editor (textarea + validate) + re-render.

## Architecture

```
src/cli/index.ts            # bin entry: args, free port, launch server, open browser
src/server/server.ts        # Fastify app + static
src/server/pipeline.ts      # orchestrate analyze→capture→direct→render, emit progress events
src/server/routes/*.ts      # run, progress(SSE), video, storyboard
src/ui/ (Vite app)          # React + Tailwind: PickRepo, Progress, Preview, StoryboardEditor
```

## Related code files

- Create: `src/cli/**`, `src/server/**`, `src/ui/**`. Install `fastify open get-port`, Vite+React+Tailwind.
- Read: all prior phase entrypoints (`repo-facts`, `capture`, `director`, `render-trailer`).

## Implementation steps

1. `pipeline.ts`: sequential orchestrator with progress callback per stage (+ errors per stage).
2. Fastify server: routes above; SSE for progress; static for UI + media + output mp4.
3. CLI bin: parse path, `get-port`, boot server, `open` browser at localhost:PORT.
4. UI: PickRepo → POST /run → Progress (SSE) → Preview (video) + Download.
5. StoryboardEditor: load JSON, client+server validate (reuse `validate-storyboard`), POST → re-render.
6. Build UI (`vite build`) served by server. Smoke test full flow on a real repo.

## Todo

- [ ] pipeline orchestrator w/ progress + per-stage errors
- [ ] Fastify server + routes + SSE + static
- [ ] CLI bin (port, launch, open browser)
- [ ] UI: PickRepo + Progress + Preview + Download
- [ ] Storyboard editor + re-render (validated)
- [ ] vite build served; full flow smoke test

## Success criteria

- `npx autodemo <repo>` (dev: `node dist/cli`) → browser opens → pick → progress → preview → download mp4.
- Edit storyboard → re-render produces updated mp4 without restarting.

## Risks

- File System Access API Chromium-only → primary path is server-side fs (path input); FS API is a bonus.
- Long render blocking UI → run render in pipeline w/ progress; never freeze the request.

## Next

P6 hardens fallbacks/errors, packages for npm, generates the meta-demo.
