# AutoDemo — Project Overview & PDR

## What is AutoDemo?

A **local-first CLI tool** that transforms any code repository into a **45–60 second "code trailer"** — a professional motion-graphics video showing **recreated UI (idealized, NeuraFlow-style with rich motion/FX)**, animated text, tech stack, and architecture — rendered locally as `.mp4`, no voiceover.

**v3 Key Pivot:** Human-gated two-stage pipeline (analyze → brief → **human review** → approve → render). Increases accuracy (LLM narrative grounded in deterministic facts) and enables token-saving (brief approved once, director doesn't re-analyze). Support for 8 usage types (cli, sdk, library, web-app, api, mobile, desktop) with type-specific flow templates. 42 UI-kit primitives (up from 14) with rich motion variants + FX layers + crash-safety.

```bash
npx autodemo [repoPath]
# Interactive: analyze → review brief → approve → render (preview in browser, download video or re-edit storyboard JSON)

npx autodemo [repoPath] --yes
# Headless: analyze → brief → render (skips approval gate, one-shot)
```

---

## The Problem

Developers struggle to showcase code projects compellingly:
- Writing docs is time-consuming; videos are expensive (production, voiceover, editing).
- GitHub READMEs rely on static text + images; first-time viewers don't understand **what the app IS or what problem it solves**.
- Existing demo tools require manual scripting, voiceover, or cloud rendering.

**Solution:** Automate the entire pipeline — analyze code → capture real UI → direct a Storyboard with Gemini → render locally with Remotion. No server uploads, no voiceover, deterministic output.

---

## Core Principles

### 1. **Accuracy-First (Human-Approved Brief)**
- **v3 Gate:** Analysis produces a brief; human reviews & approves before render (or CLI `--yes` auto-approves).
- **Why:** LLM narrative (how-it's-used, suggested beats) grounded in deterministic facts (usageType, install, links).
- Director can't invent features, commands, or URLs; accuracy > hallucination.
- Token-efficient: brief approved once; director uses approved brief (no re-analysis on each retry).

### 2. **Local-First**
- Repo, storyboard, and final video stay on the user's machine.
- Only **code text sent to Gemini for analysis** (secrets pre-scrubbed).
- No uploads, no tracking, no cloud dependency for the final output.
- Self-hostable: server + pipeline are pure Node.js (open-source framing).

### 3. **Usage-Type Aware (Flow Template per Product Type)**
- **v3:** Deterministic detection of how product is consumed (cli/sdk/library/web-app/api/mobile/desktop).
- Each usage type has a **flow template** (e.g., CLI → terminal command + progress steps + result card).
- No force-fit; trailer flow matches real usage pattern.
- Real install hints only when confident; never fabricated.

### 4. **Comprehension-First (Show, Don't Tell)**
- A trailer **fails** if viewers can't answer: *What is it? What problem? What does it do? How? What tech? Why care?*
- **Recreated UI is the hero** — idealized vector primitives (42 types) built from project design system.
- Text & graphics are supporting acts; code snippets optional (spice, not course).
- **v3 benefit:** Rich motion (enter variants, FX layers: particles, shimmer, glow, scan-lines) + crash-safe rendering.

### 5. **Deterministic**
- Storyboard JSON is the single source of truth (zod schema = contract).
- Same repo + approved brief + Gemini model → same storyboard (temperature 0.6 generation, 0.4 repair).
- Remotion renders identically on any machine (CPU-scaled concurrency, ESM bundling).
- Frame-driven motion and FX: no randomness, no Date-based timing.

### 6. **Robust (RenderBoundary Crash-Safety)**
- **v3:** Error boundary wraps every scene + element.
- Malformed LLM props (wrong chart data, invalid toggle state) degrade to blank, never abort render.
- Any storyboard renders to video; graceful degradation over hard failure.

---

## Target Users

- **Open-source maintainers** — auto-generate READMEs / landing-page videos.
- **Indie developers** — showcase side projects without production overhead.
- **Technical teams** — internal demo reels, onboarding, knowledge-sharing.
- **Agencies** — batch-process client repos into demo reels.

---

## Core Models & Tech Stack

| Component | Stack |
|-----------|-------|
| **LLM (Director)** | Gemini (default: gemini-3.5-flash, configurable via `AUTODEMO_DIRECTOR_MODEL` env) — storyboard synthesis, flow template selection per usageType |
| **LLM (Triage)** | Gemini gemini-3.1-flash-lite (repo analysis, cheap long-context) |
| **UsageType Detection** | Deterministic: package.json parsing, bin entries, framework deps (no LLM) |
| **Design Extraction** | Regex-based (CSS vars, Tailwind, SVG brand detection) — no runtime |
| **Component Classification** | Gemini (map source components to 42 UI-kit primitives) or fallback heuristic |
| **UI Rendering** | **42 animated vector primitives** (panels 3, charts 4, chrome 3, interaction 4, frames 2, dev 6, data-extra 6, surfaces 12) with motion variants + FX |
| **Motion & FX** | `lib/motion.ts` (enter variants, countUp, typewriter, tilt3d, parallax) + `lib/fx.tsx` (DrawPath, ShimmerSweep, ScanLine, ParticleBurst, GlowPulse) |
| **Crash-Safety** | RenderBoundary error boundary (scene + element level); degrades malformed props gracefully |
| **Video Render** | Remotion + React (deterministic, composable, ESM) |
| **Server** | Fastify + SSE for progress + static UI; two-stage gate routes: POST /api/analyze, GET/POST /api/brief, POST /api/approve |
| **Language** | TypeScript ESM (Node 20+) |

**v3 Architecture:** Two-stage human-gated pipeline (brief review before render). Deterministic usageType detection (no LLM). 42-primitive registry with rich motion/FX. Configurable director model. RenderBoundary crash-safety.

---

## Storyboard Contract

The **Storyboard JSON** is the contract between Gemini (director) and Remotion (renderer):

```json
{
  "meta": {
    "title": "string",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "theme": "cinematic-dark",
    "accent": "#41A3EF",
    "accent2": "#FCCE50",
    "totalSeconds": 50,
    "media": {},
    "design": {
      "mode": "dark",
      "glass": true,
      "radius": 16,
      "font": "Inter, sans-serif",
      "palette": { "bg": "#...", "surface": "#...", "text": "#...", "dim": "#...", "accent": "#...", "accent2": "#..." },
      "logo": "/path/to/logo.svg"
    }
  },
  "scenes": [
    { "type": "title", "text": "...", "durationInFrames": 60, ... },
    { "type": "ui-showcase", "element": { "primitive": "bar-chart", "props": {...} }, "caption": "...", ... },
    { "type": "ui-bento", "tiles": [{ "primitive": "card", "props": {...} }, ...], ... },
    { "type": "techstack", "items": [...], ... },
    // ... 13 scenes total (10 legacy + 3 UI-recreation)
  ]
}
```

**v2 Key Changes:**
- **3 new scene types:** `ui-showcase`, `ui-bento`, `ui-sequence` (compose themed primitives).
- **Design Profile in meta:** `design` field holds extracted palette, font, radius, logo.
- **Primitives by name:** Scene specs reference UI-kit by primitive name (string). 14 available: panel, card, bento-grid, stat-tile, bar/line/donut-chart, sidebar-nav, table, kanban-column, chat-bubble, input-field, button, toggle.
- **No media registry:** v2 removes `media` (no stills/clips in new scenes).

See `./docs/system-architecture.md` for the full schema and validation rules.

---

## Privacy & Cost Model

| Aspect | Details |
|--------|---------|
| **Local Privacy** | Repo + captures + renders stay on machine. Only code analysis (Gemini) leaves. |
| **Secret Scrubbing** | Env vars, API keys, credentials pre-scrubbed before LLM sends. |
| **Cost per Trailer** | ~5¢ (Gemini API calls: triage + director + repairs). Rendering is free (local CPU). |
| **Remotion License** | Free for individuals, non-profits, and companies ≤3 employees. Larger orgs need a company license (user responsible). |

---

## Success Criteria (v3)

### Functional
- [x] CLI entry: `npx autodemo [repoPath]` (interactive gate) or `npx autodemo --yes` (headless).
- [x] Two-stage gate: POST /api/analyze (stage A) → brief review → POST /api/approve (stage B).
- [x] Analyze repo: detect tech stack, runnable (npm scripts, live URL), **usageType** (8 types).
- [x] Build brief: LLM narrative (oneLiner, howItsUsed, beats) + deterministic facts (usageType, install, links).
- [x] Inspect UI: extract design profile (CSS/Tailwind/brand), classify components to 42 primitives.
- [x] Direct storyboard: Gemini composes UI-kit scenes per **flow template** (usageType-specific), with repair loop.
- [x] Render trailer: Remotion renders **42 primitives** with **motion variants** + **FX** + theme, to `.mp4`.
- [x] RenderBoundary: error boundary wraps scenes/elements; malformed props degrade gracefully.
- [x] Web UI: single-page (HTML + SSE progress), brief review panel, storyboard preview + download + edit + re-render.
- [x] Validate storyboard: structural (zod) + quality rules (beats, reading floor, SFX budget, etc.).
- [x] Per-project theming: DesignProfile extracted; all primitives themed from it.

### Non-Functional
- [x] Accuracy-first: usageType deterministic (no LLM guess); brief human-approved; director can't invent links.
- [x] Deterministic output (same repo + brief + model → same storyboard + video).
- [x] Local-first (no server uploads except LLM calls).
- [x] No runtime needed (reads source only; no app execution).
- [x] Graceful fallbacks (weak component classification → fallback; malformed render props → blank element).
- [x] Reasonable perf: analyze <5s, inspect <3s, brief <2s, direct <10s, render <60s (CPU-bound).
- [x] Configurable director model (AUTODEMO_DIRECTOR_MODEL env).
- [x] Token-efficient: brief approved once; director reuses (no re-analysis per repair attempt).

### Out-of-Scope (v3)
- [ ] Audio / music sync (placeholders ready; deferred to v4).
- [ ] Multi-job queue (single-job model).
- [ ] Live UI capture / dynamic interaction (uses source design + structure only).
- [ ] Custom scene components (fixed scene types + 42 primitives).

---

## Metrics & Success Indicators

- **Trailer Quality:** Stranger watch → can answer all 6 comprehension questions (What / Problem / Does / How / Tech / Why).
- **Generation Speed:** <2min end-to-end (sub-second for analyze, <15s capture, <10s direct, <60s render on 8-core CPU).
- **Fallback Coverage:** 100% of repos produce valid output (no crashes, graphics-only arc if no UI).
- **Adoption:** Used to generate READMEs, landing pages, internal demo reels.

---

## Summary

AutoDemo v3 is an **accuracy-first, local-first trailer generator** that solves the "hard to demo code" problem by **recreating idealized UI** from source design systems with a **human-in-the-loop approval gate**. Pipeline: analyze (detect usageType) → build brief → **review gate** → direct (flow template per type) → render (42 motion-rich primitives + FX + crash-safety).

**Key v3 advances:** Deterministic usageType (cli/sdk/api/web-app/mobile/etc.) drives flow templates. Human-approved brief anchors accuracy (LLM can't invent features/links). Configurable director model (AUTODEMO_DIRECTOR_MODEL). 42 UI-kit primitives (up from 14) with motion variants + FX layers (ShimmerSweep, ParticleBurst, etc.). RenderBoundary crash-safety (graceful degradation on bad LLM props). Token-efficient (brief approved once). Local-first, open-source-ready, self-hostable.

**Status:** v3 production-ready. 319 tests passing. Ready for community use + self-hosting.
