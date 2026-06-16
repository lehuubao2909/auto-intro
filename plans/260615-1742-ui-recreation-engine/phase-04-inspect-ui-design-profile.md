# Phase 4 — Inspect-UI: design tokens + brand

**Priority:** P1 · **Status:** pending · **Depends:** none (parallel to P1–P3)

## Overview
Extract the project's visual identity → `DesignProfile` that themes the trailer. Plus grab the brand
mark (logo / og-image) — the ONLY real assets kept.

## Key insights
- Most modern web repos expose tokens: `tailwind.config.*` (theme.colors/extend, fontFamily, borderRadius),
  CSS custom properties (`:root { --… }`), shadcn `globals.css`, theme/tokens files.
- Font: detect from tailwind/css/@font/next-font/package → map to a Google font loadable at render.
- Brand: `public/` favicon/logo/og-image, README hero image, `<meta og:image>`. Derive palette from logo
  if no tokens found (fallback).

## Requirements
- `DesignProfile`: `{ palette:{bg,surface,text,dim,accent,accent2}, font, radius, mode:'dark'|'light', glass:boolean }`.
- Deterministic parsers first; LLM only to disambiguate "which accent is primary" if needed.
- Brand grab: copy logo/og-image into work dir; expose path; derive dominant colors (simple pixel sampling)
  when tokens missing.

## Related files
- Create: `src/inspect-ui/{parse-tailwind,parse-css-vars,detect-font,grab-brand,derive-palette,design-profile}.ts`.
- Reuse: walk-repo, read-json-safe from analyze/.
- Output: merge into RepoFacts or a sibling `DesignProfile` persisted to `.autodemo/design-profile.json`.

## Implementation steps
1. `parse-tailwind` — read tailwind config (handle .js/.ts/.mjs via lightweight require/regex), pull colors/font/radius.
2. `parse-css-vars` — scan global css for `--background/--primary/--accent/--radius` (shadcn-style) + hex/hsl.
3. `detect-font` — tailwind fontFamily / `next/font` / @font-face / Google Fonts link → font name.
4. `grab-brand` — find logo/og-image; copy to work dir.
5. `derive-palette` — if tokens sparse, sample brand image for dominant + accent (no heavy deps; basic sampler).
6. `design-profile` — merge sources by priority (tailwind > css-vars > derived > default) → DesignProfile.

## Todo
- [ ] parse-tailwind (colors/font/radius)
- [ ] parse-css-vars (shadcn/:root tokens)
- [ ] detect-font → Google-font-loadable name
- [ ] grab-brand (logo/og-image) + derive-palette fallback
- [ ] design-profile merge (priority order) → persisted JSON

## Success criteria
- For a Tailwind/shadcn repo, DesignProfile captures the real accent + font + radius + mode.
- For a repo with no tokens, falls back to logo-derived or default palette without erroring.

## Risks
- Parsing TS/JS tailwind configs safely (no arbitrary eval) → prefer regex/AST-lite; tolerate failure → fallback.
- Font not on Google Fonts → fallback to nearest system/Inter.
