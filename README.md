# AutoIntro

**Transform any code repository into a 45–60 second intro video.** AutoIntro reads your project, recreates its UI as animated motion-graphics, and renders a polished `.mp4` locally—all powered by Gemini's story direction and Remotion's rendering, with zero uploads.

## What It Does

AutoIntro analyzes a local code repository and generates a professional intro video that:

- **Reads the codebase** without installing dependencies (zero risk)
- **Detects the project's UI** — palette, typography, components, logo
- **Determines how users interact** with it (CLI tool, SDK, web app, API, mobile, or desktop)
- **Directs a storyboard** via Gemini, OpenAI, or Anthropic — mapping components to animated UI primitives
- **Renders locally** with Remotion + headless Chromium (nothing uploads; everything stays on your machine)
- **Produces a sharable `.mp4`** in `<repo>/.auto-intro/trailer.mp4`

The result: a compelling visual narrative of your project's core flow, ready for docs, README, social, or product pages.

## Demo

Watch AutoIntro's own intro video (made with AutoIntro):

[![AutoIntro demo video](https://img.youtube.com/vi/hAz_g459Abg/maxresdefault.jpg)](https://www.youtube.com/watch?v=hAz_g459Abg)

▶️ **[Watch on YouTube](https://www.youtube.com/watch?v=hAz_g459Abg)**

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **An LLM API key** — Gemini (default, free tier: https://aistudio.google.com/apikey), OpenAI, or Anthropic
- ~200 MB disk space (for Remotion's Chromium, downloaded on first render)

### 1. Install & Configure

```bash
# Clone (or integrate into your project)
git clone https://github.com/lehuubao2909/auto-intro.git
cd auto-intro

# Install dependencies
npm install

# Create .env with your Gemini key
cat > .env << 'EOF'
GEMINI_API_KEY=your_key_here
EOF
```

### 2. Generate a Trailer

```bash
# Start the web UI (opens a browser with the approval gate)
npm run dev -- /path/to/target-repo

# Or headless (skip the approval gate)
npm run dev -- /path/to/target-repo --yes
```

### 3. Review & Download

The web UI walks you through:
1. **Analyze** — scans the repo (30–60s)
2. **Review Brief** — edit the narrative + CTA before video production
3. **Approve & Render** — Gemini directs scenes, Remotion renders the video (2–5 min depending on scene count)
4. **Download** — your `.mp4` is ready in `<repo>/.auto-intro/`

## Features

- **No Install/Setup Risk** — reads package.json & source, doesn't run `npm install`
- **Usage-Type Aware** — detects CLI, SDK, web app, API, mobile, or desktop patterns
- **Design Extraction** — pulls theme colors, fonts, and brand identity from your code
- **Component Mapping** — translates your real UI components to 52 animated primitives (incl. editorial layout templates)
- **Calm, content-first motion** — staggered reveals, depth parallax, word-by-word text; calm static background (no flashy churn)
- **Accurate by construction** — derives the *real* run command from the repo (never fabricates `npx <name>` for unpublished projects)
- **Approval Gate** — review + edit the brief before rendering (edit storyboard JSON for advanced power users)
- **Headless Mode** — `--yes` flag for CI/CD or batch processing
- **Multi-Provider** — Gemini, OpenAI, or Anthropic; swap provider + models via environment variables
- **Crash-Safe Rendering** — Remotion boundary wraps rendering; failures don't corrupt artifacts

## CLI Usage

```bash
# Web UI (recommended for first run)
npm run dev -- <repo-path>

# Headless (skip approval gate)
npm run dev -- <repo-path> --yes
npm run dev -- <repo-path> -y

# Current directory (if omitted)
npm run dev --

# After build
npm run build
node dist/index.js <repo-path>

# Or install globally
npm link
auto-intro <repo-path>
```

### Flags

| Flag | Effect |
|------|--------|
| `--yes` / `-y` | Skip web UI approval gate; render immediately after analysis. |
| `<repo-path>` | Target repository (optional; defaults to `process.cwd()`). |

## Environment Configuration

All settings can be overridden via environment variables or a `.env` file (auto-loaded).

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `AUTOINTRO_PROVIDER` | string | `gemini` | LLM provider: `gemini` \| `openai` \| `anthropic`. Picks the default models + which key is required. |
| `GEMINI_API_KEY` | string | (provider key) | Required when provider is `gemini`. Get at https://aistudio.google.com/apikey. Also accepts `GOOGLE_API_KEY`. |
| `OPENAI_API_KEY` | string | (provider key) | Required when provider is `openai`. Get at https://platform.openai.com/api-keys. |
| `ANTHROPIC_API_KEY` | string | (provider key) | Required when provider is `anthropic`. Get at https://console.anthropic.com/settings/keys. |
| `AUTOINTRO_DIRECTOR_MODEL` | string | per-provider | Storyboard synthesis model. Defaults: gemini `gemini-3.5-flash` · openai `gpt-5.4` · anthropic `claude-opus-4-8`. |
| `AUTOINTRO_TRIAGE_MODEL` | string | per-provider | Repo-skim model (fast/cheap). Defaults: gemini `gemini-3.1-flash-lite` · openai `gpt-5.4-mini` · anthropic `claude-haiku-4-5`. |
| `AUTOINTRO_PORT` | number | `0` (auto) | Server port; `0` picks a free port automatically. |
| `AUTOINTRO_FPS` | number | `30` | Video frames per second. |
| `AUTOINTRO_WIDTH` | number | `1920` | Video width (pixels). |
| `AUTOINTRO_HEIGHT` | number | `1080` | Video height (pixels). |
| `AUTOINTRO_THEME` | string | `cinematic-dark` | Rendering theme (applied post-generation). |
| `AUTOINTRO_ACCENT` | hex color | `#41A3EF` | Primary brand color. |
| `AUTOINTRO_ACCENT2` | hex color | `#FCCE50` | Secondary accent color. |
| `AUTOINTRO_MAX_FULL_READ` | number | `10` | Max files to fully read during triage (hard cap). |
| `AUTOINTRO_WORKDIR` | string | `.auto-intro` | Output directory (created in target repo). |

### Example: Switch Provider or Model

```bash
# Use OpenAI instead of Gemini (researched defaults: gpt-5.4 / gpt-5.4-mini):
export AUTOINTRO_PROVIDER=openai
export OPENAI_API_KEY=sk-...
npm run dev -- /path/to/repo

# Or Anthropic (claude-opus-4-8 / claude-haiku-4-5):
export AUTOINTRO_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# Pin a specific director model on any provider:
export AUTOINTRO_DIRECTOR_MODEL=gpt-5.5
npm run dev -- /path/to/repo
```

## How It Works

```
┌─────────────────┐
│  1. Analyze     │  Read package.json, detect usage type, scan files
└────────┬────────┘
         │
┌────────▼────────────────────┐
│  2. Inspect Design & UI     │  Extract palette, fonts, components, logo
└────────┬─────────────────────┘
         │
┌────────▼────────────────────┐
│  3. Build Brief             │  Synthesize project narrative + CTA
│     (approval gate)         │  ← Edit or approve before rendering
└────────┬─────────────────────┘
         │
┌────────▼──────────────────────┐
│  4. Direct (LLM)             │  Generate storyboard with 52 UI primitives
│     + usage-type flow        │  + themed colors + CTA
└────────┬───────────────────────┘
         │
┌────────▼─────────────────────┐
│  5. Render (Remotion)        │  Chromium renders scenes → .mp4
└─────────────────────────────┘
```

**Outputs** (in `<repo>/.auto-intro/`):

- `repo-facts.json` — detected name, usage type, dependencies
- `design-profile.json` — theme, palette, fonts
- `component-inventory.json` — mapped UI surfaces
- `brief.json` & `brief.md` — approved narrative + CTA
- `storyboard.json` — scene descriptions (editable for power users)
- `trailer.mp4` — final video

## Troubleshooting

### "Missing GEMINI_API_KEY"

**Issue:** Error on startup.

**Solution:** Get a free key at https://aistudio.google.com/apikey, then set it:
```bash
export GEMINI_API_KEY=your_key_here
# or create a .env file
echo "GEMINI_API_KEY=your_key_here" > .env
```

Without a key, analysis uses an offline fallback (much lower quality).

### "Gemini 503 / Rate Limit"

**Issue:** Overload or quota reached.

**Solution:** The tool auto-retries with exponential backoff. If it persists:
- Wait 30 seconds and try again
- Check your quota at https://aistudio.google.com/app/apikey
- Try a different (lower-cost) model: `export AUTOINTRO_TRIAGE_MODEL=gemini-3.1-flash-lite`

### "ENOSPC: no space left"

**Issue:** Disk full during rendering.

**Solution:** Free up space. Rendering needs ~500 MB temporary disk.

### "First run very slow"

**Issue:** Taking 5+ minutes on startup.

**Solution:** On the first run, Remotion auto-downloads a headless Chromium (~100 MB). This is one-time. Subsequent runs are 2–5 min.

### "Trailer looks wrong / missing scenes"

**Issue:** Video doesn't match the project.

**Solution:** 
1. Review the brief (`<repo>/.auto-intro/brief.md`). If the narrative is off, edit it in the web UI and re-render.
2. For advanced users: edit `storyboard.json` directly (scenes, timing, element positions) and re-render via the "Re-render" button.
3. Check that Gemini key is valid (key quota/project issues can cause lower-quality output).

## Privacy

The repo, screenshots, and renders **never leave your machine**. Only code/analysis is sent to Gemini (for storyboard direction). Nothing is uploaded to any AutoIntro server.

## Licensing

**Remotion License:** AutoIntro uses Remotion for rendering. 

- **Free** for individuals, nonprofits, and companies with ≤3 employees.
- **Requires a license** for companies > 3 employees: https://www.remotion.dev/license

Each user is responsible for their own license status. You must comply with Remotion's licensing terms.

## Next Steps

- **[Detailed Setup Guide](./guide.html)** — Step-by-step walkthrough for first-timers
- **System Architecture** — See `docs/system-architecture.md` for design internals
- **Codebase Summary** — See `docs/codebase-summary.md` for file structure

## Contributing

Found a bug? Have a feature idea? Open an issue or PR on GitHub.

## License

MIT © 2025 Le Huu Bao
