# Phase 06 — Adaptive director + per-type pacing (user decision #3)

**Priority:** P1 (the headline new requirement) · **Status:** completed · **Depends on:** P05 (catalog)
**Context:** research report §4 + user #3: "kịch bản phải dựa vào dự án… không phải dự án nào cũng trình
bày theo 1 barem mẫu." Length 45–60s **adaptive**, scene mix fits the project, no padding.

## Problem
`build-director-prompt.ts` CONTRACT pushes a near-fixed ARC (~10–13 scenes) + a fewshot with title=100,
problem=100 frames. Result: projects risk looking same-shaped and text scenes are too long/slow.

## Target
1. **Content-richness signal** → scene budget. Derive richness from `ComponentInventory.items.length`
   (+ usageType) → `sparse | moderate | rich`. Map to a scene budget + length band:
   - sparse → 7–9 scenes, ~45s
   - moderate → 9–11 scenes, ~50–54s
   - rich → 11–14 scenes, ~56–60s
   "Length follows content. NEVER pad with filler scenes to reach a number."
2. **Shape by usageType** — extend `USAGE_FLOW` into a fuller "story shape" per type (which scene types to
   favor / avoid). CLI→terminal/sequence/code-to-ui; SaaS-analytics→bento/charts/metric-banner;
   content-app→feed/cards/split-hero; commerce→pricing-tiers/product-card; SDK→code-to-ui/code-snippet.
   Explicitly: don't force `ui-bento` unless dashboard-like (already hinted — strengthen).
3. **Per-type pacing** — guidance + renderer:
   - Prompt: text-only scenes shorter (title ~70f, problem ~80f, stat ~70f, outro ~95f); content scenes
     keep room to read (160–260f). Update the fewshot to reflect shorter text scenes.
   - Renderer: text entrances settle fast (P03) so the held state is brief; tighter easing for text.

## Related code files
- Modify: `src/direct/build-director-prompt.ts` — add richness→budget table + per-type story shapes +
  pacing guidance; update FEWSHOT durations; add the 10 new primitives to the catalog (with P05).
- Modify: `src/shared/types.ts` — if needed, add `richness?` to `ProjectBrief` (computed) OR compute
  inline from inventory in `buildDirectorPrompt` (simpler, DRY — prefer inline, no schema churn).
- Check: `src/direct/` brief builder — where inventory is available to compute richness.
- Optional: `src/shared/validate-storyboard.ts` — soft-check totalSeconds within [42,62]; warn (not hard
  fail) if scene count wildly off the budget (don't over-constrain the LLM).
- Modify: `src/render/scenes/text-scenes.tsx` — ensure short-scene pacing (works with P03).

## Implementation steps
1. Add `function richness(inventory): "sparse"|"moderate"|"rich"` (by item count thresholds) inside the
   director module; inject a "SCENE BUDGET" block into the prompt from it.
2. Expand `USAGE_FLOW` map → per-type story shapes naming preferred/avoided scene types + the new
   layout primitives (split-hero/code-to-ui/metric-banner/timeline).
3. Add an explicit "PACING" section to CONTRACT with the per-scene-type frame ranges; rewrite FEWSHOT to
   shorter text scenes (title 70, problem 80…).
4. Strengthen "no padding / length follows content / don't force bento" rules.
5. (Optional) soft totalSeconds clamp/warn in validator.
6. `npx tsc --noEmit` + tests green.

## Todo
- [ ] richness signal → scene-budget block in prompt
- [ ] per-usageType story shapes (favor/avoid + new templates)
- [ ] PACING section + shorter text-scene frames
- [ ] update FEWSHOT durations
- [ ] "no padding, length follows content, don't force bento" rules
- [ ] (opt) soft totalSeconds warn in validator
- [ ] typecheck + tests

## Success criteria
A CLI repo and a data-dashboard repo produce **visibly different** storyboards (different scene types,
counts, lengths). Sparse projects come out ~45s & lean; rich ones ~58s. Text scenes feel snappy. Verify by
running the analyze→brief→direct path on two contrasting repos and diffing the storyboards.

## Risks
LLM ignores budget → keep guidance firm + give the richness number explicitly; soft validator warn as
backstop. Over-constraining kills variety → bands/ranges, not exact counts. Don't add schema fields if
inline computation suffices (avoid 319-test churn).
