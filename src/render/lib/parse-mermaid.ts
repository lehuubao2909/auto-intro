/**
 * Tiny mermaid-flowchart parser — just enough for the `architecture` scene so we
 * DON'T need mermaid.js/puppeteer inside Remotion (KISS, deterministic).
 *
 * Handles: `flowchart LR; A[Label] --> B[Other]; B --> C`
 * Node id with optional [label] / (label); edges via `-->` (labels on edges ignored).
 */
export interface FlowNode {
  id: string;
  label: string;
}
export interface FlowEdge {
  from: string;
  to: string;
}
export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

function nodeRef(token: string, nodes: Map<string, string>): string {
  const m = token.trim().match(/^([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\})?/);
  if (!m) return token.trim();
  const id = m[1];
  const label = m[2] ?? m[3] ?? m[4];
  if (label && !nodes.has(id)) nodes.set(id, label);
  else if (!nodes.has(id)) nodes.set(id, id);
  return id;
}

export function parseMermaid(src: string): Flow {
  const nodes = new Map<string, string>();
  const edges: FlowEdge[] = [];

  // Normalize: strip a leading `flowchart XX`/`graph XX`, split on ; and newlines.
  const body = src.replace(/^\s*(?:flowchart|graph)\s+\w+\s*;?/i, "");
  const stmts = body
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of stmts) {
    // split a chain A --> B --> C on arrow tokens (with optional |label|)
    const parts = stmt.split(/--+>|==+>|-\.->/).map((p) => p.replace(/\|[^|]*\|/g, "").trim());
    if (parts.length === 1) {
      if (parts[0]) nodeRef(parts[0], nodes);
      continue;
    }
    for (let i = 0; i < parts.length - 1; i++) {
      if (!parts[i] || !parts[i + 1]) continue;
      const from = nodeRef(parts[i], nodes);
      const to = nodeRef(parts[i + 1], nodes);
      edges.push({ from, to });
    }
  }

  return {
    nodes: [...nodes.entries()].map(([id, label]) => ({ id, label })),
    edges,
  };
}
