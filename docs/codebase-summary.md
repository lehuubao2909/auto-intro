# AutoDemo — Codebase Summary (v3)

## Directory Map

```
src/
├── shared/              # Cross-phase types, config, LLM client, schemas
├── analyze/             # Phase 1: repo analysis → RepoFacts (includes usageType detection)
├── brief/               # Phase 2b: build & render human-readable brief (v3)
├── inspect-ui/          # Phase 2: design profiling + component inventory → DesignProfile + ComponentInventory
├── direct/              # Phase 3: storyboard direction (Gemini, v3: consumes approved brief) → Storyboard JSON
├── render/              # Phase 4: video rendering (Remotion + React, 42 primitives, motion/FX, crash-safe) → .mp4
│   ├── ui-kit/          # 42 animated vector primitives (organized: panels, charts, chrome, interaction, frames, dev, data-extra, surfaces)
│   ├── scenes/          # Scene type renderers (ui-recreation-scenes, text-scenes, graphics-scenes, etc.)
│   ├── components/      # Reusable: scene frame, browser frame, code block, animated text, etc.
│   ├── background/      # Scene backgrounds (particle, glow, light-rays, grid)
│   ├── icons/           # Icon resolution (lucide + simple-icons, no emoji)
│   ├── lib/             # Utilities: motion.ts (enter variants, countUp, typewriter, tilt3d, parallax), fx.tsx (DrawPath, ShimmerSweep, ScanLine, ParticleBurst, GlowPulse), Mermaid parser
│   └── components/error-boundary.tsx # RenderBoundary (crash-safety, v3)
├── server/              # Fastify server + SSE + two-stage gated pipeline (v3: POST /api/analyze, GET/POST /api/brief, POST /api/approve)
└── cli/                 # CLI entry point (npx autodemo [repoPath] [--yes])

skill/code-trailer/      # Vendored skill reference (storytelling, schema, motion)
assets/                  # Static UI HTML, icons, fonts
plans/                   # Implementation plan + research
docs/                    # This documentation
```

**v3 Key Changes:** 
- `analyze/detect-usage-type.ts` added (deterministic usageType detection).
- `brief/` module added (build + render human-readable brief for approval gate).
- `ui-kit/` expanded to 42 primitives (from 14), organized by category (panels, charts, chrome, interaction, frames, dev, data-extra, surfaces).
- `lib/motion.ts` + `lib/fx.tsx` added (motion variants, FX components for aesthetic richness).
- `components/error-boundary.tsx` added (RenderBoundary crash-safety).
- `server/pipeline.ts` refactored for two-stage gate (runAnalysis, runRender, runPipeline).
- Server routes split: `/api/analyze` (stage A), `/api/brief` GET/POST (review), `/api/approve` (stage B).

---

## Module-by-Module Reference

### shared/

**Purpose:** Constants, schemas, and cross-phase utilities.

| File | Exports | Purpose |
|------|---------|---------|
| `config.ts` | `config: AppConfig`, `assertGeminiKey()` | Centralized env config (Gemini API key, video dims, models). |
| `storyboard-schema.ts` | `Storyboard`, `Scene`, `MediaRegistry`, `TEXT_ONLY_SCENES`, zod objects | **Single source of truth** for the Storyboard JSON contract. |
| `types.ts` | `RepoFacts`, `RunnableInfo`, `ProgressEvent`, `PipelineStage` | Types shared between analyze, direct, and server. |
| `validate-storyboard.ts` | `validateStoryboard(input): ValidationResult` | Structural (zod) + quality rules (beats, reading floor, SFX budget, etc.). |
| `gemini-client.ts` | `generateText()`, `generateJson()`, `generateRawJson()` | Wrapper around @google/genai client. |
| `asset-path.ts` | `packageRoot()`, `uiIndexPath()` | Resolve package assets (works in both dev tsx and installed package). |

**Key:** `storyboard-schema.ts` is the contract source (zod); changes ripple to validator, Director prompt, and Remotion renderer. `types.ts` defines `DesignProfile` (v2 theming struct).

---

### analyze/

**Purpose:** Read repo → extract facts (tech, runnable, usageType, summary) → RepoFacts JSON.

| File | Exports | Purpose |
|------|---------|---------|
| `repo-facts.ts` | `analyzeRepo(repoRoot): RepoFacts` | **Orchestrator.** Combines all signals (tech, runnable, usageType, install, links) into RepoFacts; persists to `.autodemo/repo-facts.json`. |
| `walk-repo.ts` | `walkRepo(root): FileTree` | Traverse tree, catalog files, resolve file types (JSON, TS, JS, etc.). |
| `detect-tech-stack.ts` | `detectTechStack(tree): string[]` | Parse package.json, detect frameworks (React, Next.js, Node, etc.). |
| `detect-runnable.ts` | `detectRunnable(tree): RunnableInfo` | Find dev commands (npm/yarn/pnpm), framework ports, live URL, repo screenshots. |
| `detect-usage-type.ts` | `detectUsageType(tree): { usageType, install }` | **v3:** Deterministic detection of how product is consumed (cli/sdk/library/web-app/api/mobile/desktop/unknown). Returns real install hint (e.g., `npx foo`, `npm i bar`) only if confident; else null. |
| `triage-and-summarize.ts` | `triageAndSummarize(tree): RepoSummary` | Call Gemini (flash-lite) with curated code excerpt; extract identity, problem, features. |
| `scrub-secrets.ts` | `scrubSecrets()`, `scrubDeep()` | Mask env vars, API keys before sending code to LLM (also used in Phase 3 post-gen). |
| `read-json-safe.ts` | `readJsonSafe<T>(path): T \| null` | Safe JSON parse (returns null on parse error, logs nothing). |

**Key Call Chain:** `analyzeRepo` → `walk-repo` → `detect-tech-stack` + `detect-runnable` + **`detect-usage-type`** + `triage-and-summarize` (Gemini call) → scrub → merge → persist.

**RepoFacts Output (v3):**
```typescript
{
  name: string;
  identity: string;
  problem: string;
  whatItDoes: string;
  features: string[];
  techStack: string[];
  usageType: "cli" | "sdk" | "library" | "web-app" | "api" | "mobile" | "desktop" | "unknown";
  install: string | null;  // only real commands or null
  links: { url?: string; repo?: string };  // only real URLs or empty
  runnable: { hasUi, devCommand?, port?, liveUrl?, screenshots };
}
```

---

### brief/ (v3)

**Purpose:** Build human-readable, user-approvable brief from RepoFacts → ProjectBrief JSON.

| File | Exports | Purpose |
|------|---------|---------|
| `build-brief.ts` | `buildBrief(facts): ProjectBrief` | **Orchestrator.** Assemble brief: LLM writes narrative (oneLiner, howItsUsed, suggestedBeats) grounded in usageType hints; factual fields (usageType, techStack, links, install) come from deterministic RepoFacts (never invented). Persists to `.autodemo/brief.json`. |
| `render-brief-md.ts` | `renderBriefMd(brief): string` | Format brief as human-readable markdown (used by web UI for review panel). |

**ProjectBrief Output:**
```typescript
{
  name: string;
  oneLiner: string;                    // LLM-generated, ≤10 words
  problem: string;                     // from RepoFacts
  whatItDoes: string;                  // from RepoFacts
  usageType: UsageType;                // from RepoFacts (deterministic, not LLM-guessed)
  howItsUsed: string;                  // LLM narrative grounded in usageType hint (e.g., "show the command + result")
  keyFeatures: string[];               // LLM or fallback to RepoFacts.features
  techStack: string[];                 // from RepoFacts
  links: { url?: string; repo?: string };  // from RepoFacts (real only)
  suggestedBeats: string[];            // 6–8 LLM story beats (approved by human)
}
```

**v3 Key:** Brief is the **contract between human and director**. Human approves narrative (how-it's-used, beats) but cannot change factual fields (usageType, links, install). Director consumes approved brief, not raw facts.

---

### inspect-ui/

**Purpose:** Extract project design tokens + classify UI components (no runtime, source-only) → DesignProfile + ComponentInventory JSON.

**v2 Module (replaces v1 capture/).**

| File | Exports | Purpose |
|------|---------|---------|
| `design-profile.ts` | `inspectDesign(repoRoot): DesignProfile` | **Orchestrator.** Merge CSS tokens (priority: CSS vars → Tailwind → brand SVG); persist to `.autodemo/design-profile.json`. |
| `parse-css-tokens.ts` | `parseCssTokens(tree): CssTokens` | Extract CSS custom properties from .css / .tsx global styles (parse direct hex + shadcn HSL format). |
| `parse-tailwind.ts` | `parseTailwind(tree): { tokens: CssTokens; font: string }` | Regex parse `tailwind.config.js` (no eval); extract palette keys + default font family. |
| `detect-font.ts` | `detectFont(tree, fallback?): string` | Find `font-family` declarations from global CSS or HTML `<link>` tags. |
| `grab-brand.ts` | `grabBrand(tree, workDir): { accent?: string; logoPath?: string }` | Locate logo SVG (src/assets, public/), extract dominant accent color. |
| `color-utils.ts` | `isLight(hex)`, `mix(hex1, hex2, ratio)`, conversion helpers | Utility: luminance check, color blending, hex↔hsl conversion. |
| `component-inventory.ts` | `buildComponentInventory(root, facts): ComponentInventory` | **Orchestrator.** Call Gemini classify (if strong) or fallback to RepoFacts.features; persist `.autodemo/component-inventory.json`. |
| `classify-components.ts` | `classifyComponents(tree): Promise<ComponentInventory \| null>` | Call Gemini with picked components; return primitive type mappings or null if weak. |
| `pick-component-files.ts` | `pickComponentFiles(tree): File[]` | Heuristic: select key `.tsx`/`.jsx` files (skip node_modules, test files, examples). |

**Design Profile Output:**
```json
{
  "mode": "light" | "dark",
  "glass": true,
  "radius": 16,
  "font": "Inter, sans-serif",
  "palette": { "bg": "#...", "surface": "#...", "text": "#...", "dim": "#...", "accent": "#...", "accent2": "#..." },
  "logo": "/path/to/logo.svg"
}
```

**Component Inventory Output:**
```json
{
  "items": [
    { "kind": "overview", "primitive": "bento-grid", "label": "..." },
    { "kind": "feature", "primitive": "card", "label": "..." },
    { "kind": "assistant", "primitive": "chat-bubble", "label": "..." }
  ]
}
```

**Key:** No runtime; reads source. Tokens merged by priority (CSS vars are explicit, Tailwind is config, brand is derived). Fallback ensures inventory always returns something concrete.

---

### direct/

**Purpose:** Consume APPROVED ProjectBrief + DesignProfile + ComponentInventory → Valid Storyboard JSON via Gemini.

| File | Exports | Purpose |
|------|---------|---------|
| `director.ts` | `direct(brief, design, inventory): DirectorResult` | **Orchestrator (v3).** Consumes **approved brief** (not raw facts). Generate → validate → repair loop (≤2 retries). Returns storyboard with 42-primitive UI-kit scene specs. |
| `build-director-prompt.ts` | `buildDirectorPrompt(brief, design, inventory): string`, `buildRepairPrompt(raw, errors): string` | Synthesize few-shot prompt for Gemini. **v3:** Includes approved brief (not facts), **flow template per usageType** (e.g., CLI → terminal + progress + card), conditional CTA (real URL from brief.links or tagline). Includes 42-primitive registry, story rules, design, inventory. |

**Flow (v3):**
1. Build prompt (approved brief + design + inventory + schema + 42-primitive registry + usageType-specific flow template + few-shot example).
2. Call Gemini (configurable model, default gemini-3.5-flash, temp 0.6) → raw JSON string.
3. Parse + inject metadata (theme, accent, design profile).
4. Validate (zod + quality rules).
5. If errors and `repaired < 2` → buildRepairPrompt (temp 0.4) → retry.
6. Final scrub (remove injected secrets), return storyboard.

**Key v3:** Director consumes **approved brief** (not raw facts), ensuring accuracy. usageType drives **flow template** (no force-fit). CTA is **conditional** (real URL or tagline). Cannot invent features/links/commands.

---

### render/

**Purpose:** Consume Storyboard JSON (with UI-kit specs) + DesignProfile → render to `.mp4` using Remotion + React.

#### Entry Points
| File | Exports | Purpose |
|------|---------|---------|
| `render-trailer.ts` | `renderTrailer(storyboard, opts): Promise<string>` | **Orchestrator.** Bundle Remotion entry, select composition, render to .mp4. |
| `index.ts` | Remotion entry point | Exports Root composition for bundling. |
| `Root.tsx` | Root Remotion composition | Takes storyboard via inputProps, renders Trailer. |
| `Trailer.tsx` | Trailer composition | Assembles Scene components into a timeline. Dispatch on scene type. |
| `theme.ts` | `themeFromProfile(design): Theme` | **v2:** Merge DesignProfile into render-time Theme object. All primitives use it. |

#### Scenes (React Components)
| File | Scene Types | Purpose |
|------|-------------|---------|
| `scenes/ui-recreation-scenes.tsx` | **ui-showcase, ui-bento, ui-sequence** | Render 42-primitive UI-kit by name + props. Apply theme. Wrapped in RenderBoundary (v3). Optional sidebar rail. |
| `scenes/text-scenes.tsx` | title, problem, stat, outro | Text-focused scenes (reading floor respected). |
| `scenes/media-scenes.tsx` | ui, demo | Legacy: UI stills and clips with framing + Ken-Burns. |
| `scenes/graphics-scenes.tsx` | feature-montage, techstack | Fast montages (cards, badges). |
| `scenes/code-scene.tsx` | code | Syntax-highlighted code snippet (Shiki). |
| (implicit) | architecture | Mermaid diagram or node-graph. |

#### UI-Kit (v3: 42 Animated Primitives)
| File | Primitives | Purpose |
|------|-----------|---------|
| `ui-kit/index.ts` | **UI_KIT registry** | Map primitive NAME (string from schema) to React component. Keyed by `PRIMITIVE_NAMES` (42 strings). |
| `ui-kit/panels.tsx` | **panel, card, bento-grid** (3) | Glass surface containers. Card is title+body+icon. Bento grid is responsive tile layout. |
| `ui-kit/data-viz.tsx` | **stat-tile, bar-chart, line-chart, donut-chart** (4) | Data visualization: stat value, bar chart, line chart, donut/pie chart. Animated entrance. |
| `ui-kit/chrome.tsx` | **sidebar-nav, table, kanban-column** (3) | App chrome: sidebar with icons/labels, data table, kanban column. |
| `ui-kit/interaction.tsx` | **chat-bubble, input-field, button, toggle** (4) | Interactive: chat message, text input, button, toggle switch. |
| `ui-kit/frames.tsx` | **mobile-frame, browser-window** (2) | **v3:** Wraps child primitive to give device context (phone / browser). |
| `ui-kit/dev.tsx` | **code-snippet, api-exchange, log-stream, file-tree, code-diff, command-palette** (6) | **v3:** Dev-focused: code, API request/response, logs, file structure, diffs, command palette. |
| `ui-kit/data-extra.tsx` | **world-map, sparkline, metric-grid, gauge, leaderboard, heatmap** (6) | **v3:** Advanced data: geospatial, sparklines, KPI grids, gauges, rankings, heatmaps. |
| `ui-kit/surfaces.tsx` | **feed, calendar, profile-card, notification-toast, pricing-tiers, product-card, settings-list, tabs, modal, form, step-wizard, comparison** (12) | **v3:** Content surfaces: feeds, calendars, profiles, notifications, pricing, products, settings, navigation, dialogs, forms, wizards, comparisons. |

**Primitive Registry:** `PRIMITIVE_NAMES` (shared/primitive-names.ts) = 42 strings. Schema enum validates Director output. **All primitives apply motion variants + optional FX + theme.**

#### Error Boundary (v3: Crash-Safety)
| File | Exports | Purpose |
|------|---------|---------|
| `components/error-boundary.tsx` | **`RenderBoundary`** | **v3:** Error boundary class component. Wraps scenes + elements. Catches render errors; degrades to blank instead of aborting render. Ensures malformed LLM props don't break video. |

#### Components (Reusable)
| File | Exports | Purpose |
|------|---------|---------|
| `components/scene-frame.tsx` | SceneFrame | Base frame: bg, transition, SFX cue. |
| `components/browser-frame.tsx` | BrowserFrame | macOS browser chrome (for legacy ui/demo). |
| `components/code-block.tsx` | CodeBlock | Syntax highlighting (Shiki) + line highlights. |
| `components/animated-text.tsx` | AnimatedText, AnimatedLine | Text with fade/slide/type animations. |
| `components/badge-row.tsx` | BadgeRow | Horizontal badge/logo montage. |
| `components/flow-diagram.tsx` | FlowDiagram | Node-graph visualization. |
| `components/ken-burns-img.tsx` | KenBurnsImg | Pan/zoom Ken-Burns animation on still. |

#### Background & Icons
| File | Exports | Purpose |
|------|---------|---------|
| `background/scene-background.tsx` | SceneBackground | Particle, glow, light-rays, grid. Themed from Design Profile. |
| `icons/icon.tsx` | Icon | Resolve icon by name (lucide + simple-icons). |
| `icons/tech-icon.tsx` | TechIcon | Map tech stack names to brand icons. |

#### Lib
| File | Exports | Purpose |
|------|---------|---------|
| **`lib/motion.ts`** (v3) | **`enter()`** (7 variants: fade-up, scale, blur, clip-left, clip-up, spring-pop, rise), **`countUp()`**, **`typewriter()`**, **`tilt3d()`**, **`parallax()`** | **v3:** Frame-driven motion helpers. All deterministic, no randomness. |
| **`lib/fx.tsx`** (v3) | **`DrawPath`**, **`ShimmerSweep`**, **`ScanLine`**, **`ParticleBurst`**, **`GlowPulse`** | **v3:** Frame-driven visual FX (SVG reveal, glass, scan, particles, glow). Optional per-primitive. |
| `lib/parse-mermaid.ts` | `parseMermaid(src): SVG` | Deterministic Mermaid → SVG (no puppeteer). |
| `lib/timing.ts` | `entrance()`, `easeInOutCubic()`, spring helpers | Animation easing + spring physics + entrance curves. |

**Key Render Logic (v2):**
1. `renderTrailer()` bundles `src/render/index.ts` (Remotion entry) with webpack (extensionAlias for .ts/.tsx).
2. `Root.tsx` is a Remotion Composition; reads `storyboard` from inputProps.
3. `Trailer.tsx` creates Sequence for each scene, dispatches on `scene.type`.
4. UI-recreation scenes invoke `renderEl(primitive, theme, delay)` → looks up primitive in UI_KIT → renders React component with props.
5. Render-time Theme is built from `storyboard.meta.design` (DesignProfile).
6. Remotion renderMedia does bundling + video codec work (CPU-concurrency scaled).

---

### server/

**Purpose:** Fastify server, SSE progress broadcast, two-stage gated pipeline orchestration (v3).

| File | Exports | Purpose |
|------|---------|---------|
| `server.ts` | `buildServer(repoRoot): FastifyInstance`, `startServer(repoRoot, port): string` | Build + start Fastify app. **v3 routes:** GET `/` (HTML UI with brief review panel), GET `/api/events` (SSE progress), POST `/api/analyze` (stage A: analyze + brief), GET `/api/brief` (fetch current brief), POST `/api/brief` (edit brief), POST `/api/approve` (stage B: direct + render), GET/POST `/api/storyboard` (fetch/re-render). |
| `pipeline.ts` | **`runAnalysis()`**, **`runRender()`**, `runPipeline()`, `rerender()` | **v3 two-stage:** `runAnalysis()` does phases 1–2b (returns brief); `runRender()` does phases 3–4 (needs approved brief). `runPipeline()` chains both for `--yes` (headless). `rerender()` edits storyboard + re-renders (skip analyze). |

**SSE Model (v3):**
- GET `/api/events` opens a persistent SSE stream (hijacks Fastify reply).
- Each phase broadcasts progress (stage, status, message).
- UI subscribes; updates progress bar / logs / brief panel.
- Fire-and-forget: POST `/api/analyze` kicks off stage A; POST `/api/approve` kicks off stage B.
- Gate: UI shows `brief.json` + `brief.md` after analyze; user can GET `/api/brief` (fetch), POST `/api/brief` (edit), then POST `/api/approve` (approve).

**Artifacts:** All saved to `<repo>/.autodemo/`. Brief review happens in browser UI before approval.

---

### cli/

**Purpose:** CLI entry point (`npx autodemo`).

| File | Exports | Purpose |
|------|---------|---------|
| `index.ts` | `main()` | **v3:** Resolve target repo, assert Gemini API key. If `--yes`/`-y`, run headless `runPipeline()` (analyze → brief → approve → render, no gate). Otherwise, start server, open browser to brief-gate UI. |

**Commands:**
- `npx autodemo [repoPath]` — interactive mode (default): analyze → brief review panel (server UI) → approve → render.
- `npx autodemo [repoPath] --yes` or `npx autodemo [repoPath] -y` — headless mode: skips approval gate; analyze → brief → render one-shot.
- If no path → current working directory.
- Finds free port (tries 0, 4747, 4748, 4749).
- Starts server, opens browser to `http://localhost:<port>` (interactive) or streams progress to console (headless).

---

## How to Run

### Development
```bash
# Install deps
npm install

# Ensure Gemini API key
export GEMINI_API_KEY=...

# Run CLI (will start server + open browser)
npm run dev
npm run dev ../path/to/repo  # or point at a repo
```

**v2 Change:** Removed `npx playwright install chromium` — no longer needed (no screen capture).

### Scripts
| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TS → dist/ (tsup). |
| `npm run typecheck` | Type-check without emitting (tsc --noEmit). |
| `npm run dev` | Run CLI via tsx (no build step). |
| `npm run test` | Run vitest suite. |
| `npm run inspect-design` | Test inspect-ui on a repo (debug design profile extraction). |
| `npm run inspect-components` | Test component inventory on a repo. |
| `npm run make-trailer-v2` | Manual trailer generation (test pipeline). |
| `npm run render-still` | Render one scene as a still image. |

### As Published Package
```bash
# Install globally or as dev dependency
npm install autodemo

# Run
npx autodemo /path/to/repo
```

---

## Key Entry Points

| Context | Entry Point | Command |
|---------|------------|---------|
| **NPM CLI** | `src/cli/index.ts` | `npx autodemo [repoPath]` |
| **Dev Server** | `src/server/server.ts` | Started by CLI; listens on free port. |
| **Full Pipeline** | `src/server/pipeline.ts` | `runPipeline(root, onProgress)` |
| **Remotion Render** | `src/render/index.ts` | Bundled + rendered by `renderTrailer()`. |
| **LLM Calls** | `src/shared/gemini-client.ts` | `generateRawJson(prompt, opts)` |

---

## Dependencies (High-Level)

| Package | Role |
|---------|------|
| `@google/genai` | Gemini API client. |
| `@remotion/*` | Video bundling, rendering, composition. |
| `fastify` + `@fastify/static` | Web server, static file serving. |
| `react` + `react-dom` | Remotion composition (React). |
| `zod` | Runtime type validation (schemas). |
| `shiki` | Syntax highlighting (code scene). |
| `open` | Open browser on startup. |
| `get-port` | Find free port. |
| `lucide-react` + `simple-icons` | Icon libraries (no emoji). |

**v2 Removed:** `playwright` (no screen capture).

---

## Special Paths

All resolved via `src/shared/asset-path.ts`:

| Purpose | Resolution |
|---------|-----------|
| **Package root** | `packageRoot()` = where `package.json` lives (works in both `tsx` dev + installed pkg). |
| **UI HTML** | `uiIndexPath()` = `{packageRoot()}/assets/ui/index.html`. |
| **Work directory** | `{repoRoot}/.autodemo/` (config.workDir). |
| **Capture directory** | `{repoRoot}/.autodemo/captures/`. |

---

## Performance Notes

- **Analyze:** <5s (file walk + stack detect + Gemini triage call, 4–8 files read).
- **Capture:** <15s (Playwright spawn + screenshot + clip, or file copy fallback).
- **Direct:** <10s (Gemini director call, usually 1–2 rounds).
- **Render:** <60s (CPU-bound; scales with cores; reduced concurrency if clips present).
- **Total:** ~2 min end-to-end on typical 8-core machine.

---

## Testing

```bash
npm run test  # vitest run
```

Tests are minimal in v0 (focus on pipeline integration). Future: expand coverage on scene rendering + schema validation.

---

## Environment Variables

All optional (sensible defaults):

```bash
GEMINI_API_KEY=...                           # Required for analysis + director
AUTODEMO_DIRECTOR_MODEL=gemini-3.5-flash    # Default: gemini-3.5-flash
AUTODEMO_TRIAGE_MODEL=gemini-3.1-flash-lite # Default: gemini-3.1-flash-lite
AUTODEMO_FPS=30                             # Frames per second
AUTODEMO_WIDTH=1920                         # Video width
AUTODEMO_HEIGHT=1080                        # Video height
AUTODEMO_THEME=cinematic-dark               # or: brand-light
AUTODEMO_ACCENT=#41A3EF                     # Brand color
AUTODEMO_ACCENT2=#FCCE50                    # Secondary accent
AUTODEMO_PORT=0                             # 0 = pick free port
AUTODEMO_MAX_FULL_READ=10                   # Max files to fully read in analyze
AUTODEMO_WORKDIR=.autodemo                  # Work directory name
```

Or use `.env` file (loaded by `config.ts` via `process.loadEnvFile()`).

---

## Summary

AutoDemo v2 is a **4-phase Node.js + TypeScript + React pipeline** organized into focused modules. Analyze → Inspect-UI (extract design + classify components) → Direct (Gemini composes storyboard) → Render (Remotion + themed primitives). The **Storyboard JSON** (zod schema in `shared/`) is the contract; **DesignProfile** enables per-project theming. UI-kit registry maps 14 named primitives; scenes reference by name. Server orchestrates via SSE; Remotion renders locally. Entry point is CLI (`npx autodemo`); source shipped in package for Remotion.
