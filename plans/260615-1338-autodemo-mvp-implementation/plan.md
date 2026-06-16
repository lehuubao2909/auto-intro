---
title: AutoDemo MVP — local-first repo → code trailer
status: completed
created: 2026-06-15
mode: solo
blockedBy: []
blocks: []
---

# AutoDemo MVP — Implementation Plan

Local-first tool: point at a local web repo → 45–60s "code trailer" `.mp4`, rendered locally with
Remotion from a Gemini-directed Storyboard JSON. Distribution: `npx autodemo`.

Source context: `PROJECT.md`, research report
[`research-260615-1202-autodemo-code-trailer-feasibility.md`](../reports/research-260615-1202-autodemo-code-trailer-feasibility.md),
vendored `code-trailer` skill (the storyboard contract).

## Locked decisions (this session)

- **Solo** build. KISS: single TS package, not a monorepo.
- **Gemini everywhere** via `@google/genai` SDK (env `GEMINI_API_KEY`): Director = `gemini-3.5-flash`,
  Triage = `gemini-3.1-flash-lite` (IDs configurable). CLI `gemini` only for local dev/research.
- **No Remotion license concern** — accept free tier, document in README. No alternative renderer.
- **Audio deferred** — MVP ships silent; music hooks stay in schema but renderer no-ops if no asset.
  Research royalty-free pack in P6; skip if none found.

## De-risk principle

Build the **render layer first** (only fully-controllable part). Capture/analysis are best-effort with
solid fallbacks; pipeline never blocks on them.

## Phases

| # | Phase | Status | Depends | Guaranteed output |
|---|-------|--------|---------|-------------------|
| 0 | [Setup + vendor skill + Gemini client](phase-00-setup-and-skill-vendoring.md) | ✅ done | — | Buildable TS project, Gemini client, vendored contract |
| 1 | [Render layer + validator](phase-01-render-layer-and-validator.md) | ✅ done | 0 | Polished `.mp4` from hand-written storyboard (**the win**) — verified: out/fixture.mp4, 47.4s 1080p |
| 2 | [Repo analysis → RepoFacts](phase-02-repo-analysis-repofacts.md) | ✅ done | 0 | `RepoFacts` JSON — verified live (Gemini triage + deterministic detect + secret scrub) |
| 3 | [Director (Gemini) → Storyboard](phase-03-director-storyboard-generation.md) | ✅ done | 1,2 | Verified live: repo → analyze → direct (repair loop) → render → on-brand .mp4 (out/trailer.mp4) |
| 4 | [UI capture (Playwright)](phase-04-ui-capture-playwright.md) | ✅ done | 1 | Verified: Playwright stills+webm clip captured & rendered in ui/demo browser-frame scenes; fallback chain wired |
| 5 | [CLI + server + Web UI](phase-05-cli-server-web-ui.md) | ✅ done | 2,3,4 | Verified: server+SSE+UI integration test passed; UI renders; all 4 capture paths proven. (UI = single HTML page, not React/Vite — KISS) |
| 6 | [Harden + package + meta-demo](phase-06-harden-package-meta-demo.md) | ✅ done | 5 | npm-publishable; AutoDemo's own trailer (verified: out/trailer.mp4; 100 vitest tests green) |

## Build order (de-risk, not phase number)

render+validator (P1) → Director on hand storyboard (P3 partial) → analysis (P2) → capture
fallback-first (P4) → UI (P5) → harden (P6). P1 is the guaranteed win — a great video exists after it.

## Key risks (from research)

- **R2 Director quality** (🔴): LLM valid-but-dull storyboard. → validator (P1) + JSON-schema structured
  output + repair loop (P3). This is the real bottleneck, not render.
- **R3 App auto-run flaky** (🟡): fallback-first capture; never block (P4).
- **R4 Render perf/OOM** (🟡): `concurrency=cpus`, cap with video clips (P1).
- **R5 Secrets** (🟡): scrub before LLM send AND before any code/file renders (P2).

## Success criteria (MVP)

- From a real Next.js/Vite repo → 45–60s `.mp4` passing the skill Quality bar in one run.
- `npx autodemo` local; nothing uploaded except LLM calls.
- AutoDemo generates **its own** trailer (meta-demo = acceptance).

## Realism note (solo)

6 build-days aggressive but feasible. If time slips, sacrifice **P5 UI polish** (preview+download
suffice) before touching Director robustness or capture fallbacks.

## Status: COMPLETE

All 7 phases (P0–P6) implemented and verified end-to-end: repo → RepoFacts → Director → Storyboard → Playwright capture (4 fallback paths) → Remotion render → MP4 + CLI/server + single-page UI + npm package. AutoDemo generates its own trailer (out/trailer.mp4); integration test passed; 100 vitest tests green.

**Known deviations (intentional):**
- UI is single HTML page (KISS) not React/Vite app.
- Audio deferred / silent (music hooks in schema, music research task deferred post-MVP).

**Known gaps (documented, operator responsibility):**
- Remotion company license for teams 4+ employees (free tier cap respected in P1; user docs cover this).
- Auto-running untrusted third-party repos runs their dev script unsandboxed (fine for operator's own repos; warning in docs).
