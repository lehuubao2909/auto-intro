# Code Review — v4 Motion & UI Diversity Overhaul

Date: 2026-06-30 · Reviewer: code-reviewer (Staff Eng, production-readiness pass)
Scope: 14 modified + 2 new files (templates.tsx, director-adaptivity.test.ts). ~436 insertions.
Gates: `npx tsc --noEmit` → exit 0 (clean). `npx vitest run` → 329/329 pass.
Focus: correctness + regressions (per request), not style.

## Verdict
One CRITICAL color-math regression in the new background (wrong hue for purple/violet brand
accents — renders from scene 0, deterministic, but visually wrong, not a crash). Everything
else in the change set is correct: determinism holds, parallax/spring frame-origin assumptions
are sound, templates self-guard against malformed props, no dead FX imports, schema/validator/
registry stay in lockstep. Fix the one bug and this is shippable.

---

## CRITICAL — must fix

### C1. `shiftHue` HSL→RGB sextant is wrong → purple/violet accents get a magenta/pink background glow
File: `src/render/background/scene-background.tsx:42`

```ts
else if (h < 300) { rr = c; bb = x; } else { rr = c; bb = x; }
//                  ^^^^^^^^^^^^^^^  WRONG — duplicates the [300,360) branch
```

The `[240,300)` sextant must be `rr = x; bb = c;` (red=min, blue=max). As written it sets
`rr = c; bb = x;`, which swaps the R and B channels — exactly the same expression as the final
`else` branch, so two adjacent sextants collapse onto one. The correct reference is the sibling
`hslToHex` in `theme.ts:101` (`else if (h < 300) { r = x; b = c; }`), which this function was
clearly adapted from but mis-copied.

Impact (verified empirically against `theme.ts` hslToHex):
- Any accent whose (section-shifted) hue lands in [240,300) — i.e. blue-violet / purple / indigo,
  a very common SaaS brand range — gets channel-swapped. Examples:
  - `#8b5cf6` (violet) → renders `#f65c8b` (pink/red)
  - `#c084fc` → `#fc84c0`; `#7c3aed` → `#ed3a7c`; `#a855f7` → `#f755a8`
- Wrong even at `deg = 0` (the first act, `SECTION_HUES[0] = 0`), so a purple-brand project shows
  the wrong CalmGlow color from the very first scene — not a rare edge.
- It's the background glow `c1`/`c2`, so the whole video reads off-brand for those projects.
- Deterministic, so it won't break Remotion (no abort) — purely a visual-correctness regression.

Fix: change the `h < 300` branch to `{ rr = x; bb = c; }`.

Stronger fix (recommended, DRY): this is a near-duplicate of `hexToHsl`+`hslToHex` already exported
from `theme.ts`. Delete the local copy and implement `shiftHue` as
`hslToHex(hexToHsl(hex).h + deg, …)` reusing the tested theme helpers, so the two HSL routines
can't drift again. (theme.ts's version is the one with test coverage and the correct sextant.)

Note: no unit test exercises `shiftHue` — that's why CI is green. A 1-line test asserting a purple
input round-trips at deg=0 would have caught this and guards the regression going forward.

---

## MEDIUM

### M1. `MapPins` hardcodes fps=30 instead of reading `useVideoConfig().fps`
File: `src/render/ui-kit/templates.tsx:198`
```ts
const t = pop(frame, 30, delay + stagger(i, 6, 5));   // 30 hardcoded
```
Every other spring caller (this file's `FeatureSpotlight:240`, `text-scenes.tsx`, `graphics-scenes.tsx`)
reads fps from `useVideoConfig()`. The whole pipeline currently renders at fps=30 (Root/meta/test-garbage),
so this is correct *today* and not a regression. But it's a latent bug: if a 60fps comp is ever added,
MapPins' pin-drop timing desyncs from the rest. Low blast radius; fix opportunistically — `MapPins`
already has no `useVideoConfig` call, so add `const { fps } = useVideoConfig()` and pass `fps`.

---

## LOW / informational

### L1. Director `props.delay` can override numeric delay → element silently invisible (degrades, no crash)
`ui-recreation-scenes.tsx:33` renders `<Cmp theme delay={delay} {...el.props} />` — the props spread
comes AFTER `delay={delay}`. Schema `props` is `z.record(z.any())` (storyboard-schema.ts:132), so a
Director emitting `props:{ delay: "abc" }` overrides the numeric delay; templates compute
`start: delay + stagger(...)` → string → `composeEnter` → NaN opacity → element renders invisible.
It does NOT throw (so ElementBoundary won't even fire) — it just disappears. Acceptable per the
"degrade, don't crash" bar, and the prompt never instructs emitting `delay`. Pre-existing pattern,
applies to all 52 primitives, not a v4 regression. If you want belt-and-suspenders: pull `delay`
out of the spread, or coerce with `num()` inside the hot templates.

### L2. `ElementBoundary` duplicates `RenderBoundary`
`ui-recreation-scenes.tsx:17` defines a second error boundary identical to `components/error-boundary.tsx`
`RenderBoundary` (which already wraps every scene in Trailer.tsx:82). Defense-in-depth is fine and even
desirable here (element-level isolation so one bad tile doesn't blank the whole scene), but it's a
copy-paste — prefer importing `RenderBoundary` to avoid two boundaries drifting. Non-blocking.

### L3. `DeviceMockupTrio` calls `composeEnter` twice for one element
`templates.tsx:157` evaluates `composeEnter(...)` once in the spread and again to read `.transform`
for the scale concat. Produces correct CSS (verified: `translate(0px, 28.75px) scale(0.96)`), just
redundant compute. Cosmetic.

---

## Verified correct (no action)

- **Determinism (Remotion-safe):** no `Date`/`Math.random` in any changed render file. `motion.ts`,
  `templates.tsx`, `animated-text.tsx`, `scene-background.tsx` are all pure frame/index functions.
  `motion.test.ts` asserts determinism for `parallaxY`/`springEnter`.
- **`parallaxY` guards:** clamps progress to [0,1]; `sceneDur > 0 ? … : 0` guards divide-by-zero
  (tested at `motion.test.ts:391`). `springEnter` config (damping 30 / stiffness 60) is a gentle
  settle, sane for the flat/corporate feel.
- **Spring/parallax frame-origin:** every scene is wrapped in `<Series.Sequence durationInFrames=
  {scene.durationInFrames}>` (Trailer.tsx:80), so `useCurrentFrame()` is frame-LOCAL (0 at scene
  start). `ParallaxLayer` uses `parallaxY(frame, scene.durationInFrames,…)` → p=0 at start, p=1 at
  end. Assumption holds. `UiShowcase` ParallaxLayer is correctly inside the Series.Sequence.
- **AnimatedWords = word-level only:** splits on `" "`, animates per-`<span>` word opacity via
  `composeEnter`; never per-character (honors the official Remotion rule). Guards `String(text ?? "")`.
- **MaskedReveal:** `Array.isArray(lines) ? … : [String(lines ?? "")]` guard; per-line overflow-hidden
  wipe via `translateY((1-t)*105%)`; optional `colors?.[i] ?? color` per-line. No layout breakage
  (each line in its own overflow:hidden box). Used by Problem with a 2-color map — fine.
- **Template prop guards:** `arr()/str()/num()` coerce every external prop; all array reads `.slice()`
  capped; `num()` returns null→fallback; `MapPins` clamps x/y to [2,98]; `TabSwitcher` clamps active
  to [0,len-1]. `scripts/test-garbage.ts` feeds all 10 templates malformed props (string/number/null)
  and asserts "no abort." Double-guarded by ElementBoundary + RenderBoundary regardless.
- **No circular import:** templates.tsx is self-contained (renders own mock UI, imports only
  theme/timing/motion/icon), imported BY ui-kit/index.ts — no back-edge. tsc clean confirms.
- **Schema/validator/registry parity:** `PRIMITIVE_NAMES` (52) is the single source; schema uses
  `z.enum(PRIMITIVE_NAMES)` so the 10 new names validate automatically; `UI_KIT` keys === names
  (parity test `ui-kit-primitives.test.ts:5` passes, length asserted 52). No drift.
- **Dead-import sweep:** no scene imports `GlowPulse`/`ParticleBurst`/`ScanLine`/`ShimmerSweep` (grep
  clean). Old sine `parallax()` fully removed (no references). `lib/fx.tsx` is now imported by NObody
  — it's intentionally opt-in per the file header; flag only as "currently unused module" (see Q1).
- **Director prompt:** no contradictions. richness boundaries (≤4 sparse / 5-9 moderate / 10+ rich)
  match the SCENE_BUDGET copy and the adaptivity test fixtures. CLI gets "AVOID dashboards/ui-bento",
  web-app gets "split-hero", SDK gets "code-to-ui" — assertions pass. PACING `ui-bento ~170-220` does
  not contradict "don't force ui-bento" (conditional vs prohibition). New templates present in catalog.
  CTA rule correctly forbids fabricated URLs when no link exists.

---

## Unresolved questions
1. `src/render/lib/fx.tsx` (DrawPath/ShimmerSweep/ScanLine/ParticleBurst/GlowPulse) is now imported by
   zero call sites. Header says "opt-in per scene" — is any scene expected to opt in this iteration, or
   should the module be kept purely as a library for future use? If nothing will use it short-term,
   consider a `// @keep` note so a future dead-code sweep doesn't delete it. Not blocking.
2. C1 fix preference: 1-line sextant correction vs. refactor to reuse theme.ts `hslToHex`/`hexToHsl`?
   The refactor removes the duplicate HSL routine (root cause of the drift) — recommend it, but it
   touches more lines.

Status: DONE_WITH_CONCERNS
Summary: One CRITICAL hue-math regression (`scene-background.tsx:42` — purple/violet brand accents
render a pink background glow, deterministic but off-brand from scene 0); all other v4 work
(determinism, parallax/spring frame-origin, template prop-guards, schema parity, dead-import removal)
verified correct, tsc clean, 329/329 tests pass.
Must-fix: `src/render/background/scene-background.tsx:42` — change `h < 300` branch to `{ rr = x; bb = c; }`.
