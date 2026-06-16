# AutoDemo — System Architecture

## Pipeline Overview (v3)

AutoDemo v3 operates as a **two-stage human-gated pipeline** with 4 internal phases. Stage A (analyze → brief) stops for human review; Stage B (approve → render) executes after approval.

```
STAGE A: ANALYSIS (stops for approval)      STAGE B: RENDER (approve → render)
Phase 1: ANALYZE         Phase 2: INSPECT   ─── Brief Review (Human) ───  Phase 3: DIRECT      Phase 4: RENDER
┌──────────────────┐  ┌──────────────┐  POST /api/brief             ┌──────────────┐    ┌──────────────────┐
│ repo-facts.json  │─▶│ design +     │────▶ (review/edit) ────────▶│ storyboard   │───▶│ trailer.mp4      │
│ (RepoFacts)      │  │ inventory    │  GET /api/brief        │     │ (Storyboard) │    │ (video file)     │
│ (with usageType) │  │ + brief.json │  POST /api/approve     │     │ (UI-kit 42)  │    │ (+motion/FX)     │
└──────────────────┘  └──────────────┘                         │     └──────────────┘    └──────────────────┘
  analyze/             inspect-ui/                             │       direct/            render/
  (detect-usage-type)  brief/                  (CLI: --yes skips gate; server: web UI)   (RenderBoundary)
```

**v3 Key Changes:**
- **Two-stage gate:** Pipeline splits at brief (stage A ends) with server routes `/api/analyze`, `/api/brief` (GET/POST), `/api/approve`.
- **usageType detection** (cli, sdk, library, web-app, api, mobile, desktop, unknown) → drives flow templates in Director.
- **42 UI-kit primitives** (up from 14): panels (3), charts (4), chrome (3), interaction (4), frames (2), dev (6), data-extra (6), surfaces (12).
- **Rich motion/FX:** `lib/motion.ts` variants (fade-up, scale, blur, clip, spring-pop, rise), `lib/fx.tsx` effects (DrawPath, ShimmerSweep, ScanLine, ParticleBurst, GlowPulse).
- **Crash-safety:** `RenderBoundary` error boundary wraps scenes + elements; malformed LLM props degrade gracefully.
- **Conditional CTA:** Director picks a real URL or falls back to tagline (no fabricated links).

---

## Phase 1: Analyze (analyze/)

**Input:** repo root  
**Output:** `RepoFacts` (→ `.autodemo/repo-facts.json`)

### Modules
| Module | Purpose |
|--------|---------|
| `walk-repo.ts` | Traverse repo tree, catalog files (size, type, readability). |
| `detect-tech-stack.ts` | Parse package.json, detect frameworks (Next.js, React, Node, etc.). |
| `detect-runnable.ts` | Find dev commands, framework ports, live URL in README, repo screenshots. |
| `detect-usage-type.ts` | **v3:** Deterministic detection of how product is consumed (cli/sdk/library/web-app/api/mobile/desktop/unknown). Returns real install hint (e.g., `npx foo`) only if confident, else null. |
| `triage-and-summarize.ts` | Send curated code excerpt to Gemini (flash-lite) for identity, problem, features. |
| `scrub-secrets.ts` | Mask env vars, API keys, credentials before LLM sees them. |
| `repo-facts.ts` | Orchestrator: combine all signals into a `RepoFacts` struct. |

### Key Outputs
```typescript
type RepoFacts = {
  name: string;
  identity: string;         // "one-liner: what is it"
  problem: string;
  whatItDoes: string;
  features: string[];
  techStack: string[];
  usageType: UsageType;     // "cli" | "sdk" | "library" | "web-app" | "api" | "mobile" | "desktop" | "unknown"
  install: string | null;   // real command only (e.g., "npm i foo", "npx bar") or null
  links: {                  // real URLs only (never invented)
    url?: string;
    repo?: string;
  };
  howItWorks?: string;
  runnable: {
    hasUi: boolean;
    devCommand?: string;
    port?: number;
    liveUrl?: string;
    screenshots: string[];
  };
  repoUrl?: string;
}
```

**v3 Key:** `usageType` + `install` + `links` are deterministic (not LLM-invented). Director uses `usageType` to pick flow template.

---

## Phase 2: Inspect-UI (inspect-ui/)

**Input:** `RepoFacts` + repo source tree  
**Output:** `DesignProfile` + `ComponentInventory` (→ `.autodemo/*.json`)

AutoDemo reads the project's **frontend source design tokens and component structure** without running the app. Two parallel inspections feed the Director:

### Design Profile: `design-profile.ts`
Extracts visual identity from source (color tokens, fonts, border-radius, logo). Merges hierarchy:
1. **CSS Variables** (most explicit, e.g., `--colors-primary`)
2. **Tailwind Config** (regex parse, no eval; extract palette keys)
3. **Brand/SVG** (grab accent color from logo SVG; detect from src/assets)

**Output:**
```json
{
  "mode": "light" | "dark",
  "glass": true,
  "radius": 16,
  "font": "Inter, sans-serif",
  "palette": {
    "bg": "#0a0f1e",
    "surface": "#1a202c",
    "text": "#eef2fb",
    "dim": "#9ca3af",
    "accent": "#41A3EF",
    "accent2": "#FCCE50"
  },
  "logo": "/path/to/logo.svg"
}
```

Persists to `.autodemo/design-profile.json`. **Renderer themes all primitives from this.**

### Component Inventory: `component-inventory.ts`
Classifies key UI components (React/Vue/SvelteSource code) into primitive types:
- **Gemini classification** (when available): detects dashboards, forms, charts, chat, etc.
- **Fallback synthesis** (when weak): derives from `RepoFacts.features` → deterministic cards + dashboard.

**Output:**
```json
{
  "items": [
    { "kind": "overview", "primitive": "bento-grid", "label": "Dashboard" },
    { "kind": "feature", "primitive": "card", "label": "Real-time Sync" },
    { "kind": "assistant", "primitive": "chat-bubble", "label": "Ask anything" }
  ]
}
```

Persists to `.autodemo/component-inventory.json`. **Director uses to populate `ui-kit` scenes.**

### Modules
| Module | Purpose |
|--------|---------|
| `design-profile.ts` | Orchestrator: merge CSS → Tailwind → brand; persist. |
| `parse-css-tokens.ts` | Extract CSS custom properties from .css/.tsx files (direct hex + shadcn HSL). |
| `parse-tailwind.ts` | Regex parse tailwind.config.js (no eval; extract palette). |
| `detect-font.ts` | Find font-family declarations from global CSS or link tags. |
| `grab-brand.ts` | Locate logo SVG, extract dominant accent color. |
| `color-utils.ts` | Helpers: isLight(), mix(), hex↔hsl. |
| `component-inventory.ts` | Orchestrator: Gemini classify or fallback. |
| `classify-components.ts` | Call Gemini with picked components; map to primitive types. |
| `pick-component-files.ts` | Heuristic: select key .tsx/.jsx files (avoid node_modules, test files). |

---

## Phase 2b: Build Brief (brief/)

**Input:** `RepoFacts`  
**Output:** `ProjectBrief` (→ `.autodemo/brief.json` + `.autodemo/brief.md`)

**v3:** After Phase 2 (inspect-ui), the pipeline pauses here for human review. Stage A stops. The brief becomes the **human-approved contract** for the Director.

### Modules
| Module | Purpose |
|--------|---------|
| `build-brief.ts` | Assemble ProjectBrief: LLM writes narrative (oneLiner, howItsUsed, keyFeatures, suggestedBeats); factual fields (usageType, install, links, techStack) come from deterministic RepoFacts (never invented). |
| `render-brief-md.ts` | Format brief as human-readable markdown (for review in browser/editor). |

### Key Outputs
```typescript
type ProjectBrief = {
  name: string;
  oneLiner: string;         // ≤10 words, LLM-generated
  problem: string;          // factual, from RepoFacts
  whatItDoes: string;       // factual
  usageType: UsageType;     // from Phase 1 detection
  howItsUsed: string;       // LLM narrative, grounded in usageType hint
  keyFeatures: string[];    // 3–6, LLM or fallback to RepoFacts.features
  techStack: string[];      // from RepoFacts
  links: {
    url?: string;           // only if real (from facts)
    repo?: string;
  };
  suggestedBeats: string[]; // 6–8 story beats for the trailer
}
```

**STAGE A ends here.** In server mode, GET/POST `/api/brief` allows review and editing before approval.

---

## Phase 3: Direct (direct/)

**Input:** APPROVED `ProjectBrief` + `DesignProfile` + `ComponentInventory`  
**Output:** Valid `Storyboard` JSON (→ `.autodemo/storyboard.json`)

**STAGE B begins.** Director consumes the **approved brief** (not raw RepoFacts) and builds a storyboard. Prompt includes **flow template** matched to brief's `usageType` (e.g., CLI → terminal + progress + card; API → request/response; web-app → core action). CTA is conditional: real URL from brief.links or tagline (no invention).

### Modules
| Module | Purpose |
|--------|---------|
| `build-director-prompt.ts` | Synthesize few-shot prompt: approved brief (not facts) + design/inventory + 42-primitive registry + flow template per usageType + story rules. Tagline-only CTA if no real URL. |
| `director.ts` | Call Gemini (configurable model, default gemini-3.5-flash, temp 0.6), validate, repair loop (≤2 retries). Returns storyboard with UI-kit scenes (42 primitives). |

### Flow: Generate → Validate → Repair Loop
```
generateRawJson(prompt)
        ↓
    [Parse JSON]
        ↓
    injectMeta(media)
        ↓
    validateStoryboard()
        ├─ Structural (zod): bail if schema fails
        └─ Quality rules:
            ✓ Has `techstack` scene (required)
            ✓ Has `ui`/`demo` or graphics-only is okay
            ✓ 8–14 scenes (~10–13 target)
            ✓ No 3+ text-only scenes in a row
            ✓ Text reading floor: sec ≥ max(1.0, words*0.25)
            ✓ ≤1 code scene, ≤1 architecture
            ✓ ≤6 scenes with SFX
        ↓
   [if !ok, repaired < 2]
        ├─ buildRepairPrompt(errors)
        └─ retry with lower temp (0.4)
        ↓
   [scrubDeep: remove injected secrets]
   [re-inject real media registry]
        ↓
   Return Storyboard
```

---

## Phase 4: Render (render/)

**Input:** Storyboard JSON (with 42 UI-kit primitives) + DesignProfile  
**Output:** `trailer.mp4` (→ `.autodemo/trailer.mp4`)

Remotion renderer composes scenes by dispatching on scene type. **UI-recreation scenes** render animated vector primitives from the `ui-kit` registry, themed from `DesignProfile`. **Crash-safety:** `RenderBoundary` wraps every scene + element; if a primitive throws (malformed LLM props), it degrades to blank instead of aborting the entire render.

### Modules
| Module | Purpose |
|--------|---------|
| `render-trailer.ts` | Bundle Remotion entry with webpack (ESM extensionAlias), render to .mp4. |
| `Root.tsx` | Remotion composition entry; reads storyboard via inputProps. |
| `Trailer.tsx` | Main composition: assembles Scene components into a timeline. Dispatch on scene type. |
| `components/error-boundary.tsx` | **v3:** `RenderBoundary` error boundary; wraps scenes/elements; render fallback (blank) on error instead of aborting. |
| `scenes/ui-recreation-scenes.tsx` | Render `ui-showcase`, `ui-bento`, `ui-sequence` by invoking 42-primitive ui-kit with props from storyboard. Wrapped in RenderBoundary. |
| `scenes/text-scenes.tsx` | Render `title`, `problem`, `stat`, `outro` (text-focused). |
| `scenes/media-scenes.tsx` | Render `ui` (stills), `demo` (clips) if present (legacy support). |
| `scenes/graphics-scenes.tsx` | Render `feature-montage`, `techstack` (cards, badges). |
| `scenes/code-scene.tsx` | Render `code` (syntax-highlighted snippet). |
| `ui-kit/index.ts` | **42-primitive registry:** Map primitive name (string from schema) to React component. |
| `ui-kit/{panels,charts,chrome,interaction,frames,dev,data-extra,surfaces}.tsx` | **42 animated vector primitives** (organized by category). Each applies motion + optional FX + theme. Defensive prop defaults for LLM robustness. |
| `lib/motion.ts` | **v3:** Reusable motion helpers: `enter()` variants (fade-up, scale, blur, clip-left, clip-up, spring-pop, rise), `countUp()`, `typewriter()`, `tilt3d()`, `parallax()`. Frame-driven, Remotion-safe. |
| `lib/fx.tsx` | **v3:** Visual FX components: `DrawPath` (SVG path reveal), `ShimmerSweep` (glass shine), `ScanLine` (tech texture), `ParticleBurst` (beat FX), `GlowPulse` (soft halo). |
| `background/scene-background.tsx` | Particle/glow/light-rays/grid backgrounds, themed. Particle count modest for render perf. |
| `icons/icon.tsx` | Lucide + simple-icons (no emoji). |
| `components/*.tsx` | Browser frame, code block, animated text, flow diagram, Ken-Burns. |
| `lib/parse-mermaid.ts` | Deterministic Mermaid parser (no puppeteer; returns SVG). |
| `theme.ts` | Per-project theming: `themeFromProfile(design)` merges `DesignProfile` into render-time `Theme` object. |

### Render Options
```typescript
interface RenderOptions {
  outPath: string;         // output .mp4 location
  mediaDir?: string;       // serves captured media (Remotion publicDir)
  onProgress?: (ratio: number) => void;
}
```

**CPU Scaling:** Concurrency = `cpu_count` if stills-only; `cpu_count / 2` if clips present (video decoding is expensive).

---

## The Storyboard JSON Contract

**Location:** `src/shared/storyboard-schema.ts` (zod = single source of truth)

### Root Structure
```typescript
{
  meta: {
    title: string;                    // video title
    fps: number;                      // default 30
    width: number;                    // default 1920
    height: number;                   // default 1080
    theme: "cinematic-dark" | "brand-light";
    accent: string;                   // brand color #RRGGBB
    accent2: string;                  // secondary accent
    music?: string;                   // mood key (deferred)
    bpm?: number;
    totalSeconds: number;
    media: MediaRegistry;             // empty in v2 (no stills/clips; was injected in v1)
    design?: DesignProfile;           // v2: per-project theming; when present, renderer uses it
  };
  scenes: Scene[];                    // discriminated union
}
```

### Scene Types (13 total: 10 legacy + 3 UI-recreation)

| Type | Fields | Duration | Use |
|------|--------|----------|-----|
| `title` | text, sub?, media? | 2–3s | Identity + promise. |
| `problem` | lines (1–2) | 2–3s | Problem statement. |
| `ui` | media (still), caption?, kenBurns? | 2–4s | Legacy: show static screenshot. |
| `demo` | media (clip), caption?, trim? | 2–5s | Legacy: show interaction clip. |
| `feature-montage` | items (3–5), perItemFrames? | 3–5s | Fast feature callouts. |
| `architecture` | mermaid? / graph?, caption? | 3–4s | How it works. |
| `techstack` | items (name, icon?), caption? | 2–3s | Badge/logo montage. |
| `code` | lang, code, highlight?, caption? | 3–5s | ONE algorithm if it sells. |
| `stat` | value, label, sub? | 2–3s | One number or fact. |
| `outro` | text, cta, sub? | 3s | CTA + repo / live URL. |
| **`ui-showcase`** | **element (PrimitiveElement), sidebar?, caption?** | **2–4s** | **v2: Single hero primitive (chart/table/chat). Optional app sidebar rail for context.** |
| **`ui-bento`** | **tiles (PrimitiveElement[]), cols?, sidebar?, caption?** | **4–5s** | **v2: Dashboard-style grid of primitives (3–6 tiles). Optional sidebar.** |
| **`ui-sequence`** | **steps (PrimitiveElement[]), caption?** | **3–4s** | **v2: A few UI primitives revealed in sequence (2–3 steps).** |

### UI-Kit Primitive Registry (v3: 42 Primitives)

**42 named vector primitives** organized by category (scene types `ui-showcase`/`ui-bento`/`ui-sequence` invoke these by name):

```json
{
  "primitive": "panel" | "card" | "bento-grid" |                        // panels (3)
               "stat-tile" | "bar-chart" | "line-chart" | "donut-chart" | // charts (4)
               "sidebar-nav" | "table" | "kanban-column" |               // chrome (3)
               "chat-bubble" | "input-field" | "button" | "toggle" |    // interaction (4)
               "mobile-frame" | "browser-window" |                       // frames (2)
               "code-snippet" | "api-exchange" | "log-stream" | "file-tree" | "code-diff" | "command-palette" | // dev (6)
               "world-map" | "sparkline" | "metric-grid" | "gauge" | "leaderboard" | "heatmap" | // data-extra (6)
               "feed" | "calendar" | "profile-card" | "notification-toast" | "pricing-tiers" | "product-card" |
               "settings-list" | "tabs" | "modal" | "form" | "step-wizard" | "comparison",  // surfaces (12)
  "props": { /* component-specific props */ }
}
```

Each primitive is a React component in `src/render/ui-kit/{panels,charts,chrome,interaction,frames,dev,data-extra,surfaces}.tsx`. All animate with **motion variants** + **optional FX** + glassmorphic styling from `DesignProfile`. Registry in `src/render/ui-kit/index.ts` keyed by `src/shared/primitive-names.ts`.

### Common Fields
All scenes share:
```typescript
durationInFrames: number;           // at meta.fps
transitionIn?: "fade" | "slide" | "wipe" | "cut";
sfx?: "whoosh" | "tick" | "riser" | "thock" | "impact" | "none";
bg?: string;                        // override background
```

---

## Data Flow Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE A: ANALYSIS (stops for approval)                                      │
│                                                                              │
│  ┌─────────────┐      ┌──────────────┐   ┌────────────────┐                 │
│  │  User Repo  │─────▶│ Phase 1+2:   │──▶│ Phase 2b:      │                 │
│  │ (source)    │      │ Analyze +    │   │ Build Brief    │                 │
│  └─────────────┘      │ Inspect-UI   │   │ (narrative +   │                 │
│                       │ (detect      │   │  factual)      │                 │
│                       │ usageType)   │   │ → brief.json   │                 │
│                       └──────────────┘   └────────┬───────┘                 │
│                                                   │                         │
│                                            ┌──────▼──────────────────────┐  │
│                                            │ APPROVAL GATE               │  │
│                                            │ CLI: --yes (skip)           │  │
│                                            │ Server: GET /api/brief      │  │
│                                            │         POST /api/brief     │  │
│                                            │         POST /api/approve   │  │
│                                            └──────┬──────────────────────┘  │
└─────────────────────────────────────────────────────┼──────────────────────┘
                                                      │ (APPROVED brief)
┌─────────────────────────────────────────────────────▼──────────────────────┐
│ STAGE B: RENDER (approve → render)                                          │
│                                                                              │
│  ┌────────────────────────────────────────┐   ┌──────────────────────────┐ │
│  │ Phase 3: Direct                        │──▶│ Phase 4: Render          │ │
│  │ - Prompt: brief + design + inventory   │   │ - Remotion bundle        │ │
│  │ - Gemini director (configurable model) │   │ - 42-primitive registry  │ │
│  │ - Flow template per usageType          │   │ - Motion/FX layers      │ │
│  │ - Conditional CTA (URL or tagline)     │   │ - RenderBoundary safety  │ │
│  │ - Validate + repair loop               │   │ - Render to .mp4         │ │
│  │ → storyboard.json (UI-kit 42 specs)    │   │ → trailer.mp4            │ │
│  └────────────────────────────────────────┘   └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. **Gemini-Only LLM (Configurable Model)**
- Director: default `gemini-3.5-flash` (best storyboard synthesis in budget); override via `AUTODEMO_DIRECTOR_MODEL` env.
- Triage: `gemini-3.1-flash-lite` (cheap long-context repo analysis).
- No multi-LLM fallback; Gemini is the lock-in decision.

### 2. **Two-Stage Human-Gated Pipeline (v3 Pivot)**
- **v2:** Analysis → Direct → Render (no human interception).
- **v3:** Stage A (analyze → brief) → **APPROVAL GATE** (human review/edit) → Stage B (approve → render).
- **Why:** Human-approved brief increases accuracy (LLM narrative grounded in facts); enables token-saving (once brief is approved, director doesn't re-analyze). CLI `--yes` skips gate (headless).

### 3. **Deterministic usageType Detection (No LLM Guessing)**
- `detectUsageType()` reads package.json, bin entries, framework deps (React, Next.js, Electron, etc.).
- Returns one of 8 types: cli, sdk, library, web-app, api, mobile, desktop, unknown.
- Produces real install hint (e.g., `npx foo`) only if confident; else null (no fabrication).
- Director uses usageType to pick **flow template** (e.g., CLI → terminal + progress + result).

### 4. **UI Reconstruction Over Screen Capture (v2 Pivot)**
- **v1:** Captured real UI with Playwright (stills + clips).
- **v2:** Reads source design tokens + component structure → Gemini composes animated vector primitives.
- **Why:** No app runtime needed, deterministic output, editable storyboard, NeuraFlow-style aesthetics.
- Playwright removed; inspect-ui module reads source only.

### 5. **Brief as Contract (Accuracy Anchor)**
- Storyboard zod schema validates against **approved brief**, not raw facts.
- LLM narrative (oneLiner, howItsUsed, suggestedBeats) is human-approved before director uses it.
- Factual fields (usageType, install, links) deterministic from Phase 1 (never invented by director).
- Result: director can't hallucinate features or fake URLs.

### 6. **42-Primitive UI-Kit Registry (Organized by Category)**
- Primitives organized: panels (3), charts (4), chrome (3), interaction (4), frames (2), dev (6), data-extra (6), surfaces (12).
- Director references by name; renderer dispatches via `UI_KIT` registry.
- Storyboard schema enum validates names against `PRIMITIVE_NAMES`.
- Modular: each primitive in its own .tsx file; easy to add/update.

### 7. **Rich Motion & FX (v3 Aesthetic)**
- `lib/motion.ts`: entrance variants (fade-up, scale, blur, clip, spring-pop, rise), countUp, typewriter, tilt3d, parallax.
- `lib/fx.tsx`: DrawPath (SVG reveal), ShimmerSweep (glass), ScanLine (tech), ParticleBurst (beat), GlowPulse (halo).
- Primitives layer motion + optional FX; deterministic frame-driven (no randomness).

### 8. **RenderBoundary Crash-Safety (v3 Robustness)**
- Error boundary wraps every scene + element.
- If a primitive throws (malformed LLM props), degrades to blank instead of aborting entire render.
- Ensures any storyboard renders to video, even if LLM produces garbage props.

### 9. **Conditional CTA (No Invented Links)**
- Director picks CTA from `brief.links.url` (real) or falls back to tagline (no URL).
- Never fabricates URLs; integrity over clickability.

### 10. **Storyboard JSON as Contract**
- Zod schema in source is single source of truth (used by validator, Director prompt).
- JSON enables edit-and-rerender in the UI (storyboard can be modified, video re-rendered without re-analyzing/inspecting).
- `meta.design` field for per-project theming.

### 11. **Per-Project Theming (Design Profile)**
- `DesignProfile` extracted from CSS/Tailwind/brand at inspect time.
- Renderer applies theme to all primitives via `themeFromProfile()`.
- Result: every trailer respects project's actual design system (colors, fonts, radius).

### 12. **Deterministic Output**
- Same repo + Gemini model + brief → same storyboard (temperature 0.6 generation, 0.4 repair).
- No randomness in render (CPU-scaled concurrency is deterministic).
- Enables edit-and-rerender workflow without re-analyzing.

### 13. **Local Rendering with Remotion**
- Video renders on user's CPU (Remotion ESM + webpack extensionAlias for TypeScript imports).
- Eliminates cloud rendering dependency and latency.
- CPU concurrency scaled down if video clips present (decoder overhead).

### 14. **Server with Brief-Gate UI (Fastify + SSE)**
- GET `/api/analyze` → triggers Stage A (analyze + brief), broadcasts progress.
- GET/POST `/api/brief` → fetch or edit brief (human review).
- POST `/api/approve` → triggers Stage B (direct + render).
- Artifacts served from `.autodemo/` folder; brief.md displayed for review.

### 15. **Deterministic Mermaid (No Puppeteer)**
- `parse-mermaid.ts` converts Mermaid to deterministic SVG inline (no headless browser).
- Ensures reproducible renders.

### 16. **Source Shipped with Package**
- `package.json` `files` includes `src/` and `skill/` (not just `dist/`).
- Remotion must compile TypeScript at bundle time, so source must be in node_modules.
- Trade: larger package size; benefit: zero build step for consumers.

---

## Module Entry Points

| Module | Export | Used by | v3 Note |
|--------|--------|---------|---------|
| `analyze/repo-facts.ts` | `analyzeRepo(repoRoot): RepoFacts` | server/pipeline.ts | Now includes `usageType` + real `install` + `links` |
| `analyze/detect-usage-type.ts` | `detectUsageType(tree): { usageType, install }` | analyze/repo-facts.ts | **v3:** Deterministic detection, no LLM |
| `inspect-ui/design-profile.ts` | `inspectDesign(repoRoot): DesignProfile` | server/pipeline.ts | Unchanged |
| `inspect-ui/component-inventory.ts` | `buildComponentInventory(root, facts): ComponentInventory` | server/pipeline.ts | Unchanged |
| `brief/build-brief.ts` | `buildBrief(facts): ProjectBrief` | server/pipeline.ts | **v3:** LLM narrative + factual fields (no invention) |
| `brief/render-brief-md.ts` | `renderBriefMd(brief): string` | server/server.ts | **v3:** Human-readable brief for review |
| `direct/director.ts` | `direct(brief, design, inventory): DirectorResult` | server/pipeline.ts | **v3:** Consumes approved brief (not facts); flow template per usageType |
| `render/render-trailer.ts` | `renderTrailer(sb, opts): string` | server/pipeline.ts | Unchanged (input: 42-primitive storyboard) |
| `server/pipeline.ts` | `runAnalysis()`, `runRender()`, `runPipeline()` | server/server.ts | **v3:** Two stages; `--yes` skips gate |
| `server/server.ts` | `buildServer(root)`, `startServer(root, port)` | cli/index.ts | **v3:** Routes: POST /api/analyze, GET/POST /api/brief, POST /api/approve |
| `cli/index.ts` | `main()` | bin entry (npx autodemo) | **v3:** `--yes` flag (headless, skips gate) |

---

## Configuration & Env

All config centralized in `src/shared/config.ts`:

```typescript
const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    directorModel: env("AUTODEMO_DIRECTOR_MODEL", "gemini-3.5-flash"),
    triageModel: env("AUTODEMO_TRIAGE_MODEL", "gemini-3.1-flash-lite"),
  },
  video: {
    fps: envInt("AUTODEMO_FPS", 30),
    width: envInt("AUTODEMO_WIDTH", 1920),
    height: envInt("AUTODEMO_HEIGHT", 1080),
    theme: env("AUTODEMO_THEME", "cinematic-dark"),
    accent: env("AUTODEMO_ACCENT", "#41A3EF"),
    accent2: env("AUTODEMO_ACCENT2", "#FCCE50"),
  },
  server: { port: envInt("AUTODEMO_PORT", 0) },  // 0 = pick free port
  analyze: { maxFullReadFiles: envInt("AUTODEMO_MAX_FULL_READ", 10) },
  workDir: env("AUTODEMO_WORKDIR", ".autodemo"),
};
```

---

## Artifacts Produced

All artifacts land in `<repo>/.autodemo/`:

| File | Purpose |
|------|---------|
| `repo-facts.json` | Phase 1 output; human-readable repo analysis. |
| `design-profile.json` | Phase 2 output; extracted design tokens (palette, fonts, radius, logo path). |
| `component-inventory.json` | Phase 2 output; classified UI components → primitive mappings. |
| `storyboard.json` | Phase 3 output; the Remotion composition input (includes UI-kit scene specs). |
| `trailer.mp4` | Phase 4 output; final video. |
| `logo.svg` (optional) | Extracted/copied brand logo (used by render publicDir). |

All readable JSON for debugging and re-use. v2 removed: `captures/` directory (no stills/clips).

---

## Summary

AutoDemo v3 is a **two-stage human-gated pipeline** with 4 internal phases that reconstructs project UIs as animated vector primitives. **Stage A:** Analyze → Inspect → Build Brief (stops for approval). **Gate:** Human reviews/edits brief in server UI or CLI accepts `--yes`. **Stage B:** Approved Brief → Direct (Gemini picks flow template per usageType) → Render (Remotion + 42 motion-rich primitives + FX + RenderBoundary crash-safety).

**Accuracy anchors:** usageType + install + links deterministic (Phase 1, never invented); brief is human-approved contract; Director can't hallucinate. **Robustness:** RenderBoundary degrades malformed props gracefully. **Aesthetics:** 42-primitive registry with motion variants + FX layers (DrawPath, ShimmerSweep, ParticleBurst, GlowPulse). **Flexibility:** Configurable director model (AUTODEMO_DIRECTOR_MODEL env).

Result: token-efficient, accurate trailers that respect real design systems; offline-capable; editable storyboard JSON enables fast iteration without re-analyzing.
