/** Build ComponentInventory for a repo. Run: npx tsx scripts/inspect-components.ts [repoPath] */
import { analyzeRepo } from "../src/analyze/repo-facts.js";
import { buildComponentInventory } from "../src/inspect-ui/component-inventory.js";

const target = process.argv[2] ?? ".";
const facts = await analyzeRepo(target);
const inv = await buildComponentInventory(target, facts);
console.log(JSON.stringify(inv, null, 2));
