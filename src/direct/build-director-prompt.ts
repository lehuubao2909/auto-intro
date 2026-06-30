import type { ProjectBrief, DesignProfile, ComponentInventory } from "../shared/types.js";

/**
 * Director prompt (v2.1 — NARRATIVE UI RECREATION). Inputs: RepoFacts + DesignProfile
 * + ComponentInventory. Output: a Storyboard that TELLS THE STORY of using the product
 * — its core flow (input → process → output), recreated as animated vector UI. No
 * screenshots, no code dumps, no emoji, no auth/settings filler. Palette injected after.
 */

const SAFE_ICONS = [
  "LayoutDashboard", "Search", "MessageSquare", "Settings", "Folder", "Bell", "Zap", "Shield",
  "Lock", "TrendingUp", "BarChart3", "PieChart", "Activity", "Users", "User", "Plus", "Check",
  "Target", "Sparkles", "Calendar", "Clock", "Star", "Filter", "Workflow", "Database", "Globe",
  "Rocket", "Cloud", "Terminal", "FileText", "Inbox", "CreditCard", "Gauge", "Play", "Upload", "Wand2",
];

const CONTRACT = `You are the DIRECTOR of a 45-60s product trailer that RECREATES a product's UI as clean animated
vector graphics (modern SaaS launch-video style). NO screenshots, NO screen recording, NO code dumps,
NO emoji. Output ONE Storyboard JSON.

THE #1 RULE — TELL A STORY, SHOW THE PRODUCT IN ACTION:
The trailer must walk a viewer through HOW SOMEONE USES this product to get a result. Find the product's
SINGLE core action (from RepoFacts.whatItDoes) and SHOW it happening as a flow: input → process → output.
Do NOT explain with decorative charts/tables. Skip login/auth/settings/secondary screens entirely.

ARC (a STARTING POINT, not a fixed template): title → problem → THE CORE FLOW (the hero, 1-2 scenes
showing the product used) → why-it-matters (feature-montage / a key stat) → techstack → outro.
ADAPT the arc, scene mix, and LENGTH to THIS project — a CLI, a data dashboard, an SDK and a content app
should tell DIFFERENT stories with different scene types. Follow the SCENE BUDGET below (length follows
content; never pad with filler to reach a number).

PACING (durationInFrames @ fps=30) — keep text scenes SNAPPY, give UI scenes room to read:
- title ~70 · problem ~80 · stat ~70 · outro ~95 (text scenes: short, they settle fast)
- ui-sequence ~210-260 · ui-bento/ui-showcase ~170-220 · feature-montage ~180-210 · techstack ~120 · architecture ~160.

SCENE TYPES (durationInFrames are FRAMES at fps=30):
- title         {text(<=7 words), sub?}
- problem       {lines: string[1..2]}
- feature-montage {items:[{icon, text(2-4 words)}] (3-5), perItemFrames?~36}   // icon = a lucide name
- ui-sequence   {steps:[{primitive, props}] (2-3), caption?}   // THE HERO: one step at a time = the flow
- ui-showcase   {element:{primitive, props}, sidebar?, caption?}   // one surface in focus
- ui-bento      {tiles:[{primitive, props}] (3-6), cols?, sidebar?, caption?}   // ONLY if product is a dashboard/analytics tool
- architecture  {mermaid OR graph:{nodes:[{id,label}],edges:[{from,to}]}, caption?}   // ONE mechanism, optional
- techstack     {items:[{name}], caption?}
- stat          {value, label, sub?}
- outro         {text, cta, sub?}
- sidebar (for ui-showcase/ui-bento): {items:[{icon,label}] (2-5), active}

PRIMITIVE CATALOG — pick the ones that fit the product (names + props for tiles/element/steps):
dev/CLI: terminal {command, output?:string[]} · progress-steps {steps:string[], title?} · code-snippet {code, lang, caption?}
  · api-exchange {method, endpoint, response} · log-stream {lines:string[]} · file-tree {items:string[]} · code-diff {added:string[], removed:string[]} · command-palette {query?, results:string[]}
input/IO: input-field {placeholder?, query?} · chat-bubble {from:"ai"|"user", text, bullets?:string[], typing?:true} · button {label, icon?} · toggle {on?, label?} · form {fields:string[], submitLabel?}
data/analytics: stat-tile {label, value, suffix?, delta?} · line-chart {values:number[]} · bar-chart {values:number[]} · donut-chart {percent, label?}
  · sparkline {values:number[]} · gauge {percent, label?} · metric-grid {metrics:[{label,value}]} · leaderboard {rows:[{name,value}]} · heatmap {weeks?} · world-map {points?}
content/app: card {title, body?, icon?} · feed {items:[{title, meta?}]} · table {columns:string[], rows:string[][]} · kanban-column {title, cards:string[]}
  · calendar {month?, highlights?:number[]} · profile-card {name, role?, stats?:[{label,value}]} · notification-toast {title, body?, icon?} · settings-list {items:[{label,on?}]} · tabs {tabs:string[], active?} · modal {title, body?} · step-wizard {steps:string[], active?} · comparison {before, after}
commerce: pricing-tiers {tiers:[{name, price, features:string[]}]} · product-card {title, price?, tag?}
frames (WRAP a child to give context): mobile-frame {children} · browser-window {url?, children}
layout: panel {children} · bento-grid {} · sidebar-nav {items:[{icon,label}], active}
layout templates (editorial — great as a ui-showcase element to vary the look; self-contained, no nesting):
  split-hero {title, body?, bullets?:string[]} · stacked-timeline {steps:[{title, body?}]} · metric-banner {metrics:[{label,value,suffix?}]}
  · quote-card {quote, author?, role?} · before-after {before, after, label?} · device-mockup-trio {screens?:string[]}
  · tab-switcher {tabs:string[], active?} · map-pins {points?:[{x,y,label?}]} · code-to-ui {code, lang?, result?} · feature-spotlight {title, labels:string[]}

Fill props with REAL specifics from the brief (actual command/feature/metric names). Use brief.usageType + the FLOW section to pick the hero beat.
Vary transitionIn across scenes (fade/slide/zoom/push/clip) — not all the same.

RULES: show the core flow EARLY (by ~10s). Variety: never 3 text-only scenes (title/problem/stat/outro) in a row,
and vary scene TYPES + transitionIn (don't repeat the same layout). ADAPT to the project: pick scene types that
fit THIS product (see FLOW + SCENE BUDGET). Do NOT force ui-bento unless it's genuinely a dashboard/analytics
tool. Do NOT pad with filler scenes to reach a length — a lean 8-scene story beats a padded 13-scene one.
techstack from the brief. Do NOT set colors/theme (injected). Output JSON ONLY: {"meta":{title,totalSeconds},"scenes":[...]}.`;

const FEWSHOT = `=== EXAMPLE (a CLI tool — STORY-DRIVEN; recreate for the ACTUAL project, don't copy content) ===
{"meta":{"title":"Shipfast","totalSeconds":48},"scenes":[
 {"type":"title","durationInFrames":70,"text":"Ship in one command.","sub":"Shipfast · deploy any app instantly"},
 {"type":"problem","durationInFrames":80,"lines":["Deploys are slow and fiddly.","Too many steps to go live."]},
 {"type":"ui-sequence","durationInFrames":240,"caption":"from one command to live",
  "steps":[{"primitive":"terminal","props":{"command":"npx shipfast deploy","output":["Reading project…"]}},
           {"primitive":"progress-steps","props":{"title":"Shipfast","steps":["Bundle","Optimize","Upload","Go live"]}},
           {"primitive":"card","props":{"title":"Live at shipfast.app","body":"Deployed in 8s","icon":"Rocket"}}]},
 {"type":"feature-montage","durationInFrames":190,"perItemFrames":38,
  "items":[{"icon":"Zap","text":"Zero config"},{"icon":"Globe","text":"Global edge"},{"icon":"Shield","text":"Auto HTTPS"},{"icon":"Activity","text":"Live logs"}]},
 {"type":"ui-showcase","durationInFrames":170,"caption":"watch it roll out",
  "element":{"primitive":"progress-steps","props":{"title":"Rollout","steps":["Build","Deploy to edge","Health check","Done"]}}},
 {"type":"stat","durationInFrames":70,"value":"8s","label":"average deploy","sub":"commit to live"},
 {"type":"techstack","durationInFrames":120,"caption":"built with","items":[{"name":"Node.js"},{"name":"TypeScript"},{"name":"Docker"}]},
 {"type":"outro","durationInFrames":95,"text":"Shipfast","sub":"deploy any app instantly","cta":"shipfast.app"}
]}`;

const USAGE_FLOW: Record<string, string> = {
  cli: "CLI → hero ui-sequence: terminal(the real command) → progress-steps(what runs) → card(result). Favor: code-to-ui, stacked-timeline (the steps). AVOID dashboards/ui-bento.",
  sdk: "SDK → hero is code-to-ui (real import/usage from howItsUsed → rendered result), or code-snippet → card. Do NOT show a terminal install unless that's truly how it's used. AVOID ui-bento.",
  library: "Library → code-to-ui / code-snippet of the API in use → card(outcome). Favor: stacked-timeline, feature-spotlight. AVOID dashboards.",
  "web-app": "Web app → hero ui-sequence of the MAIN feature: input/action → working surface → result. Skip auth/settings. Favor: split-hero (landing beat), feature-spotlight. Use ui-bento ONLY if it's genuinely a dashboard/analytics tool.",
  api: "API → ui-sequence: input-field/terminal(a request) → card/table(the JSON response), or code-to-ui (request → response). Favor: metric-banner for throughput stats.",
  mobile: "Mobile → device-mockup-trio for the key screens, or a main-flow with card/feed/stat tiles. Favor: map-pins if location-based. Keep it the core feature.",
  desktop: "Desktop → main window + core action as a ui-sequence. Favor: split-hero, feature-spotlight.",
  unknown: "Infer the single core action and show it input → result. Favor split-hero / stacked-timeline / feature-spotlight to frame it.",
};

/** Content-richness signal → drives scene budget + length. From the inventory size. */
type Richness = "sparse" | "moderate" | "rich";
function richnessOf(inventory: ComponentInventory): Richness {
  const n = inventory.items?.length ?? 0;
  if (n <= 4) return "sparse";
  if (n <= 9) return "moderate";
  return "rich";
}
const SCENE_BUDGET: Record<Richness, string> = {
  sparse: "SPARSE → 7-9 scenes, ~45s. Lean: one strong hero flow; skip optional architecture/extra UI scenes. Better short than padded.",
  moderate: "MODERATE → 9-11 scenes, ~50-54s: hero flow + 1-2 supporting UI scenes + montage/stat.",
  rich: "RICH → 11-14 scenes, ~56-60s: hero flow + multiple UI surfaces (sequence/bento/showcase) + montage + stat + (optional) architecture.",
};

export function buildDirectorPrompt(brief: ProjectBrief, design: DesignProfile, inventory: ComponentInventory): string {
  const inv = inventory.items.map((i) => `  - ${i.kind}: primitive=${i.primitive}, label="${i.label}"`).join("\n");
  const hasLink = Boolean(brief.links.url || brief.links.repo);
  const ctaRule = hasLink
    ? `Outro cta = ${brief.links.url ?? brief.links.repo}.`
    : `NO real URL/repo exists → outro cta must be a SHORT TAGLINE (e.g. "${brief.oneLiner}"), NEVER a fabricated url/github.`;
  return [
    CONTRACT,
    "",
    FEWSHOT,
    "",
    "=== APPROVED BRIEF (the contract — do not contradict; this is what the user signed off) ===",
    JSON.stringify(brief, null, 2),
    "",
    `=== FLOW for usageType "${brief.usageType}" ===`,
    USAGE_FLOW[brief.usageType] ?? USAGE_FLOW.unknown,
    "Ground every prop in the brief (real features/usage). Use brief.suggestedBeats as the story spine.",
    ctaRule,
    "",
    "=== SCENE BUDGET for THIS project (length follows content — do NOT pad to a number) ===",
    `Detected richness: ${richnessOf(inventory)} (${inventory.items?.length ?? 0} component surfaces in the inventory).`,
    SCENE_BUDGET[richnessOf(inventory)],
    "",
    "=== COMPONENT INVENTORY (hints for which surfaces exist) ===",
    inv || "  (none — infer the core flow from the brief)",
    "",
    `Allowed lucide icon names: ${SAFE_ICONS.join(", ")}.`,
    `Project style is ${design.mode} mode (palette injected). Now write the STORY storyboard for THIS project.`,
  ].join("\n");
}

/** Append validator errors for a repair attempt. */
export function buildRepairPrompt(previous: string, errors: string[]): string {
  return [
    "Your previous Storyboard JSON failed validation. Fix EXACTLY these problems and return the full corrected JSON (JSON only):",
    ...errors.map((e) => `- ${e}`),
    "",
    "Previous JSON:",
    previous,
  ].join("\n");
}
