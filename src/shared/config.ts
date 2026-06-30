/**
 * Central config — defaults + env overrides. KISS: plain object, no framework.
 *
 * LLM provider is pluggable — Gemini (default), OpenAI, or Anthropic. Each has a
 * researched default Director (storyboard synthesis) + Triage (cheap repo skim) model;
 * override the provider and either model via env without code changes:
 *   AUTOINTRO_PROVIDER = gemini | openai | anthropic
 *   AUTOINTRO_DIRECTOR_MODEL / AUTOINTRO_TRIAGE_MODEL (optional per-model overrides)
 * Keys: GEMINI_API_KEY/GOOGLE_API_KEY · OPENAI_API_KEY · ANTHROPIC_API_KEY.
 */

// Load a local .env if present (Node 20.12+ has process.loadEnvFile). Best-effort.
try {
  (process as NodeJS.Process & { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(".env");
} catch {
  // no .env file — rely on real environment
}

function env(key: string, fallback: string): string {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// --- LLM provider selection ------------------------------------------------
export type LlmProvider = "gemini" | "openai" | "anthropic";

/**
 * Researched per-provider defaults (mid-2026). Director = strongest reasonable for
 * structured storyboard JSON; Triage = cheap/fast long-context skim.
 *  - gemini: 3.5-flash / 3.1-flash-lite
 *  - openai: gpt-5.4 (mid frontier) / gpt-5.4-mini (cheap)
 *  - anthropic: claude-opus-4-8 (most capable) / claude-haiku-4-5 (fastest, cheapest)
 */
const PROVIDER_DEFAULTS: Record<LlmProvider, { director: string; triage: string }> = {
  gemini: { director: "gemini-3.5-flash", triage: "gemini-3.1-flash-lite" },
  openai: { director: "gpt-5.4", triage: "gpt-5.4-mini" },
  anthropic: { director: "claude-opus-4-8", triage: "claude-haiku-4-5" },
};

const rawProvider = env("AUTOINTRO_PROVIDER", "gemini").toLowerCase();
const provider: LlmProvider = (["gemini", "openai", "anthropic"] as const).includes(rawProvider as LlmProvider)
  ? (rawProvider as LlmProvider)
  : "gemini";

const PROVIDER_KEY: Record<LlmProvider, string> = {
  gemini: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
  openai: process.env.OPENAI_API_KEY ?? "",
  anthropic: process.env.ANTHROPIC_API_KEY ?? "",
};

const KEY_HELP: Record<LlmProvider, { envVar: string; url: string }> = {
  gemini: { envVar: "GEMINI_API_KEY", url: "https://aistudio.google.com/apikey" },
  openai: { envVar: "OPENAI_API_KEY", url: "https://platform.openai.com/api-keys" },
  anthropic: { envVar: "ANTHROPIC_API_KEY", url: "https://console.anthropic.com/settings/keys" },
};

const defaults = PROVIDER_DEFAULTS[provider];

export const config = {
  llm: {
    provider,
    apiKey: PROVIDER_KEY[provider],
    directorModel: env("AUTOINTRO_DIRECTOR_MODEL", defaults.director),
    triageModel: env("AUTOINTRO_TRIAGE_MODEL", defaults.triage),
  },
  video: {
    fps: envInt("AUTOINTRO_FPS", 30),
    width: envInt("AUTOINTRO_WIDTH", 1920),
    height: envInt("AUTOINTRO_HEIGHT", 1080),
    theme: env("AUTOINTRO_THEME", "cinematic-dark"),
    // Brand palette is FIXED: one dominant accent + sparing secondary.
    // The Director must not pick its own colors — these are injected post-generation.
    accent: env("AUTOINTRO_ACCENT", "#41A3EF"),
    accent2: env("AUTOINTRO_ACCENT2", "#FCCE50"),
  },
  server: {
    port: envInt("AUTOINTRO_PORT", 0), // 0 → pick a free port at runtime
  },
  analyze: {
    maxFullReadFiles: envInt("AUTOINTRO_MAX_FULL_READ", 10), // triage hard cap
  },
  // Working dir for captures / repo-facts / output, created under the target repo.
  workDir: env("AUTOINTRO_WORKDIR", ".auto-intro"),
} as const;

export type AppConfig = typeof config;

/** Assert the ACTIVE provider has its API key set; otherwise a clear, provider-aware error. */
export function assertLlmKey(): void {
  if (!config.llm.apiKey) {
    const { envVar, url } = KEY_HELP[config.llm.provider];
    throw new Error(
      `Missing ${envVar} for AUTOINTRO_PROVIDER="${config.llm.provider}". ` +
        `Set it in your environment (or a .env file) to run analysis + director. Get a key at ${url}`,
    );
  }
}
