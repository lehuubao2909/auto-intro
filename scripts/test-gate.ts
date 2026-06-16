/** Smoke-test the brief approval gate (analyze → brief), no render. Run: npx tsx scripts/test-gate.ts [repo] */
import { buildServer } from "../src/server/server.js";

const repo = process.argv[2] ?? "/Users/huubao/Documents/GOKU/Dev/DEV_AI/todo-demo";
const app = await buildServer(repo);
await app.listen({ port: 4799, host: "127.0.0.1" });
const base = "http://localhost:4799";

const ui = await (await fetch(base + "/")).text();
console.log("UI has brief panel:", ui.includes("Project brief"));
console.log("brief before analyze →", (await fetch(base + "/api/brief")).status, "(expect 404)");

await fetch(base + "/api/analyze", { method: "POST" });
// poll for brief readiness
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const r = await fetch(base + "/api/brief");
  if (r.ok) {
    const b = await r.json();
    console.log("brief ready: usageType =", b.usageType, "| oneLiner =", b.oneLiner);
    break;
  }
}
await app.close();
