---
name: code-trailer
description: >-
  Direct and produce a beautiful, FAST, informative "code trailer" — a 45–60s motion-graphics demo
  video built from a local repository, with on-screen text + real UI footage + music + SFX (no
  voiceover), rendered with Remotion. This is the DIRECTION / storytelling layer ON TOP of the
  official remotion-dev/skills (mechanics only). Use it WHENEVER the user wants to turn a repo,
  codebase, project, or product into a demo video / trailer / explainer / showreel — even if they
  don't say "Remotion" — and whenever a generated video is one-note, slow, or fails to explain what
  the app IS, what problem it solves, what it DOES, or what tech it uses. A trailer's non-negotiable
  job: a first-time viewer can answer What / Problem / What-it-does / How / Tech / Why by the end,
  primarily by SHOWING the real UI, not reciting text or quoting code. Treat this skill as the
  authority on story, pacing, visual variety, and what good looks like.
---

# Code Trailer — director's layer (v2)

Turns a **local repo** into a **45–60s trailer that actually explains the product**: real UI footage
+ kinetic text + a fast feature montage + a tech-stack beat + light motion graphics, set to music
with sparing SFX. **No voiceover.** Rendered deterministically with Remotion.

This is a **local-first** tool: the repo is read from a local folder, UI footage is captured by a
local headless browser (or pulled from repo screenshots), and the video is rendered on the user's
machine. Nothing is uploaded to a server. (Implications for how `ui`/`demo` scenes get their footage
are in `references/ui-capture.md`.)

## The one rule that matters most

A trailer is a FAILURE if, after watching once, a stranger can't answer these. Treat them as a
checklist the storyboard must satisfy — this is the fix for "nice motion, but I don't get what it is":

1. **What is it?** one-line identity — and show the product on screen, not just words.
2. **What problem** does it solve?
3. **What does it DO?** ← shown with **real UI** (the single most important beat).
4. **How does it work?** (brief — diagram or one mechanism).
5. **What tech** is it built with? (shown fast — badges/logos).
6. **Why care?** outcome + CTA.

If the storyboard can't answer all six, it is not done. Detail and arc patterns:
**read `references/storytelling.md`.**

## How this fits with other skills

- **Mechanics → `remotion-dev/skills`** (authoritative for `useCurrentFrame`, `spring`, `Sequence`,
  `<Audio>`, `<Video>`/`<OffthreadVideo>`, asset handling, render). Don't reinvent it.
- **Story / pacing / variety / quality → this skill.**
- **Brand (optional)** — reuse your project's palette/type tokens for a one-family look.

## The contract: Storyboard JSON

The LLM director emits a **Storyboard JSON**; a Remotion composition renders it (consuming captured
UI media). Full schema + scene fields + worked example: **read `references/storyboard-schema.md`.**
Durations are **frames** at `meta.fps`. Keep scenes small and single-purpose.

## Scene taxonomy — UI is the hero, code is optional

Mix these; do NOT make every scene centered-text-on-dark (that's the "one-note" trap). A dense,
informative default arc (~10–13 scenes for 45–60s, because pacing is fast):

- **title** — identity + promise, with the product visible behind/beside it. ~2.5s.
- **problem** — 1–2 punchy lines (not 3 slow ones). ~2.5–3s.
- **ui / demo** — **real screenshots or a short interaction clip of the app.** This is the beat that
  answers "what does it do". Use 2–4 of these across the trailer; they carry the most weight. Each
  2–3s, can Ken-Burns/pan/zoom a still or play a trimmed interaction.
- **feature-montage** — 3–5 features as rapid cuts (icon + 2–4 words each), ~0.8–1.2s per card,
  often over or beside UI. Replaces slow one-feature-per-scene.
- **architecture** — how it works, as a diagram that builds. ~3–4s. Keep it ONE clear mechanism.
- **techstack** — the stack as a fast badge/logo montage (e.g. Next.js · TS · MongoDB · D3). ~2–3s.
- **code** — OPTIONAL. Include ONE snippet only if the code IS the selling point (a core
  algorithm). Otherwise omit. ≤14 lines, one highlighted region, a caption. Never a filler snippet.
- **stat** — one number or one punchy fact (count-up if numeric). ~2.5s.
- **outro** — name + CTA (repo / live URL). ~3s.

Pick the set that answers the six questions. UI + feature-montage + techstack are what make it feel
*complete*; title/problem/architecture/outro give it shape; code is a spice, not a course.

## Pacing & rhythm — FAST and dense (this was the main flaw)

The old default (one short line held 8–9s, a plain graph for 11s) is too slow and too empty. Fix:

- Target **45–60s** but **pack more**: ~10–13 scenes, not 6–7.
- **Shorter holds.** Text still respects a reading floor (~0.25s/word, min ~1.0s after it lands), but
  NON-text visuals (UI, montage cuts, badges) move quickly — montage cards 0.8–1.2s each.
- **Use montages** for features and tech so you convey breadth without slow single beats.
- **Cut on the beat** (see `references/audio-and-music.md`); energy comes from rhythm, not from
  holding longer.
- Front-load comprehension: show the product (UI) within the first ~8–10s, not at the end.

## Visual variety — kill the "one-note" look

- Alternate beat *kinds*: text → UI → montage → diagram → UI → tech → stat → outro. Never three
  text-only scenes in a row.
- Vary layout and anchor: full-bleed UI, split text|UI, centered hero, corner-label + big visual.
- Let **real UI provide the color and texture**; motion-graphics scenes stay disciplined (dark,
  blue-dominant). The contrast between clean graphics and live product is what reads as "produced".
- One dominant accent + sparing secondary still holds; variety comes from *content & layout*, not
  from rainbow colors.

## Look, motion, audio (condensed — details in references)

- **Theme:** default `cinematic-dark` (near-black, high-contrast text), ONE dominant accent
  (Clear Sky Blue `#41A3EF`) + sparing secondary (Soil Yellow `#FCCE50`); semantic red/green
  only for meaning. A `brand-light` brand theme exists for brand-matched trailers.
- **Motion:** drive everything from `useCurrentFrame()`; entrances ease-out / `spring()`, exits
  ease-in, **never linear**; stagger 4–8 frames; animate one thing at a time. Full craft (easing
  curves, type scale, safe zones, UI Ken-Burns): `references/motion-design.md`.
- **Type:** one family (Google Sans Flex / Inter), strong hierarchy, ≤6–8 words per card, text inside
  the inner ~90% safe zone.
- **UI footage:** prefer real captured clips/stills; pan/zoom subtly; keep within safe zone; round
  the corners and add a soft device/browser frame so screenshots read as "product", not "image".
- **Audio:** royalty-free music matched in mood/BPM, resolve on the outro; 3–6 SFX total as
  punctuation. Sourcing + beat-sync: `references/audio-and-music.md`.

## Quality bar — reject before render

Not done until ALL are true:

- **Comprehension:** a first-time viewer can answer What / Problem / What-it-does / How / Tech / Why.
- **Shows the product:** if the app has any UI, real UI footage appears (ideally in the first 10s).
- **Tech is shown** (a techstack beat), not left implicit.
- **Not one-note:** beat kinds alternate; no 3 text-only scenes in a row; layouts vary.
- **Not slow:** ~10–13 scenes in 45–60s; montages used; no single short line held >~4s.
- **No filler code:** a code scene exists ONLY if the code is the selling point.
- Motion eased (not linear); one thing at a time; text readable (≥7:1 on lead line).
- Music resolves; ≤6 SFX; cuts feel on-beat.
- Total length 45–60s (hard cap ~70s).

If a check fails, fix the **storyboard** (add a UI beat, add techstack, tighten holds, add a montage,
cut filler) — not by adding more motion.

## Workflow

1. Get **RepoFacts** (upstream analysis): identity, problem, what it does, key features, tech stack,
   whether it has a runnable UI / live URL / screenshots. (See `references/ui-capture.md` for how UI
   media is obtained locally.)
2. Acquire **UI footage** if the app has a UI (capture or repo screenshots); else plan a
   graphics-only arc that still answers the six questions.
3. Write the **Storyboard JSON** (schema + storytelling spine), applying pacing & variety rules.
4. Render via Remotion (mechanics per remotion-dev/skills), feeding captured media.
5. Run the **Quality bar**; iterate on the storyboard.
