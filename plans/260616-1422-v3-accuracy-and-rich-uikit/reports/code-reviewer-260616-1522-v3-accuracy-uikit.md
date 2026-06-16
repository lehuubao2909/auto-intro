# Adversarial Review — AutoDemo v3 (accuracy gate + 26 primitives + motion/FX + Director v3)

Scope: detect-usage-type, build-brief/render-brief-md, types, pipeline/server/cli, build-director-prompt/director, ui-kit {frames,dev,data-extra,surfaces}, lib/motion+fx, scene-frame, ui-recreation-scenes.
Focus: crash-safety (render-abort), accuracy guarantees, correctness, server state.
Baseline: `tsc --noEmit` clean.

## Architecture note (read first)
The ONLY crash defense for the 26 LLM-driven primitives is `ElementBoundary` in ui-recreation-scenes.tsx. Props are typed `z.record(z.string(), z.any())` (storyboard-schema.ts:132) — NO per-prop validation. So any primitive prop can be wrong-typed/missing. ElementBoundary catches RENDER-phase throws → renders null (good). It does NOT catch: (a) throws inside `useEffect`, (b) `delayRender` handles left dangling. Those abort the whole headless render. That makes the Shiki path (CRITICAL-1) the top risk.

---

## CRITICAL

### C1 — CodeSnippet: dangling `delayRender` aborts the entire video on bad/edge props
`src/render/ui-kit/dev.tsx:29-94`
`delayRender()` is called unconditionally in the `useState` initializer (line 34) during render. `continueRender(handle)` only runs inside the `useEffect` (line 38/47). Two abort paths:
1. If CodeSnippet throws during render AFTER line 34 but before mount (e.g. `code`/`lang` is a non-string from the LLM and something downstream throws, or `theme` access), the effect never runs → handle never continued → Remotion `delayRender` TIMES OUT → render ABORTS. ElementBoundary catches the visual throw but the orphaned delayRender handle still kills the render.
2. `lang` arrives as a non-string (e.g. number/object). `codeToHtml(code, { lang })` rejects; `.catch` sets fallback html and `.finally` continues — OK. BUT if `code` is a non-string, `code.replace` in the catch (line 46) throws inside the promise `.catch` callback → unhandled rejection, and arguably `.finally` still runs. The bigger issue is the early `if (!code) { continueRender(handle); return; }` (line 38): if `code` is `0`, `false`, or `""` it short-circuits fine, but if `code` is an object/number, `!code` is false, `codeToHtml` gets a non-string → may throw synchronously BEFORE returning a promise → `.then/.catch/.finally` never attach → handle dangles → ABORT.
Fix: (a) coerce at entry: `const codeStr = typeof code === "string" ? code : ""; const langStr = typeof lang === "string" ? lang : "text";` and use those. (b) Wrap the `codeToHtml(...)` call in try/catch so a synchronous throw still calls `continueRender(handle)`. (c) Guard line 90 fallback `code.replace` with the coerced string. Belt-and-suspenders: register the delayRender with a timeout and always continue in a cleanup.

### C2 — Render-phase throws in non-`renderEl` scene trees are NOT boundary-protected
`src/render/Trailer.tsx:25-54`, `src/render/scenes/ui-recreation-scenes.tsx:16-35`
ElementBoundary only wraps primitives reached via `renderEl` (ui-showcase/-bento/-sequence). SidebarNav is rendered DIRECTLY in `AppFrame` (ui-recreation-scenes.tsx:47), and ALL other scene types (Code, FeatureMontage, Architecture, Table, etc.) render unwrapped in `Trailer`. Those are zod-validated so lower risk, but there is no top-level boundary: a single unhandled render throw anywhere aborts the whole mp4. Recommend wrapping each `<Series.Sequence>` child in a scene-level error boundary (render null/last-good frame) so one bad scene degrades gracefully instead of aborting. At minimum wrap SidebarNav in ElementBoundary too.

---

## HIGH

### H1 — CodeDiff: `.length` on possibly-non-array props before Array guard
`src/render/ui-kit/dev.tsx:264-272`
`added`/`removed` default to `[]`, but the LLM can send a string or object. `Math.max(added.length, removed.length, 1)` (line 272) reads `.length` (string len works, object→undefined→`Math.max(undefined,...)=NaN`), then `removed.map`/`added.map` (lines 290/302) THROW if not an array. Render-phase throw → caught by ElementBoundary (renders null) so not an abort, but the primitive silently vanishes. Inconsistent with sibling primitives that all do `Array.isArray(...)` guards.
Fix: `const safeAdded = Array.isArray(added) ? added : []; const safeRemoved = Array.isArray(removed) ? removed : [];` then derive maxLen/maps from those.

### H2 — ApiExchange: `method.toUpperCase()` throws if `method` is non-string
`src/render/ui-kit/dev.tsx:99,106,141`
`method` defaults to `"GET"` but LLM may emit a number/object. `method.toUpperCase()` (line 106 and 141) throws on non-string. Caught by ElementBoundary (null render), but again silent vanish.
Fix: `const m = typeof method === "string" ? method : "GET";` use `m.toUpperCase()`. Same defensive coercion for `endpoint`/`response` (rendered as children — non-string objects rendered as React children throw "Objects are not valid as a React child" → boundary null). Coerce to string.

### H3 — Sparkline: NaN/non-finite values poison the SVG path → invisible/abort-ish
`src/render/ui-kit/data-extra.tsx:100-130`
Guards `Array.isArray && length>=2` (line 108) but does NOT validate element types. If `values` contains strings/NaN/null, `Math.max(...values,1)`/`Math.min` yield NaN, `(v-min)/range` → NaN, `p[1].toFixed(1)` produces `"NaN"` in the path `d` (line 116). SVG with `d="MNaN,NaN..."` doesn't throw but renders nothing — acceptable. However `values.map((v,i)=>[...])` assumes numbers; mixed types just produce NaN coords (no throw). LOW-ish but flag: coerce `const nums = values.filter(v => typeof v === "number" && isFinite(v)); if (nums.length < 2) return null;`. Same untyped-number risk in Leaderboard (line 223 already coerces with `typeof === "number" ? : 0` — good), bar-chart/line-chart/donut (verify those original primitives similarly).

### H4 — Calendar: unvalidated `month`/large arrays from `new Date` are fine, but `MONTHS[safeMonth-1]` ok; real gap is `highlights` element types
`src/render/ui-kit/surfaces.tsx:88-103`
`safeMonth` clamped 1..12 (good, line 93). `safeHighlights` Array-guarded (line 94). `safeHighlights.includes(day)` is safe. No crash. OK — included only to confirm it's clean.

---

## MED

### M1 — `hexA` throws if a theme color is null/undefined/non-string
`src/render/theme.ts:72` — `hex.trim()` throws on non-string. Theme comes from DesignProfile (zod-validated strings) so normally safe, but `themeFromProfile` (theme.ts:44) trusts `p.palette.*` and `p.font`. If a future code path builds a Theme from partial data, every `hexA`/`glassSurface` call across all primitives throws on EVERY frame → unrecoverable abort (theme failure is above ElementBoundary). Cheap hardening: `if (typeof hex !== "string") return "transparent";` at top of hexA.

### M2 — Server two-stage state: `analysis` mutated/replaced with no guard between stages
`src/server/server.ts:54-92`
Single-job model uses module-scoped `running`/`analysis`. Races/footguns:
- `/api/analyze` sets `running=true` synchronously then runs async; `analysis=null` is set, populated in `.then`. If the analyze promise REJECTS, `.catch` broadcasts error but `analysis` stays `null` and `running` resets false. Client that then POSTs `/api/approve` gets 400 "run analyze first" — correct, but there's no signal that analyze FAILED vs never-ran. Minor UX.
- `POST /api/brief` mutates `analysis.brief` (line 75) with NO `running` check. If a render (approve) is in-flight using `a.brief` (captured by value reference at line 87 `const a = analysis`), editing the brief mid-render mutates the SAME object the renderer's Director call may still read (direct() is async). `const a = analysis` copies the reference, not the brief — so `analysis.brief = parsed.data` REPLACES the field but `a` still points at the old AnalysisResult whose `.brief` was reassigned → `a.brief` sees the NEW brief. Editing brief during an active approve render can change Director input mid-flight. Guard `POST /api/brief` with `if (running) return 409`.
- `/api/storyboard` POST (line 99) checks `running` but does NOT require `analysis` — fine (re-render from raw storyboard is independent), just note it bypasses the approval gate entirely (by design).

### M3 — `history=[]` reset races with live SSE writers
`src/server/server.ts:57,85,104`
Each stage start does `history = []`. SSE clients added during the previous stage still hold `reply.raw`; new broadcasts append to the new array — fine. But a client connecting mid-reset replays `history` (events line 48) which may be momentarily empty, losing the "start" event ordering. Cosmetic; single-user local tool. Note only.

### M4 — Director CTA guard is sound but relies on LLM compliance, not enforced
`src/direct/build-director-prompt.ts:90-93`
`hasLink` correctly gates: real cta only when `brief.links.url||repo` exists, else instructs a tagline and "NEVER a fabricated url/github" (good accuracy design). BUT this is PROMPT-only — nothing in `validateStoryboard` rejects an outro `cta` that looks like a URL when `brief.links` is empty. A non-compliant model could still emit `cta:"github.com/foo"`. For a hard accuracy guarantee, add a validator rule: if brief had no links, error on outro.cta matching `/https?:\/\/|github\.com|\.(com|app|io|dev)\b/`. Currently accuracy is "best-effort via prompt," not "deterministically guaranteed." (Director doesn't receive brief.links separately at validate time — would need plumbing.)

### M5 — `injectDesign` repair loop: design survives but `meta.totalSeconds`/scrub interplay ok
`src/direct/director.ts:25-72` — on each repair, `injectDesign` re-parses raw and re-adds `meta.design`; final `scrubbed.meta.design = design` (line 71) re-asserts post-scrub. Correct. No bug — confirming. One nit: if the model returns a top-level JSON ARRAY, `injectDesign` returns `{parsed: obj}` with obj being the array and the `!Array.isArray` guard skips meta injection → validateStoryboard fails on schema → repair. Handled. OK.

---

## LOW (note, don't fix)

- L1 `data-extra.tsx:53` WorldMap `Math.min(Math.max(0, points ?? 4), 8)` — if `points` is non-number (string), `Math.max(0,"x")`→NaN→`Math.min(NaN,8)`→NaN→`slice(0,NaN)`→`[]` (no markers, no crash). Fine but coerce for clarity.
- L2 `data-extra.tsx:279` Heatmap `Math.max(1, Math.min(weeks??26,52))` same non-number→NaN→`Math.max(1,NaN)`=NaN→loop `w<NaN` false→0 cells→empty svg. No crash.
- L3 `surfaces.tsx:168` ProfileCard `stats` items render `st.value`/`st.label` as children — if an item is `{value:{}}` object → React-child throw → ElementBoundary null. Coerce to String() for resilience. Same for Feed item.title (surfaces.tsx:65), MetricGrid m.value (data-extra.tsx:164), PricingTiers tier.price (surfaces.tsx:304). All caught by boundary → silent-null, not abort.
- L4 `dev.tsx:48` CodeSnippet effect cleanup sets `alive=false` but never `continueRender` in cleanup — see C1.
- L5 `frames.tsx` MobileFrame/BrowserWindow accept `children` but Director catalog says they "WRAP a child" — schema PrimitiveElement has no children field; the Director cannot actually nest a primitive inside a frame via JSON (props.children would be raw, not a rendered element). So mobile-frame/browser-window will render EMPTY chrome. Functional gap, not a crash. Worth a follow-up: either drop them from the catalog or add a nested-element prop the renderer expands.
- L6 `detect-usage-type.ts:28` `.slice(0,30)` caps package.json scan — fine. `name.replace(/^@[^/]+\//,"")` strips scope; `npx ${name}`/`npm i ${name}` use UNscoped name (line 42/60) — for a scoped pkg `@foo/bar` install becomes `npm i bar` which is WRONG (should be `npm i @foo/bar`). Accuracy bug: install hint can be incorrect for scoped packages. MED-worthy actually — see M6 below.

### M6 (promote from L6) — scoped-package install command is wrong
`src/analyze/detect-usage-type.ts:37,42,60`
`name` strips the npm scope (`@scope/pkg`→`pkg`). `install` then emits `npx pkg` / `npm i pkg`, which fails for scoped packages and misleads viewers — violates the "never invent / always accurate" guarantee for install commands. Keep the full package name for the install string (strip scope only for display titles). Fix: use `rootPkg.name` (unstripped) in the install template; keep stripped `name` for the SDK/library display only.

---

## Accuracy guarantees — verdict
- install/links nullable + deterministic: YES (RepoFacts.install `z.string().nullable().default(null)`, ProjectLinks optional). buildBrief copies facts.links/usageType verbatim (build-brief.ts:46-47), LLM only writes narrative. SOLID — except M6 (scoped pkg install string is factually wrong).
- Director cannot fabricate URL when links empty: PROMPT-enforced only, not validator-enforced (M4). Acceptable risk for v3 but not a hard guarantee.
- Conditional CTA logic: sound (build-director-prompt.ts:90-93).
- LLM brief invention: bounded — factual fields come from facts, not the model. Good.

## Crash-safety — verdict
- 26 primitives: render-phase throws all land in ElementBoundary → null (no abort). Confirmed for all of frames/data-extra/surfaces.
- Real abort vectors: C1 (Shiki delayRender dangling — fix required), C2 (no boundary on non-renderEl scenes/SidebarNav), M1 (theme-level hexA throw bypasses boundary).
- H1/H2 cause silent-vanish (not abort) but should be fixed for output quality + consistency with sibling guards.

## Must-fix list (blocking)
1. C1 — CodeSnippet: coerce code/lang to string + try/catch around codeToHtml so `delayRender` is ALWAYS continued (prevents render abort).
2. C2 — Add a scene-level error boundary (or wrap each Series.Sequence + SidebarNav) so an unhandled throw degrades to null instead of aborting the mp4.
3. H1 — CodeDiff: Array.isArray-guard added/removed before .length/.map.
4. H2 — ApiExchange: coerce method/endpoint/response to string.
5. M1 — hexA: return safe value on non-string input (theme-failure protection above the boundary).
6. M6 — detect-usage-type: don't strip npm scope from install command (accuracy).

Recommended (non-blocking): M2 (409-guard POST /api/brief during render), M4 (validator-enforce no-URL CTA), H3/L3 string/number coercion, L5 frames-children gap.

## Unresolved questions
1. Does Remotion's headless renderer treat a render-phase throw caught by an error boundary as success (frame renders null) — confirmed by React semantics, but has it been smoke-tested with a deliberately-malformed primitive prop end-to-end? The 198 tests pass `tsc`/unit but I didn't see an integration test feeding garbage props through `renderTrailer`. Recommend one.
2. Is there any global `delayRender` timeout override? If default (~30s) and Shiki is slow under render concurrency, C1's dangling-handle abort could also manifest as a timeout even on the happy path.
3. mobile-frame/browser-window (L5): intended to wrap children but schema has no children mechanism — was nesting deferred?

**Status:** DONE_WITH_CONCERNS
**Summary:** 26 primitives are render-throw-safe via ElementBoundary, but C1 (Shiki delayRender can dangle → full render abort) and C2 (no boundary on non-renderEl scenes) are real abort vectors; accuracy guarantees are solid except scoped-package install (M6) and prompt-only (not validator-enforced) CTA (M4).
**Concerns:** 2 CRITICAL + 4 must-fix (H1/H2/M1/M6) before shipping v3. No code changed — report only.
