import { generateRawJson } from "../shared/llm-client.js";
import { validateStoryboard, type ValidationResult } from "../shared/validate-storyboard.js";
import { buildDirectorPrompt, buildRepairPrompt } from "./build-director-prompt.js";
import { scrubDeep } from "../analyze/scrub-secrets.js";
import { config } from "../shared/config.js";
import type { ProjectBrief, DesignProfile, ComponentInventory } from "../shared/types.js";
import type { Storyboard } from "../shared/storyboard-schema.js";

/**
 * Director (v2): RepoFacts + DesignProfile + ComponentInventory → a VALID recreation
 * Storyboard. generate → validate → repair (<=2). The DesignProfile (palette/theme)
 * is injected post-generation so the renderer themes per-project and the Director
 * never picks colors. Final scrub before return.
 */

export interface DirectorResult {
  storyboard: Storyboard;
  validation: ValidationResult;
  repaired: number;
}

const MAX_REPAIRS = 2;

/** Inject the brand-fixed theme/palette (from DesignProfile) onto the board. */
function injectDesign(raw: string, design: DesignProfile): { parsed: unknown } {
  try {
    const obj = JSON.parse(raw) as { meta?: Record<string, unknown> };
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      obj.meta = {
        ...(obj.meta ?? {}),
        theme: design.mode === "light" ? "brand-light" : "cinematic-dark",
        accent: design.palette.accent,
        accent2: design.palette.accent2,
        design,
      };
    }
    return { parsed: obj };
  } catch {
    return { parsed: null };
  }
}

export async function direct(
  brief: ProjectBrief,
  design: DesignProfile,
  inventory: ComponentInventory,
): Promise<DirectorResult> {
  const model = config.llm.directorModel;
  const basePrompt = buildDirectorPrompt(brief, design, inventory);

  let raw = await generateRawJson(basePrompt, { model, temperature: 0.6 });
  let parsed = injectDesign(raw, design).parsed;
  let result = validateStoryboard(parsed);

  let repaired = 0;
  while (!result.ok && repaired < MAX_REPAIRS) {
    repaired++;
    raw = await generateRawJson(buildRepairPrompt(raw, result.errors), { model, temperature: 0.4 });
    parsed = injectDesign(raw, design).parsed;
    result = validateStoryboard(parsed);
  }

  if (!result.ok || !result.storyboard) {
    throw new Error(
      `Director could not produce a valid storyboard after ${repaired} repair(s):\n` +
        result.errors.map((e) => `  - ${e}`).join("\n"),
    );
  }

  const scrubbed = scrubDeep(result.storyboard);
  scrubbed.meta.design = design; // ensure injected design survives scrub
  return { storyboard: scrubbed, validation: result, repaired };
}
