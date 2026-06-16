import { describe, it, expect } from 'vitest';
import {
  toHex,
  hexToRgb,
  rgbToHex,
  hslToHex,
  luminance,
  isLight,
  mix,
  clamp,
  chroma,
  contrast,
} from '../src/inspect-ui/color-utils.js';

describe('color-utils', () => {
  describe('toHex', () => {
    it('converts #rgb shorthand to #rrggbb', () => {
      expect(toHex('#f00')).toBe('#ff0000');
      expect(toHex('#0f0')).toBe('#00ff00');
      expect(toHex('#00f')).toBe('#0000ff');
      expect(toHex('#abc')).toBe('#aabbcc');
    });

    it('passes through #rrggbb', () => {
      expect(toHex('#ffffff')).toBe('#ffffff');
      expect(toHex('#000000')).toBe('#000000');
      expect(toHex('#1a2b3c')).toBe('#1a2b3c');
    });

    it('handles #rrggbb without hash', () => {
      expect(toHex('ff0000')).toBe('#ff0000');
      expect(toHex('ABCDEF')).toBe('#abcdef');
    });

    it('converts hsl(h, s%, l%) format', () => {
      const hex = toHex('hsl(0, 100%, 50%)');
      expect(hex).toBeTruthy();
      const [r, g, b] = hexToRgb(hex!);
      expect(r).toBeCloseTo(255, 0);
      expect(g).toBeCloseTo(0, 0);
      expect(b).toBeCloseTo(0, 0);
    });

    it('converts shadcn HSL triplet format (space/comma separated)', () => {
      const hex1 = toHex('120 100% 50%');
      const hex2 = toHex('120, 100%, 50%');
      expect(hex1).toBeTruthy();
      expect(hex2).toBeTruthy();
    });

    it('converts rgb(r, g, b) format', () => {
      expect(toHex('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(toHex('rgb(0,128,255)')).toBe('#0080ff');
    });

    it('converts rgba(r, g, b, a) format (ignores alpha)', () => {
      expect(toHex('rgba(255, 0, 0, 0.5)')).toBe('#ff0000');
    });

    it('returns null for invalid input', () => {
      expect(toHex('not-a-color')).toBeNull();
      expect(toHex('#gg0000')).toBeNull();
      expect(toHex('cmyk(0,0,0,0)')).toBeNull();
    });

    it('trims whitespace', () => {
      expect(toHex('  #ff0000  ')).toBe('#ff0000');
      expect(toHex('  rgb(255, 0, 0)  ')).toBe('#ff0000');
    });
  });

  describe('hexToRgb', () => {
    it('converts #rrggbb to [r, g, b]', () => {
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
    });

    it('converts rrggbb without hash', () => {
      expect(hexToRgb('ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('000000')).toEqual([0, 0, 0]);
    });

    it('returns [0, 0, 0] for invalid input', () => {
      expect(hexToRgb('not-hex')).toEqual([0, 0, 0]);
      expect(hexToRgb('#xyz')).toEqual([0, 0, 0]);
    });
  });

  describe('rgbToHex', () => {
    it('converts [r, g, b] to #rrggbb', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('clamps values to 0-255 range', () => {
      expect(rgbToHex(300, -50, 128)).toBe('#ff0080');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('zero-pads single-digit hex values', () => {
      expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
    });
  });

  describe('hslToHex', () => {
    it('converts pure red (0 deg)', () => {
      const hex = hslToHex(0, 100, 50);
      expect(hex).toBe('#ff0000');
    });

    it('converts pure green (120 deg)', () => {
      const hex = hslToHex(120, 100, 50);
      expect(hex).toBe('#00ff00');
    });

    it('converts pure blue (240 deg)', () => {
      const hex = hslToHex(240, 100, 50);
      expect(hex).toBe('#0000ff');
    });

    it('converts white (any hue, 100% lightness)', () => {
      expect(hslToHex(0, 0, 100)).toBe('#ffffff');
      expect(hslToHex(180, 50, 100)).toBe('#ffffff');
    });

    it('converts black (0% lightness)', () => {
      expect(hslToHex(0, 100, 0)).toBe('#000000');
      expect(hslToHex(180, 50, 0)).toBe('#000000');
    });

    it('converts gray (0% saturation)', () => {
      expect(hslToHex(0, 0, 50)).toBe('#808080');
    });
  });

  describe('luminance', () => {
    it('white has high luminance (~1.0)', () => {
      const lum = luminance('#ffffff');
      expect(lum).toBeGreaterThan(0.9);
    });

    it('black has low luminance (~0.0)', () => {
      const lum = luminance('#000000');
      expect(lum).toBeLessThan(0.1);
    });

    it('returns 0-1 range', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#808080'];
      for (const hex of colors) {
        const lum = luminance(hex);
        expect(lum).toBeGreaterThanOrEqual(0);
        expect(lum).toBeLessThanOrEqual(1);
      }
    });

    it('green is brighter than red (WCAG formula)', () => {
      const redLum = luminance('#ff0000');
      const greenLum = luminance('#00ff00');
      expect(greenLum).toBeGreaterThan(redLum);
    });

    it('white luminance > black luminance', () => {
      expect(luminance('#ffffff')).toBeGreaterThan(luminance('#000000'));
    });
  });

  describe('isLight', () => {
    it('returns true for light colors', () => {
      expect(isLight('#ffffff')).toBe(true);
      expect(isLight('#ffff00')).toBe(true);
      expect(isLight('#00ff00')).toBe(true);
    });

    it('returns false for dark colors', () => {
      expect(isLight('#000000')).toBe(false);
      expect(isLight('#0000ff')).toBe(false);
      expect(isLight('#800000')).toBe(false);
    });

    it('threshold at luminance 0.5', () => {
      const darkGray = '#333333';
      const lightGray = '#cccccc';
      expect(isLight(darkGray)).toBe(false);
      expect(isLight(lightGray)).toBe(true);
    });
  });

  describe('mix', () => {
    it('t=0 returns first color', () => {
      expect(mix('#ff0000', '#00ff00', 0)).toBe('#ff0000');
    });

    it('t=1 returns second color', () => {
      expect(mix('#ff0000', '#00ff00', 1)).toBe('#00ff00');
    });

    it('t=0.5 returns midpoint', () => {
      const result = mix('#ff0000', '#0000ff', 0.5);
      const [r, g, b] = hexToRgb(result);
      // 255 + (0 - 255) * 0.5 = 255 - 127.5 = 127.5, rounded to 128
      expect(r).toBeCloseTo(128, 0);
      expect(g).toBeCloseTo(0, 0);
      expect(b).toBeCloseTo(128, 0);
    });

    it('interpolates correctly for grey/black mix', () => {
      const result = mix('#ffffff', '#000000', 0.5);
      const [r, g, b] = hexToRgb(result);
      // 255 + (0 - 255) * 0.5 = 127.5, rounded to 128
      expect(r).toBeCloseTo(128, 0);
      expect(g).toBeCloseTo(128, 0);
      expect(b).toBeCloseTo(128, 0);
    });

    it('handles negative t (extrapolates)', () => {
      const result = mix('#000000', '#ff0000', -0.5);
      const [r, g, b] = hexToRgb(result);
      // mix() does NOT clamp during interpolation, but rgbToHex() clamps in conversion
      // 0 + (255 - 0) * -0.5 = -127.5, clamped to 0
      expect(r).toBeCloseTo(0, 0);
      expect(g).toBeCloseTo(0, 0);
      expect(b).toBeCloseTo(0, 0);
    });
  });

  describe('clamp', () => {
    it('clamps to default range [0, 255]', () => {
      expect(clamp(0)).toBe(0);
      expect(clamp(255)).toBe(255);
      expect(clamp(-50)).toBe(0);
      expect(clamp(300)).toBe(255);
    });

    it('clamps to custom range', () => {
      expect(clamp(5, 10, 20)).toBe(10);
      expect(clamp(15, 10, 20)).toBe(15);
      expect(clamp(25, 10, 20)).toBe(20);
    });
  });

  describe('chroma', () => {
    it('returns 0 for grayscale colors (no saturation)', () => {
      expect(chroma('#ffffff')).toBe(0);
      expect(chroma('#000000')).toBe(0);
      expect(chroma('#808080')).toBe(0);
      expect(chroma('#cccccc')).toBe(0);
    });

    it('returns high value for saturated colors', () => {
      expect(chroma('#ff0000')).toBe(1); // Pure red
      expect(chroma('#00ff00')).toBe(1); // Pure green
      expect(chroma('#0000ff')).toBe(1); // Pure blue
    });

    it('is in range [0, 1]', () => {
      const colors = [
        '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#6600ff',
      ];
      for (const hex of colors) {
        const c = chroma(hex);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });

    it('partial saturation is between 0 and 1', () => {
      const halfRed = chroma('#ff8080'); // Red mixed with white
      expect(halfRed).toBeGreaterThan(0);
      expect(halfRed).toBeLessThan(1);
    });

    it('pure primary/secondary hues have max chroma', () => {
      const red = chroma('#ff0000');
      const green = chroma('#00ff00');
      const blue = chroma('#0000ff');
      const yellow = chroma('#ffff00');

      // These should all have max chroma (1.0)
      expect(red).toBe(1);
      expect(green).toBe(1);
      expect(blue).toBe(1);
      expect(yellow).toBe(1);

      // Tertiary/desaturated colors have lower chroma
      const brown = chroma('#884400');
      expect(brown).toBeLessThan(1);
    });

    it('yellow and cyan have high chroma (both primaries at max)', () => {
      const yellow = chroma('#ffff00');
      const cyan = chroma('#00ffff');
      const magenta = chroma('#ff00ff');

      expect(yellow).toBe(1);
      expect(cyan).toBe(1);
      expect(magenta).toBe(1);
    });
  });

  describe('contrast', () => {
    it('returns 1 for identical colors (no contrast)', () => {
      expect(contrast('#ffffff', '#ffffff')).toBe(1);
      expect(contrast('#000000', '#000000')).toBe(1);
      expect(contrast('#ff0000', '#ff0000')).toBe(1);
    });

    it('returns high value for black/white (max contrast)', () => {
      const bw = contrast('#000000', '#ffffff');
      expect(bw).toBeGreaterThan(10);
    });

    it('is symmetric (order doesn\'t matter)', () => {
      expect(contrast('#ffffff', '#000000')).toBe(contrast('#000000', '#ffffff'));
      expect(contrast('#ff0000', '#00ff00')).toBe(contrast('#00ff00', '#ff0000'));
    });

    it('is in range [1, ~21]', () => {
      const pairs = [
        ['#ffffff', '#ffffff'],
        ['#ffffff', '#000000'],
        ['#000000', '#ffffff'],
        ['#ff0000', '#00ff00'],
        ['#0000ff', '#ffff00'],
      ];
      for (const [a, b] of pairs) {
        const c = contrast(a, b);
        expect(c).toBeGreaterThanOrEqual(1);
        expect(c).toBeLessThanOrEqual(21);
      }
    });

    it('white on white = 1 (no contrast)', () => {
      expect(contrast('#ffffff', '#ffffff')).toBe(1);
    });

    it('black on black = 1 (no contrast)', () => {
      expect(contrast('#000000', '#000000')).toBe(1);
    });

    it('white on black approaches 21 (WCAG max)', () => {
      const c = contrast('#ffffff', '#000000');
      expect(c).toBeGreaterThan(19);
    });

    it('dark gray on light gray has moderate contrast', () => {
      const c = contrast('#333333', '#cccccc');
      expect(c).toBeGreaterThan(3);
      expect(c).toBeLessThan(10);
    });

    it('bright colors may have lower contrast than expected (luminance-based)', () => {
      // Red and yellow both have relatively high luminance
      const ry = contrast('#ff0000', '#ffff00');
      const bw = contrast('#000000', '#ffffff');
      expect(ry).toBeLessThan(bw);
    });

    it('light color contrast > dark color contrast', () => {
      const whiteBlack = contrast('#ffffff', '#000000');
      const lightGray = contrast('#cccccc', '#000000');
      expect(whiteBlack).toBeGreaterThan(lightGray);
    });
  });
});
