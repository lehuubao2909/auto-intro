# Phase 3 — New scene types + schema/validator

**Priority:** P0 · **Status:** pending · **Depends:** P2

## Overview
Wire the primitives into the storyboard contract: new UI-recreation scene types + upgrade existing
scenes to the new visual language (SVG icons, backgrounds). Extend zod schema + validator + Trailer map.

## Key insights
- Replace capture-era `ui`/`demo` (media-ref) with recreation scenes that reference **ui-kit primitives + data**.
- Keep title/problem/feature-montage/architecture/techstack/stat/outro but route through SceneBackground +
  Icon (no emoji). techstack uses simple-icons logos.
- Meta gains a `DesignProfile` (palette/font/radius/mode) so the renderer themes per project.

## New / changed scene types
- `ui-showcase` — one primitive (e.g. `dashboard`/`chat`/`chart`) built in, with caption. Replaces `ui`.
- `ui-bento` — BentoGrid of 3–6 primitive tiles (the signature dashboard beat). Replaces `demo`.
- `ui-sequence` — 2–3 primitives revealed in turn (light flow feel, no real clicks).
- Each references primitives by registry name + a small `data` payload (labels/values/items).

## Related files
- Edit: `src/shared/storyboard-schema.ts` (add DesignProfile to meta; add ui-showcase/ui-bento/ui-sequence;
  deprecate media-based ui/demo), `src/shared/validate-storyboard.ts` (rules for new types; drop media-registry
  checks; keep techstack-required, no-3-text-in-row, length, etc.).
- Edit: `src/render/Trailer.tsx` (map new types → ui-kit), scene components for upgraded title/problem/etc.
- Remove: `media` registry plumbing from render path (kept harmless or deleted).

## Implementation steps
1. Schema: add `DesignProfile` meta block; define ui-showcase/ui-bento/ui-sequence (primitive name + data).
2. Validator: new rules (≥1 UI-recreation scene; bento tiles 3–6; primitive name exists in registry).
3. Trailer: render new types via ui-kit registry; route all scenes through SceneBackground.
4. Upgrade title/problem/stat/outro/feature-montage/architecture/techstack to icons+bg (no emoji).
5. Author a HAND storyboard (idealized recreation of a generic SaaS) → render → tune to NeuraFlow polish.

## Todo
- [ ] Schema: DesignProfile + 3 new scene types; deprecate media ui/demo
- [ ] Validator rules for new types (+ keep quality bar)
- [ ] Trailer map + SceneBackground routing
- [ ] Upgrade existing scenes (icons/bg, no emoji)
- [ ] Hand storyboard → render → polish

## Success criteria
- One render from a hand storyboard yields a varied, on-brand recreated-UI trailer (bento + showcase +
  techstack-with-logos + stat), passes validator + Quality bar.

## Risks
- Schema churn vs v1 validator tests → update tests in P7.
- Primitive-name typos from Director → validator rejects unknown names → repair loop (P6).
