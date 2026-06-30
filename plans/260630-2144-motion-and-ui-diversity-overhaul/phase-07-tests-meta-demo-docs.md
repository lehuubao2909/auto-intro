# Phase 07 — Tests + meta-demo + docs

**Priority:** P1 (gate) · **Status:** completed · **Depends on:** P01–P06
**Context:** lock in the work; prove it visually on AutoIntro's own intro; keep docs honest.

## Scope
1. **Tests green + extended**
   - All 319 existing tests pass (schema/validator/director/render).
   - Add: motion-helper unit tests (`stagger`/`parallaxY`/`composeEnter`/`springEnter` deterministic).
   - Add: garbage-props render tests for the 10 new primitives (no abort).
   - Add: a director test asserting two contrasting briefs (CLI vs analytics, sparse vs rich) yield
     different scene-type sets / lengths (richness logic).
2. **Meta-demo (visual proof)**
   - Re-render AutoIntro's own intro via the real pipeline AND/OR the hand-crafted fixture, with the new
     calm bg + content motion. Compare against the current `out/` video.
   - Spot-check 2 contrasting repos (e.g. a CLI + a dashboard) end-to-end to confirm adaptivity.
3. **Docs**
   - Update `docs/system-architecture.md` + `docs/codebase-summary.md`: motion core, calm background,
     adaptive director, new primitive count (42 → 52).
   - Update `skill/code-trailer/SKILL.md` + `references/storyboard-schema.md` if scene/primitive guidance
     changed.
   - Note the motion guardrails (no per-char opacity, frame-deterministic, parallax 0.2–0.5).

## Related code files
- `tests/*` (add motion + new-primitive + adaptivity tests)
- `fixtures/*` (optionally refresh the hand-crafted intro to use new components)
- `out/*` (re-rendered videos — git-ignored; for review only)
- `docs/system-architecture.md`, `docs/codebase-summary.md`, `skill/code-trailer/*`

## Implementation steps
1. `npx vitest run` — fix any regressions from P01–P06.
2. Add new unit/render/director tests.
3. Render the meta-demo; eyeball: calm bg? content stagger/parallax visible? text snappy? Adaptive length?
4. Run analyze→direct on a CLI repo and a dashboard repo; confirm different storyboards.
5. Update docs to match shipped reality (not aspiration).
6. Optional: `code-reviewer` pass on the diff; then offer to commit via `git-manager`.

## Todo
- [ ] 319 existing tests green
- [ ] motion-helper unit tests
- [ ] new-primitive garbage-props tests
- [ ] director adaptivity test (CLI vs dashboard differ)
- [ ] re-render AutoIntro intro (visual proof)
- [ ] 2 contrasting repos end-to-end
- [ ] docs updated (architecture/summary/skill)
- [ ] code-review + commit

## Success criteria
All tests pass; meta-demo visibly calmer-bg + richer-content-motion than current; CLI vs dashboard intros
differ in shape & length; docs reflect 52 primitives + new motion system.

## Risks
Visual quality is subjective → review the actual render, don't trust the diff alone. Re-render is slow
(Chromium) → budget time. Don't mark done until the video is watched.
