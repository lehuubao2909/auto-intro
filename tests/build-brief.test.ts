import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderBriefMd } from '../src/brief/render-brief-md.js';
import type { ProjectBrief } from '../src/shared/types.js';

describe('build-brief & renderBriefMd', () => {
  describe('renderBriefMd (deterministic brief rendering)', () => {
    let briefFixture: ProjectBrief;

    beforeEach(() => {
      briefFixture = {
        name: 'Test App',
        oneLiner: 'A sample app',
        problem: 'Solves X',
        whatItDoes: 'Does Y',
        usageType: 'web-app',
        howItsUsed: 'Open and click Go',
        keyFeatures: ['Feature 1', 'Feature 2'],
        techStack: ['React', 'TypeScript'],
        links: { url: 'https://example.com', repo: 'https://github.com/user/repo' },
        suggestedBeats: ['Beat 1', 'Beat 2'],
      };
    });

    it('includes project name in header', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('# Test App — trailer brief');
    });

    it('includes one-liner', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('**A sample app**');
    });

    it('includes usage type', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('**Usage type:** web-app');
    });

    it('includes how it\'s used', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('**How it\'s used:** Open and click Go');
    });

    it('includes problem when present', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('**Problem:** Solves X');
    });

    it('includes what it does when present', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('**What it does:** Does Y');
    });

    it('omits URL line when links.url is empty', () => {
      briefFixture.links = { url: '', repo: 'https://github.com/user/repo' };
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('**URL:**');
    });

    it('omits URL line when links.url is undefined', () => {
      briefFixture.links = { repo: 'https://github.com/user/repo' };
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('**URL:**');
    });

    it('omits repo line when links.repo is empty', () => {
      briefFixture.links = { url: 'https://example.com', repo: '' };
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('**Repo:**');
    });

    it('omits repo line when links.repo is undefined', () => {
      briefFixture.links = { url: 'https://example.com' };
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('**Repo:**');
    });

    it('includes both URL and Repo when both present', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('**URL:** https://example.com');
      expect(md).toContain('**Repo:** https://github.com/user/repo');
    });

    it('includes key features section when features present', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('## Key features');
      expect(md).toContain('- Feature 1');
      expect(md).toContain('- Feature 2');
    });

    it('omits key features section when features empty', () => {
      briefFixture.keyFeatures = [];
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('## Key features');
    });

    it('includes tech stack line when present', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('## Tech stack');
      expect(md).toContain('React · TypeScript');
    });

    it('omits tech stack section when empty', () => {
      briefFixture.techStack = [];
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('## Tech stack');
    });

    it('includes suggested beats section when present', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('## Suggested story beats');
      expect(md).toContain('1. Beat 1');
      expect(md).toContain('2. Beat 2');
    });

    it('omits suggested beats section when empty', () => {
      briefFixture.suggestedBeats = [];
      const md = renderBriefMd(briefFixture);
      expect(md).not.toContain('## Suggested story beats');
    });

    it('includes footer prompt', () => {
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('Edit any line above, then approve to generate the trailer.');
    });

    it('handles minimal brief (only required fields)', () => {
      const minimal: ProjectBrief = {
        name: 'Minimal',
        oneLiner: 'A minimal app',
        problem: '',
        whatItDoes: '',
        usageType: 'unknown',
        howItsUsed: 'Just use it',
        keyFeatures: [],
        techStack: [],
        links: {},
        suggestedBeats: [],
      };

      const md = renderBriefMd(minimal);
      expect(md).toContain('# Minimal');
      expect(md).toContain('A minimal app');
      expect(md).not.toContain('## Key features');
      expect(md).not.toContain('## Tech stack');
      expect(md).not.toContain('## Suggested story beats');
    });

    it('handles rich brief with all optional fields', () => {
      const rich: ProjectBrief = {
        name: 'Rich App',
        oneLiner: 'Rich and full featured',
        problem: 'Problem X',
        whatItDoes: 'Does Y and Z',
        usageType: 'api',
        howItsUsed: 'Call the REST API',
        keyFeatures: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
        techStack: ['Node', 'Express', 'PostgreSQL', 'TypeScript', 'Docker'],
        links: { url: 'https://site.com', repo: 'https://github.com/org/repo' },
        suggestedBeats: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'],
      };

      const md = renderBriefMd(rich);
      expect(md).toContain('Rich App');
      expect(md).toContain('## Key features');
      expect(md).toContain('## Tech stack');
      expect(md).toContain('## Suggested story beats');
      expect(md).toContain('F1');
      expect(md).toContain('F6');
      expect(md).toContain('B1');
      expect(md).toContain('B8');
    });

    it('formats features as markdown list', () => {
      briefFixture.keyFeatures = ['Fast', 'Secure', 'Easy'];
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('- Fast');
      expect(md).toContain('- Secure');
      expect(md).toContain('- Easy');
    });

    it('formats beats as numbered list', () => {
      briefFixture.suggestedBeats = ['Setup', 'Configure', 'Deploy', 'Test'];
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('1. Setup');
      expect(md).toContain('2. Configure');
      expect(md).toContain('3. Deploy');
      expect(md).toContain('4. Test');
    });

    it('joins tech stack with · separator', () => {
      briefFixture.techStack = ['Node.js', 'React', 'GraphQL'];
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('Node.js · React · GraphQL');
    });

    it('handles special characters in fields', () => {
      briefFixture.name = 'App & Co.';
      briefFixture.oneLiner = 'A "great" app (yes!)';
      briefFixture.keyFeatures = ['Feature with "quotes"', 'Feature with & ampersand'];

      const md = renderBriefMd(briefFixture);
      expect(md).toContain('App & Co.');
      expect(md).toContain('A "great" app (yes!)');
      expect(md).toContain('Feature with "quotes"');
      expect(md).toContain('Feature with & ampersand');
    });

    it('handles empty strings for optional fields', () => {
      briefFixture.problem = '';
      briefFixture.whatItDoes = '';
      const md = renderBriefMd(briefFixture);

      expect(md).not.toContain('**Problem:**');
      expect(md).not.toContain('**What it does:**');
    });

    it('handles URLs with query parameters and fragments', () => {
      briefFixture.links = {
        url: 'https://example.com/page?foo=bar#section',
        repo: 'https://github.com/org/repo/tree/main',
      };
      const md = renderBriefMd(briefFixture);
      expect(md).toContain('https://example.com/page?foo=bar#section');
      expect(md).toContain('https://github.com/org/repo/tree/main');
    });

    it('returns valid markdown structure', () => {
      const md = renderBriefMd(briefFixture);
      // Must have at least one heading
      expect(md).toMatch(/^#/m);
      // Must have footer
      expect(md).toContain('Edit any line above');
      // Should not have trailing/leading extra newlines
      expect(md.trim()).toBe(md);
    });

    it('output is deterministic (same input = same output)', () => {
      const md1 = renderBriefMd(briefFixture);
      const md2 = renderBriefMd(briefFixture);
      expect(md1).toBe(md2);
    });

    it('handles all usage types', () => {
      const types = ['cli', 'sdk', 'library', 'web-app', 'api', 'mobile', 'desktop', 'unknown'] as const;
      for (const type of types) {
        briefFixture.usageType = type;
        const md = renderBriefMd(briefFixture);
        expect(md).toContain(`**Usage type:** ${type}`);
      }
    });
  });

  describe('fallback rendering (no Gemini API key)', () => {
    // These tests document the fallback behavior when GEMINI_API_KEY is not set
    // renderBriefMd is pure/deterministic, so we just test it directly
    // The buildBrief function would use this fallback internally

    it('renderBriefMd works without any LLM call', () => {
      const brief: ProjectBrief = {
        name: 'CLI Tool',
        oneLiner: 'A CLI for development',
        problem: '',
        whatItDoes: '',
        usageType: 'cli',
        howItsUsed: 'Run `npx mytool` in terminal',
        keyFeatures: [],
        techStack: ['Node.js'],
        links: {},
        suggestedBeats: [],
      };

      // This should never call any LLM, just render markdown
      const md = renderBriefMd(brief);
      expect(md).toContain('CLI Tool');
      expect(md).toContain('A CLI for development');
      expect(md).toContain('**Usage type:** cli');
    });

    it('brief with minimal data still produces valid markdown', () => {
      const brief: ProjectBrief = {
        name: 'X',
        oneLiner: 'Y',
        problem: '',
        whatItDoes: '',
        usageType: 'unknown',
        howItsUsed: 'Z',
        keyFeatures: [],
        techStack: [],
        links: {},
        suggestedBeats: [],
      };

      const md = renderBriefMd(brief);
      expect(md).toBeTruthy();
      expect(md.length).toBeGreaterThan(0);
    });
  });
});
