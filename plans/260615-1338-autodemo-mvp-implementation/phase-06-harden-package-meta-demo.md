# Phase 6 — Harden + package + meta-demo

**Priority:** P1 (ship) · **Status:** pending · **Depends:** P5

## Overview

Make it robust and shippable: solid fallbacks + error states, README/docs, `npx autodemo` publish prep,
optional audio research, and the **meta-demo** (AutoDemo's own trailer = acceptance test).

## Key insights

- Robustness = the fallback chain is already designed (no-UI arc, screenshot fallback, repair loop);
  this phase verifies + surfaces them as clear UI/CLI states.
- Meta-demo is the strongest proof + the AABW submission video — make AutoDemo trailer itself.
- Audio: research royalty-free pack that allows redistribution in an npm package; if none clean → ship
  silent (decision locked). Don't block release on audio.

## Requirements

- Graceful states for: no UI / app won't run / no live URL / Gemini key missing / render failure.
- README: install (`npx autodemo`), `GEMINI_API_KEY` setup, privacy note, **Remotion free-tier note**.
- npm publish prep: `bin`, `files`, bundled `skill/` + Remotion assets, `playwright install` guidance.
- Audio (optional): research → if pack found, add to `assets/music/` + wire `<Audio>` + beat-sync;
  else leave silent (hooks already no-op).

## Related code files

- Edit: `README.md`, `package.json` (bin/files/publishConfig), error handling across `pipeline.ts`,
  CLI/UI error views.
- Create (optional): `assets/music/*` + `src/render/audio.ts` wiring.
- Docs: update `docs/` (system-architecture, codebase-summary) via docs-manager.

## Implementation steps

1. Audit fallback paths end-to-end: force each failure, confirm pipeline degrades (never hard-crash).
2. Clear error surfaces in CLI + UI (missing key, no-UI repo, render fail) with actionable messages.
3. README + privacy + Remotion-license note; `.env.example`; quickstart.
4. npm packaging: `bin: { autodemo }`, `files` includes `dist skill assets`, test `npm pack` + local
   `npx ./autodemo-*.tgz <repo>`.
5. **Audio research** (self): find redistributable royalty-free pack. If clean → wire 1 mood + ≤6 SFX +
   beat-sync; else ship silent.
6. **Meta-demo**: run AutoDemo on its own repo → trailer; verify vs Quality bar; use as submission.
7. docs-manager: update `docs/` (architecture + codebase summary).

## Todo

- [ ] Force-test every fallback (no-UI / no-run / no-URL / no-key / render-fail)
- [ ] Clear error states (CLI + UI)
- [ ] README + privacy + Remotion-license note
- [ ] npm packaging + `npm pack` local install test
- [ ] Audio research → wire or ship silent (locked: silent OK)
- [ ] Meta-demo: AutoDemo's own trailer passes Quality bar
- [ ] docs/ updated

## Success criteria

- Fresh machine: `npx autodemo <repo>` + `GEMINI_API_KEY` → valid `.mp4`, no uploads.
- Every failure mode degrades gracefully with a clear message.
- AutoDemo's own trailer passes the skill Quality bar in one run.

## Risks

- npm packaging misses bundled assets (skill/Remotion) → verify via `npm pack` + clean install.
- Playwright browser not installed on user machine → detect + prompt `npx playwright install chromium`.

## Open questions

- Audio pack with npm-redistribution license — exists clean? (If not → ship silent, decided.)
- Which 1–2 frameworks to officially support for auto-run capture (Next.js + Vite assumed)?
