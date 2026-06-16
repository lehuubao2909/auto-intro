import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectRunnable } from '../src/analyze/detect-runnable.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('detectRunnable', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('detects Next.js app as runnable with dev command', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.hasUi).toBe(true);
    expect(result.devCommand).toBe('npm run dev');
    expect(result.port).toBe(3000);
  });

  it('detects Vite app with default port 5173', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'vite' },
      devDependencies: { vite: '^4.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.hasUi).toBe(true);
    expect(result.port).toBe(5173);
  });

  it('uses start script if dev script missing', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { start: 'npm run server' },
      dependencies: { react: '^18.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.devCommand).toBe('npm run start');
  });

  it('detects homepageURL from package.json', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      homepage: 'https://example.com',
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.liveUrl).toBe('https://example.com');
  });

  it('extracts demo/live URLs from README', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, '[Live Demo](https://demo.example.com)');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.liveUrl).toBe('https://demo.example.com');
  });

  it('finds vercel.app URLs in README', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, 'Check out https://my-app.vercel.app for the live version.');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.liveUrl).toBe('https://my-app.vercel.app');
  });

  it('finds netlify.app URLs in README', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, 'Live at https://my-site.netlify.app');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.liveUrl).toContain('netlify.app');
  });

  it('finds github.io URLs in README', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, 'See https://user.github.io/repo for demo.');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.liveUrl).toContain('github.io');
  });

  it('finds screenshots in public directory', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const screenshotPath = join(tmpDir, 'public/screenshot.png');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));
    // Create public dir and screenshot
    require('node:fs').mkdirSync(join(tmpDir, 'public'), { recursive: true });
    writeFileSync(screenshotPath, '');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'public/screenshot.png', absPath: screenshotPath, kind: 'asset' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.screenshots).toContain('public/screenshot.png');
  });

  it('finds screenshots in assets directory', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const screenshotPath = join(tmpDir, 'assets/demo.jpg');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }));
    require('node:fs').mkdirSync(join(tmpDir, 'assets'), { recursive: true });
    writeFileSync(screenshotPath, '');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'assets/demo.jpg', absPath: screenshotPath, kind: 'asset' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.screenshots).toContain('assets/demo.jpg');
  });

  it('extracts image refs from README markdown', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, '![Screenshot](./public/app.png)');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.screenshots).toContain('public/app.png');
  });

  it('extracts image refs from README HTML img tags', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, '<img src="./docs/demo.gif" />');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.screenshots).toContain('docs/demo.gif');
  });

  it('ignores external image URLs in README', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const readmePath = join(tmpDir, 'README.md');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));
    writeFileSync(readmePath, '![External](https://example.com/image.png)');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'README.md', absPath: readmePath, kind: 'readme' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.screenshots).not.toContain('https://example.com/image.png');
  });

  it('returns false for hasUi when no web framework and no screenshots/liveUrl', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { lodash: '^4.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.hasUi).toBe(false);
  });

  it('returns undefined for devCommand when no dev/start scripts', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { build: 'next build' },
      dependencies: { next: '^14.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.devCommand).toBeUndefined();
  });

  it('returns undefined for port when framework not recognized', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'custom-dev' },
      dependencies: { 'custom-framework': '^1.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.port).toBeUndefined();
  });

  it('returns empty screenshots array when none found', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.screenshots).toEqual([]);
  });

  it('handles missing README gracefully', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: '^14.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    // Should not crash
    expect(() => detectRunnable(tree as any)).not.toThrow();
    const result = detectRunnable(tree as any);
    expect(result.hasUi).toBe(true);
  });

  it('detects React with dev command as runnable', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'react-scripts start' },
      dependencies: { react: '^18.0.0', 'react-scripts': '^5.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.hasUi).toBe(true);
    expect(result.devCommand).toBe('npm run dev');
    expect(result.port).toBe(3000);
  });

  it('detects Astro with correct port', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'astro dev' },
      devDependencies: { astro: '^3.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    expect(result.port).toBe(4321);
  });

  it('prefers first matching framework port', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: {
        next: '^14.0.0',
        vite: '^4.0.0',
      },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectRunnable(tree as any);
    // Next.js (port 3000) comes before Vite (5173) in FRAMEWORK_PORTS
    expect(result.port).toBe(3000);
  });
});
