import { z } from "zod";
import { PRIMITIVE_NAMES } from "./primitive-names.js";

/**
 * Shared cross-phase types. Storyboard/Media types live in `storyboard-schema.ts`.
 * Here: RepoFacts (P2 output → P3 input) and pipeline plumbing.
 */

// --- RepoFacts (emitted by analyze/, consumed by direct/) ------------------
export const RunnableInfo = z.object({
  hasUi: z.boolean(),
  devCommand: z.string().optional(), // e.g. "npm run dev"
  port: z.number().int().optional(), // detected/default framework port
  liveUrl: z.string().optional(), // README "Demo"/"Live" link or homepage
  screenshots: z.array(z.string()).default([]), // local image paths found in repo
});
export type RunnableInfo = z.infer<typeof RunnableInfo>;

/** How the product is consumed — drives the trailer's flow template (no force-fit). */
export const UsageType = z.enum(["cli", "sdk", "library", "web-app", "api", "mobile", "desktop", "unknown"]);
export type UsageType = z.infer<typeof UsageType>;

/** Real outbound links only (never invented). */
export const ProjectLinks = z.object({ url: z.string().optional(), repo: z.string().optional() });
export type ProjectLinks = z.infer<typeof ProjectLinks>;

export const RepoFacts = z.object({
  name: z.string(),
  identity: z.string(), // one-line "what is it"
  problem: z.string(), // what problem it solves
  whatItDoes: z.string(), // core behavior
  features: z.array(z.string()).default([]), // 3-5 key features
  techStack: z.array(z.string()).default([]), // for the techstack scene
  howItWorks: z.string().optional(), // brief mechanism (architecture scene)
  usageType: UsageType.default("unknown"), // how users consume it
  install: z.string().nullable().default(null), // real run/install hint (e.g. "npx foo"); null if unknown
  links: ProjectLinks.default({}), // real url/repo only
  runnable: RunnableInfo,
  repoUrl: z.string().optional(),
});
export type RepoFacts = z.infer<typeof RepoFacts>;

/** Human-readable, user-APPROVED brief — the contract the Director must not contradict. */
export const ProjectBrief = z.object({
  name: z.string(),
  oneLiner: z.string(),
  problem: z.string(),
  whatItDoes: z.string(),
  usageType: UsageType,
  howItsUsed: z.string(), // 1-2 lines: the real way to use it (run cmd / import SDK / open app)
  keyFeatures: z.array(z.string()).max(6).default([]),
  techStack: z.array(z.string()).default([]),
  links: ProjectLinks.default({}),
  suggestedBeats: z.array(z.string()).max(8).default([]), // story outline
});
export type ProjectBrief = z.infer<typeof ProjectBrief>;

// --- DesignProfile (P4 inspect-ui → themes the trailer per project) --------
export const DesignProfile = z.object({
  mode: z.enum(["dark", "light"]).default("dark"),
  glass: z.boolean().default(true),
  radius: z.number().default(16), // px, base corner radius
  font: z.string().default("Inter"), // Google-font-loadable name when possible
  palette: z.object({
    bg: z.string(),
    surface: z.string(),
    text: z.string(),
    dim: z.string(),
    accent: z.string(),
    accent2: z.string(),
  }),
  logo: z.string().optional(), // local path to brand mark (only real asset kept)
});
export type DesignProfile = z.infer<typeof DesignProfile>;

// --- ComponentInventory (P5 → Director hint: what UI to showcase) ----------
export const InventoryItem = z.object({
  kind: z.string(), // human label of the UI piece: "dashboard", "chat", "pricing", "board"…
  primitive: z.enum(PRIMITIVE_NAMES), // which ui-kit primitive best recreates it
  label: z.string(), // a short on-screen label / title for the recreated element
  source: z.string().optional(), // file it was inferred from
});
export type InventoryItem = z.infer<typeof InventoryItem>;

export const ComponentInventory = z.object({
  items: z.array(InventoryItem).default([]),
});
export type ComponentInventory = z.infer<typeof ComponentInventory>;

// --- pipeline progress (P5 streams these to the UI) -----------------------
export type PipelineStage = "analyze" | "inspect" | "brief" | "direct" | "render" | "done";

export interface ProgressEvent {
  stage: PipelineStage;
  status: "start" | "ok" | "warn" | "error";
  message: string;
  /** absolute path to the produced artifact when stage === "render"/"done" */
  artifact?: string;
}

export type ProgressFn = (e: ProgressEvent) => void;
