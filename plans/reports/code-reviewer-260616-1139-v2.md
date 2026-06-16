# Code Review — AutoDemo v2 "UI-recreation" surface

Date: 2026-06-16 · Reviewer: code-reviewer · Scope: v2 additions only (v1 pipeline assumed reviewed)

## Scope
- Files: src/shared/{primitive-names,storyboard-schema,types}.ts; src/inspect-ui/* (9); src/render/ui-kit/* (5); src/render/{background,icons,scenes/ui-recreation-scenes,theme}; src/direct/{build-director-prompt,director}.ts; src/server/pipeline.ts
- Focus: correctness bugs, security, clear simplifications (no style nits)
- Typecheck + 100 tests reportedly green

## Overall Assessment
v2 is cohesive and well-structured. Registry/enum sync is correct, no eval, no leftover capture/playwright module, scrub ordering is sound. **One critical render-crash class** (untrusted primitive props with no per-primitive shape validation), plus a few medium correctness gaps. Director output is structurally validated but the *contents* of `props` are wholly untrusted at render time.

---

## CRITICAL

### C1. Untrusted primitive `props` crash the render — no per-primitive validation
**Files:** `src/shared/storyboard-schema.ts:131-134`, `src/render/scenes/ui-recreation-scenes.tsx:14-18`, consumed in `data-viz.tsx:35,52,75`, `chrome.tsx:35,55`, `interaction.tsx:16`

`PrimitiveElement.props` is `z.record(z.string(), z.any()).default({})`. Zod accepts ANY object shape. `validate-storyboard.ts` never inspects props. `renderEl` then spreads them raw into the component: `<Cmp theme delay {...props} />`. Several primitives dereference required array/number props with NO defaults:

- `BarChart` (`data-viz.tsx:35-37`): `Math.max(...values, 1)` — if Director emits `{"primitive":"bar-chart","props":{}}`, `values` is `undefined` → `TypeError: undefined is not iterable` → **entire Remotion render aborts** (not just one scene).
- `LineChart` (`data-viz.tsx:52-55`): same `...values`; also `values.length - 1 === 0` for a single value → divide-by-zero → `NaN` in path → silent blank.
- `DonutChart` (`data-viz.tsx:75`): `percent` undefined → `Math.round(NaN)` → renders "NaN%".
- `Table` (`chrome.tsx:35`): `columns`/`rows` undefined → `.length` / `.map` throw.
- `KanbanColumn` (`chrome.tsx:55`): `cards.map` throws if `cards` missing.
- `SidebarNav` (`chrome.tsx:10`): `items.map` — but `SidebarSpec` IS zod-validated, so sidebar is safe; only the freeform `props` path is exposed.
- `ChatBubble` (`interaction.tsx:16`): `from`/`text` undefined → typing slice on undefined throws (`typed(undefined,...)` → `.slice` on undefined).

The prompt asks for correct props, but the repair loop only feeds back *validator* errors — and the validator can't see prop-shape problems, so a malformed-prop board passes validation, gets written to storyboard.json, and dies at render with a stack trace the user sees.

**Fix (pick one):**
1. Preferred — make each `PrimitiveElement` a discriminated union with a typed `props` schema per primitive (e.g. `bar-chart` → `{values: z.array(z.number()).min(1)}`). Then validator catches bad props and the repair loop can fix them. Most robust; keeps Director honest.
2. Cheaper — defensive defaults + guards in each primitive: `values = []` then `if (!values.length) return null`; `columns = []`, `rows = []`, `cards = []`, `percent = 0`, `from = "ai"`, `text = ""`. Prevents crash but renders empty/odd surfaces silently.
3. Belt-and-suspenders — wrap `renderEl`'s `<Cmp/>` in a Remotion error boundary so one bad primitive can't abort the whole video.

Recommend (1) for the props that are structurally required (`values`, `columns`/`rows`, `cards`, `percent`, chat `from`/`text`) since those are exactly the ones that throw.

---

## HIGH

### H1. `injectDesign` blindly overwrites Director `meta`, can drop required fields → repair loop churn
**File:** `src/direct/director.ts:25-41`

`injectDesign` does `obj.meta = { ...(obj.meta ?? {}), theme, accent, accent2, design }`. If the Director omitted `meta.title` or `meta.totalSeconds` (both required by `StoryboardMeta`, and the prompt says "meta needs: title, totalSeconds"), injection preserves the omission and validation fails on `meta.title`/`meta.totalSeconds` — wasting repair attempts on something the Director may keep getting almost-right. Not a crash (caught + repaired), but the design injection masks nothing here; it's just that meta merge can't supply those. Low-cost improvement: when `obj` is not an object or `meta` missing, surface a clearer validator error. Minor — note only.

More important: if Gemini returns valid JSON that is an **array** (`[...]`) or a primitive, `JSON.parse` succeeds, `typeof obj === "object"` is true for an array, and `obj.meta = ...` sets a `.meta` property on the array. `validateStoryboard` then fails cleanly (no `scenes`), so it self-heals via repair — acceptable, but worth a guard `!Array.isArray(obj)` for clarity.

### H2. `scrubDeep` strips zod branding / can drop `meta.design` ordering is correct but fragile
**File:** `src/direct/director.ts:70-71`

`scrubDeep(result.storyboard)` deep-clones into plain objects then `scrubbed.meta.design = design` re-attaches the (already-validated) profile. This is correct *because* `design` is re-assigned after the scrub — good. But `scrubbed` is typed as `Storyboard` while `scrubDeep` returns a structurally-cloned `T` that is no longer the parsed zod object; any consumer relying on it being the parsed instance (none currently) would break. Also `scrubDeep` runs over `design` strings too on the first pass, then they're replaced by the un-scrubbed `design` object on line 71 — meaning a secret accidentally embedded in `design.logo`/palette would survive. Palette values are hex (safe) and `logo` is a local basename (safe), so no real leak today, but the re-assignment bypasses the scrub for that subtree. Acceptable given the data, flag for awareness.

---

## MEDIUM

### M1. `toHex` HSL regex can misfire on bare hex-less numeric strings / `rem` radius edge
**File:** `src/inspect-ui/color-utils.ts:18`

The HSL/triplet regex `(\d+(?:\.\d+)?)\s*[, ]\s*(\d+...)%\s*[, ]\s*(\d+...)%` requires two `%`. Fine. But a shadcn var value like `0 0% 100%` (achromatic) parses to white correctly. A value like `222.2 47.4% 11.2%` works. No bug — but note `toHex` tries hex *first*, so `#fff` won't be misread. OK. Lower-confidence: a CSS var value `oklch(...)` or `rgb(... / .5)` returns null silently and the role falls back — acceptable by design.

### M2. `parseCssTokens` shadcn `--radius` is usually `rem`, often `0.5rem` → 8px; but `--radius` may be `0.625rem` etc. Fine. However `r.includes("rem")` also true for `"0.5remx"` garbage — negligible.
**File:** `src/inspect-ui/parse-css-tokens.ts:69-73` — no action; noting the heuristic.

### M3. `parseTailwind` regex `[^}]*` for nested color/borderRadius blocks fails on nested objects
**File:** `src/inspect-ui/parse-tailwind.ts:19,48`

`["']?${key}["']?\s*:\s*\{([^}]*)\}` matches up to the FIRST `}`. For `primary: { DEFAULT: '#fff', foreground: { ... } }` the inner `{` breaks the match (stops at first inner `}`), so `DEFAULT` may still be captured if it precedes the nested object, else missed. By-design best-effort (comment says so) and design-profile falls back — acceptable. No eval confirmed (regex only). No injection risk: config is read as text, never executed. **Security: PASS.**

### M4. `deriveAccentFromSvg` reads SVG as text and only matches `fill:`/`stop-color:` with `#hex` — misses `rgb()`/named colors and `style=""` blocks
**File:** `src/inspect-ui/grab-brand.ts:40`

Misses `fill="rgb(...)"`, `fill="red"`, and CSS classes. Best-effort; falls back to default accent. No bug. Note: it derives accent from the *best SVG among candidates* (line 70) which may differ from the copied logo (line 62) — intentional per comment, but means accent and logo can visually mismatch. Minor product concern, not correctness.

### M5. `classifyComponents` partial-match coercion is greedy / order-dependent
**File:** `src/inspect-ui/classify-components.ts:53-54`

`for (const [k,v] of Object.entries(ALIASES)) if (n.includes(k)) return v;` — first alias key *contained anywhere* in the name wins, iterating object insertion order. E.g. a primitive name `"navbar-search"` contains `"nav"` (→ sidebar-nav) before reaching `"search"` (→ input-field). Order-luck classification. Also `n.includes(k)` with short keys like `"bar"`, `"nav"`, `"list"`, `"grid"` over-matches (`"grid"` matches "bento-grid"-ish, `"bar"` matches "toolbar","sidebar"). Result is a *valid* primitive (never crashes — coerced or dropped), just possibly wrong choice. Cheap improvement: sort alias keys by length desc before the partial loop, and/or require word-boundary match. Low impact (cosmetic mapping), medium-ranked because it silently degrades inventory quality.

### M6. `JSON.parse` in `normalizeItems` can throw — but it's inside the try/catch? No — it's NOT
**File:** `src/inspect-ui/classify-components.ts:21-29` vs `79-85`

`normalizeItems(raw)` calls `JSON.parse(raw)` and `z.array(LooseItem).parse(arr)` (both can throw). It is called at line 84 **inside** the `try` block that wraps `generateRawJson` + `normalizeItems`, and the `catch` returns `null`. ✅ Correct — confirmed no uncaught throw into the pipeline. Good. (Listing to confirm the checklist item: classify never throws into pipeline.)

---

## LOW

### L1. Stale unused pipeline stage `"capture"` in type union
**File:** `src/shared/types.ts:65` — `PipelineStage` still includes `"capture"` though v2 has no capture stage and nothing emits it. Harmless; remove for cleanliness. (No capture/ module, no playwright/puppeteer refs found — confirmed clean.)

### L2. `LineChart` width/height fixed at 420×200 but rendered inside flex-centered showcase — fine; single-point NaN covered in C1.

### L3. `Particles` pseudo-random `(Math.sin(i*…)*43758.5453) % 1` — JS `%` keeps sign; `Math.abs` applied after, OK. Deterministic. No bug.

### L4. `hexA` and `hexToRgb` only accept 6-digit hex; 3-digit shorthand from `toHex` is always expanded to 6 first, and palette is `DesignProfile`-validated (strings, not enforced hex). If a non-hex palette value slips in (e.g. CSS `--text: rgb(...)` that `toHex` resolved — it always resolves to #rrggbb, so safe). `hexA` passes through non-hex unchanged (line 73) → would yield invalid CSS but not crash. Acceptable.

### L5. `detect-font` returns raw `@font-face` family or next/font name unsanitized into `fontStack("${name}")` (theme.ts:22) — injected into inline CSS `fontFamily`. Name comes from repo source, not user runtime input, and is wrapped in quotes; a crafted font name with `"` could break the font string but only affects local render aesthetics. Negligible. Note for completeness (input-from-repo boundary).

---

## Checklist verification
- Registry ↔ PRIMITIVE_NAMES sync: **PASS** — `UI_KIT` keys exactly match the 14 names; `Record<PrimitiveName, …>` makes drift a compile error. No runtime-null from name drift.
- `{...props}` spread risk beyond defaults: **C1** — required props missing → crash, not just defaults.
- parse-tailwind eval: **PASS** — regex only, config never executed.
- color-utils correctness: PASS (hex-first ordering, HSL/rgb covered).
- classify/design-profile fallbacks throw into pipeline: **PASS** — both catch and fall back (`null` → fallbackInventory; design-profile is all best-effort with defaults, no network throw path).
- injectDesign + scrubDeep ordering: **PASS** — design re-attached after scrub (director.ts:71).
- Leftover capture/playwright: **PASS** — none (only the unused `"capture"` enum value, L1).
- Auth/N+1/data-leak: N/A (no DB, no auth surface in v2). Secret scrub runs on Gemini inputs (classify) and final storyboard — PASS.

---

## Recommended Actions (priority order)
1. **C1** — add per-primitive prop validation (discriminated union) OR defensive defaults+guards in the 6 throwing primitives; ideally also an error boundary in `renderEl`. Blocking for production.
2. **M5** — sort ALIASES by key length desc / word-boundary match to stop greedy mis-mapping.
3. **H1** — guard `!Array.isArray(obj)` in `injectDesign`.
4. **L1** — drop unused `"capture"` from `PipelineStage`.

## Unresolved Questions
- Does the Remotion render harness already wrap scenes in an error boundary upstream of `renderEl`? If yes, C1 downgrades from "whole-video crash" to "blank scene" (still HIGH, not CRITICAL). Could not confirm from the v2 surface — check `Trailer.tsx` / `render-trailer.ts`.
- Are the 100 passing tests exercising malformed `props` at render, or only well-formed Director output? If only happy-path, C1 is untested.

---

**Status:** DONE_WITH_CONCERNS
**Summary:** v2 structure is solid (registry sync, no eval, scrub ordering, no capture leftovers all verified), but untrusted `PrimitiveElement.props` are spread into render-time components with no per-primitive validation — a missing `values`/`rows`/`cards`/`percent`/`from` aborts the whole Remotion render (C1, critical). Recommend typed per-primitive props or defensive guards before shipping.
