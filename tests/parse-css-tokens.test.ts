import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { walkRepo } from '../src/analyze/walk-repo.js';
import { parseCssTokens } from '../src/inspect-ui/parse-css-tokens.js';

describe('parse-css-tokens', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(tmpdir(), `css-tokens-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('extracts direct hex vars from :root', () => {
    const css = `
      :root {
        --bg: #ffffff;
        --accent: #0066ff;
        --text: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.accent).toBe('#0066ff');
    expect(tokens.text).toBe('#000000');
  });

  it('extracts shadcn HSL format vars', () => {
    const css = `
      :root {
        --background: 0 0% 100%;
        --primary: 240 5% 46%;
        --radius: 0.5rem;
      }
    `;
    writeFileSync(path.join(tempDir, 'globals.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBeTruthy();
    expect(tokens.accent).toBeTruthy();
    expect(tokens.radius).toBe(8); // 0.5rem → 8px
  });

  it('converts rem radius to px', () => {
    const css = `
      :root {
        --bg: #000000;
        --radius: 0.25rem;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.radius).toBe(4); // 0.25rem * 16 = 4px
  });

  it('keeps px radius as-is', () => {
    const css = `
      :root {
        --bg: #000000;
        --radius: 12px;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.radius).toBe(12);
  });

  it('matches var name candidates in priority order', () => {
    const css = `
      :root {
        --color-bg: #111111;
        --bg: #222222;
        --body-bg: #333333;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    // --background, --bg, --color-bg, --color-background, --body-bg (priority order)
    // --bg should be picked (second in list)
    expect(tokens.bg).toBe('#222222');
  });

  it('prefers globals.css over other css files', () => {
    writeFileSync(path.join(tempDir, 'app.css'), ':root { --bg: #111111; }');
    writeFileSync(path.join(tempDir, 'globals.css'), ':root { --bg: #222222; }');

    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#222222');
  });

  it('handles multiple CSS files and merges tokens', () => {
    writeFileSync(path.join(tempDir, 'colors.css'), ':root { --bg: #ffffff; --accent: #0066ff; }');
    writeFileSync(path.join(tempDir, 'radius.css'), ':root { --radius: 8px; }');

    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.accent).toBe('#0066ff');
    expect(tokens.radius).toBe(8);
  });

  it('ignores unparseable color values', () => {
    const css = `
      :root {
        --bg: #ffffff;
        --bad-accent: not-a-color;
        --text: #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.text).toBe('#000000');
    expect(tokens.accent).toBeUndefined();
  });

  it('handles rgb() format vars', () => {
    const css = `
      :root {
        --bg: rgb(255, 255, 255);
        --accent: rgb(0, 102, 255);
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.accent).toBe('#0066ff');
  });

  it('extracts all token roles (bg, surface, text, dim, accent, accent2)', () => {
    const css = `
      :root {
        --bg: #ffffff;
        --surface: #f5f5f5;
        --text: #000000;
        --dim: #999999;
        --accent: #0066ff;
        --accent2: #ff6600;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.surface).toBe('#f5f5f5');
    expect(tokens.text).toBe('#000000');
    expect(tokens.dim).toBe('#999999');
    expect(tokens.accent).toBe('#0066ff');
    expect(tokens.accent2).toBe('#ff6600');
  });

  it('returns empty object for file with no :root vars', () => {
    const css = `
      body {
        color: red;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens).toEqual({});
  });

  it('handles whitespace variations in var declarations', () => {
    const css = `
      :root {
        --bg:   #ffffff  ;
        --accent : #0066ff ;
        --text:
          #000000;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.accent).toBe('#0066ff');
    expect(tokens.text).toBe('#000000');
  });

  it('case-insensitive var name matching', () => {
    const css = `
      :root {
        --BG: #ffffff;
        --ACCENT: #0066ff;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.accent).toBe('#0066ff');
  });

  it('ignores non-existent files gracefully', () => {
    const tree = { root: tempDir, files: [] };
    const tokens = parseCssTokens(tree);
    expect(tokens).toEqual({});
  });

  it('returns undefined for missing optional fields', () => {
    const css = `
      :root {
        --bg: #ffffff;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.bg).toBe('#ffffff');
    expect(tokens.surface).toBeUndefined();
    expect(tokens.accent).toBeUndefined();
    expect(tokens.radius).toBeUndefined();
  });

  it('detects secondary accent candidates --secondary, --accent-2', () => {
    const css = `
      :root {
        --bg: #ffffff;
        --secondary: #ff9900;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    expect(tokens.accent2).toBe('#ff9900');
  });

  it('prioritizes surface candidates (--card, --surface, --panel)', () => {
    const css = `
      :root {
        --bg: #ffffff;
        --card: #f0f0f0;
        --surface: #e0e0e0;
      }
    `;
    writeFileSync(path.join(tempDir, 'theme.css'), css);
    const tree = walkRepo(tempDir);
    const tokens = parseCssTokens(tree);

    // First match in priority order wins
    expect(tokens.surface).toBe('#f0f0f0');
  });
});
