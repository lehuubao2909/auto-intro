import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { inspectDesign } from '../src/inspect-ui/design-profile.js';
import { config } from '../src/shared/config.js';

describe('design-profile (inspectDesign)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(tmpdir(), `design-profile-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects light mode for light background', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.mode).toBe('light');
    expect(profile.palette.bg).toBe('#ffffff');
  });

  it('detects dark mode for dark background', () => {
    const css = `
      :root {
        --background: #000000;
        --primary: #00ffff;
        --foreground: #ffffff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.mode).toBe('dark');
    expect(profile.palette.bg).toBe('#000000');
  });

  it('extracts accent from CSS primary token', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #ff0099;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.palette.accent).toBe('#ff0099');
  });

  it('uses default accent if no token found', () => {
    const css = `
      :root {
        --background: #ffffff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    // light bg → light-mode default accent (mode-aware since palette sanitization)
    expect(profile.palette.accent).toBe('#4f46e5');
  });

  it('writes design-profile.json to .autodemo workDir', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    inspectDesign(tempDir);

    const profilePath = path.join(tempDir, config.workDir, 'design-profile.json');
    expect(() => readFileSync(profilePath, 'utf8')).not.toThrow();
  });

  it('persisted design-profile.json is valid JSON', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    inspectDesign(tempDir);

    const profilePath = path.join(tempDir, config.workDir, 'design-profile.json');
    const content = readFileSync(profilePath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('persisted profile contains all required fields', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    inspectDesign(tempDir);

    const profilePath = path.join(tempDir, config.workDir, 'design-profile.json');
    const content = readFileSync(profilePath, 'utf8');
    const stored = JSON.parse(content);

    expect(stored).toHaveProperty('mode');
    expect(stored).toHaveProperty('palette');
    expect(stored.palette).toHaveProperty('bg');
    expect(stored.palette).toHaveProperty('accent');
    expect(stored.palette).toHaveProperty('text');
  });

  it('uses light text for dark backgrounds', () => {
    const css = `
      :root {
        --background: #0a0f1e;
        --primary: #6ea8fe;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.mode).toBe('dark');
    expect(profile.palette.text).toBe('#eef2fb');
  });

  it('uses dark text for light backgrounds', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.mode).toBe('light');
    expect(profile.palette.text).toBe('#0b1220');
  });

  it('extracts text color from CSS token', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #333333;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.palette.text).toBe('#333333');
  });

  it('has glass=true by default', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.glass).toBe(true);
  });

  it('has default radius of 16px', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.radius).toBe(16);
  });

  it('extracts custom radius from CSS', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --radius: 0.5rem;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.radius).toBe(8);
  });

  it('generates palette with all colors populated', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.palette).toHaveProperty('bg');
    expect(profile.palette).toHaveProperty('surface');
    expect(profile.palette).toHaveProperty('text');
    expect(profile.palette).toHaveProperty('dim');
    expect(profile.palette).toHaveProperty('accent');
    expect(profile.palette).toHaveProperty('accent2');
  });

  it('computes surface (mix of bg and text)', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    // surface should be computed if not provided
    expect(profile.palette.surface).toBeTruthy();
    expect(profile.palette.surface).not.toBe(profile.palette.bg);
  });

  it('computes dim (mix of text and bg)', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
        --foreground: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    // dim should be computed if not provided
    expect(profile.palette.dim).toBeTruthy();
    expect(profile.palette.dim).not.toBe(profile.palette.text);
  });

  it('returns valid DesignProfile type', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    // Verify structure matches DesignProfile schema
    expect(profile.mode).toMatch(/^(dark|light)$/);
    expect(typeof profile.glass).toBe('boolean');
    expect(typeof profile.radius).toBe('number');
    expect(typeof profile.font).toBe('string');
    expect(profile.palette).toHaveProperty('bg');
  });

  it('handles multiple CSS files and merges tokens', () => {
    writeFileSync(
      path.join(tempDir, 'colors.css'),
      ':root { --background: #ffffff; --primary: #0066ff; }'
    );
    writeFileSync(
      path.join(tempDir, 'radius.css'),
      ':root { --radius: 1rem; }'
    );

    const profile = inspectDesign(tempDir);

    expect(profile.palette.bg).toBe('#ffffff');
    expect(profile.palette.accent).toBe('#0066ff');
    expect(profile.radius).toBe(16);
  });

  it('creates workDir if it does not exist', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    inspectDesign(tempDir);

    const workDir = path.join(tempDir, config.workDir);
    expect(() => readFileSync(path.join(workDir, 'design-profile.json'), 'utf8')).not.toThrow();
  });

  it('uses default accent2 when not provided', () => {
    const css = `
      :root {
        --background: #ffffff;
        --primary: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.palette.accent2).toBe('#f59e0b');
  });

  it('respects shadcn HSL format in CSS', () => {
    const css = `
      :root {
        --background: 0 0% 100%;
        --primary: 240 5% 46%;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);

    const profile = inspectDesign(tempDir);

    expect(profile.mode).toBe('light');
    expect(profile.palette.bg).toBeTruthy();
    expect(profile.palette.accent).toBeTruthy();
  });
});
