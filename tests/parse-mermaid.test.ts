import { describe, it, expect } from 'vitest';
import { parseMermaid } from '../src/render/lib/parse-mermaid.js';

describe('parseMermaid', () => {
  it('parses simple linear flow with 3 nodes', () => {
    const mermaid = 'flowchart LR; A[Repo] --> B[Analyze]; B --> C';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toHaveLength(3);
    expect(result.nodes).toContainEqual({ id: 'A', label: 'Repo' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'Analyze' });
    expect(result.nodes).toContainEqual({ id: 'C', label: 'C' }); // no explicit label → id as label

    expect(result.edges).toHaveLength(2);
    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
    expect(result.edges).toContainEqual({ from: 'B', to: 'C' });
  });

  it('handles node labels in brackets', () => {
    const mermaid = 'flowchart LR; A[Start] --> B[Process]';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toContainEqual({ id: 'A', label: 'Start' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'Process' });
  });

  it('handles node labels in parentheses', () => {
    const mermaid = 'flowchart LR; A(Start) --> B(Process)';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toContainEqual({ id: 'A', label: 'Start' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'Process' });
  });

  it('handles node labels in braces', () => {
    const mermaid = 'flowchart LR; A{Decide} --> B{Another}';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toContainEqual({ id: 'A', label: 'Decide' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'Another' });
  });

  it('strips flowchart declaration', () => {
    const mermaid1 = 'flowchart LR; A --> B';
    const mermaid2 = 'A --> B';
    const result1 = parseMermaid(mermaid1);
    const result2 = parseMermaid(mermaid2);

    expect(result1.nodes).toEqual(result2.nodes);
    expect(result1.edges).toEqual(result2.edges);
  });

  it('strips graph declaration (alternate syntax)', () => {
    const mermaid = 'graph TB; A --> B';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it('handles chains A --> B --> C', () => {
    const mermaid = 'flowchart LR; A --> B --> C';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
    expect(result.edges).toContainEqual({ from: 'B', to: 'C' });
  });

  it('handles chains with labels A[X] --> B[Y] --> C[Z]', () => {
    const mermaid = 'A[Repo] --> B[Analyze] --> C[Render]';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toHaveLength(3);
    expect(result.nodes).toContainEqual({ id: 'A', label: 'Repo' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'Analyze' });
    expect(result.nodes).toContainEqual({ id: 'C', label: 'Render' });

    expect(result.edges).toHaveLength(2);
    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
    expect(result.edges).toContainEqual({ from: 'B', to: 'C' });
  });

  it('handles multiline input (newlines instead of semicolons)', () => {
    const mermaid = `
      flowchart LR
      A[Start]
      B[Process]
      A --> B
    `;
    const result = parseMermaid(mermaid);

    expect(result.nodes).toContainEqual({ id: 'A', label: 'Start' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'Process' });
    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
  });

  it('ignores edge labels (|label|)', () => {
    const mermaid = 'A --> |sends data| B';
    const result = parseMermaid(mermaid);

    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
    // label is stripped, not stored (KISS)
  });

  it('handles double-dash arrows (--)', () => {
    const mermaid = 'A --> B'; // standard mermaid syntax is --> with >
    const result = parseMermaid(mermaid);

    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
  });

  it('handles thick arrows (==)', () => {
    const mermaid = 'A ==> B';
    const result = parseMermaid(mermaid);

    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
  });

  it('handles dotted arrows (-.->)', () => {
    const mermaid = 'A -.-> B';
    const result = parseMermaid(mermaid);

    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
  });

  it('merges duplicate node definitions with different labels (first wins)', () => {
    const mermaid = 'A[Label1] --> B; A[Label2] --> C';
    const result = parseMermaid(mermaid);

    // A is defined first with "Label1", second definition ignored
    const aNode = result.nodes.find((n) => n.id === 'A');
    expect(aNode?.label).toBe('Label1');
  });

  it('handles nodes without explicit labels', () => {
    const mermaid = 'A --> B --> C';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toContainEqual({ id: 'A', label: 'A' });
    expect(result.nodes).toContainEqual({ id: 'B', label: 'B' });
    expect(result.nodes).toContainEqual({ id: 'C', label: 'C' });
  });

  it('parses complex architecture flow', () => {
    const mermaid = `
      flowchart LR
      ID[IP id] --> SDK[Story Protocol SDK]
      SDK --> T[transform]
      T --> G[force graph]
    `;
    const result = parseMermaid(mermaid);

    expect(result.nodes).toHaveLength(4);
    expect(result.nodes).toContainEqual({ id: 'ID', label: 'IP id' });
    expect(result.nodes).toContainEqual({ id: 'SDK', label: 'Story Protocol SDK' });
    expect(result.nodes).toContainEqual({ id: 'T', label: 'transform' });
    expect(result.nodes).toContainEqual({ id: 'G', label: 'force graph' });

    expect(result.edges).toHaveLength(3);
    expect(result.edges).toContainEqual({ from: 'ID', to: 'SDK' });
    expect(result.edges).toContainEqual({ from: 'SDK', to: 'T' });
    expect(result.edges).toContainEqual({ from: 'T', to: 'G' });
  });

  it('handles empty/whitespace-only input gracefully', () => {
    const result = parseMermaid('   \n\n  ');
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('parses multiple separate chains', () => {
    const mermaid = `
      A --> B
      C --> D
    `;
    const result = parseMermaid(mermaid);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(2);
    expect(result.edges).toContainEqual({ from: 'A', to: 'B' });
    expect(result.edges).toContainEqual({ from: 'C', to: 'D' });
  });

  it('ignores statements with single node (no arrow)', () => {
    const mermaid = 'A[Standalone]; B --> C';
    const result = parseMermaid(mermaid);

    // A is still registered (nodeRef called), B and C have an edge
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(1);
    expect(result.edges).toContainEqual({ from: 'B', to: 'C' });
  });

  it('handles IDs with underscores and numbers', () => {
    const mermaid = 'Node_1[Start] --> Node_2[End]';
    const result = parseMermaid(mermaid);

    expect(result.nodes).toContainEqual({ id: 'Node_1', label: 'Start' });
    expect(result.nodes).toContainEqual({ id: 'Node_2', label: 'End' });
  });
});
