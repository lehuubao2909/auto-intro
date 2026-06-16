import { describe, it, expect } from 'vitest';
import { scrubSecrets, isSecretFile } from '../src/analyze/scrub-secrets.js';

describe('scrubSecrets', () => {
  it('redacts OpenAI sk-* tokens', () => {
    const text = 'const apiKey = sk-proj-abc1234567890123456789012345;';
    const result = scrubSecrets(text);
    expect(result).not.toContain('sk-proj-abc');
    expect(result).toContain('«redacted»');
  });

  it('redacts Google API keys (AIza...)', () => {
    const text = 'const googleKey = AIza1234567890123456789012345678901;';
    const result = scrubSecrets(text);
    expect(result).not.toContain('AIza');
    expect(result).toContain('«redacted»');
  });

  it('redacts GitHub tokens (ghp, ghs, ghu, gho, ghr)', () => {
    const texts = [
      'export GITHUB_TOKEN=ghp_1234567890123456789012345678901;',
      'token = ghs_1234567890123456789012345678901;',
      'pat = ghu_1234567890123456789012345678901;',
      'oauth = gho_1234567890123456789012345678901;',
      'release = ghr_1234567890123456789012345678901;',
    ];

    for (const text of texts) {
      const result = scrubSecrets(text);
      expect(result).toContain('«redacted»');
      // Ensure the token is not in the output
      expect(result).not.toMatch(/gh[pousr]_[A-Za-z0-9]{30,}/);
    }
  });

  it('redacts KEY=value secret assignments', () => {
    const text = 'API_KEY = "sk-abc1234567890123456789";';
    const result = scrubSecrets(text);
    expect(result).toContain('API_KEY=«redacted»');
    expect(result).not.toContain('sk-abc');
  });

  it('redacts PASSWORD= assignments', () => {
    const text = 'DB_PASSWORD=supersecretpassword123;';
    const result = scrubSecrets(text);
    expect(result).toContain('DB_PASSWORD=«redacted»');
    expect(result).not.toContain('supersecretpassword');
  });

  it('redacts TOKEN= assignments', () => {
    const text = 'BEARER_TOKEN = "abcdef123456789012345678";';
    const result = scrubSecrets(text);
    expect(result).toContain('BEARER_TOKEN=«redacted»');
    expect(result).not.toContain('abcdef');
  });

  it('redacts JWT tokens (eyJ...)', () => {
    const text = 'auth: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
    const result = scrubSecrets(text);
    expect(result).not.toContain('eyJ');
    expect(result).toContain('«redacted»');
  });

  it('leaves normal code intact', () => {
    const text = `
const myVar = "hello";
function compute(x) {
  return x * 2;
}
// This is a comment about the code
const result = compute(42);
    `.trim();
    const result = scrubSecrets(text);
    expect(result).toBe(text);
    expect(result).not.toContain('«redacted»');
  });

  it('leaves valid URLs intact', () => {
    const text = 'Visit https://example.com/api?key=value for details';
    const result = scrubSecrets(text);
    expect(result).toBe(text);
  });

  it('leaves variable names with KEY/SECRET in them alone if not assignments', () => {
    const text = 'const mySecretVar = 42; // variable name, no assignment pattern';
    const result = scrubSecrets(text);
    expect(result).toBe(text);
  });

  it('redacts private key blocks', () => {
    const text = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3...truncated
-----END PRIVATE KEY-----`;
    const result = scrubSecrets(text);
    expect(result).not.toContain('-----BEGIN PRIVATE KEY-----');
    expect(result).toContain('«redacted»');
  });

  it('redacts RSA private key blocks', () => {
    const text = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2Z3qX...
-----END RSA PRIVATE KEY-----`;
    const result = scrubSecrets(text);
    expect(result).not.toContain('-----BEGIN RSA PRIVATE KEY-----');
    expect(result).toContain('«redacted»');
  });

  it('handles multiple secrets in one text', () => {
    const text = `
const apiKey = sk-abc1234567890123456789;
const googleKey = AIza1234567890123456789012345;
const github = ghp_1234567890123456789012345678901;
    `.trim();
    const result = scrubSecrets(text);
    const redactCount = (result.match(/«redacted»/g) || []).length;
    expect(redactCount).toBe(3);
  });

  it('redacts slack tokens (xox...)', () => {
    const text = 'const slackToken = xoxb-1234567890-1234567890-abcdefg;';
    const result = scrubSecrets(text);
    expect(result).not.toContain('xoxb-');
    expect(result).toContain('«redacted»');
  });

  it('redacts AWS access keys (AKIA...)', () => {
    const text = 'const awsKey = AKIAIOSFODNN7EXAMPLE;';
    const result = scrubSecrets(text);
    expect(result).not.toContain('AKIA');
    expect(result).toContain('«redacted»');
  });
});

describe('isSecretFile', () => {
  it('flags .env files', () => {
    expect(isSecretFile('.env')).toBe(true);
    expect(isSecretFile('.env.local')).toBe(true);
    expect(isSecretFile('.env.production')).toBe(true);
    expect(isSecretFile('config/.env')).toBe(true);
  });

  it('flags .pem files', () => {
    expect(isSecretFile('keys/private.pem')).toBe(true);
    expect(isSecretFile('cert.pem')).toBe(true);
  });

  it('flags .key files', () => {
    expect(isSecretFile('api.key')).toBe(true);
    expect(isSecretFile('certs/ssl.key')).toBe(true);
  });

  it('flags id_rsa files', () => {
    expect(isSecretFile('id_rsa')).toBe(true);
    expect(isSecretFile('.ssh/id_rsa')).toBe(true);
  });

  it('flags credentials files', () => {
    expect(isSecretFile('credentials')).toBe(true);
    expect(isSecretFile('aws/credentials')).toBe(true);
  });

  it('flags .pfx files', () => {
    expect(isSecretFile('cert.pfx')).toBe(true);
    expect(isSecretFile('certificates/cert.pfx')).toBe(true);
  });

  it('flags .p12 files', () => {
    expect(isSecretFile('cert.p12')).toBe(true);
    expect(isSecretFile('certs/key.p12')).toBe(true);
  });

  it('does not flag .ts files', () => {
    expect(isSecretFile('src/auth.ts')).toBe(false);
    expect(isSecretFile('src/config.ts')).toBe(false);
  });

  it('does not flag .js files', () => {
    expect(isSecretFile('src/config.js')).toBe(false);
  });

  it('does not flag regular files', () => {
    expect(isSecretFile('README.md')).toBe(false);
    expect(isSecretFile('src/index.ts')).toBe(false);
  });

  it('case-insensitive for extensions', () => {
    expect(isSecretFile('CERT.PEM')).toBe(true);
    expect(isSecretFile('API.KEY')).toBe(true);
  });
});
