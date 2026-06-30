import { z } from "zod";
import { generateJson } from "../shared/llm-client.js";
import { config } from "../shared/config.js";
import { ProjectBrief, type RepoFacts, type ProjectBrief as Brief, type UsageType } from "../shared/types.js";

/**
 * Build the human-approved ProjectBrief from RepoFacts. The LLM writes the NARRATIVE
 * (one-liner, how-it's-used, story beats); the FACTUAL fields (usageType, links,
 * techStack) come from deterministic detection so they can't be invented.
 */

const BriefGen = z.object({
  oneLiner: z.string(),
  howItsUsed: z.string(),
  keyFeatures: z.array(z.string()).max(6).default([]),
  suggestedBeats: z.array(z.string()).max(8).default([]),
});

const USAGE_HINT: Record<UsageType, string> = {
  cli: "a CLI: show the command being run in a terminal, then its output/result.",
  sdk: "an SDK/library: show a short code snippet importing & calling it, then the result it produces.",
  library: "a library: show a short code snippet using its API, then the outcome.",
  "web-app": "a web app: show the main feature being used (the core action → result), not login/settings.",
  api: "an API: show a request (METHOD /endpoint) and the JSON response it returns.",
  mobile: "a mobile app: show key screens of the main flow inside a phone frame.",
  desktop: "a desktop app: show the main window and its core action.",
  unknown: "infer the single core action and show it as input → result.",
};

function fallbackHowUsed(facts: RepoFacts): string {
  if (facts.install) return `Run \`${facts.install}\`.`;
  return facts.whatItDoes || facts.identity;
}

export async function buildBrief(facts: RepoFacts): Promise<Brief> {
  const assemble = (gen: z.infer<typeof BriefGen>): Brief =>
    ProjectBrief.parse({
      name: facts.name,
      oneLiner: gen.oneLiner || facts.identity || facts.name,
      problem: facts.problem,
      whatItDoes: facts.whatItDoes || facts.identity,
      usageType: facts.usageType,
      howItsUsed: gen.howItsUsed || fallbackHowUsed(facts),
      keyFeatures: gen.keyFeatures.length ? gen.keyFeatures : facts.features.slice(0, 6),
      techStack: facts.techStack,
      links: facts.links,
      suggestedBeats: gen.suggestedBeats,
    });

  if (!config.llm.apiKey) {
    return assemble({ oneLiner: facts.identity, howItsUsed: fallbackHowUsed(facts), keyFeatures: facts.features.slice(0, 6), suggestedBeats: [] });
  }

  const prompt = [
    "Write a concise, ACCURATE brief for a 45-60s product trailer. Ground everything in the facts below.",
    `This product's usageType is "${facts.usageType}" → how-it's-used should reflect ${USAGE_HINT[facts.usageType]}`,
    "Do NOT invent install commands, URLs, or features that aren't supported by the facts.",
    "Return JSON: { oneLiner (<=10 words), howItsUsed (1-2 sentences, the REAL way to use it),",
    "keyFeatures (3-6 short), suggestedBeats (6-8 short story beats for the trailer, matched to usageType) }.",
    "",
    "=== FACTS ===",
    JSON.stringify({ ...facts, runnable: undefined }, null, 2),
  ].join("\n");

  try {
    const gen = await generateJson(prompt, BriefGen, { model: config.llm.directorModel, temperature: 0.4, useResponseSchema: false });
    return assemble(gen);
  } catch {
    return assemble({ oneLiner: facts.identity, howItsUsed: fallbackHowUsed(facts), keyFeatures: facts.features.slice(0, 6), suggestedBeats: [] });
  }
}
