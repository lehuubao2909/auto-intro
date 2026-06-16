import { describe, it, expect } from 'vitest';
import { validateStoryboard } from '../src/shared/validate-storyboard.js';

describe('validateStoryboard v2 UI-recreation (ui-bento)', () => {
  // Helper: minimal valid storyboard with techstack + ui-bento
  const baseStoryboard = {
    meta: {
      title: 'Test v2',
      fps: 30,
      totalSeconds: 50,
      media: {},
    },
  };

  describe('ui-bento scene validation', () => {
    it('accepts ui-bento with 3 tiles (minimum)', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: { value: '100', label: 'Users' } },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts ui-bento with 6 tiles (maximum)', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
              { primitive: 'table', props: {} },
              { primitive: 'chat-bubble', props: {} },
              { primitive: 'button', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });

    it('rejects ui-bento with <3 tiles', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects ui-bento with >6 tiles', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
              { primitive: 'table', props: {} },
              { primitive: 'chat-bubble', props: {} },
              { primitive: 'button', props: {} },
              { primitive: 'panel', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(false);
    });

    it('validates all primitive names against PRIMITIVE_NAMES', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'invalid-primitive', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('accepts ui-bento with optional cols parameter', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            cols: 2,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });

    it('accepts ui-bento with optional sidebar', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
            sidebar: {
              items: [
                { icon: 'home', label: 'Home' },
                { icon: 'settings', label: 'Settings' },
              ],
            },
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });

    it('accepts ui-bento with optional caption', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            caption: 'Dashboard view',
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });
  });

  describe('ui-showcase and ui-sequence scenes', () => {
    it('accepts ui-showcase with single element', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-showcase',
            durationInFrames: 120,
            element: { primitive: 'bar-chart', props: { data: [] } },
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });

    it('accepts ui-sequence with 2-3 steps', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-sequence',
            durationInFrames: 120,
            steps: [
              { primitive: 'panel', props: {} },
              { primitive: 'card', props: {} },
              { primitive: 'stat-tile', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });

    it('rejects ui-sequence with <2 steps', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-sequence',
            durationInFrames: 120,
            steps: [{ primitive: 'panel', props: {} }],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(false);
    });

    it('rejects ui-sequence with >3 steps', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-sequence',
            durationInFrames: 120,
            steps: [
              { primitive: 'panel', props: {} },
              { primitive: 'card', props: {} },
              { primitive: 'stat-tile', props: {} },
              { primitive: 'button', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(false);
    });
  });

  describe('meta.design (optional DesignProfile)', () => {
    it('accepts storyboard with optional design profile', () => {
      const sb = {
        meta: {
          title: 'Test v2',
          fps: 30,
          totalSeconds: 50,
          media: {},
          design: {
            mode: 'dark',
            glass: true,
            radius: 16,
            font: 'Inter',
            palette: {
              bg: '#000000',
              surface: '#1a1a1a',
              text: '#ffffff',
              dim: '#666666',
              accent: '#0066ff',
              accent2: '#ff9900',
            },
          },
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
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
      expect(result.storyboard?.meta.design).toBeDefined();
    });

    it('accepts storyboard without design profile', () => {
      const sb = {
        meta: {
          title: 'Test v2',
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
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
      expect(result.storyboard?.meta.design).toBeUndefined();
    });
  });

  describe('ui-recreation scenes count as UI scenes', () => {
    it('ui-bento satisfies the "at least one UI scene" requirement', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
      expect(result.warnings.some(w => w.includes('no UI scene'))).toBe(false);
    });

    it('ui-showcase satisfies the UI scene requirement', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-showcase',
            durationInFrames: 120,
            element: { primitive: 'bar-chart', props: {} },
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
      expect(result.warnings.some(w => w.includes('no UI scene'))).toBe(false);
    });

    it('ui-sequence satisfies the UI scene requirement', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-sequence',
            durationInFrames: 120,
            steps: [
              { primitive: 'panel', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });
  });

  describe('primitive element props validation', () => {
    it('accepts primitive element with any props object', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: { value: 100, label: 'Users', icon: 'users' } },
              { primitive: 'bar-chart', props: { data: [1, 2, 3], title: 'Sales' } },
              { primitive: 'card', props: { title: 'Card', body: 'content' } },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });

    it('accepts primitive element with empty props', () => {
      const sb = {
        ...baseStoryboard,
        scenes: [
          {
            type: 'title',
            durationInFrames: 90,
            text: 'Title',
          },
          {
            type: 'techstack',
            durationInFrames: 90,
            items: [{ name: 'React' }],
          },
          {
            type: 'ui-bento',
            durationInFrames: 120,
            tiles: [
              { primitive: 'stat-tile', props: {} },
              { primitive: 'bar-chart', props: {} },
              { primitive: 'card', props: {} },
            ],
          },
          {
            type: 'outro',
            durationInFrames: 120,
            text: 'End',
            cta: 'example.com',
          },
        ],
      };

      const result = validateStoryboard(sb);
      expect(result.ok).toBe(true);
    });
  });
});
