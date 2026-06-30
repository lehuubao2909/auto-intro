# Phase 03 — Text animation: split / stagger / masked reveal

**Priority:** P1 · **Status:** completed · **Depends on:** P02
**Context:** research report §3 + §8. `components/animated-text.tsx` (33 LOC) only does single-line
rise+fade (`AnimatedLine`). Weakest content layer. Text is a core focus per the user.

## Target
Add split-and-stagger text components (Remotion's own pattern: split by word/line, stagger each):
- **`AnimatedWords`** — split headline into words; each fades+rises with `stagger(i)`; optional
  `springEnter` per word (gentle). For titles/outro hero text.
- **`AnimatedLines`** — multi-line, staggered per line (replaces manual `delay={i*10}` in Problem).
- **`MaskedReveal`** — wrap each line in `overflow:hidden`, animate child `translateY 100%→0` (clean
  wipe-up, no opacity flicker). For title hero.
- **Keep `AnimatedLine`** (back-compat) — re-implement on top of `composeEnter`.
- **Typewriter stays string-slice** (existing `typewriter()` in motion.ts) — NEVER per-char opacity.

## Related code files
- Modify: `src/render/components/animated-text.tsx` — add `AnimatedWords`, `AnimatedLines`,
  `MaskedReveal`; keep `AnimatedLine`. If >200 LOC, split into `animated-text.tsx` + `masked-reveal.tsx`.
- Modify: `src/render/scenes/text-scenes.tsx` — `Title` uses `MaskedReveal`/`AnimatedWords`; `Problem`
  uses `AnimatedLines` (staggered); `Outro` words-staggered; keep `Stat` count-up + `pop`.
- Reuse: `lib/motion.ts` (`stagger`, `composeEnter`, `springEnter`), `lib/timing.ts` (`pop`).

## Implementation steps
1. Build `AnimatedWords({text, size, color, weight, delay, stepFrames})` — `text.split(" ")`, each word
   `display:inline-block` with `composeEnter(frame, {start: stagger(i), riseY})`. Opacity at WORD level
   (allowed), not char level.
2. Build `MaskedReveal({lines|children})` — per line: outer `overflow:hidden`, inner `translateY` from
   `(1-t)*100%`, `t = entrance(frame, stagger(i))`.
3. Build `AnimatedLines` — array of lines, staggered; reuse `AnimatedLine` internally.
4. Rewire `text-scenes.tsx` Title/Problem/Outro to new components; keep durations short (P06 sets the
   actual frame budgets; here just ensure entrances settle in ~12–15f so the hold is brief).
5. Confirm typewriter callers unchanged (still slicing). `npx tsc --noEmit` clean.

## Todo
- [ ] `AnimatedWords` (word split + stagger + word-level opacity)
- [ ] `MaskedReveal` (overflow-hidden line wipe)
- [ ] `AnimatedLines` (per-line stagger)
- [ ] keep `AnimatedLine` (on composeEnter)
- [ ] rewire Title/Problem/Outro
- [ ] typewriter still string-slice (no per-char opacity)
- [ ] typecheck

## Success criteria
Headlines reveal word-by-word / wipe-up; problem lines cascade; no per-character opacity anywhere;
text reads "snappy" (settles fast). Smoke-render a title + problem scene.

## Risks
Stagger span can exceed short scene durations (P06) → last word never finishes. Mitigation: cap total
stagger span < sceneDur − holdMin; keep `stepFrames` small (3–4). Many words → keep word-level (never
char-level) opacity for perf.
