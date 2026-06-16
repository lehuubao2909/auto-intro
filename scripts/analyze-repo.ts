/**
 * Analyze a repo → RepoFacts (prints JSON). Run: npx tsx scripts/analyze-repo.ts [path]
 * Works without GEMINI_API_KEY (deterministic detection + fallback summary).
 */
import { analyzeRepo } from "../src/analyze/repo-facts.js";

const target = process.argv[2] ?? ".";
const facts = await analyzeRepo(target);
console.log(JSON.stringify(facts, null, 2));
