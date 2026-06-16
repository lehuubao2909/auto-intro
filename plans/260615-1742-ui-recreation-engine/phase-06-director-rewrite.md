# Phase 6 — Rewrite Director for UI-recreation

**Priority:** P0 (the brain) · **Status:** pending · **Depends:** P3, P5

## Overview
Rewrite the Director so it composes a recreation storyboard from `DesignProfile` + `ComponentInventory`
+ `RepoFacts` — picking ui-kit primitives, real labels, SVG icons, in the project's style. No media/flow.

## Key insights
- Director now references **primitive names** (constrained to ui-kit registry) + data, not media ids.
- DesignProfile injected into `meta` (renderer themes from it) — Director must NOT pick colors.
- Validator (P3) + repair loop reused: unknown primitive / missing UI-recreation scene / quality-bar → repair.
- Few-shot: a hand storyboard from P3 (idealized SaaS) as the example.

## Requirements
- New `build-director-prompt`: contract = recreation scene taxonomy (ui-showcase/ui-bento/ui-sequence +
  upgraded scenes) + the ui-kit primitive list (names + what each shows) + icon usage (no emoji) +
  ComponentInventory (what to feature) + RepoFacts (identity/problem/features/tech) + DesignProfile (themed).
- Inject DesignProfile + brand into meta post-generation (like v1 media/brand injection).
- Keep generate → validate → repair (≤2) → final scrub.

## Related files
- Edit: `src/direct/build-director-prompt.ts` (rewrite), `src/direct/director.ts` (inject DesignProfile/brand;
  drop media registry).
- Reuse: gemini-client, validate-storyboard (P3), scrubDeep.

## Implementation steps
1. Rewrite the contract prompt for recreation (taxonomy + primitive catalog + icon rules + few-shot).
2. Feed DesignProfile + ComponentInventory + RepoFacts; constrain primitive names to the registry enum.
3. Inject DesignProfile + brand into meta; run validate→repair loop.
4. End-to-end: real repo (Lumino todo + a richer SaaS) → storyboard → render. Iterate prompt to NeuraFlow polish.
5. Tune pacing/variety so it alternates kinds and features the right primitives early.

## Todo
- [ ] Rewrite build-director-prompt (recreation taxonomy + primitive catalog + few-shot)
- [ ] Director: inject DesignProfile/brand, constrain primitives, repair loop
- [ ] End-to-end on 2 repos → render
- [ ] Prompt iteration to polish

## Success criteria
- repo → valid recreation storyboard within ≤2 repairs; references only real primitives; themed by DesignProfile.
- Rendered trailer answers the six questions AND visibly showcases the product's UI (recreated), NeuraFlow-grade.

## Risks (highest)
- Director picks weak primitive/data combos → strengthen catalog descriptions + few-shot; validator nudges.
- Over-dense bento → cap tiles; pacing rules in validator.
