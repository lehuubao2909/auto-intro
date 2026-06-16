# Phase 1 — Render layer + validator (THE GUARANTEED WIN)

**Priority:** P0 (de-risk) · **Status:** pending · **Depends:** P0

## Overview

Stand up a Remotion project with one generic scene component per `scene.type` + a `<Trailer>`
composition that reads a Storyboard JSON via `inputProps`. Drive from a **hand-written** storyboard +
placeholder media → render a polished `.mp4`. Also write the **storyboard validator** (code-side
enforcement of the skill's quality rules). After this phase a great-looking video exists regardless of
analysis/capture quality.

## Key insights

- Renderer = generic, one component per `scene.type` — NOT bespoke per repo (skill rule).
- `bundle()` once → `selectComposition()` → `renderMedia({ serveUrl, inputProps, codec:'h264' })`.
  Storyboard passed via `inputProps`. `concurrency = os.cpus().length`.
- `<OffthreadVideo>` for clips, `<Img>` for stills. Cap concurrency when clips present (OOM).
- Audio deferred: `<Audio>` hook present but no-op if `meta.music` asset absent.
- Validator encodes `storyboard-schema.md` §Validation + SKILL Quality bar → reused by Director (P3).

## Requirements

- 10 scene components: `title problem ui demo feature-montage architecture techstack code stat outro`.
- Theme `cinematic-dark`: near-black bg, accent `#41A3EF`, accent2 `#FCCE50`, Inter/Google Sans.
- Motion: `useCurrentFrame()` + `spring()`/ease; entrances ease-out, exits ease-in, never linear;
  stagger 4–8 frames. Safe zone inner ~90%. Ken-Burns 1.0→1.06 for `ui` stills.
- `architecture`: render Mermaid (build-in) → static SVG/image in-frame. `techstack`: badge montage.
  `code`: Shiki highlight, ≤14 lines, 1 highlight region.
- Render API entry: `src/render/render-trailer.ts` → `(storyboard, mediaDir, outPath) → mp4`.

## Architecture

```
src/render/
  Root.tsx                  # registerRoot; <Composition id="Trailer" ...>
  Trailer.tsx               # maps scenes[] → <Sequence> per scene
  scenes/                   # one file per scene.type (title.tsx, ui.tsx, ...)
  components/               # BrowserFrame, KenBurnsImg, BadgeRow, MermaidDiagram, CodeBlock(Shiki)
  theme.ts                  # tokens (colors, type scale, easing, safe zone)
  render-trailer.ts         # bundle + renderMedia programmatic entry
src/shared/validate-storyboard.ts  # zod + rule checks; returns {ok, errors[]}
```

## Related code files

- Create: all under `src/render/**`, `src/shared/validate-storyboard.ts`.
- Create test fixtures: `fixtures/hand-storyboard.json` (from skill example), `fixtures/media/*` (placeholder png/webm).
- Read: `skill/code-trailer/references/{motion-design,storyboard-schema}.md`, `assets/example-storyboard.json`.

## Implementation steps

1. Init Remotion (follow `remotion` skill / remotion-dev). `Root.tsx` registers `Trailer` (1920×1080@30).
2. `theme.ts` tokens. `Trailer.tsx`: iterate `scenes`, place each in `<Sequence durationInFrames>` with
   `transitionIn`; compute offsets.
3. Implement scene components (start text-only: title/problem/stat/outro → then ui/demo/feature-montage
   /techstack → then architecture/code). Each: eased entrance, safe zone, one accent.
4. `components/`: `KenBurnsImg`, `BrowserFrame` (rounded corners), `BadgeRow`, `MermaidDiagram`
   (render mermaid to SVG at build), `CodeBlock` (Shiki static highlight).
5. `validate-storyboard.ts`: zod schema + rule checks (≥1 ui/demo, has techstack, 10–13 scenes,
   text floor `frames/fps ≥ max(1.0, words*0.25)`, no 3 text-scenes in a row, ≤1 code/arch, totalSeconds
   45–70). Returns structured errors (reused by Director repair loop).
6. `render-trailer.ts`: `bundle()` → `selectComposition()` → `renderMedia()` h264, concurrency=cpus,
   cap to ~half when any media is a clip.
7. Render `fixtures/hand-storyboard.json` → `out.mp4`. Eyeball against Quality bar; iterate scenes.

## Todo

- [ ] Remotion project + Root + Trailer composition
- [ ] theme.ts tokens
- [ ] 10 scene components (text → ui/montage/tech → arch/code)
- [ ] shared components (KenBurns, BrowserFrame, BadgeRow, Mermaid, Shiki CodeBlock)
- [ ] validate-storyboard.ts (zod + rules)
- [ ] render-trailer.ts programmatic render
- [ ] Hand storyboard + placeholder media → polished out.mp4
- [ ] Self-check vs Quality bar

## Success criteria

- One `npm run render` produces a 45–60s `.mp4` that *looks produced* (eased motion, varied layouts,
  not one-note) from a hand-written storyboard + placeholder media.
- `validate-storyboard` rejects a deliberately bad storyboard with actionable errors.

## Risks

- Mermaid-in-Remotion rendering fiddly → pre-render mermaid to SVG/PNG before the frame, embed as `<Img>`.
- Render perf with clips → cap concurrency; keep scenes simple; benchmark.

## Next

P3 Director emits storyboards validated by this validator; P4 capture feeds the media registry.
