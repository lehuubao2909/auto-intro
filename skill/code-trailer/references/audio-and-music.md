# Audio — music & sound effects (no voiceover)

With no narration, audio does the emotional work. Two layers: a music bed and a few sound effects.

## Licensing (non-negotiable)

Use only **royalty-free / properly licensed** music and SFX. Never commercial/chart tracks, never
song clips. Good sources: a bundled royalty-free pack, or libraries with clear free-use licenses
(e.g. Pixabay Music, Uppbeat free tier, YouTube Audio Library). Keep an attribution note where the
license requires it. AI-generated music is fine only if its license permits commercial reuse — for a
6-day build, a curated royalty-free pack is lower-risk than wiring up a generator.

## Choosing the bed

- Match **mood + BPM** to the story arc. A code-trailer arc is usually calm intro → rising build →
  brief peak → resolve. Pick a track that already has that shape, or trim one phrase to fit ~60s.
- Mood keys (resolve `meta.music` to a track tagged like this): `tense-build`, `clean-uplift`,
  `minimal-tech`, `warm-product`, `driving-electronic`.
- 90–120 BPM reads "modern product"; slower for serious/enterprise tone, faster for energetic.

## Syncing cuts to the beat

- If `meta.bpm` is known, frames-per-beat = `fps * 60 / bpm`. Snap major scene transitions to beat
  boundaries — even loosely aligning cuts to the beat makes the whole thing feel produced.
- Put the biggest visual moment (architecture build finishing, the stat count-up landing) on a
  musical accent/downbeat.
- **Resolve, don't chop.** End on a phrase ending or a clean fade over the outro (~0.5–1s fade-out).
  A hard cut mid-phrase feels broken.

## SFX palette (sparing)

Treat SFX as punctuation — **3–6 in the whole trailer**, not one per element.

| Cue | Use on |
|---|---|
| `whoosh` | a major scene transition (e.g. into the title, into architecture) |
| `riser` | building into the peak moment (just before architecture resolves / stat lands) |
| `tick` / `thock` | a code line/region snapping into focus, a chip appearing |
| soft `impact` | the outro logo/name settling |

Keep SFX **quieter than** you think — they should feel felt, not heard. Duck or trim so they never
mask the music's downbeat.

## Levels

- Music bed sits low enough to feel like a bed (it's the only continuous layer, so it can be fairly
  present, but avoid peaking). SFX a touch above the bed at their moment, then gone.
- Add a short fade-in at the very start (~0.3s) and fade-out on the outro (~0.5–1s) so nothing
  begins or ends abruptly.

## In Remotion

Use `<Audio src={...} />` for the bed (trim with `startFrom`/`endAt`), and short `<Audio>` instances
inside the relevant `<Sequence>` for each SFX so they're frame-locked to the visual. Mechanics:
see remotion-dev/skills `audio` rules.
