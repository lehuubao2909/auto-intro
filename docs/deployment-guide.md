# AutoDemo — Deployment & Usage Guide

## Quick Start

### For End Users

#### 1. Install Node 20+
```bash
node --version  # should be v20 or later
```

#### 2. Get Gemini API Key
```bash
# Visit: https://aistudio.google.com/apikey
# Create a key (free, instant)
# Set in environment:
export GEMINI_API_KEY=your_key_here

# Or create .env file in your repo:
# GEMINI_API_KEY=your_key_here
```

#### 3. Run AutoDemo (Interactive)
```bash
# Inside a repository:
npx autodemo

# Or point at a repo:
npx autodemo /path/to/my-app

# Or relative:
npx autodemo ../my-repo
```

This opens `http://localhost:4747` (or next free port) in your browser.

#### 4. Review & Approve Brief
1. AutoDemo analyzes repo (2–5s).
2. Browser shows **Brief Review Panel** with generated brief (narrative + story beats).
3. You can **edit the brief** (change wording, beats) or approve as-is.
4. Click **Approve** to trigger Stage B (direct + render).

#### 5. Render & Download
1. Director synthesizes storyboard (using approved brief + usageType-specific flow template).
2. Remotion renders video (30–60s, CPU-bound).
3. Preview in browser + download `.mp4`.
4. Optionally **edit storyboard JSON** and click **Re-render** (skips analysis, just renders).

**v3 Headless Mode (Skip Gate):**
```bash
npx autodemo [repoPath] --yes
# Analyzes → approves brief automatically → renders → outputs video path to console
# No browser, no approval gate.
```

**v3 Note:** Two-stage gated pipeline (brief review before render). usageType-driven flow templates. 42 motion-rich UI primitives. Configurable director model.

---

## Usage & Workflow

### Web UI Flow

```
┌─────────────────┐
│ AutoDemo Server │
│ (Fastify + SSE) │
└────────┬────────┘
         │ http://localhost:PORT
         ▼
    ┌────────────────────────────────┐
    │ Single-Page Web UI (HTML)       │
    │ ┌──────────────────────────────┤
    │ │ Generate   [BUTTON]           │
    │ │ Status: ________ [SSE stream] │
    │ │ Progress:  [████████░░░░░░░░] │
    │ │                               │
    │ │ Video Preview:                │
    │ │ [────────────────────────]    │
    │ │ Download | Edit JSON          │
    │ │                               │
    │ │ JSON Editor:                  │
    │ │ [{ "meta": {...},             │
    │ │    "scenes": [...] }          │
    │ │  Re-render [BUTTON]           │
    │ └──────────────────────────────┘
    │
    └─────────────────────────────────
```

### Storyboard Editing

After generation, you can:
1. Download `storyboard.json` from the browser.
2. Edit locally (change scene order, durations, text, etc.).
3. Paste edited JSON back into the **JSON Editor** panel.
4. Click **Re-render** (skips analyze/capture/direct; only renders video).

This is the power of the Storyboard contract—you iterate without re-analyzing.

---

## Installation & Publishing

### NPM Package Structure

The `package.json` `files` array includes source for Remotion compilation:

```json
{
  "files": [
    "dist",          // Compiled JavaScript
    "src",           // TypeScript source (Remotion needs this)
    "skill",         // Vendored skill reference
    "assets",        // UI HTML + static files
    "tsconfig.json"  // Config for Remotion bundler
  ]
}
```

**Why source is shipped:** Remotion's webpack must compile TypeScript components at bundle time. Simply shipping `dist/` would not work; Remotion would fail to find `src/render/Trailer.tsx`.

### Build & Publish

```bash
# 1. Build TypeScript → dist/
npm run build

# 2. Verify dist/ has index.js (bin entry)
ls dist/index.js

# 3. Test locally
npm link
npx autodemo ../test-repo

# 4. Publish to npm
npm publish
```

### After Publish

Users install:
```bash
npm install -g autodemo
# or
npm install --save-dev autodemo
npx autodemo
```

Remotion will find `src/` in `node_modules/autodemo/src/` and compile it.

---

## Environment & Configuration

### Required
- **GEMINI_API_KEY** – Google Gemini API key (free tier available at https://aistudio.google.com/apikey).
- **Node 20+** – Minimum version (ESM support, modern APIs).

### Optional
All optional; sensible defaults in `src/shared/config.ts`:

```bash
# Gemini models (v3: director model is now configurable for accuracy tuning)
AUTODEMO_DIRECTOR_MODEL=gemini-3.5-flash     # or use a stronger model: gemini-2.0-flash, gemini-2.0-pro
AUTODEMO_TRIAGE_MODEL=gemini-3.1-flash-lite

# Video dimensions & framerate
AUTODEMO_FPS=30
AUTODEMO_WIDTH=1920
AUTODEMO_HEIGHT=1080

# Theming (brand colors injected into all primitives)
AUTODEMO_THEME=cinematic-dark        # or: brand-light
AUTODEMO_ACCENT=#41A3EF              # Brand blue (primary)
AUTODEMO_ACCENT2=#FCCE50             # Brand yellow (secondary)

# Server
AUTODEMO_PORT=0                       # 0 = auto pick free port

# Analysis
AUTODEMO_MAX_FULL_READ=10             # Max files to fully read (analyzer triage)

# Output
AUTODEMO_WORKDIR=.autodemo            # Where to write repo-facts, brief, storyboard, video
```

**v3 Director Model Tuning:**
If accuracy is critical, override the director model to a stronger one:
```bash
# Trade cost for accuracy (faster + more capable)
AUTODEMO_DIRECTOR_MODEL=gemini-2.0-flash npx autodemo /path/to/repo

# Cost-optimized (default, good balance)
AUTODEMO_DIRECTOR_MODEL=gemini-3.5-flash npx autodemo /path/to/repo
```

Load via `.env` file (auto-loaded by `config.ts`):
```bash
# .env
GEMINI_API_KEY=sk_...
AUTODEMO_THEME=brand-light
```

---

## Artifacts & Outputs

All artifacts go to `<repo>/.autodemo/`:

| File | Size | Purpose | Editable | v3 Note |
|------|------|---------|----------|---------|
| `repo-facts.json` | ~2 KB | Phase 1: analysis (tech, runnable, usageType, install, links). | Yes (for debugging). | Now includes `usageType` (deterministic) + real `install` hint. |
| `brief.json` | ~2 KB | Phase 2b: human-approved brief (narrative + story beats). **Gate stops here.** | **Yes** (edit via server UI or manually). | **v3:** Key artifact. Contains oneLiner, howItsUsed, suggestedBeats (LLM) + usageType, techStack, links (factual, never invented). |
| `brief.md` | ~1 KB | Human-readable brief (markdown). Shown in browser review panel. | No (auto-generated from brief.json). | **v3:** For human review. |
| `design-profile.json` | ~1 KB | Phase 2: extracted palette, font, radius, logo path. | No (auto-generated). | Unchanged. |
| `component-inventory.json` | ~1 KB | Phase 2: classified components → 42 UI-kit primitives. | No (auto-generated). | Unchanged. |
| `storyboard.json` | ~5–20 KB | Phase 3: Storyboard (42 primitive specs + scene details). **Editable; re-render after edits.** | **Yes** (edit & re-render). | v3: 42 primitives (vs. 14 in v2); motion variants + FX. |
| `trailer.mp4` | ~10–50 MB | Phase 4: Final video (h.264, 1920×1080, 30fps, 45–60s). | No (output artifact). | Includes motion/FX layers + crash-safe renders. |
| `logo.svg` (optional) | ~10 KB | Extracted brand logo (used by render). | No (auto-generated). | Unchanged. |

**v3 Key Changes:**
- **Gate stops at brief:** `brief.json` + `brief.md` are review artifacts. Human can edit brief before approval.
- **Only `brief.json` and `storyboard.json` are hand-editable.** Everything else auto-generated.
- **Storyboard now uses 42 primitives** (expanded from 14) with motion variants + FX.
- Server UI provides editor for both brief (pre-render) and storyboard (post-render).

---

## Troubleshooting

### "GEMINI_API_KEY not set"
```bash
export GEMINI_API_KEY=your_key_from_aistudio.google.com
# or create .env file:
echo "GEMINI_API_KEY=your_key" > .env
```

### "Design profile extraction failed"
AutoDemo reads CSS/Tailwind/SVG in source. If extraction is weak:
```bash
# Ensure your project has one of:
# - CSS custom properties (--colors-primary, etc.)
# - tailwind.config.js with theme.colors
# - src/assets/logo.svg or public/logo.png
```

If still weak, inspect logs in `.autodemo/design-profile.json`; defaults (dark mode, brand colors) will be used.

### "Address already in use"
AutoDemo tries ports 4747, 4748, 4749 automatically. If all busy:
```bash
# Specify a free port explicitly
AUTODEMO_PORT=5555 npx autodemo
```

### "Analysis / Director timeout"
Gemini API might be slow or the repo very large. Retry; increase timeout by setting:
```bash
# Increase triage max files read (default 10)
AUTODEMO_MAX_FULL_READ=20 npx autodemo
```

### "Component classification weak"
If Gemini can't classify components, fallback inventory uses `RepoFacts.features` to synthesize cards. Storyboard will still have valid `ui-showcase`/`bento`/`sequence` scenes (with basic card/bento-grid). Check `.autodemo/component-inventory.json` to see what was classified.

### Video render is very slow
Render time is CPU-bound. On 8-core machine, expect ~60s. Reduce dimensions or FPS:
```bash
AUTODEMO_FPS=24 AUTODEMO_WIDTH=1280 npx autodemo
```

### Storyboard validation errors
Editor will show errors when pasting invalid JSON. Ensure:
- All scenes have `type` + `durationInFrames`.
- Media references exist in `meta.media`.
- Reading floor respected (text scenes hold long enough).
- No 3+ text-only scenes in a row.

See `docs/system-architecture.md` → Storyboard section for full validation rules.

---

## Remotion Licensing

**CRITICAL for companies:** Remotion is free for:
- ✓ Individuals.
- ✓ Non-profits.
- ✓ For-profit companies with ≤3 employees.

**For larger for-profit orgs:** A Remotion company license is required.  
See https://www.remotion.dev/license for details and pricing.

**AutoDemo does not enforce this.** Each user is responsible for ensuring they have appropriate licensing. If you are unsure, check Remotion's official licensing page or contact them.

---

## Performance Expectations

On a typical 8-core machine with good internet (Gemini API):

| Phase | Time | Factors |
|-------|------|---------|
| Analyze | <5s | File walk + stack detect + Gemini triage. |
| Inspect | <3s | Parse CSS/Tailwind/SVG, classify components (Gemini or fallback). |
| Direct | <10s | Gemini director (usually 1–2 repair rounds). |
| Render | <60s | CPU-bound; scales with cores; no video codec overhead. |
| **Total** | ~80–100s | Analyze + Inspect + Direct are fast; render dominates. |

Faster machines: render in 30–45s (total ~60s).  
Slower machines: render in 90–120s (total ~130s).

**v2 Benefit:** Faster than v1 (no Playwright launch overhead or screen codec delay).

---

## CI/CD Integration

AutoDemo can be run in CI (GitHub Actions, etc.) to auto-generate trailers:

```yaml
# .github/workflows/generate-trailer.yml
name: Generate Code Trailer

on:
  push:
    branches: [main]

jobs:
  trailer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npx autodemo . 
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - uses: actions/upload-artifact@v4
        with:
          name: trailer
          path: .autodemo/trailer.mp4
```

**v2 Note:** No Playwright browser install needed; faster CI.

Store `.autodemo/trailer.mp4` as an artifact or in a release.

---

## Publishing to npm

### Checklist
- [ ] `npm run typecheck` passes.
- [ ] `npm run test` passes (or skipped in v0).
- [ ] `npm run build` produces `dist/index.js`.
- [ ] `package.json` version bumped.
- [ ] CHANGELOG.md updated (if maintaining one).
- [ ] README.md is clear (users can run `npx autodemo`).
- [ ] `.gitignore` includes `node_modules/`, `.env`, `.autodemo/`.

### Publish
```bash
# Ensure logged in to npm
npm login

# Publish
npm publish

# Tag the release (optional)
git tag v0.0.1
git push origin v0.0.1
```

### After Publish
Users can immediately run:
```bash
npx autodemo
```

npm will download + cache the package; Remotion will find `src/` and compile it.

---

## Version & Upgrade

Current version: `0.0.1` (Early MVP)

Check for updates:
```bash
npm outdated -g autodemo
npm update -g autodemo
```

---

## Support & Feedback

- **Issues:** Report bugs on GitHub (if open-sourced).
- **Licensing:** For Remotion licensing questions, see https://www.remotion.dev/license.
- **Gemini API:** For API issues, see https://ai.google.dev.

---

## Summary

AutoDemo v3 is a **local-first CLI** with a **human-gated approval flow**. Install → set API key → run `npx autodemo` (interactive) or `npx autodemo --yes` (headless).

**Flow:** Analyze → Brief Review (browser UI) → Approve → Render (Remotion, 42 motion-rich primitives).

**Key v3 Features:**
- **Accuracy-first:** Deterministic usageType detection (cli/sdk/api/web-app/etc.) drives flow templates. Brief approved by human before render. Director can't invent features/links.
- **Token-efficient:** Brief approved once; director reuses (no re-analysis per repair attempt).
- **Aesthetic:** 42 UI-kit primitives (up from 14) with motion variants (enter, countUp, typewriter) + FX layers (DrawPath, ShimmerSweep, ParticleBurst).
- **Robust:** RenderBoundary error boundary; malformed LLM props degrade gracefully, never abort render.
- **Configurable:** Override director model via `AUTODEMO_DIRECTOR_MODEL` env for accuracy tuning.

**Artifacts:** Repo-facts → brief (human review) → storyboard → trailer.mp4, all in `.autodemo/`.

**Publishing:** npm package includes source (Remotion needs TS at build time). Remotion licensing is user's responsibility.
