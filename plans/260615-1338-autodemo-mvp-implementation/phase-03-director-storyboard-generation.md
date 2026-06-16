# Phase 3 — Director (Gemini) → Storyboard JSON

**Priority:** P0 (real bottleneck — R2) · **Status:** pending · **Depends:** P1, P2

## Overview

Gemini Director turns `RepoFacts` + media registry → a **valid, good** Storyboard JSON per the
`code-trailer` skill. Structured output + the P1 validator + a **repair loop** make quality reliable.
This is where "wow" is won/lost — render is already solved.

## Key insights

- Valid-schema ≠ good. Enforce skill quality bar via validator, then **repair**: validate fail →
  feed errors back to Gemini (≤2 retries) → re-validate.
- Few-shot with `assets/example-storyboard.json` (the 11-scene worked example).
- Director must answer the six questions; pick scene set from available media (UI beats if media exists,
  else no-UI graphics arc). Director = `gemini-3.5-flash`.

## Requirements

- Input: `RepoFacts` + `MediaRegistry` (from P4; if empty → no-UI arc). Output: Storyboard JSON that
  passes `validate-storyboard`.
- Prompt embeds: the contract (scene taxonomy + pacing + variety + quality bar, distilled), the example,
  RepoFacts, and the media ids the storyboard MAY reference (never invent media ids).
- Repair loop: max 2 retries; on final fail → return best-effort + warnings (don't hard-crash).

## Architecture

```
src/direct/
  build-director-prompt.ts   # distill skill rules + few-shot + RepoFacts + media ids
  generate-storyboard.ts     # Gemini structured call → Storyboard
  repair-storyboard.ts       # validate → feed errors → retry (≤2)
  director.ts                # orchestrate generate+repair → valid Storyboard
```

## Related code files

- Create: `src/direct/**`.
- Read: `skill/code-trailer/SKILL.md`, `references/{storytelling,storyboard-schema}.md`,
  `assets/example-storyboard.json`; `shared/{gemini-client,types,validate-storyboard}.ts`.

## Implementation steps

1. `build-director-prompt.ts`: distill SKILL.md (six questions, scene taxonomy, pacing/variety, quality
   bar) into a tight system prompt + few-shot example + RepoFacts + explicit allowed media ids.
2. `generate-storyboard.ts`: Gemini 3.5 Flash structured output (Storyboard zod/JSON schema). Set `meta`
   defaults (fps 30, theme, accent) if missing.
3. `repair-storyboard.ts`: run validator; if errors, append them to prompt ("fix exactly these"),
   regenerate; loop ≤2.
4. `director.ts`: generate → repair → return valid Storyboard (+ warnings if still imperfect).
5. **Wire end-to-end on a no-UI graphics arc first** (RepoFacts only, empty media) → render via P1 →
   eyeball. Then with media (after P4).

## Todo

- [ ] build-director-prompt (distilled contract + few-shot + allowed media ids)
- [ ] generate-storyboard (Gemini 3.5 Flash structured)
- [ ] repair-storyboard (validate→feed errors→retry ≤2)
- [ ] director orchestrator
- [ ] End-to-end no-UI arc → render → quality check

## Success criteria

- For a RepoFacts input, Director returns a storyboard passing `validate-storyboard` within ≤2 repairs.
- Rendered no-UI arc answers all six questions on eyeball (What/Problem/Does/How/Tech/Why).
- Director never references a media id not in the registry.

## Risks (the big one)

- Gemini produces dull-but-valid boards → strengthen prompt (variety/pacing examples), tighten validator
  rules, add 1–2 more few-shots. Budget extra time here (R2 is highest risk).
- Structured-output flakiness → robust JSON parse + repair on parse error too.

## Next

P4 supplies real media → richer boards; P5 lets user tweak + re-render.
