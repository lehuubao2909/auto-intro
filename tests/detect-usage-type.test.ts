import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectUsageType } from '../src/analyze/detect-usage-type.js';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { RepoTree } from '../src/analyze/walk-repo.js';

describe('detectUsageType', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'test-detect-usage-'));
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  });

  // CLI detection with bin field
  it('detects CLI from bin field', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: 'my-cli',
      bin: { 'my-cli': './bin/cli.js' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('cli');
    expect(result.install).toBe('npx my-cli');
  });

  // CLI with scoped name - regression test for M6 fix
  it('detects scoped CLI and includes scope in install command', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: '@scope/my-cli',
      bin: { 'my-cli': './bin/cli.js' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('cli');
    expect(result.install).toBe('npx @scope/my-cli');
  });

  // CLI with no name should have null install
  it('detects CLI from bin but returns null install if no package name', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      bin: { 'cli': './bin/cli.js' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('cli');
    expect(result.install).toBeNull();
  });

  // Web app detection - Next.js
  it('detects web-app from Next.js dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: 'next-app',
      dependencies: { next: '^14.0.0', react: '^18.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('web-app');
    expect(result.install).toBeNull();
  });

  // Web app detection - Vite
  it('detects web-app from Vite dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { vite: '^4.0.0', react: '^18.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('web-app');
  });

  // Web app detection - Nuxt
  it('detects web-app from Nuxt dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { nuxt: '^3.0.0', vue: '^3.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('web-app');
  });

  // API detection - Express without React
  it('detects api from Express without frontend frameworks', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { express: '^4.18.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('api');
    expect(result.install).toBeNull();
  });

  // API detection - Fastify
  it('detects api from Fastify without React', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { fastify: '^4.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('api');
  });

  // API detection - NestJS
  it('detects api from NestJS without React', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { '@nestjs/core': '^10.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('api');
  });

  // NOT API if has React
  it('detects web-app instead of api if both Express and React present', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { express: '^4.18.0', react: '^18.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('web-app');
  });

  // SDK/Library detection with exports field
  it('detects sdk from exports field + package name', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: 'my-sdk',
      exports: { '.': './dist/index.js' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('sdk');
    expect(result.install).toBe('npm i my-sdk');
  });

  // SDK with scoped name
  it('detects scoped sdk and includes scope in install command', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: '@myorg/sdk',
      exports: { '.': './dist/index.js' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('sdk');
    expect(result.install).toBe('npm i @myorg/sdk');
  });

  // Library detection with main field
  it('detects sdk from main field + package name', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: 'my-lib',
      main: './dist/index.js',
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('sdk');
    expect(result.install).toBe('npm i my-lib');
  });

  // Library detection with module field
  it('detects sdk from module field + package name', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      name: 'my-lib',
      module: './dist/index.esm.js',
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('sdk');
    expect(result.install).toBe('npm i my-lib');
  });

  // Library detection with src/index without package name
  it('detects library from src/index without package name', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const srcDir = join(tmpDir, 'src');
    const srcPath = join(srcDir, 'index.ts');
    writeFileSync(pkgPath, JSON.stringify({}));
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(srcPath, 'export const foo = 1;');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
        { relPath: 'src/index.ts', absPath: srcPath, kind: 'source', size: 50 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('library');
    expect(result.install).toBeNull();
  });

  // Library detected but with package name → sdk
  it('detects sdk when src/index present + package name (no app/pages)', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const srcDir = join(tmpDir, 'src');
    const srcPath = join(srcDir, 'index.ts');
    writeFileSync(pkgPath, JSON.stringify({ name: 'my-lib' }));
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(srcPath, 'export const foo = 1;');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
        { relPath: 'src/index.ts', absPath: srcPath, kind: 'source', size: 50 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('sdk');
    expect(result.install).toBe('npm i my-lib');
  });

  // Not library/sdk if has app/ or pages/
  it('detects web-app instead of sdk if app/ folder present', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const appDir = join(tmpDir, 'app');
    const appPath = join(appDir, 'page.tsx');
    writeFileSync(pkgPath, JSON.stringify({ name: 'my-app' }));
    mkdirSync(appDir, { recursive: true });
    writeFileSync(appPath, 'export default function Page() {}');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
        { relPath: 'app/page.tsx', absPath: appPath, kind: 'source', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).not.toBe('sdk');
    expect(result.usageType).not.toBe('library');
  });

  // Mobile detection - React Native
  it('detects mobile from react-native dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { 'react-native': '^0.72.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('mobile');
    expect(result.install).toBeNull();
  });

  // Mobile detection - Expo
  it('detects mobile from expo dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { expo: '^49.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('mobile');
    expect(result.install).toBeNull();
  });

  // Desktop detection - Electron
  it('detects desktop from electron dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { electron: '^latest' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('desktop');
    expect(result.install).toBeNull();
  });

  // Desktop detection - Tauri
  it('detects desktop from tauri dependency', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { '@tauri-apps/api': '^1.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('desktop');
    expect(result.install).toBeNull();
  });

  // Python library detection - requirements.txt
  it('detects library from requirements.txt (Python)', () => {
    const reqPath = join(tmpDir, 'requirements.txt');
    writeFileSync(reqPath, 'numpy==1.24.0\n');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'requirements.txt', absPath: reqPath, kind: 'manifest', size: 50 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('library');
    expect(result.install).toBeNull();
  });

  // Python library detection - pyproject.toml
  it('detects library from pyproject.toml (Python)', () => {
    const pyPath = join(tmpDir, 'pyproject.toml');
    writeFileSync(pyPath, '[project]\nname = "my-app"\n');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'pyproject.toml', absPath: pyPath, kind: 'manifest', size: 50 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('library');
    expect(result.install).toBeNull();
  });

  // Go CLI detection
  it('detects cli from go.mod (Go)', () => {
    const goPath = join(tmpDir, 'go.mod');
    writeFileSync(goPath, 'module github.com/example/cli\n');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'go.mod', absPath: goPath, kind: 'manifest', size: 50 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('cli');
    expect(result.install).toBeNull();
  });

  // Unknown when no markers
  it('detects unknown for unknown repo structure', () => {
    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'README.md', absPath: join(tmpDir, 'README.md'), kind: 'readme', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('unknown');
    expect(result.install).toBeNull();
  });

  // React without framework → web-app fallback
  it('detects web-app from React alone (fallback)', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('web-app');
  });

  // Monorepo - union dependencies across multiple package.json files
  it('unions dependencies across monorepo packages', () => {
    const rootPkg = join(tmpDir, 'package.json');
    const pkgADir = join(tmpDir, 'packages/a');
    const pkgBDir = join(tmpDir, 'packages/b');
    const pkgA = join(pkgADir, 'package.json');
    const pkgB = join(pkgBDir, 'package.json');

    writeFileSync(rootPkg, JSON.stringify({
      name: 'monorepo',
      workspaces: ['packages/*'],
    }));
    mkdirSync(pkgADir, { recursive: true });
    mkdirSync(pkgBDir, { recursive: true });
    writeFileSync(pkgA, JSON.stringify({
      name: '@monorepo/a',
      dependencies: { express: '^4.18.0' },
    }));
    writeFileSync(pkgB, JSON.stringify({
      name: '@monorepo/b',
      dependencies: { react: '^18.0.0' },
    }));

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: rootPkg, kind: 'manifest', size: 100 },
        { relPath: 'packages/a/package.json', absPath: pkgA, kind: 'manifest', size: 100 },
        { relPath: 'packages/b/package.json', absPath: pkgB, kind: 'manifest', size: 100 },
      ],
    };

    const result = detectUsageType(tree);
    // Has both express and react → web-app
    expect(result.usageType).toBe('web-app');
  });

  // Malformed package.json should be gracefully ignored
  it('handles malformed package.json gracefully', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, 'invalid json {');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
      ],
    };

    // Should not throw, should gracefully return unknown
    expect(() => detectUsageType(tree)).not.toThrow();
    const result = detectUsageType(tree);
    expect(result.usageType).toBe('unknown');
  });

  // Case-insensitive file matching
  it('matches src/index file case-insensitively', () => {
    const pkgPath = join(tmpDir, 'package.json');
    const srcDir = join(tmpDir, 'SRC');
    const srcPath = join(srcDir, 'INDEX.JS');
    writeFileSync(pkgPath, JSON.stringify({ name: 'my-lib' }));
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(srcPath, 'export const foo = 1;');

    const tree: RepoTree = {
      root: tmpDir,
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'manifest', size: 100 },
        { relPath: 'SRC/INDEX.JS', absPath: srcPath, kind: 'source', size: 50 },
      ],
    };

    const result = detectUsageType(tree);
    expect(result.usageType).toBe('sdk');
  });
});
