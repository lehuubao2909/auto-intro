# Phase 05 — ~10 new layout-template primitives

**Priority:** P2 · **Status:** completed · **Before:** P06 (director catalog references these)
**Context:** research report §6. 42 primitives cover widgets; layouts repeat (mostly bento + sequence).
Add compositional/editorial templates so the same data feels fresh + stories vary by project.

## New primitives (10)
| name | shape (props) | best for |
|------|---------------|----------|
| `split-hero` | `{title, body?, element:{primitive,props}}` | landing-style copy + UI panel |
| `stacked-timeline` | `{steps:[{title, body?}]}` | "how it works" / process |
| `metric-banner` | `{metrics:[{label,value,suffix?}]} (2-4)` | big animated counters row |
| `quote-card` | `{quote, author?, role?}` | testimonial / callout |
| `before-after` | `{before, after, label?}` | animated wipe comparison |
| `device-mockup-trio` | `{screens:[{primitive,props}]} (2-3)` | 3 frames at parallax depths |
| `tab-switcher` | `{tabs:string[], panels:[{primitive,props}]}` | multi-view apps |
| `map-pins` | `{points?:[{x,y,label?}]}` | animated pin-drop (extends world-map) |
| `code-to-ui` | `{code, lang, element:{primitive,props}}` | SDK/dev tools: code → rendered UI |
| `feature-spotlight` | `{element:{primitive,props}, labels:string[]}` | one big primitive + orbiting labels |

Each uses P02/P03 motion (stagger, composeEnter, parallax depth) so they're alive by default.

## Related code files (move together — same discipline as the v3 42-primitive add)
- Modify: `src/shared/primitive-names.ts` — append 10 names to `PRIMITIVE_NAMES`.
- Modify: `src/shared/storyboard-schema.ts` — `PrimitiveElement` enum auto-covers (uses `PRIMITIVE_NAMES`);
  verify no per-primitive prop schema needed (props are `z.record(z.any())` — loose, OK).
- Create: `src/render/ui-kit/templates.tsx` (NEW module for these layout primitives; keep <200 LOC, split
  to `templates-a.tsx`/`templates-b.tsx` if needed).
- Modify: `src/render/ui-kit/index.ts` — register the 10 in `UI_KIT`.
- Modify: coercion/alias map (wherever primitive-name drift is normalized) — add sensible aliases.
- Modify: `src/direct/build-director-prompt.ts` — add to the PRIMITIVE CATALOG list (P06 also touches this).

## Implementation steps
1. Append names → `primitive-names.ts`. Run tests: enum/validator should still pass (names are data).
2. Implement components in `ui-kit/templates.tsx`, each `({theme, delay, ...props})`, wrapped so bad props
   never throw (the `ElementBoundary` in scenes already isolates, but guard inside too — coerce arrays).
3. Register in `ui-kit/index.ts`.
4. Add catalog lines to the director prompt (group "layout templates").
5. Add render smoke tests (garbage-props → no throw) for each new primitive.
6. `npx tsc --noEmit` + `npx vitest run` green.

## Todo
- [ ] 10 names in `primitive-names.ts`
- [ ] `ui-kit/templates.tsx` (10 components, prop-guarded, motion-aware)
- [ ] register in `ui-kit/index.ts`
- [ ] alias/coercion entries
- [ ] director catalog lines
- [ ] garbage-props render tests (no abort)
- [ ] typecheck + tests green

## Success criteria
All 10 render with real + garbage props without aborting; appear in director catalog; tests green.
Storyboards can now express landing/timeline/testimonial/code-to-ui layouts, not just bento.

## Risks
Registry/enum/validator drift → keep them in lockstep (single source = `primitive-names.ts`). Prop-shape
errors at runtime → guard inside each component (coerce arrays/strings) like CodeSnippet/ApiExchange fixes.
LOC: `templates.tsx` will be big — split by group to honor ≤200 LOC.
