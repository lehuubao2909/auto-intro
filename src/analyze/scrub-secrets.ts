/**
 * Secret scrubbing (R5). Run on ANY repo text before it is sent to Gemini, and
 * before any code/file content can reach the renderer. Better to over-redact.
 */

const SECRET_FILE_PATTERNS = [
  /(^|\/)\.env(\.|$)/i,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)id_rsa$/i,
  /(^|\/)credentials$/i,
  /\.pfx$/i,
  /\.p12$/i,
];

/** True if a file path is likely to hold secrets and should never be read for the LLM. */
export function isSecretFile(relPath: string): boolean {
  return SECRET_FILE_PATTERNS.some((re) => re.test(relPath));
}

const REDACTION = "«redacted»";

// Value-bearing assignments where the KEY name implies a secret.
const ASSIGNMENT_RE =
  /\b([A-Za-z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD|PWD|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|CLIENT[_-]?SECRET|AUTH|CREDENTIAL)[A-Za-z0-9_]*)\s*[:=]\s*["'`]?([^"'`\s,}]{6,})["'`]?/gi;

// Standalone high-entropy / known token shapes.
const TOKEN_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9]{16,}\b/g, // OpenAI-style
  /\bAIza[0-9A-Za-z_-]{30,}\b/g, // Google API key
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, // GitHub tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWT
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

/** Redact secrets from a blob of text. */
export function scrubSecrets(text: string): string {
  let out = text.replace(ASSIGNMENT_RE, (_m, key: string) => `${key}=${REDACTION}`);
  for (const re of TOKEN_PATTERNS) out = out.replace(re, REDACTION);
  return out;
}

/**
 * Deep-scrub every string in a JSON-like value (defensive final pass before any
 * LLM output is rendered into the video — residual secrets in model prose).
 * Returns a new value; non-strings pass through unchanged.
 */
export function scrubDeep<T>(value: T): T {
  if (typeof value === "string") return scrubSecrets(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrubDeep(v);
    return out as T;
  }
  return value;
}
