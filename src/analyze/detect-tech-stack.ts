import type { RepoTree } from "./walk-repo.js";
import { readJsonSafe } from "./read-json-safe.js";

/**
 * Deterministic tech-stack detection from manifests + dependencies.
 * Produces display names for the `techstack` scene. No LLM needed.
 */

// dependency name (substring match) → display label
const DEP_LABELS: Array<[RegExp, string]> = [
  [/^next$/, "Next.js"],
  [/^react$/, "React"],
  [/^react-dom$/, "React"],
  [/^vue$/, "Vue"],
  [/^svelte$/, "Svelte"],
  [/^@sveltejs\/kit$/, "SvelteKit"],
  [/^astro$/, "Astro"],
  [/^nuxt$/, "Nuxt"],
  [/^vite$/, "Vite"],
  [/^typescript$/, "TypeScript"],
  [/^tailwindcss$/, "Tailwind CSS"],
  [/^express$/, "Express"],
  [/^fastify$/, "Fastify"],
  [/^@nestjs\/core$/, "NestJS"],
  [/^@trpc\//, "tRPC"],
  [/^graphql$/, "GraphQL"],
  [/^prisma$/, "Prisma"],
  [/^drizzle-orm$/, "Drizzle"],
  [/^mongoose$/, "MongoDB"],
  [/^mongodb$/, "MongoDB"],
  [/^pg$/, "PostgreSQL"],
  [/^redis$|^ioredis$/, "Redis"],
  [/^@supabase\//, "Supabase"],
  [/^firebase$/, "Firebase"],
  [/^d3$/, "D3"],
  [/^three$/, "Three.js"],
  [/^remotion$/, "Remotion"],
  [/^electron$/, "Electron"],
  [/^@google\/genai$|^openai$|^@anthropic-ai\//, "LLM"],
];

export function detectTechStack(tree: RepoTree): string[] {
  const found = new Set<string>();
  const names = new Map(tree.files.map((f) => [f.relPath, f]));

  // JS/TS ecosystem — union deps across ALL package.json files (monorepo-aware).
  const pkgFiles = tree.files.filter((f) => f.relPath.split("/").pop() === "package.json").slice(0, 30);
  for (const pf of pkgFiles) {
    const pkg = readJsonSafe<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(pf.absPath);
    const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
    for (const dep of Object.keys(deps)) {
      for (const [re, label] of DEP_LABELS) if (re.test(dep)) found.add(label);
    }
  }
  if (!found.has("TypeScript") && [...names.keys()].some((p) => p.endsWith(".ts") || p.endsWith(".tsx"))) {
    found.add("TypeScript");
  }

  // Other languages by manifest presence
  if (names.has("requirements.txt") || names.has("pyproject.toml")) found.add("Python");
  if (names.has("go.mod")) found.add("Go");
  if (names.has("cargo.toml") || names.has("Cargo.toml")) found.add("Rust");
  if (names.has("pom.xml") || names.has("build.gradle")) found.add("Java");

  return [...found];
}
