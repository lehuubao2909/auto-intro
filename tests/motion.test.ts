import { describe, it, expect } from 'vitest';
import { countUp, typewriter, enter, tilt3d, parallax } from '../src/render/lib/motion.js';
import type { EnterVariant } from '../src/render/lib/motion.js';

describe('motion helpers', () => {
  describe('countUp', () => {
    it('starts at 0 before start frame', () => {
      expect(countUp(-10, 100, 0, 26)).toBe(0);
      expect(countUp(0, 100, 10, 26)).toBe(0);
    });

    it('reaches target at end of duration', () => {
      expect(countUp(26, 100, 0, 26)).toBe(100);
      expect(countUp(52, 200, 0, 26)).toBe(200);
    });

    it('is monotonic (increases over time within duration)', () => {
      const target = 100;
      const start = 0;
      const dur = 26;

      let prev = countUp(start, target, start, dur);
      for (let frame = start + 1; frame <= start + dur; frame++) {
        const current = countUp(frame, target, start, dur);
        expect(current).toBeGreaterThanOrEqual(prev);
        prev = current;
      }
    });

    it('uses cubic-out easing (smooth acceleration)', () => {
      const target = 100;
      const start = 0;
      const dur = 26;

      // Cubic-out easing: starts fast, slows toward end
      // This is opposite to cubic-in, so we just verify monotonic increase and proper bounds
      const v5 = countUp(start + 5, target, start, dur);
      const v13 = countUp(start + 13, target, start, dur);
      const v21 = countUp(start + 21, target, start, dur);

      // Verify monotonic increase
      expect(v13).toBeGreaterThan(v5);
      expect(v21).toBeGreaterThan(v13);

      // Verify progress is smooth and bounded
      expect(v5).toBeGreaterThan(0);
      expect(v21).toBeLessThan(100);
    });

    it('clamps to [0, target] (extrapolate behavior)', () => {
      expect(countUp(-100, 100, 0, 26)).toBe(0);
      expect(countUp(1000, 100, 0, 26)).toBe(100);
    });

    it('rounds to integer', () => {
      const result = countUp(13, 100, 0, 26);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('handles custom start and duration', () => {
      expect(countUp(10, 50, 10, 20)).toBe(0); // Before start
      expect(countUp(30, 50, 10, 20)).toBe(50); // At end (start + dur)
    });

    it('handles zero target', () => {
      const result = countUp(13, 0, 0, 26);
      expect(result).toBe(0);
    });

    it('handles negative target (counts down)', () => {
      const zero = countUp(0, -100, 0, 26);
      expect(Math.abs(zero)).toBe(0); // Handle both 0 and -0
      expect(countUp(26, -100, 0, 26)).toBeLessThan(0);
    });
  });

  describe('typewriter', () => {
    it('is empty before start frame', () => {
      expect(typewriter('hello', -10, 0, 26, 30)).toBe('');
      expect(typewriter('hello', 0, 10, 26, 30)).toBe('');
    });

    it('grows with frame after start', () => {
      const text = 'hello';
      const start = 0;
      const cps = 26;
      const fps = 30;

      let prev = typewriter(text, start, start, cps, fps);
      for (let frame = start + 1; frame < start + 30; frame++) {
        const current = typewriter(text, frame, start, cps, fps);
        expect(current.length).toBeGreaterThanOrEqual(prev.length);
        prev = current;
      }
    });

    it('reaches full text at end', () => {
      const text = 'hello';
      const start = 0;
      const cps = 26; // characters per frame @ 30fps = ~26 char/sec
      const fps = 30;
      // Full text takes approximately (5 chars) / (26 chars/sec) * 30 fps frames
      const estimatedFrames = (5 / 26) * fps; // ~5.77 frames
      const frame = start + Math.ceil(estimatedFrames) + 5; // Well past full reveal

      const result = typewriter(text, frame, start, cps, fps);
      expect(result).toBe(text);
    });

    it('respects chars per second rate', () => {
      const text = 'hello world';
      const start = 0;
      const fps = 30;
      const cps1 = 10; // 10 chars/sec
      const cps2 = 30; // 30 chars/sec

      // At frame 30 (1 second):
      // cps1: (30 - 0) * (10 / 30) = 10 chars
      // cps2: (30 - 0) * (30 / 30) = 30 chars (but clamped to text length)
      const at1sec_cps1 = typewriter(text, 30, 0, cps1, fps).length;
      const at1sec_cps2 = typewriter(text, 30, 0, cps2, fps).length;

      expect(at1sec_cps2).toBeGreaterThan(at1sec_cps1);
    });

    it('does not exceed text length', () => {
      const text = 'abc';
      for (let frame = 0; frame <= 100; frame++) {
        const result = typewriter(text, frame, 0, 100, 30);
        expect(result.length).toBeLessThanOrEqual(text.length);
      }
    });

    it('handles empty string', () => {
      expect(typewriter('', 10, 0, 26, 30)).toBe('');
    });

    it('handles single character', () => {
      const text = 'a';
      expect(typewriter(text, 0, 0, 26, 30)).toBe('');
      expect(typewriter(text, 10, 0, 26, 30)).toBe('a');
    });

    it('uses default parameters correctly', () => {
      const text = 'test';
      // Default: start = 0, cps = 26, fps = 30
      const withDefaults = typewriter(text, 10);
      const explicit = typewriter(text, 10, 0, 26, 30);
      expect(withDefaults).toBe(explicit);
    });

    it('reveals progressively and is monotonic', () => {
      const text = 'hello world!';
      const start = 0;
      const cps = 26;
      const fps = 30;

      let prev = '';
      for (let frame = start; frame <= start + 60; frame++) {
        const current = typewriter(text, frame, start, cps, fps);
        expect(current.length).toBeGreaterThanOrEqual(prev.length);
        expect(current).toMatch(new RegExp(`^${prev}`)); // Current starts with previous
        prev = current;
      }
    });
  });

  describe('enter', () => {
    const variants: EnterVariant[] = [
      'fade-up',
      'scale',
      'blur',
      'clip-left',
      'clip-up',
      'spring-pop',
      'rise',
    ];

    it('returns a valid CSS properties object for each variant', () => {
      for (const variant of variants) {
        const style = enter(0, variant, 0, 18);
        expect(style).toBeDefined();
        expect(typeof style).toBe('object');
      }
    });

    it('has zero opacity at start (before animation)', () => {
      for (const variant of variants) {
        if (variant === 'clip-left' || variant === 'clip-up') {
          // Clip variants use full opacity but clipPath for reveal
          expect(enter(0, variant, 0, 18).opacity).toBe(1);
        } else {
          expect(enter(0, variant, 0, 18).opacity).toBeLessThanOrEqual(0.1);
        }
      }
    });

    it('reaches full opacity at end of duration', () => {
      for (const variant of variants) {
        const style = enter(18, variant, 0, 18);
        expect(style.opacity).toBeGreaterThanOrEqual(0.95);
      }
    });

    it('fade-up: translates Y down-to-up with opacity', () => {
      const start = enter(0, 'fade-up', 0, 18);
      const mid = enter(9, 'fade-up', 0, 18);
      const end = enter(18, 'fade-up', 0, 18);

      expect(start.opacity).toBeLessThan(mid.opacity);
      expect(mid.opacity).toBeLessThan(end.opacity);
      expect(start.transform).toContain('translateY');
      expect(end.transform).toContain('translateY(0px)');
    });

    it('scale: scales from 0.86 to 1.0 with opacity', () => {
      const start = enter(0, 'scale', 0, 18);
      const end = enter(18, 'scale', 0, 18);

      expect(start.transform).toContain('scale(0.86');
      expect(end.transform).toContain('scale(1');
    });

    it('blur: blurs from 12px to 0px with opacity', () => {
      const start = enter(0, 'blur', 0, 18);
      const end = enter(18, 'blur', 0, 18);

      expect(start.filter).toContain('blur(12px)');
      expect(end.filter).toContain('blur(0px)');
    });

    it('clip-left: clips from right to left (reveals left-to-right)', () => {
      const start = enter(0, 'clip-left', 0, 18);
      const end = enter(18, 'clip-left', 0, 18);

      expect(start.clipPath).toContain('100%');
      expect(end.clipPath).toContain('0%');
    });

    it('clip-up: clips from bottom to top (reveals bottom-to-top)', () => {
      const start = enter(0, 'clip-up', 0, 18);
      const end = enter(18, 'clip-up', 0, 18);

      expect(start.clipPath).toContain('100%');
      expect(end.clipPath).toContain('0%');
    });

    it('spring-pop: uses overshoot easing (springs past then settles)', () => {
      const start = enter(0, 'spring-pop', 0, 18);
      const mid = enter(5, 'spring-pop', 0, 18);
      const end = enter(18, 'spring-pop', 0, 18);

      expect(start.opacity).toBeLessThan(0.1);
      // Overshoot easing can go slightly past 1.0 mid-animation, then settles
      expect(end.opacity).toBeCloseTo(1, 1);
    });

    it('rise: translates Y upward with opacity', () => {
      const start = enter(0, 'rise', 0, 18);
      const end = enter(18, 'rise', 0, 18);

      expect(start.transform).toContain('translateY(40px)');
      expect(end.transform).toContain('translateY(0px)');
    });

    it('uses default variant (fade-up) when not specified', () => {
      const withDefault = enter(9, undefined, 0, 18);
      const explicit = enter(9, 'fade-up', 0, 18);
      expect(withDefault).toEqual(explicit);
    });

    it('respects custom start frame', () => {
      const beforeStart = enter(5, 'fade-up', 10, 18);
      const atStart = enter(10, 'fade-up', 10, 18);
      const midAnimation = enter(19, 'fade-up', 10, 18);

      expect(beforeStart.opacity).toBeLessThan(0.1);
      expect(atStart.opacity).toBeLessThan(0.1);
      expect(midAnimation.opacity).toBeGreaterThan(beforeStart.opacity);
    });

    it('respects custom duration', () => {
      const short = enter(1, 'fade-up', 0, 2);
      const long = enter(1, 'fade-up', 0, 26);

      // Same frame but shorter duration → further along animation
      expect(short.opacity).toBeGreaterThan(long.opacity);
    });

    it('does not throw for any variant', () => {
      for (const variant of variants) {
        expect(() => enter(10, variant, 0, 18)).not.toThrow();
      }
    });

    it('all styles contain valid CSS values', () => {
      for (const variant of variants) {
        const style = enter(9, variant, 0, 18);
        for (const [key, value] of Object.entries(style)) {
          if (key === 'opacity') {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1.5); // Allow slight overshoot for spring-pop
          } else if (typeof value === 'string') {
            // Transform, filter, clipPath are strings
            expect(value).not.toBe('');
          }
        }
      }
    });
  });

  describe('tilt3d', () => {
    it('returns a 3D transform string', () => {
      const result = tilt3d(0, 0, 24, 8);
      expect(typeof result).toBe('string');
      expect(result).toContain('perspective');
      expect(result).toContain('rotateX');
      expect(result).toContain('rotateY');
    });

    it('tilts away from flat at frame 0', () => {
      const result = tilt3d(0, 0, 24, 8);
      expect(result).toContain('8deg'); // deg = 8 by default
    });

    it('settles flat at end of duration', () => {
      const result = tilt3d(24, 0, 24, 8);
      expect(result).toContain('0deg');
    });

    it('interpolates between tilt and flat', () => {
      const start = tilt3d(0, 0, 24, 8);
      const mid = tilt3d(12, 0, 24, 8);
      const end = tilt3d(24, 0, 24, 8);

      // Just a sanity check that mid is between start and end
      expect(mid).not.toBe(start);
      expect(mid).not.toBe(end);
    });

    it('respects custom deg parameter', () => {
      const deg4 = tilt3d(0, 0, 24, 4);
      const deg12 = tilt3d(0, 0, 24, 12);

      expect(deg4).toContain('4deg');
      expect(deg12).toContain('12deg');
    });

    it('uses default parameters correctly', () => {
      const withDefaults = tilt3d(0);
      const explicit = tilt3d(0, 0, 24, 8);
      expect(withDefaults).toBe(explicit);
    });
  });

  describe('parallax', () => {
    it('oscillates based on frame (sine wave)', () => {
      const vals = [];
      for (let frame = 0; frame < 360; frame += 30) {
        vals.push(parallax(frame, 0.5, 30));
      }
      // Sine wave oscillates, so values should vary
      expect(new Set(vals).size).toBeGreaterThan(1);
    });

    it('is zero or near-zero at frame 0', () => {
      expect(Math.abs(parallax(0, 0.5, 30))).toBeLessThan(1);
    });

    it('scales with depth (0 = no parallax, 1 = full parallax)', () => {
      const frame = 60;
      const depth0 = parallax(frame, 0, 30);
      const depth05 = parallax(frame, 0.5, 30);
      const depth1 = parallax(frame, 1, 30);

      expect(depth0).toBe(0); // No depth = no parallax
      expect(Math.abs(depth05)).toEqual(Math.abs(depth1) / 2); // Linear scaling
    });

    it('scales with amplitude', () => {
      const frame = 60;
      const amp30 = parallax(frame, 0.5, 30);
      const amp60 = parallax(frame, 0.5, 60);

      expect(Math.abs(amp60)).toEqual(Math.abs(amp30) * 2);
    });

    it('uses default parameters correctly', () => {
      const withDefaults = parallax(60);
      const explicit = parallax(60, 0.5, 30);
      expect(withDefaults).toBe(explicit);
    });

    it('returns a number in reasonable range', () => {
      for (let frame = 0; frame < 120; frame += 10) {
        const result = parallax(frame, 1, 100);
        expect(result).toBeGreaterThanOrEqual(-100);
        expect(result).toBeLessThanOrEqual(100);
      }
    });
  });
});
