# Phase 5 — Director v3 + integrate + verify

**Priority:** P0 (the payoff) · **Status:** pending · **Depends:** 2, 3, 4

## Overview
Connect everything: the Director consumes the APPROVED brief + usageType, grounds every detail in it,
picks from the big kit + animations, and stops inventing install/CTA. Verify accuracy on real repos.

## Key insights
- The approved brief is the contract — Director must not contradict it (no invented install/links/features).
- usageType picks the flow template; conditional CTA removes fake URLs.
- Big catalog needs concise per-primitive prop docs so Gemini fills them right (group by use, not dump all 40).

## Requirements
- Director input = approved ProjectBrief (+ DesignProfile + inventory). Prompt:
  - Flow templates by usageType: sdk→`code-snippet`(real import)→result; api→`api-exchange`; cli→terminal→progress→result;
    web-app→feature `ui-sequence`; mobile→`mobile-frame` flow; library→code-snippet + feature cards.
  - **Conditional outro**: cta only if brief.links present; else a tagline. NEVER invent a url/github.
  - Use brief.suggestedBeats as the spine; fill props from brief specifics only.
  - Catalog: list primitives grouped w/ 1-line prop hints; allow `anim` hints.
- Env model already supported (`AUTODEMO_DIRECTOR_MODEL`); document in README.
- Validator: add rule — outro.cta must not look like a URL unless brief had links (soft → warn/repair).

## Related files
- Edit: `src/direct/build-director-prompt.ts` (v3: brief + usageType templates + big catalog + conditional CTA),
  `src/direct/director.ts` (take brief), `src/server/pipeline.ts` (pass approved brief), validator tweak.
- Edit: `README.md` / `docs/` (brief gate, env model, usage), tests for new schema/primitives/validator.

## Implementation steps
1. Rewrite director prompt v3 (usageType flow templates, grounded-in-brief, conditional CTA, grouped catalog).
2. director.ts consumes ProjectBrief; pipeline passes the approved (possibly edited) brief.
3. Validator: conditional-CTA rule; bump primitive count; keep registry-drift guard.
4. Update tests (vitest) + docs (README brief gate + env model + open-source usage).
5. **Verify accuracy** end-to-end: trackly (sdk → code-snippet, NO npx, NO fake url), AutoDemo (cli),
   a Next/shadcn app (web feature flow), an API repo if available. Eyeball frames.
6. code-reviewer + tester + finalize (project-manager/docs-manager), commit offer, journal.

## Todo
- [ ] Director prompt v3 (brief + usageType templates + conditional CTA + grouped big catalog)
- [ ] director.ts + pipeline consume approved brief
- [ ] validator conditional-CTA + counts; tests green
- [ ] README/docs (brief gate, env model, OSS usage)
- [ ] verify on sdk/cli/web (+api) repos — accurate, varied, no invented facts
- [ ] code-reviewer + tester + finalize

## Success criteria
- Trackly trailer: SDK usage shown via code-snippet, no fake terminal install, no fake URL; matches the approved brief.
- Editing the brief visibly changes the trailer; trailers feel varied + professional across types.
- Tests green; docs reflect v3; env model switch documented.

## Risks
- Catalog too long → Gemini overwhelmed: group + keep hints terse; rely on brief.suggestedBeats to focus.
- Accuracy regressions → the brief gate is the backstop (user catches before render).
