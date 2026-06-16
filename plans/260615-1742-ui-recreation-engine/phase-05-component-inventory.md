# Phase 5 — Component inventory (Gemini)

**Priority:** P1 · **Status:** pending · **Depends:** P4

## Overview
Identify the project's important UI pieces from source and map them to ui-kit primitives the Director can
showcase — so the trailer features THIS product's surface (dashboard? chat? kanban? pricing?), idealized.

## Key insights
- We don't render the real components; we **classify intent** and pick the matching primitive + real labels.
- Heuristics narrow candidates (files under components/ui/app, route/page names, big JSX); Gemini classifies.
- Output maps to ui-kit registry names (from P2) so Director references valid primitives only.

## Requirements
- `ComponentInventory`: list of `{ kind, primitive, label, items?/values?, source }` where `primitive` ∈ ui-kit
  registry (e.g. dashboard→bento+charts, chat→ChatBubble, board→KanbanColumn, pricing→Card row, form→InputField).
- Triage hard (token budget): send component/page filenames + a few representative file slices (scrubbed) to Gemini.
- Fallback: if classification weak, synthesize a generic inventory from RepoFacts.features (still good).

## Related files
- Create: `src/inspect-ui/{pick-component-files,classify-components,component-inventory.ts}`.
- Reuse: walk-repo, scrub-secrets, gemini-client (triage model), ui-kit registry (valid primitive names).

## Implementation steps
1. `pick-component-files` — find likely UI files (components/, app/(routes), pages/, *.tsx with JSX density), cap count.
2. `classify-components` — Gemini (triage model) structured output: for each candidate → {kind, primitive, label, sample data}. Constrain `primitive` to the ui-kit registry names.
3. `component-inventory` — dedupe/rank by importance (hero/dashboard/primary feature first), cap ~6–8.
4. Fallback synthesizer from RepoFacts.features when inventory is empty/weak.
5. Persist to `.autodemo/component-inventory.json`.

## Todo
- [ ] pick-component-files (heuristic, capped)
- [ ] classify-components (Gemini, primitive constrained to registry)
- [ ] component-inventory rank/dedupe/cap + persist
- [ ] RepoFacts-features fallback

## Success criteria
- For a real SaaS repo, inventory names the right primitives (e.g. detects a dashboard + chat) with sensible labels.
- Every `primitive` value is a valid ui-kit registry name (no hallucinated primitives).
- Empty/weak case still yields a usable inventory via fallback.

## Risks
- LLM invents primitive names → constrain via enum in the schema + validate against registry.
- Big repos → strict file caps + signatures-only.
