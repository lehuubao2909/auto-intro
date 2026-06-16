import { z } from "zod";
import { PRIMITIVE_NAMES } from "./primitive-names.js";
import { DesignProfile } from "./types.js";

/**
 * Storyboard JSON schema — the contract between the LLM Director and the Remotion
 * renderer. Mirrors `skill/code-trailer/references/storyboard-schema.md` (v2).
 *
 * This zod schema is the SINGLE SOURCE OF TRUTH:
 * - P1 renderer + validator consume it,
 * - P3 Director generates against it (converted to JSON Schema for Gemini),
 * - quality-rule checks live in `validate-storyboard.ts` on top of this.
 *
 * Durations are FRAMES at `meta.fps`. Unknown keys are stripped (safe to extend).
 */

export const TransitionIn = z.enum(["fade", "slide", "wipe", "cut", "zoom", "push", "clip"]);
export const Sfx = z.enum(["whoosh", "tick", "riser", "thock", "impact", "none"]);
export type TransitionInValue = z.infer<typeof TransitionIn>;
export type SfxValue = z.infer<typeof Sfx>;

// --- media registry -------------------------------------------------------
export const MediaItem = z.object({
  kind: z.enum(["still", "clip"]),
  src: z.string(),
  durationInFrames: z.number().int().positive().optional(),
});
export type MediaItem = z.infer<typeof MediaItem>;

export const MediaRegistry = z.record(z.string(), MediaItem);
export type MediaRegistry = z.infer<typeof MediaRegistry>;

// --- common scene fields --------------------------------------------------
const sceneBase = {
  durationInFrames: z.number().int().positive(),
  transitionIn: TransitionIn.optional(),
  sfx: Sfx.optional(),
  bg: z.string().optional(),
};

// --- scene types (discriminated union on `type`) --------------------------
export const TitleScene = z.object({
  type: z.literal("title"),
  text: z.string(),
  sub: z.string().optional(),
  media: z.string().optional(), // registry id of a UI still
  ...sceneBase,
});

export const ProblemScene = z.object({
  type: z.literal("problem"),
  lines: z.array(z.string()).min(1).max(2),
  ...sceneBase,
});

export const UiScene = z.object({
  type: z.literal("ui"),
  media: z.string(), // registry id (still)
  caption: z.string().optional(),
  kenBurns: z.enum(["in", "out"]).optional(),
  frame: z.enum(["browser", "device", "none"]).optional(),
  ...sceneBase,
});

export const DemoScene = z.object({
  type: z.literal("demo"),
  media: z.string(), // registry id (clip)
  caption: z.string().optional(),
  trim: z.tuple([z.number().int(), z.number().int()]).optional(),
  ...sceneBase,
});

export const FeatureMontageScene = z.object({
  type: z.literal("feature-montage"),
  items: z
    .array(z.object({ icon: z.string(), text: z.string() }))
    .min(3)
    .max(5),
  perItemFrames: z.number().int().positive().optional(),
  over: z.string().optional(), // registry id to dim behind cards
  ...sceneBase,
});

export const ArchitectureScene = z.object({
  type: z.literal("architecture"),
  mermaid: z.string().optional(),
  graph: z
    .object({
      nodes: z.array(z.object({ id: z.string(), label: z.string().optional() })),
      edges: z.array(z.object({ from: z.string(), to: z.string() })),
    })
    .optional(),
  caption: z.string().optional(),
  ...sceneBase,
});

export const TechstackScene = z.object({
  type: z.literal("techstack"),
  items: z.array(z.object({ name: z.string(), icon: z.string().optional() })).min(1),
  caption: z.string().optional(),
  ...sceneBase,
});

export const CodeScene = z.object({
  type: z.literal("code"),
  lang: z.string(),
  code: z.string(),
  highlight: z.array(z.tuple([z.number().int(), z.number().int()])).optional(),
  caption: z.string().optional(),
  ...sceneBase,
});

export const StatScene = z.object({
  type: z.literal("stat"),
  value: z.union([z.string(), z.number()]),
  label: z.string(),
  sub: z.string().optional(),
  ...sceneBase,
});

export const OutroScene = z.object({
  type: z.literal("outro"),
  text: z.string(),
  cta: z.string(),
  sub: z.string().optional(),
  ...sceneBase,
});

// --- v2 UI-recreation scenes ---------------------------------------------
/** A single recreated UI primitive by registry name + its props (validated loosely). */
export const PrimitiveElement = z.object({
  primitive: z.enum(PRIMITIVE_NAMES),
  props: z.record(z.string(), z.any()).default({}),
});
export type PrimitiveElement = z.infer<typeof PrimitiveElement>;

/** Optional app sidebar rail to give a recreated screen "app" context. */
export const SidebarSpec = z.object({
  items: z.array(z.object({ icon: z.string(), label: z.string() })).min(2).max(6),
  active: z.number().int().nonnegative().default(0),
});

export const UiShowcaseScene = z.object({
  type: z.literal("ui-showcase"),
  element: PrimitiveElement, // one hero primitive (chart/chat/table/donut…)
  sidebar: SidebarSpec.optional(),
  caption: z.string().optional(),
  ...sceneBase,
});

export const UiBentoScene = z.object({
  type: z.literal("ui-bento"),
  tiles: z.array(PrimitiveElement).min(3).max(6), // dashboard-style grid
  cols: z.number().int().min(2).max(4).optional(),
  sidebar: SidebarSpec.optional(),
  caption: z.string().optional(),
  ...sceneBase,
});

export const UiSequenceScene = z.object({
  type: z.literal("ui-sequence"),
  steps: z.array(PrimitiveElement).min(2).max(3), // a few panels revealed in turn
  caption: z.string().optional(),
  ...sceneBase,
});

export const Scene = z.discriminatedUnion("type", [
  TitleScene,
  ProblemScene,
  UiScene,
  DemoScene,
  FeatureMontageScene,
  ArchitectureScene,
  TechstackScene,
  CodeScene,
  StatScene,
  OutroScene,
  UiShowcaseScene,
  UiBentoScene,
  UiSequenceScene,
]);
export type Scene = z.infer<typeof Scene>;
export type SceneType = Scene["type"];

// --- meta + storyboard ----------------------------------------------------
export const StoryboardMeta = z.object({
  title: z.string(),
  fps: z.number().int().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  theme: z.enum(["cinematic-dark", "brand-light"]).default("cinematic-dark"),
  accent: z.string().default("#41A3EF"),
  accent2: z.string().default("#FCCE50"),
  music: z.string().optional(), // mood key; audio deferred — renderer no-ops if asset absent
  bpm: z.number().positive().optional(),
  totalSeconds: z.number().positive(),
  media: MediaRegistry.default({}),
  /** v2: per-project design profile; when present the renderer themes from it. */
  design: DesignProfile.optional(),
});
export type StoryboardMeta = z.infer<typeof StoryboardMeta>;

export const Storyboard = z.object({
  meta: StoryboardMeta,
  scenes: z.array(Scene).min(1),
});
export type Storyboard = z.infer<typeof Storyboard>;

/** Scene types that are "text-only" (used by the no-3-in-a-row rule). */
export const TEXT_ONLY_SCENES: ReadonlySet<SceneType> = new Set([
  "title",
  "problem",
  "stat",
  "outro",
]);
