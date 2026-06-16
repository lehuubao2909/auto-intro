import type { ProjectBrief } from "../shared/types.js";

/** Render a ProjectBrief as human-readable markdown for review/editing. */
export function renderBriefMd(b: ProjectBrief): string {
  const lines: string[] = [];
  lines.push(`# ${b.name} — trailer brief`, "");
  lines.push(`**${b.oneLiner}**`, "");
  lines.push(`- **Usage type:** ${b.usageType}`);
  lines.push(`- **How it's used:** ${b.howItsUsed}`);
  if (b.problem) lines.push(`- **Problem:** ${b.problem}`);
  if (b.whatItDoes) lines.push(`- **What it does:** ${b.whatItDoes}`);
  if (b.links.url) lines.push(`- **URL:** ${b.links.url}`);
  if (b.links.repo) lines.push(`- **Repo:** ${b.links.repo}`);
  lines.push("");
  if (b.keyFeatures.length) {
    lines.push("## Key features");
    for (const f of b.keyFeatures) lines.push(`- ${f}`);
    lines.push("");
  }
  if (b.techStack.length) lines.push(`## Tech stack`, b.techStack.join(" · "), "");
  if (b.suggestedBeats.length) {
    lines.push("## Suggested story beats");
    b.suggestedBeats.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }
  lines.push("> Edit any line above, then approve to generate the trailer.");
  return lines.join("\n");
}
