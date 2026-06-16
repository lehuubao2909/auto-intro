import { describe, it, expect } from 'vitest';
import { validateStoryboard } from '../src/shared/validate-storyboard.js';

describe('validateStoryboard', () => {
  // Helper: minimal valid storyboard with techstack
  const minimalValid = {
    meta: {
      title: 'Test',
      fps: 30,
      totalSeconds: 50,
      media: {},
    },
    scenes: [
      {
        type: 'title',
        durationInFrames: 90,
        text: 'Title',
      },
      {
        type: 'techstack',
        durationInFrames: 90,
        items: [{ name: 'TypeScript' }],
      },
      {
        type: 'outro',
        durationInFrames: 120,
        text: 'End',
        cta: 'example.com',
      },
    ],
  };

  it('accepts a valid storyboard with techstack', () => {
    const result = validateStoryboard(minimalValid);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.storyboard).toBeDefined();
  });

  it('rejects storyboard missing techstack scene', () => {
    const invalid = {
      ...minimalValid,
      scenes: [
        minimalValid.scenes[0], // title only
        minimalValid.scenes[2], // outro
      ],
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('missing required `techstack` scene')
    );
  });

  it('rejects 3+ text-only scenes in a row', () => {
    const invalid = {
      ...minimalValid,
      scenes: [
        { type: 'title', durationInFrames: 90, text: 'A' },
        { type: 'problem', durationInFrames: 90, lines: ['B'] },
        { type: 'stat', durationInFrames: 90, value: '100', label: 'C' },
        { type: 'techstack', durationInFrames: 90, items: [{ name: 'TS' }] },
      ],
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('3+ text-only scenes in a row')
    );
  });

  it('rejects reading-floor violation (text too short for words)', () => {
    const invalid = {
      ...minimalValid,
      scenes: [
        {
          type: 'title',
          durationInFrames: 30, // ~1s, but title is 10+ words
          text: 'This is a very long title with many words that definitely violates reading floor',
        },
        minimalValid.scenes[1], // techstack
        minimalValid.scenes[2], // outro
      ],
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('reading floor')
    );
  });

  it('rejects when totalSeconds out of [45, 70] range', () => {
    const invalid = {
      ...minimalValid,
      meta: { ...minimalValid.meta, totalSeconds: 100 }, // exceeds 70
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('out of range [45,70]')
    );
  });

  it('rejects when totalSeconds is too low', () => {
    const invalid = {
      ...minimalValid,
      meta: { ...minimalValid.meta, totalSeconds: 30 }, // below 45
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('out of range [45,70]')
    );
  });

  it('rejects media id not in registry', () => {
    const invalid = {
      ...minimalValid,
      scenes: [
        {
          type: 'title',
          durationInFrames: 90,
          text: 'Title',
          media: 'nonexistent-id', // not in meta.media
        },
        minimalValid.scenes[1],
        minimalValid.scenes[2],
      ],
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('not in meta.media registry')
    );
  });

  it('accepts media id when in registry', () => {
    const valid = {
      meta: {
        title: 'Test',
        fps: 30,
        totalSeconds: 50,
        media: {
          'my-screenshot': { kind: 'still', src: 'path/to/screenshot.png' },
        },
      },
      scenes: [
        {
          type: 'title',
          durationInFrames: 90,
          text: 'Title',
          media: 'my-screenshot',
        },
        {
          type: 'techstack',
          durationInFrames: 90,
          items: [{ name: 'React' }],
        },
        {
          type: 'outro',
          durationInFrames: 120,
          text: 'End',
          cta: 'example.com',
        },
      ],
    };
    const result = validateStoryboard(valid);
    expect(result.ok).toBe(true);
  });

  it('accepts valid example-storyboard.json', async () => {
    // Load the example from the skill directory
    const example = {
      meta: {
        title: 'IP NEXUS',
        fps: 30,
        width: 1920,
        height: 1080,
        theme: 'cinematic-dark',
        accent: '#41A3EF',
        accent2: '#FCCE50',
        music: 'minimal-tech',
        bpm: 100,
        totalSeconds: 52,
        media: {
          home: { kind: 'still', src: 'captures/home.png' },
          graph: { kind: 'still', src: 'captures/graph.png' },
          search: { kind: 'clip', src: 'captures/search.webm', durationInFrames: 80 },
        },
      },
      scenes: [
        { type: 'title', durationInFrames: 75, sfx: 'whoosh', text: 'See on-chain IP, mapped.', sub: 'IP NEXUS · genealogy explorer', media: 'graph' },
        { type: 'problem', durationInFrames: 75, lines: ['On-chain IP data is raw and opaque.', 'Who is the root? What derives from what?'] },
        { type: 'ui', durationInFrames: 90, transitionIn: 'fade', media: 'home', kenBurns: 'in', frame: 'browser', caption: 'search any IP asset' },
        { type: 'feature-montage', durationInFrames: 120, over: 'graph', perItemFrames: 30,
          items: [
            { icon: 'git-branch', text: 'Trace lineage' },
            { icon: 'search', text: 'Deep search' },
            { icon: 'activity', text: 'Real-time genealogy' },
            { icon: 'zap', text: 'Root vs derivative' },
          ],
        },
        { type: 'demo', durationInFrames: 90, sfx: 'tick', media: 'search', caption: 'root → derivatives, live' },
        { type: 'architecture', durationInFrames: 110, transitionIn: 'slide', sfx: 'riser', caption: 'how it works', mermaid: 'flowchart LR; ID[IP id] --> SDK[Story Protocol SDK]; SDK --> T[transform]; T --> G[force graph]' },
        { type: 'techstack', durationInFrames: 80, caption: 'built with',
          items: [
            { name: 'Next.js 14' },
            { name: 'TypeScript' },
            { name: 'D3 / force-graph' },
            { name: 'Story SDK' },
            { name: 'Tailwind' },
          ],
        },
        { type: 'stat', durationInFrames: 70, sfx: 'thock', value: '100%', label: 'traceability & transparency', sub: 'opaque chain → living map' },
        { type: 'ui', durationInFrames: 70, media: 'graph', kenBurns: 'out', frame: 'browser' },
        { type: 'outro', durationInFrames: 90, sfx: 'impact', text: 'IP NEXUS', sub: 'force-directed genealogy · Story Protocol', cta: 'ip-nexus-story-protocol.vercel.app' },
      ],
    };

    const result = validateStoryboard(example);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects ui scene with wrong media kind', () => {
    const invalid = {
      meta: {
        title: 'Test',
        fps: 30,
        totalSeconds: 50,
        media: {
          'my-clip': { kind: 'clip', src: 'video.webm', durationInFrames: 90 },
        },
      },
      scenes: [
        {
          type: 'ui',
          durationInFrames: 90,
          media: 'my-clip', // should be 'still', not 'clip'
        },
        {
          type: 'techstack',
          durationInFrames: 90,
          items: [{ name: 'React' }],
        },
      ],
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('is a clip, expected still')
    );
  });

  it('rejects demo scene with wrong media kind', () => {
    const invalid = {
      meta: {
        title: 'Test',
        fps: 30,
        totalSeconds: 50,
        media: {
          'my-still': { kind: 'still', src: 'image.png' },
        },
      },
      scenes: [
        {
          type: 'demo',
          durationInFrames: 90,
          media: 'my-still', // should be 'clip', not 'still'
        },
        {
          type: 'techstack',
          durationInFrames: 90,
          items: [{ name: 'React' }],
        },
      ],
    };
    const result = validateStoryboard(invalid);
    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('is a still, expected clip')
    );
  });

  it('allows 2 text-only scenes in a row (below threshold)', () => {
    const valid = {
      ...minimalValid,
      scenes: [
        { type: 'title', durationInFrames: 90, text: 'A' },
        { type: 'problem', durationInFrames: 90, lines: ['B'] },
        { type: 'techstack', durationInFrames: 90, items: [{ name: 'TS' }] },
        { type: 'outro', durationInFrames: 90, text: 'C', cta: 'example.com' },
      ],
    };
    const result = validateStoryboard(valid);
    expect(result.ok).toBe(true);
    expect(result.errors).not.toContainEqual(
      expect.stringContaining('3+ text-only')
    );
  });
});
