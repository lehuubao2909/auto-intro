/**
 * Integration test: start the server over a real repo, run the pipeline via the
 * HTTP API, consume SSE progress, assert the video is produced.
 * Run: npx tsx scripts/test-server.ts [repoPath]
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { buildServer } from "../src/server/server.js";

const repo = process.argv[2] ?? "/tmp/sample-app";
const app = await buildServer(repo);
await app.listen({ port: 4788, host: "127.0.0.1" });
const base = "http://localhost:4788";

// 1. UI served
const ui = await (await fetch(base + "/")).text();
console.log("GET / contains AutoDemo:", ui.includes("AutoDemo"));

// 2. consume SSE in background
const es = await fetch(base + "/api/events");
const reader = es.body!.getReader();
const decoder = new TextDecoder();
let done = false;
const pump = (async () => {
  let buf = "";
  while (!done) {
    const { value, done: rd } = await reader.read();
    if (rd) break;
    buf += decoder.decode(value, { stream: true });
    for (const part of buf.split("\n\n")) {
      const m = part.match(/^data: (.+)$/m);
      if (!m) continue;
      const e = JSON.parse(m[1]);
      console.log(`  [${e.stage}/${e.status}] ${e.message}`);
      if (e.stage === "done") done = true;
    }
    buf = buf.slice(buf.lastIndexOf("\n\n") + 2);
  }
})();

// 3. trigger run
console.log("POST /api/run:", (await (await fetch(base + "/api/run", { method: "POST" })).json()));

// 4. wait for done (with timeout)
const deadline = Date.now() + 240000;
while (!done && Date.now() < deadline) await new Promise((r) => setTimeout(r, 500));
await pump.catch(() => {});

const videoPath = path.join(repo, ".autodemo", "trailer.mp4");
console.log("trailer.mp4 exists:", existsSync(videoPath));
await app.close();
process.exit(existsSync(videoPath) ? 0 : 1);
