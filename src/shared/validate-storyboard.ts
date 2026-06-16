import {
  Storyboard,
  TEXT_ONLY_SCENES,
  type Scene,
  type Storyboard as StoryboardT,
} from "./storyboard-schema.js";

/**
 * Storyboard validator — structural (zod) + the code-trailer skill's quality rules
 * (`references/storyboard-schema.md` §Validation + SKILL.md quality bar).
 *
 * `errors` block render and are fed back to the Director's repair loop (P3).
 * `warnings` are advisory (don't block).
 */

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  storyboard?: StoryboardT; // present when structural parse succeeds
}

/** Words in the lead text of a text-only scene (for the reading-floor rule). */
function leadWords(scene: Scene): number {
  let text = "";
  switch (scene.type) {
    case "title":
      text = scene.text;
      break;
    case "problem":
      // Stacked short lines overlap; the binding read is the LONGEST line, not the sum.
      return Math.max(...scene.lines.map((l) => l.trim().split(/\s+/).filter(Boolean).length));
    case "stat":
      text = `${scene.value} ${scene.label}`;
      break;
    case "outro":
      text = scene.text;
      break;
    default:
      return 0;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateStoryboard(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Structural (zod) — bail early with field errors if it fails.
  const parsed = Storyboard.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`schema: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
    }
    return { ok: false, errors, warnings };
  }
  const sb = parsed.data;
  const { meta, scenes } = sb;
  const fps = meta.fps;

  // 2. Required beats: a techstack scene; at least one ui/demo (else no-UI fallback → warn).
  const has = (t: Scene["type"]) => scenes.some((s) => s.type === t);
  if (!has("techstack")) errors.push("missing required `techstack` scene (tech must be shown).");
  const showsUi = ["ui", "demo", "ui-showcase", "ui-bento", "ui-sequence"].some((t) => has(t as Scene["type"]));
  if (!showsUi) {
    warnings.push("no UI scene (ui-showcase/ui-bento/ui-sequence) — only acceptable as a no-UI graphics arc.");
  }

  // 3. Scene count (soft) — ~10–13 for 45–60s.
  if (scenes.length < 8) warnings.push(`only ${scenes.length} scenes; aim ~10–13 for a dense trailer.`);
  if (scenes.length > 14) warnings.push(`${scenes.length} scenes is a lot; consider tightening to ~10–13.`);

  // 4. No 3 text-only scenes in a row.
  let run = 0;
  for (const s of scenes) {
    run = TEXT_ONLY_SCENES.has(s.type) ? run + 1 : 0;
    if (run >= 3) {
      errors.push("3+ text-only scenes in a row — break the one-note look with a ui/montage/diagram beat.");
      break;
    }
  }

  // 5. Reading floor for text scenes: sec ≥ max(1.0, words*0.25).
  scenes.forEach((s, i) => {
    if (!TEXT_ONLY_SCENES.has(s.type)) return;
    const sec = s.durationInFrames / fps;
    const floor = Math.max(1.0, leadWords(s) * 0.25);
    if (sec + 1e-6 < floor) {
      errors.push(`scene ${i} (${s.type}): ${sec.toFixed(2)}s < reading floor ${floor.toFixed(2)}s — hold longer.`);
    }
  });

  // 6. Spice caps: ≤1 code, ≤1 architecture.
  const count = (t: Scene["type"]) => scenes.filter((s) => s.type === t).length;
  if (count("code") > 1) errors.push("more than 1 `code` scene — code is a spice; keep at most one, only if it sells.");
  if (count("architecture") > 1) errors.push("more than 1 `architecture` scene — keep one clear mechanism.");

  // 7. SFX budget: ≤6 scenes carry sfx (excluding "none").
  const sfxCount = scenes.filter((s) => s.sfx && s.sfx !== "none").length;
  if (sfxCount > 6) warnings.push(`${sfxCount} scenes carry SFX; cap at ~6 for punctuation, not noise.`);

  // 8. feature-montage per-item pacing ~24–36 frames.
  scenes.forEach((s, i) => {
    if (s.type !== "feature-montage" || !s.perItemFrames) return;
    if (s.perItemFrames < 18 || s.perItemFrames > 45) {
      warnings.push(`scene ${i} (feature-montage): perItemFrames ${s.perItemFrames} outside ~24–36.`);
    }
  });

  // 9. Length: meta.totalSeconds must be in [45,70] (the rule). The ACTUAL video length is
  //    the frame sum — if it drifts far from target, warn (real playback is what viewers get).
  if (meta.totalSeconds < 45 || meta.totalSeconds > 70) {
    errors.push(`meta.totalSeconds=${meta.totalSeconds} out of range [45,70].`);
  }
  const computedSec = scenes.reduce((a, s) => a + s.durationInFrames, 0) / fps;
  if (computedSec < 45 || computedSec > 70) {
    warnings.push(`scenes actually run ${computedSec.toFixed(1)}s (target 45–60); adjust durations.`);
  }
  if (Math.abs(computedSec - meta.totalSeconds) > 5) {
    warnings.push(`meta.totalSeconds=${meta.totalSeconds} but scenes sum to ${computedSec.toFixed(1)}s.`);
  }

  // 10. Media references must exist in the registry (Director must not invent ids).
  const registry = meta.media ?? {};
  const refs: Array<{ i: number; id: string; want: "still" | "clip" | "any" }> = [];
  scenes.forEach((s, i) => {
    if (s.type === "ui") refs.push({ i, id: s.media, want: "still" });
    else if (s.type === "demo") refs.push({ i, id: s.media, want: "clip" });
    else if (s.type === "title" && s.media) refs.push({ i, id: s.media, want: "any" });
    else if (s.type === "feature-montage" && s.over) refs.push({ i, id: s.over, want: "any" });
  });
  for (const r of refs) {
    const item = registry[r.id];
    if (!item) {
      errors.push(`scene ${r.i}: media id "${r.id}" not in meta.media registry.`);
      continue;
    }
    if (r.want !== "any" && item.kind !== r.want) {
      errors.push(`scene ${r.i}: media "${r.id}" is a ${item.kind}, expected ${r.want}.`);
    }
  }

  return { ok: errors.length === 0, errors, warnings, storyboard: sb };
}
