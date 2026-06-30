import { z } from "zod";
import type { RepoTree } from "../analyze/walk-repo.js";
import { pickComponentFiles, fileDigest } from "./pick-component-files.js";
import { scrubSecrets } from "../analyze/scrub-secrets.js";
import { generateRawJson } from "../shared/llm-client.js";
import { config } from "../shared/config.js";
import { PRIMITIVE_NAMES, type PrimitiveName } from "../shared/primitive-names.js";
import { ComponentInventory, type ComponentInventory as Inventory } from "../shared/types.js";

/**
 * Ask Gemini (triage model) to classify the repo's key UI surfaces into ui-kit
 * primitives. We accept LOOSE output then COERCE each item's primitive to a valid
 * registry name (alias map) and drop unmappable ones — so a single off-name never
 * discards the whole inventory. Returns null on hard failure (caller falls back).
 */

// loose: primitive is a free string; we coerce afterward
const LooseItem = z.object({ kind: z.string(), primitive: z.string(), label: z.string(), source: z.string().optional() });

/** Accept either {items:[...]} or a bare [...] (providers vary); → array of loose items. */
function normalizeItems(raw: string): z.infer<typeof LooseItem>[] {
  const parsed = JSON.parse(raw) as unknown;
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : [];
  return z.array(LooseItem).parse(arr);
}

const VALID = new Set<string>(PRIMITIVE_NAMES);
const ALIASES: Record<string, PrimitiveName> = {
  "stat-card": "stat-tile", metric: "stat-tile", "metric-card": "stat-tile", kpi: "stat-tile", "kpi-card": "stat-tile",
  chart: "line-chart", graph: "line-chart", "area-chart": "line-chart", "line": "line-chart",
  bars: "bar-chart", "bar": "bar-chart", histogram: "bar-chart",
  donut: "donut-chart", gauge: "donut-chart", progress: "donut-chart", ring: "donut-chart", pie: "donut-chart",
  nav: "sidebar-nav", navigation: "sidebar-nav", menu: "sidebar-nav", sidebar: "sidebar-nav",
  list: "table", datagrid: "table", "data-grid": "table", grid: "table", rows: "table",
  board: "kanban-column", column: "kanban-column", kanban: "kanban-column",
  chat: "chat-bubble", message: "chat-bubble", "message-bubble": "chat-bubble", assistant: "chat-bubble", conversation: "chat-bubble",
  search: "input-field", searchbar: "input-field", "search-bar": "input-field", input: "input-field", textfield: "input-field",
  cta: "button", btn: "button",
  switch: "toggle", checkbox: "toggle",
  dashboard: "bento-grid", "grid-layout": "bento-grid", bento: "bento-grid", overview: "bento-grid",
  container: "panel", section: "panel", hero: "panel", "pricing": "card", "plan-card": "card", feature: "card",
};

function coerce(name: string): PrimitiveName | null {
  const n = name.trim().toLowerCase();
  if (VALID.has(n)) return n as PrimitiveName;
  if (ALIASES[n]) return ALIASES[n];
  // partial: find an alias key contained in the name
  for (const [k, v] of Object.entries(ALIASES)) if (n.includes(k)) return v;
  for (const p of PRIMITIVE_NAMES) if (n.includes(p)) return p;
  return null;
}

export async function classifyComponents(tree: RepoTree): Promise<Inventory | null> {
  if (!config.llm.apiKey) return null;
  const files = pickComponentFiles(tree);
  if (files.length === 0) return null;

  const digests = files.map((f) => scrubSecrets(fileDigest(f))).join("\n\n");
  const prompt = [
    "You are mapping a web app's important UI surfaces to a fixed set of reusable UI primitives,",
    "so a trailer can RECREATE (not screenshot) the product's look.",
    "From the component files below, list the 4-7 MOST important, distinct surfaces, most-important first.",
    "For each: kind (short label e.g. 'dashboard','chat','pricing','board'), primitive (from the allowed list),",
    "label (a short on-screen title for the recreated element), source (the file path).",
    `Allowed primitive names (use EXACTLY these): ${PRIMITIVE_NAMES.join(", ")}.`,
    "Mapping hints: metrics dashboard -> bento-grid or stat-tile; chat/assistant -> chat-bubble;",
    "task board -> kanban-column; data list -> table; search -> input-field; chart -> line-chart/bar-chart/donut-chart.",
    "Prefer variety. JSON only.",
    "",
    "=== COMPONENT FILES ===",
    digests,
  ].join("\n");

  let loose: z.infer<typeof LooseItem>[];
  try {
    const raw = await generateRawJson(prompt, { model: config.llm.triageModel, temperature: 0.3 });
    loose = normalizeItems(raw);
  } catch {
    return null;
  }

  const items = loose
    .map((it) => ({ ...it, primitive: coerce(it.primitive) }))
    .filter((it): it is typeof it & { primitive: PrimitiveName } => it.primitive !== null)
    .map((it) => ({ kind: it.kind, primitive: it.primitive, label: it.label, source: it.source }));

  if (items.length === 0) return null;
  return ComponentInventory.parse({ items });
}
