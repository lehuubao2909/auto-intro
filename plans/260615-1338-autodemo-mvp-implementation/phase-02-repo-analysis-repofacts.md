# Phase 2 — Repo analysis → RepoFacts

**Priority:** P1 · **Status:** pending · **Depends:** P0

## Overview

Read a local repo and emit **RepoFacts**: identity, problem, what-it-does, key features, tech stack,
runnable-app signals (dev script, port, live URL), existing screenshots. Triage with Gemini Flash to
keep tokens bounded. Scrub secrets before anything leaves the machine.

## Key insights

- Triage HARD: read ≤8–10 files fully; signatures/first-lines only for the rest (token control).
- Detection hints (ui-capture.md): `package.json` scripts `dev`/`start`; framework→port
  (Next 3000, Vite 5173); README "Demo"/"Live"; images in `public/ assets/ docs/ screenshots/`.
- **Secret scrub is mandatory** (R5): redact `.env*`, keys, tokens before sending code to Gemini AND
  before any snippet can reach the renderer.

## Requirements

- Input: local folder path. Output: `RepoFacts` JSON (typed in `shared/types.ts`).
- Walk tree (respect `.gitignore`, skip `node_modules/.git/dist`). Collect README, manifests
  (`package.json`, lockfile, framework configs).
- Tech-stack detection from deps + config files (Next/Vite/React/Tailwind/DB/etc).
- Runnable detection: scripts + framework default port + live URL from README/`homepage`.
- Screenshot discovery: glob known dirs + README image refs.

## Architecture

```
src/analyze/
  walk-repo.ts            # gitignore-aware tree + file picker
  detect-tech-stack.ts    # deps/config → stack list (for techstack scene)
  detect-runnable.ts      # dev/start script, port, live URL, screenshots
  scrub-secrets.ts        # redact .env/keys/tokens
  triage-and-summarize.ts # Gemini Flash: pick key files → identity/problem/does/features
  repo-facts.ts           # orchestrate → RepoFacts
```

## Related code files

- Create: `src/analyze/**`.
- Read: `skill/code-trailer/references/ui-capture.md`; `shared/{gemini-client,types,config}.ts`.

## Implementation steps

1. `walk-repo.ts`: build file list, gitignore-aware; classify (manifest/readme/source/asset).
2. `scrub-secrets.ts`: regex redact common secret patterns + skip `.env*`; run on any text before LLM.
3. `detect-tech-stack.ts` + `detect-runnable.ts`: deterministic, no LLM (deps + config + globs).
4. `triage-and-summarize.ts`: send README + top manifests + ≤8–10 triaged files (scrubbed) to Gemini
   Flash with a structured prompt → identity/problem/what-it-does/features. JSON output via schema.
5. `repo-facts.ts`: merge deterministic detections + LLM summary → `RepoFacts`. Persist to
   `.autodemo/repo-facts.json`.
6. Test on 2 real repos (one Next.js w/ screenshots, one CLI/no-UI).

## Todo

- [ ] walk-repo (gitignore-aware)
- [ ] scrub-secrets (used before all LLM sends)
- [ ] detect-tech-stack (deterministic)
- [ ] detect-runnable (script/port/URL/screenshots)
- [ ] triage-and-summarize (Gemini Flash, structured)
- [ ] repo-facts orchestrator → RepoFacts JSON
- [ ] Validate on Next.js repo + no-UI repo

## Success criteria

- RepoFacts for a real repo has correct identity/stack + a usable runnable hint (or correct "no UI").
- No secret/`.env` content present in the LLM payload (verify with a planted dummy secret).

## Risks

- Big repos blow tokens → enforce triage caps; signatures-only beyond the ≤10 full reads.
- Misdetected port/script → P4 capture must fail soft to screenshots.

## Next

P3 Director consumes RepoFacts (+ P4 media list).
