import { describe, it, expect } from 'vitest';
import { shiftHue } from '../src/render/theme.js';

/**
 * Regression guard for the v4 background hue math. A previous local copy had a wrong
 * HSL→RGB sextant for hue [240,300) that SWAPPED the R and B channels, so blue-violet/
 * purple brand accents rendered a pink glow. shiftHue now reuses theme's tested helpers.
 */

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

describe('shiftHue', () => {
  it('round-trips (deg=0) within rounding for a violet accent', () => {
    const out = shiftHue('#8b5cf6', 0);
    const a = rgb('#8b5cf6');
    const b = rgb(out);
    expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(3);
    expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(3);
    expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(3);
  });

  it('does NOT swap R/B for purple/violet hues (the old bug → pink)', () => {
    // violet #8b5cf6 has B(246) > R(139); the bug produced #f65c8b (R>B, pink).
    for (const hex of ['#8b5cf6', '#c084fc', '#7c3aed', '#a855f7']) {
      const { r, b } = rgb(shiftHue(hex, 0));
      expect(b).toBeGreaterThan(r); // stays blue-dominant, not pink
    }
    expect(shiftHue('#8b5cf6', 0)).not.toBe('#f65c8b');
  });

  it('rotating hue by ±10° keeps it brand-adjacent (small channel change)', () => {
    const base = rgb('#41A3EF'); // the default accent (blue)
    const shifted = rgb(shiftHue('#41A3EF', 10));
    const delta = Math.abs(base.r - shifted.r) + Math.abs(base.g - shifted.g) + Math.abs(base.b - shifted.b);
    expect(delta).toBeGreaterThan(0); // it did move
    expect(delta).toBeLessThan(160); // but stays nearby (moderate, not a wild jump)
  });

  it('is deterministic', () => {
    expect(shiftHue('#41A3EF', 9)).toBe(shiftHue('#41A3EF', 9));
  });
});
