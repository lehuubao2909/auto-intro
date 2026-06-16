# Phase 0 — Setup + vendor skill + Gemini client

**Priority:** P0 (foundation) · **Status:** pending · **Depends:** none

## Overview

Stand up a buildable TS project, vendor the `code-trailer` skill into the repo as the storyboard
contract, and create the shared Gemini client. KISS: single package (no monorepo for solo MVP).

## Key insights

- Source skill is `code-trailer.skill` (zip) — extract into repo so contract + example travel with code.
- Shipped tool calls Gemini via `@google/genai` SDK, NOT the `gemini` CLI. CLI only for local dev.
- `code-trailer` quality bar + schema validation rules → become a code-side validator (P1).

## Requirements

- Node ≥20, TypeScript, ESM. Single `package.json`, `tsconfig.json`, build via `tsup`/`tsc`.
- Folders (concerns, not packages): `src/analyze/ src/capture/ src/direct/ src/render/ src/ui/ src/cli/ src/server/ src/shared/`.
- Vendored contract at `skill/code-trailer/` (SKILL.md, references/, assets/example-storyboard.json).
- Gemini client: read `GEMINI_API_KEY`; models from env/config (`AUTODEMO_DIRECTOR_MODEL`, `AUTODEMO_TRIAGE_MODEL`).

## Architecture

```
src/shared/gemini-client.ts   # @google/genai wrapper: generateText(), generateJson(schema)
src/shared/config.ts          # env + defaults (models, port, fps, theme)
src/shared/types.ts           # RepoFacts, Storyboard, MediaRegistry TS types (mirror schema)
skill/code-trailer/           # vendored contract (read-only reference)
```

## Related code files

- Create: `package.json`, `tsconfig.json`, `src/shared/gemini-client.ts`, `src/shared/config.ts`,
  `src/shared/types.ts`, `.env.example`, `README.md` (stub), `.gitignore`.
- Vendor (copy from extracted skill): `skill/code-trailer/**`.

## Implementation steps

1. `npm init` + install: `typescript tsup @google/genai zod` (zod for schema/validate reuse).
2. Extract `code-trailer.skill` → `skill/code-trailer/` (unzip the .skill zip).
3. Write `src/shared/types.ts` — TS types for `Storyboard`, `Scene` (10 types), `MediaRegistry`,
   `RepoFacts`. Mirror `storyboard-schema.md` exactly.
4. Write `gemini-client.ts`: `generateJson<T>(prompt, zodSchema)` using Gemini structured output
   (responseSchema/JSON mode); `generateText(prompt)`. Handle missing key with clear error.
5. `config.ts`: defaults — director `gemini-3.5-flash`, triage `gemini-3.1-flash-lite`, fps 30,
   1920×1080, theme `cinematic-dark`, port auto. Override via env.
6. `.env.example` with `GEMINI_API_KEY=`. README stub w/ Remotion-license note (free ≤3 ppl).
7. Verify build: `npm run build` compiles clean.

## Todo

- [ ] Project scaffold + deps + tsconfig (ESM)
- [ ] Vendor `code-trailer` skill into `skill/`
- [ ] `types.ts` mirrors storyboard schema
- [ ] `gemini-client.ts` (generateJson + generateText)
- [ ] `config.ts` + `.env.example` + README stub
- [ ] `npm run build` passes

## Success criteria

- `npm run build` clean. `gemini-client` callable in a throwaway script (returns JSON for a trivial schema).
- Vendored contract present; types compile against `example-storyboard.json` shape.

## Risks

- Gemini structured-output API shape may differ from assumption → verify `@google/genai` `responseSchema`
  support early; fallback to prompt-with-JSON + parse if needed.

## Next

Phase 1 (render) consumes `types.ts` + example storyboard.
