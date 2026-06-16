/** Start the AutoDemo server (no browser open). Run: npx tsx scripts/serve.ts [repo] [port] */
import { startServer } from "../src/server/server.js";

const repo = process.argv[2] ?? process.cwd();
const port = Number(process.argv[3] ?? 4790);
const url = await startServer(repo, port);
console.log(`AutoDemo server: ${url} (repo: ${repo})`);
