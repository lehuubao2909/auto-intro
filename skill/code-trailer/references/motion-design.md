# Motion design — easing, timing, type, layout

Detailed craft for making a code trailer feel intentional. Mechanics (how to call `interpolate`,
`spring`, `Sequence`) belong to remotion-dev/skills; this is *how to use them tastefully*.

## Easing — the feeling of motion

| Intent | Curve | Remotion |
|---|---|---|
| Element enters and settles | ease-out / decelerate | `spring({fps, frame, config:{damping:200}})` or `Easing.out(Easing.cubic)` |
| Element leaves | ease-in / accelerate | `Easing.in(Easing.cubic)` |
| Playful settle (small bounce) | underdamped spring | `spring({..., config:{damping:12, stiffness:120}})` |
| Continuous bg drift (rare) | linear, very slow | only behind nothing-to-read |

Rules: **never linear for things the eye tracks** — it reads robotic. Entrances decelerate; exits
accelerate. Keep one motion vocabulary across the trailer (don't mix bouncy and calm randomly).

## Timing & stagger

- **Entrance length:** 8–18 frames (at 30fps) for a single element. Slower for big hero type, faster
  for small supporting bits.
- **Stagger:** offset sibling elements by **4–8 frames** so they cascade, not pop together. A list of
  3 lines: line1 at f0, line2 at f6, line3 at f12.
- **Hold:** after the last element settles, hold **≥ the reading floor** (`max(1.2s, words*0.3s)`)
  before transitioning. This single rule fixes most "too fast" trailers.
- **Transitions between scenes:** 8–14 frames. Cross-fade is safe; a directional slide/wipe adds
  energy — use the same one consistently.

## Type scale (1080p stage; scale proportionally for other sizes)

| Role | Size px | Weight | Notes |
|---|---|---|---|
| Hero / title | 90–130 | 700 | tight letter-spacing (~ -0.02em) |
| Scene lead line | 56–72 | 700 | one per scene, the dominant element |
| Supporting / sub | 28–36 | 400–500 | clearly smaller; lower contrast |
| Caption / eyebrow | 20–24 | 500 | uppercase, tracked out, accent or muted |
| Code | 26–32 mono | 400 | generous line-height ~1.5 |
| Big stat number | 140–200 | 700 | count-up animation if numeric |

Family: **Google Sans Flex** (Inter fallback) for UI text; a mono family for code. One family for
all non-code text.

## Layout & safe zones

- **Safe zone:** all text inside the inner ~90% (≥ 5% margin per edge). For vertical/social, keep the
  top ~12% and bottom ~12% clear of essential text (platform chrome).
- **Composition:** anchor the lead line on a clear horizontal third; don't center everything every
  time — vary anchor between scenes for rhythm, but keep it deliberate.
- **One focal point per scene.** Background stays quiet (flat dark, or a very subtle gradient/grain).
  No busy patterns behind text.

## Code scenes specifically

- Show ≤ 16 lines. Dim non-highlighted lines (e.g. opacity 0.35) and bring the `highlight` region to
  full opacity; optionally a subtle scale/translate to center the active region.
- If multiple highlight regions, move focus between them **sequentially** with a short hold on each —
  never highlight two regions at once.
- Reveal options: whole block fades in then focus moves; or lines type/wipe in small groups. Either
  way, respect the reading floor for the highlighted region.

## Anti-slop quick reference

- Too fast → increase holds to the reading floor.
- Chaotic → stagger; animate one thing; quiet the background.
- Robotic → ease-out/spring in, ease-in out.
- Flat → add hierarchy (size + weight + contrast), not more motion.
- Cluttered code → trim to the hero function, focus one region, add a caption.
