import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectTechStack } from '../src/analyze/detect-tech-stack.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('detectTechStack', () => {
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

  it('detects React from package.json dependencies', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('React');
  });

  it('detects Next.js from package.json', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { next: '^14.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Next.js');
  });

  it('detects TypeScript from dependencies', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      devDependencies: { typescript: '^5.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('TypeScript');
  });

  it('detects TypeScript from .ts files when not in package.json', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { react: '^18.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
        { relPath: 'src/index.ts', absPath: join(tmpDir, 'src/index.ts'), kind: 'code' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('TypeScript');
  });

  it('detects Tailwind CSS', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      devDependencies: { tailwindcss: '^3.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Tailwind CSS');
  });

  it('detects Vite', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      devDependencies: { vite: '^4.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Vite');
  });

  it('detects Express backend', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { express: '^4.18.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Express');
  });

  it('detects Prisma ORM', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { prisma: '^5.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Prisma');
  });

  it('detects PostgreSQL', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { pg: '^8.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('PostgreSQL');
  });

  it('detects GraphQL', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { graphql: '^16.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('GraphQL');
  });

  it('detects Python from requirements.txt', () => {
    const reqPath = join(tmpDir, 'requirements.txt');
    writeFileSync(reqPath, 'numpy==1.24.0\n');

    const tree = {
      files: [
        { relPath: 'requirements.txt', absPath: reqPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Python');
  });

  it('detects Python from pyproject.toml', () => {
    const projPath = join(tmpDir, 'pyproject.toml');
    writeFileSync(projPath, '[project]\nname = "app"\n');

    const tree = {
      files: [
        { relPath: 'pyproject.toml', absPath: projPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Python');
  });

  it('detects Go from go.mod', () => {
    const modPath = join(tmpDir, 'go.mod');
    writeFileSync(modPath, 'module github.com/example/app\n');

    const tree = {
      files: [
        { relPath: 'go.mod', absPath: modPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Go');
  });

  it('detects Rust from Cargo.toml', () => {
    const cargoPath = join(tmpDir, 'Cargo.toml');
    writeFileSync(cargoPath, '[package]\nname = "app"\n');

    const tree = {
      files: [
        { relPath: 'Cargo.toml', absPath: cargoPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Rust');
  });

  it('detects Java from pom.xml', () => {
    const pomPath = join(tmpDir, 'pom.xml');
    writeFileSync(pomPath, '<project></project>');

    const tree = {
      files: [
        { relPath: 'pom.xml', absPath: pomPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Java');
  });

  it('detects LLM (Google Genai)', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { '@google/genai': '^1.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('LLM');
  });

  it('detects multiple technologies', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        prisma: '^5.0.0',
        pg: '^8.0.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        tailwindcss: '^3.0.0',
      },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Next.js');
    expect(result).toContain('React');
    expect(result).toContain('TypeScript');
    expect(result).toContain('Tailwind CSS');
    expect(result).toContain('Prisma');
    expect(result).toContain('PostgreSQL');
  });

  it('returns empty array when no technologies detected', () => {
    const tree = {
      files: [
        { relPath: 'README.md', absPath: join(tmpDir, 'README.md'), kind: 'readme' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toEqual([]);
  });

  it('handles missing or malformed package.json gracefully', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, 'invalid json {');

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    // Should not crash, should return empty or partial result
    expect(() => detectTechStack(tree as any)).not.toThrow();
  });

  it('detects D3', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      dependencies: { d3: '^7.0.0' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('D3');
  });

  it('detects Electron', () => {
    const pkgPath = join(tmpDir, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({
      devDependencies: { electron: '^latest' },
    }));

    const tree = {
      files: [
        { relPath: 'package.json', absPath: pkgPath, kind: 'config' },
      ],
    };

    const result = detectTechStack(tree as any);
    expect(result).toContain('Electron');
  });
});
