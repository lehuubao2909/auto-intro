/**
 * Central config — defaults + env overrides. KISS: plain object, no framework.
 *
 * LLM provider is Gemini everywhere (locked decision):
 *   - Director  = gemini-3.5-flash      (storyboard synthesis; strongest for our budget)
 *   - Triage    = gemini-3.1-flash-lite (cheap long-context skim of repo files)
 * Override any value via env without code changes.
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

export const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
    directorModel: env("AUTOINTRO_DIRECTOR_MODEL", "gemini-3.5-flash"),
    triageModel: env("AUTOINTRO_TRIAGE_MODEL", "gemini-3.1-flash-lite"),
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

export function assertGeminiKey(): void {
  if (!config.gemini.apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Set it in your environment (or a .env file) to run analysis + director. " +
        "Get a key at https://aistudio.google.com/apikey",
    );
  }
}
