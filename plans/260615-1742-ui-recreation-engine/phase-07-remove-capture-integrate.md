# Phase 7 — Remove capture + integrate + meta-demo

**Priority:** P1 (ship) · **Status:** pending · **Depends:** P6

## Overview
Retire Playwright/capture, wire DesignProfile + inventory into the pipeline/server, fix tests/docs, and
produce the meta-demos in the new style.

## Key insights
- Pipeline becomes: analyze (RepoFacts) → inspect-ui (DesignProfile + brand) → component-inventory →
  direct → render. No capture stage, no dev-server spawn.
- Remove `playwright` dep + `src/capture/*` (or keep a thin brand-grab only, already in inspect-ui).
- Update v1 vitest suite for the new schema/scene types; keep validator/scrub/parse-mermaid tests.

## Requirements
- `pipeline.ts`: replace capture step with inspect-ui + component-inventory; pass DesignProfile + inventory to Director.
- Drop `src/capture/`, `run-app`, `capture-playwright`, `collect-repo-screenshots`; remove `playwright` from package.json + tsup externals; remove `npx playwright install` from docs.
- Server/UI unchanged functionally (still Generate → SSE → preview → download → edit→re-render).
- Update README/docs (no capture/auth/flow; explain recreation + per-project style + idealized caveat).

## Related files
- Edit: `src/server/pipeline.ts`, `package.json`, `tsup.config.ts`, `README.md`, `docs/*`, `tests/*`.
- Delete: `src/capture/**`, capture-related scripts.

## Implementation steps
1. Rewire `pipeline.ts` (analyze → inspect-ui → inventory → direct → render); update progress stages.
2. Remove capture code + Playwright dep; clean tsup externals; drop playwright-install docs.
3. Update vitest tests for new schema/scene types/validator; ensure green.
4. Update docs (system-architecture, codebase-summary, deployment) to v2.
5. Meta-demos: run on Lumino (todo) + AutoDemo itself → trailers in the new recreated-UI style.
6. `code-reviewer` + `tester` pass; finalize.

## Todo
- [ ] Rewire pipeline (no capture; inspect-ui + inventory)
- [ ] Remove capture/ + playwright dep + docs mentions
- [ ] Update tests (green) for v2 schema
- [ ] Update docs to v2
- [ ] Meta-demos (Lumino + AutoDemo) in new style
- [ ] code-reviewer + tester + finalize

## Success criteria
- `npx autodemo <repo>` (no Playwright) → recreated-UI trailer themed to the project, end-to-end.
- Tests green; docs reflect v2; Playwright fully removed.
- Meta-demos visibly match the NeuraFlow-style target.

## Risks
- Hidden capture imports → grep + typecheck after deletion.
- Test churn from schema change → budget time to rewrite affected tests.
