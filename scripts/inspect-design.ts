/** Extract a DesignProfile from a repo. Run: npx tsx scripts/inspect-design.ts [repoPath] */
import { inspectDesign } from "../src/inspect-ui/design-profile.js";

const target = process.argv[2] ?? ".";
console.log(JSON.stringify(inspectDesign(target), null, 2));
