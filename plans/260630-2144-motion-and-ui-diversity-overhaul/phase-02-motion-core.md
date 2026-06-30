# Phase 02 — Motion core: stagger + composable transforms + real parallax + spring

**Priority:** P0 (foundation for P03/P04) · **Status:** completed
**Context:** research report §3 + §8. Two motion files exist: `lib/timing.ts` (entrance/exit/pop/riseY)
and `lib/motion.ts` (enter variants, countUp, typewriter, tilt3d, fake `parallax`). Extend, don't duplicate.

## Gaps
- **No stagger** helper (the #1 missing primitive — needed for "reveal in order, not all at once").
- **No composable entrance** — `enter()` returns one variant; user wants fade∘slide∘parallax combined.
- **`parallax()` is a global sine-drift**, not depth-based/entrance parallax.
- No reusable `springEnter` (only `pop` exists in timing.ts).

## Additions (in `src/render/lib/motion.ts`)
```ts
// per-item start frame (interpolate) — index*4 default; spring variant index*5
export const stagger = (i: number, base = 6, step = 4) => base + i * step;

// composable entrance: fade ∘ slide-in ∘ parallax-rise → single CSS style
export function composeEnter(frame: number, opts?: {
  start?: number; dur?: number; slideX?: number; riseY?: number; easing?
}): React.CSSProperties; // opacity:t, transform: translate((1-t)*slideX,(1-t)*riseY), willChange

// real depth parallax (subtle): mult 0.15/0.3/0.5 by depth; drives translateY over scene progress
export const parallaxY = (frame: number, sceneDur: number, depth = 0.3, amp = 40) =>
  (frame / sceneDur) * amp * depth;

// guarded spring entrance (user #5): gentle config, no aggressive bounce
export function springEnter(frame: number, fps: number, delay = 0,
  cfg = { damping: 30, stiffness: 60 }): number; // 0→1
```
- Keep existing `enter`, `countUp`, `typewriter`, `tilt3d` (still used). **Deprecate** the sine
  `parallax()` (leave for back-compat or migrate callers if any — grep first).
- `timing.ts` stays the easing base; `motion.ts` builds on it. No duplicate `entrance` logic.

## Implementation steps
1. `grep -rn "parallax(" src/render` — find callers of the old drift; migrate or leave deprecated.
2. Add `stagger`, `composeEnter`, `parallaxY`, `springEnter` to `motion.ts` with doc-comments.
3. Ensure all are pure functions of (frame, …) — no Date/random.
4. If `motion.ts` >200 LOC after additions, split text helpers (`typewriter`) into `lib/text-motion.ts`
   and re-export, OR keep if under. (Currently 60 LOC → room to grow.)
5. `npx tsc --noEmit` clean. Add a tiny unit test that `stagger`/`parallaxY` are monotonic & deterministic.

## Todo
- [ ] grep old `parallax()` callers
- [ ] add `stagger`
- [ ] add `composeEnter` (fade∘slide∘parallax)
- [ ] add `parallaxY` (depth-based)
- [ ] add `springEnter` (guarded config)
- [ ] keep deterministic; typecheck; unit test helpers

## Success criteria
New helpers compile, are deterministic (same frame → same output), and are consumable by P03/P04.
`springEnter` overshoot is mild (damping 30/stiffness 60) so it suits the flat/corporate feel.

## Risks
Spring keyed off `useCurrentFrame()` drifts if a scene isn't wrapped in `<Sequence>` (frame must be
scene-local). Note for P04: verify scene/element frame origins. Mitigation: pass explicit `delay` and
test inside a Sequence.
