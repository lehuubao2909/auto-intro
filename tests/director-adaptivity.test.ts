import { describe, it, expect } from 'vitest';
import { buildDirectorPrompt } from '../src/direct/build-director-prompt.js';
import type { ProjectBrief, DesignProfile, ComponentInventory, InventoryItem, UsageType } from '../src/shared/types.js';

/**
 * v4 adaptivity: the Director prompt must ADAPT to each project — scene budget/length by
 * content richness, and scene-type favor/avoid by usageType (no fixed "barem").
 */

const design: DesignProfile = {
  mode: 'dark', glass: true, radius: 16, font: 'Inter',
  palette: { bg: '#0a0f1e', surface: '#161f38', text: '#eef2fb', dim: '#93a0b8', accent: '#6ea8fe', accent2: '#c084fc' },
};

const brief = (usageType: UsageType): ProjectBrief => ({
  name: 'Acme', oneLiner: 'does a thing', problem: 'p', whatItDoes: 'w', usageType,
  howItsUsed: 'use it', keyFeatures: ['a', 'b'], techStack: ['TypeScript'], links: {}, suggestedBeats: [],
});

const inv = (n: number): ComponentInventory => ({
  items: Array.from({ length: n }, (_, i): InventoryItem => ({ kind: 'card', primitive: 'card', label: `surface ${i}` })),
});

describe('director adaptivity', () => {
  it('SPARSE inventory → lean budget (~45s, 7-9 scenes)', () => {
    const p = buildDirectorPrompt(brief('cli'), design, inv(2));
    expect(p).toContain('Detected richness: sparse');
    expect(p).toContain('7-9 scenes');
  });

  it('RICH inventory → fuller budget (11-14 scenes, ~56-60s)', () => {
    const p = buildDirectorPrompt(brief('web-app'), design, inv(12));
    expect(p).toContain('Detected richness: rich');
    expect(p).toContain('11-14 scenes');
  });

  it('a CLI and a web-app get DIFFERENT story shapes (not one barem)', () => {
    const cli = buildDirectorPrompt(brief('cli'), design, inv(6));
    const web = buildDirectorPrompt(brief('web-app'), design, inv(6));
    expect(cli).not.toBe(web);
    expect(cli).toContain('AVOID dashboards/ui-bento'); // CLI shouldn't get a dashboard
    expect(web).toContain('split-hero'); // web-app favors a landing hero
  });

  it('prompt enforces no-padding + snappy text pacing + exposes new templates', () => {
    const p = buildDirectorPrompt(brief('sdk'), design, inv(6));
    expect(p).toContain('do NOT pad'); // length follows content
    expect(p).toContain('title ~70'); // snappy text-scene pacing
    expect(p).toContain('feature-spotlight'); // layout templates are in the catalog
    expect(p).toContain('code-to-ui'); // SDK favors code-to-ui
  });
});
