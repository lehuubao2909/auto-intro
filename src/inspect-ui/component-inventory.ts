import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { walkRepo } from "../analyze/walk-repo.js";
import { classifyComponents } from "./classify-components.js";
import { config } from "../shared/config.js";
import type { RepoFacts, ComponentInventory as Inventory, InventoryItem } from "../shared/types.js";

/**
 * Build the ComponentInventory: Gemini classification when possible, else a
 * deterministic fallback synthesized from RepoFacts.features so the Director always
 * has something concrete to showcase. Dedupes, caps, persists.
 */

/** Fallback inventory from RepoFacts when classification is unavailable/weak. */
function fallbackInventory(facts: RepoFacts): Inventory {
  const items: InventoryItem[] = [];
  // A dashboard beat anchored on the project identity.
  items.push({ kind: "overview", primitive: "bento-grid", label: facts.name });
  // Features → cards.
  for (const f of facts.features.slice(0, 4)) {
    items.push({ kind: "feature", primitive: "card", label: f });
  }
  // If it mentions chat/assistant/ai, add a chat beat.
  if (/\b(chat|assistant|copilot|conversation|messaging)\b/i.test(facts.whatItDoes + " " + facts.features.join(" "))) {
    items.push({ kind: "assistant", primitive: "chat-bubble", label: "Ask anything" });
  }
  return { items: items.slice(0, 6) };
}

function dedupeAndCap(inv: Inventory, max = 6): Inventory {
  const seen = new Set<string>();
  const items: InventoryItem[] = [];
  for (const it of inv.items) {
    const key = `${it.primitive}|${it.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(it);
    if (items.length >= max) break;
  }
  return { items };
}

export async function buildComponentInventory(repoRoot: string, facts: RepoFacts): Promise<Inventory> {
  const root = path.resolve(repoRoot);
  const tree = walkRepo(root);

  const classified = await classifyComponents(tree);
  const inv = classified && classified.items.length >= 2 ? classified : fallbackInventory(facts);
  const final = dedupeAndCap(inv);

  const workDir = path.join(root, config.workDir);
  mkdirSync(workDir, { recursive: true });
  writeFileSync(path.join(workDir, "component-inventory.json"), JSON.stringify(final, null, 2));
  return final;
}
