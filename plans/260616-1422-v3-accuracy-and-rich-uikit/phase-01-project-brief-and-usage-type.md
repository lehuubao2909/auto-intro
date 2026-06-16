# Phase 1 — Project Brief + usageType (accuracy foundation)

**Priority:** P0 · **Status:** pending · **Depends:** none

## Overview
Produce a readable **ProjectBrief** the user approves BEFORE rendering, and detect HOW the product is
used (`usageType`) so the Director stops force-fitting a terminal-install flow. Fixes the "misunderstands
the project" + "fake install/URL" problems cheaply (1 text call, no render).

## Key insights
- usageType drives the whole story shape (SDK ≠ CLI ≠ web app ≠ API). Detect deterministically + LLM.
- install/links must be NULLABLE and only real → conditional CTA downstream.
- The brief is the human-in-the-loop contract; editing it must change the trailer (P2 wires the gate).

## Requirements
- Extend `RepoFacts`: `usageType` ∈ {cli,sdk,library,web-app,api,mobile,desktop,unknown}; `install?` (real
  command or import snippet, else null); `links?: {url?, repo?}` (only if found).
- Detection: deterministic signals (package.json `bin`→cli; `main`/`exports` + no app → library/sdk; next/vite→web-app;
  framework server/route files→api; react-native/expo→mobile; electron/tauri→desktop) + Gemini disambiguation.
- New `src/brief/` : `build-brief.ts` → `ProjectBrief` { name, oneLiner, problem, whatItDoes, usageType,
  howItsUsed (1-2 lines), keyFeatures[], techStack[], links, suggestedBeats[] (story outline) }.
- Persist `.autodemo/brief.json` + a human `.autodemo/brief.md`.

## Related files
- Edit: `src/shared/types.ts` (RepoFacts + ProjectBrief + UsageType), `src/analyze/detect-runnable.ts`
  (+ usageType/install/links) or new `detect-usage-type.ts`, `src/analyze/repo-facts.ts`.
- Create: `src/brief/build-brief.ts`, `src/brief/render-brief-md.ts`.

## Implementation steps
1. `detect-usage-type.ts` — deterministic signals from manifests/deps/files → usageType + install + links.
2. Extend RepoFacts schema + analyze to populate them (scrubbed).
3. `build-brief.ts` — Gemini (director or triage model) turns RepoFacts → ProjectBrief incl. suggestedBeats
   (a short story outline matched to usageType). Structured output + fallback to RepoFacts fields.
4. `render-brief-md.ts` — pretty markdown for human review; persist json + md.
5. Test on trackly (→ sdk + real install snippet, no npx), AutoDemo (→ cli, `npx autodemo`), a Next app (→ web-app).

## Todo
- [ ] detect-usage-type (cli/sdk/web/api/mobile/desktop) + install + links (nullable)
- [ ] RepoFacts + ProjectBrief + UsageType schema
- [ ] build-brief (Gemini → brief + suggestedBeats), fallback
- [ ] render-brief-md + persist json/md
- [ ] verify usageType on 3 repo types

## Success criteria
- Trackly → usageType `sdk`, install = real SDK import snippet (NOT a terminal npm install), links only if real.
- Brief reads like an accurate one-pager a stranger could approve.

## Risks
- Ambiguous repos → default `unknown` + safe generic beats; never invent install/links.
