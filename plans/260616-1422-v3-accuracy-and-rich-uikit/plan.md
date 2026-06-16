---
title: AutoDemo v3 — accuracy (project brief gate) + big UI-kit + rich motion
status: completed
created: 2026-06-16
mode: solo
blockedBy: []
blocks: []
---

# AutoDemo v3 — accurate, expressive, open-source-friendly

Fix the "misunderstands the project / generic UI / forced flows" problems and make trailers expressive.

Root causes (not mainly the model):
1. **No human review of understanding** before the expensive render → misunderstandings ship.
2. **Director invents specifics** (install cmd, CTA url) — no `usageType`, no grounding, no conditional fields.
3. **UI-kit too small (16)** → force-fit, every video looks the same; can't describe diverse projects.
4. **Motion = mostly cross-fades** → not impressive.

## Locked decisions

- **Open-source self-host tool** (not SaaS). Optimize for "install → set env → run". No server uploads beyond LLM.
- **Project Brief approval gate**: analyze → brief → **review/edit/approve in the web UI** (primary; `npx autodemo` already opens it) + persist `.autodemo/brief.md` (editable) + `--yes` flag to skip (headless/power users).
- **Director model via env** `AUTODEMO_DIRECTOR_MODEL` (default `gemini-3.5-flash`, set `gemini-3-pro-*` for higher accuracy). Already wired; document it.
- **Big, diverse UI-kit (+~24 primitives)** built upfront (not LLM-generated UI — too token-heavy/flaky).
- **Rich animation/FX** (SVG draw, particle/tech FX, count-up, typewriter, tilt, reveals, varied transitions), component-level, not just slides.

## Keep from v2

Pipeline scaffold, RepoFacts, inspect-ui (DesignProfile + palette sanitize + monorepo tech-stack), Gemini
director loop + validate/repair/scrub, Remotion render, ui-kit registry pattern, server + UI, tests.

## Phases

| # | Phase | Status | Depends | Output |
|---|-------|--------|---------|--------|
| 1 | [Project Brief + accuracy facts](phase-01-project-brief-and-usage-type.md) | ✅ done | — | Verified: usageType (cli/web-app…) + nullable install/links + accurate ProjectBrief on trackly/AutoDemo/Lumino |
| 2 | [Brief approval gate (pipeline + web UI)](phase-02-brief-approval-gate.md) | ✅ done | 1 | Verified: pipeline split (runAnalysis/runRender), /api/analyze→brief→/api/approve, UI brief panel, `--yes`, Director consumes brief, conditional CTA (no fake URL) |
| 3 | [Big UI-kit expansion (+~24 primitives)](phase-03-big-uikit-expansion.md) | ✅ done | — | Verified: 16→42 primitives (frames/dev/data/surfaces); tsc clean, 198 tests; sampler still confirms code-snippet/api-exchange/gauge/pricing/feed render well |
| 4 | [Rich animation & FX system](phase-04-rich-animation-fx.md) | ✅ done | 3 | Verified: motion.ts (enter variants/countUp/typewriter/tilt/parallax) + fx.tsx (DrawPath/Shimmer/ScanLine/ParticleBurst/GlowPulse) + transitions (zoom/push/clip) + tech bg; tsc+198 tests; render clean |
| 5 | [Director v3 + integrate + verify](phase-05-director-v3-and-verify.md) | ✅ done | 2,3,4 | Verified: 42-primitive grouped catalog + usageType flow + conditional CTA; trackly → real SDK code-snippet (NO fake npx/URL). tsc clean. |

## Build order

P1 (brief + usageType) and P3 (UI-kit) are independent → can interleave. P4 builds on P3. P2 (gate) wires P1.
P5 connects everything + verifies accuracy on real repos (trackly SDK, AutoDemo CLI, a Next/shadcn app).

## Accuracy rules (the fixes)

- `usageType` ∈ {cli, sdk, library, web-app, api, mobile, desktop} → flow MUST match (SDK → `code-snippet` of real import, NOT terminal install; API → `api-exchange`; web → feature flow; CLI → terminal).
- `install`/`links` are nullable and only set when REAL → outro CTA conditional (no link → tagline, never a fake url/github).
- Director grounds every prop in the (approved) brief; brief is the contract the user signed off.

## Success criteria

- Trackly (SDK analytics) trailer shows the SDK snippet + real usage, NO fake `npx install`, NO fake URL.
- A 1-call **brief** is shown for approval before any render; editing it changes the trailer.
- Trailers visibly varied + expressive across project types (richer primitives + motion), not slide-y.
- All tests green; docs updated; env model switch documented.
