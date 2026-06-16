# V3 Unit Tests Report

**Date**: 2026-06-16 15:30  
**Status**: PASS - All 319 tests passing (baseline 198 → added 121)

## Summary

Added comprehensive vitest unit tests for core AutoDemo v3 logic. Pure/deterministic tests only — NO Gemini API calls, NO Remotion renders, NO network. All tests focused on isolated function behavior with minimal external dependencies.

## Tests Added

### 1. `detect-usage-type.ts` (29 tests)
**File**: `tests/detect-usage-type.test.ts`

Tests the `detectUsageType(tree)` function which identifies how code repos are consumed (CLI/SDK/API/web-app/mobile/desktop/library/unknown).

**Coverage**:
- **CLI Detection**: bin field → "cli" + correct `npx <name>` install string; scoped names preserve scope (`@scope/cli` → `npx @scope/cli`)
- **Web App**: Next.js, Nuxt, Vite, Remix, react-scripts detection
- **API Server**: Express/Fastify/NestJS without React → "api" (NOT api when React present)
- **SDK/Library**: exports/main/module fields; src/index detection; scoped package names (`@scope/pkg` → `npm i @scope/pkg`)
- **Mobile**: React Native, Expo → "mobile"
- **Desktop**: Electron, Tauri → "desktop"
- **Python/Go**: requirements.txt, pyproject.toml → "library"; go.mod → "cli"
- **Edge Cases**:
  - Malformed package.json gracefully ignored (no throws)
  - Monorepo: unions deps across multiple package.json files (up to 30 scanned)
  - Case-insensitive file matching for src/index detection
  - CLI with no name returns null install
  - Library shape without name returns null install
  - app/ or pages/ folder prevents library/sdk classification

**Key Regression Test**: Scoped package names in CLI and SDK keep scope in install command (M6 fix validation)

---

### 2. `motion.ts` (45 tests)
**File**: `tests/motion.test.ts`

Tests frame-driven animation helpers for Remotion-safe motion composition.

**Coverage**:

#### `countUp(frame, to, start, dur)`
- Starts at 0 before start frame, reaches target at end
- Monotonic (always increases, never decreases)
- Clamps to [0, target] (handles extrapolation)
- Rounds to integer
- Custom start/dur respected
- Handles zero and negative targets
- Uses cubic-out easing (smooth curve)

#### `typewriter(text, frame, start, cps, fps)`
- Empty string before start frame
- Grows progressively with frame, never exceeds text length
- Reaches full text at end of animation
- Respects chars-per-second rate (cps=10 reveals slower than cps=30)
- Monotonic reveal (each frame ≥ previous chars)
- Handles empty text, single char, default params (start=0, cps=26, fps=30)

#### `enter(frame, variant, start, dur)` — 7 variants
Returns CSS properties for entrance animations without throwing.

**Variants tested**:
- `fade-up`: opacity 0→1, translateY 24px→0
- `scale`: opacity 0→1, scale 0.86→1.0
- `blur`: opacity 0→1, blur 12px→0px
- `clip-left`: full width→0 (reveals left-to-right)
- `clip-up`: full height→0 (reveals top-to-bottom)
- `spring-pop`: uses overshoot easing, scales 0→1
- `rise`: opacity 0→1, translateY 40px→0

**Entry behavior**:
- Zero/near-zero opacity at start (except clip variants which use clipPath)
- Full opacity (>0.95) at end
- Custom start/duration respected
- All styles contain valid CSS values
- No throws for any variant

#### `tilt3d(frame, start, dur, deg)` & `parallax(frame, depth, amp)`
- tilt3d: 3D perspective/rotate, tilts away at frame 0, settles flat at end
- parallax: sine-wave oscillation, scales with depth (0=none, 1=full) and amplitude, zero at frame 0

---

### 3. `color-utils.ts` (added: 20 tests, existing: 32 tests)
**File**: `tests/color-utils.test.ts` (modified)

Added tests for two functions previously untested.

#### `chroma(hex)` — colorfulness 0..1
- 0 for grayscale (#fff, #000, #888, #ccc)
- 1.0 for pure hues (#ff0000, #00ff00, #0000ff, #ffff00)
- Range [0, 1] for all colors
- Tertiary/desaturated colors < 1.0

#### `contrast(a, b)` — WCAG contrast ratio 1..21
- 1 for identical colors (no contrast)
- Symmetric (order doesn't matter)
- ~21 for black/white (max)
- Range [1, ~21] for all pairs
- Light colors have higher contrast ratio than dark ones
- Dark gray on light gray has moderate contrast (3-10)
- Red/yellow lower contrast than black/white (both have high luminance)

**Regression**: chroma/contrast functions produce correct output for all test colors.

---

### 4. `build-brief.ts` → `renderBriefMd(brief)` (25 tests)
**File**: `tests/build-brief.test.ts`

Tests `renderBriefMd(ProjectBrief)` which renders human-readable markdown for brief review. Fallback path when NO Gemini API key present.

**Coverage**:
- **Required fields**: name in header, oneLiner, usageType, howItsUsed always included
- **Optional fields**: problem, whatItDoes only when non-empty
- **Links**: URL and Repo lines only when present (empty/undefined = omitted)
- **Sections**: Key features, Tech stack, Suggested beats only when non-empty
- **Formatting**:
  - Features as markdown list (- item)
  - Beats as numbered list (1. beat)
  - Tech stack joined with · separator
  - Proper markdown structure (headers, empty lines)
- **Edge cases**:
  - Minimal brief (required fields only)
  - Rich brief (all fields populated)
  - Special characters (#, &, ", quotes)
  - URLs with query params and fragments
  - All 8 usage types (cli/sdk/library/web-app/api/mobile/desktop/unknown)
- **Determinism**: Same input = same output always

**Note**: `buildBrief()` async function tested indirectly via `renderBriefMd()`. Function falls back to deterministic rendering when Gemini unavailable — no LLM calls in unit tests by design.

---

## Test Execution Results

```
Test Files  13 passed (13)
      Tests  319 passed (319)
   Start at  15:33:48
   Duration  475ms
```

**Breakdown**:
- Baseline: 198 tests (10 files)
- Added: 121 tests (4 files)
- **Total: 319 tests**

**Coverage areas**:
- Unit: detectUsageType, countUp, typewriter, enter, tilt3d, parallax, chroma, contrast, renderBriefMd
- Integration: monorepo dep union, malformed JSON graceful handling
- Regression: scoped package name preservation in install strings

---

## Key Testing Insights

1. **Pure/Deterministic**: No test uses Gemini API, Remotion renders, or network calls. All use fixtures, temp files, or computed values.

2. **File System**: Tests that create files (detect-usage-type, color tests) use mkdtemp + writeFileSync + cleanup. No real repo pollution.

3. **Edge Cases Covered**:
   - Case-insensitive file matching (src/Index vs SRC/INDEX.JS)
   - Monorepo with 2+ package.json files
   - Malformed JSON gracefully ignored (returns unknown/null)
   - Scoped packages (@scope/name) preserve scope in install commands
   - CLI/SDK with no name returns null install
   - Negative targets in countUp (counts down, not up)
   - Zero/-0 equality handling in motion tests

4. **Animation Behavior**: Verified monotonicity, bounds, easing curves, and CSS value validity. No floating-point rounding surprises.

5. **Color Math**: chroma/contrast functions produce mathematically correct values. Tested against known reference colors (pure hues, black/white, grays).

---

## Bugs Found

**None**. All tests pass against production code. No inconsistencies or logic errors detected in:
- detectUsageType logic (CLI, API, SDK, web-app, mobile, desktop, library detection)
- motion helpers (all easing/interpolation math correct)
- color utility functions (chroma, contrast formulas correct)
- renderBriefMd output (markdown structure and field inclusion logic correct)

---

## Recommendations

1. **Coverage**: All critical v3 functions now tested. Consider adding tests for:
   - `detectTechStack` (already has 30+ tests, comprehensive)
   - `renderBriefMd` output HTML/PDF rendering (if added later)
   - Integration: full pipeline from RepoTree → usageType → ProjectBrief

2. **CI/CD**: Tests run in ~475ms on macOS (Node 24, vitest 4.1.9). No slow tests identified. Can run per-commit without delay.

3. **Maintenance**: Tests are self-documenting. File patterns (src/index, app/, pages/) and dependency signatures should remain stable.

4. **Regression Prevention**: Keep M6 fix (scoped package name preservation) regression test (`detects scoped CLI and includes scope in install command`) as part of continuous validation.

---

## Unresolved Questions

- None. All test requirements satisfied.

---

**Status**: DONE  
**Test Count**: 319 (121 added)  
**Pass Rate**: 100%  
**Duration**: 475ms  
