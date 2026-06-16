/** Analyze a repo → ProjectBrief (prints md). Run: npx tsx scripts/inspect-brief.ts [repoPath] */
import { analyzeRepo } from "../src/analyze/repo-facts.js";
import { buildBrief } from "../src/brief/build-brief.js";
import { renderBriefMd } from "../src/brief/render-brief-md.js";

const target = process.argv[2] ?? ".";
const facts = await analyzeRepo(target);
console.log(`usageType=${facts.usageType} install=${JSON.stringify(facts.install)} links=${JSON.stringify(facts.links)}\n`);
const brief = await buildBrief(facts);
console.log(renderBriefMd(brief));
