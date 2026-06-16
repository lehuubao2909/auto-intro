import path from "node:path";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { runAnalysis, runRender, rerender, type AnalysisResult } from "./pipeline.js";
import { validateStoryboard } from "../shared/validate-storyboard.js";
import { ProjectBrief } from "../shared/types.js";
import { renderBriefMd } from "../brief/render-brief-md.js";
import { config } from "../shared/config.js";
import { uiIndexPath } from "../shared/asset-path.js";
import type { ProgressEvent } from "../shared/types.js";
import type { Storyboard } from "../shared/storyboard-schema.js";

/**
 * Local control-panel server with a two-stage flow + human approval gate:
 *   POST /api/analyze → analyze+brief (STOP) → GET/POST /api/brief (review/edit) → POST /api/approve → render.
 * Single job at a time; progress over SSE. Artifacts served from <repo>/.auto-intro.
 */
export async function buildServer(repoRoot: string): Promise<FastifyInstance> {
  const root = path.resolve(repoRoot);
  const artifactDir = path.join(root, config.workDir);
  mkdirSync(artifactDir, { recursive: true });

  const app = Fastify({ logger: false });
  const clients = new Set<import("node:http").ServerResponse>();
  let history: ProgressEvent[] = [];
  let running = false;
  let analysis: AnalysisResult | null = null;

  const broadcast = (e: ProgressEvent): void => {
    history.push(e);
    const line = `data: ${JSON.stringify(e)}\n\n`;
    for (const res of clients) res.write(line);
  };

  await app.register(fastifyStatic, { root: artifactDir, prefix: "/artifact/", decorateReply: false });

  app.get("/", async (_req, reply) => {
    const htmlPath = uiIndexPath();
    const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "<h1>UI missing</h1>";
    reply.type("text/html").send(html.replace("__REPO__", root));
  });

  app.get("/api/events", (_req, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    reply.raw.write(": connected\n\n");
    for (const e of history) reply.raw.write(`data: ${JSON.stringify(e)}\n\n`);
    clients.add(reply.raw);
    reply.raw.on("close", () => clients.delete(reply.raw));
  });

  // Stage A — analyze + brief (stops for approval)
  app.post("/api/analyze", async (_req, reply) => {
    if (running) return reply.code(409).send({ error: "busy" });
    running = true;
    history = [];
    analysis = null;
    void runAnalysis(root, broadcast)
      .then((a) => { analysis = a; })
      .catch((err) => broadcast({ stage: "done", status: "error", message: (err as Error).message }))
      .finally(() => { running = false; });
    return { ok: true };
  });

  // Review / edit the brief before approving.
  app.get("/api/brief", async (_req, reply) => {
    if (!analysis) return reply.code(404).send({ error: "no brief yet" });
    return analysis.brief;
  });
  app.post<{ Body: { brief: unknown } }>("/api/brief", async (req, reply) => {
    if (!analysis) return reply.code(400).send({ error: "run analyze first" });
    const parsed = ProjectBrief.safeParse(req.body?.brief);
    if (!parsed.success) return reply.code(400).send({ error: "invalid brief", details: parsed.error.issues.map((i) => i.message) });
    analysis.brief = parsed.data;
    writeFileSync(path.join(artifactDir, "brief.json"), JSON.stringify(parsed.data, null, 2));
    writeFileSync(path.join(artifactDir, "brief.md"), renderBriefMd(parsed.data));
    return { ok: true };
  });

  // Stage B — approve → render from the (edited) brief.
  app.post("/api/approve", async (_req, reply) => {
    if (running) return reply.code(409).send({ error: "busy" });
    if (!analysis) return reply.code(400).send({ error: "run analyze first" });
    running = true;
    history = [];
    const a = analysis;
    void runRender(root, a.brief, a.design, a.inventory, broadcast)
      .catch((err) => broadcast({ stage: "done", status: "error", message: (err as Error).message }))
      .finally(() => { running = false; });
    return { ok: true };
  });

  app.get("/api/storyboard", async (_req, reply) => {
    const p = path.join(artifactDir, "storyboard.json");
    if (!existsSync(p)) return reply.code(404).send({ error: "no storyboard yet" });
    reply.type("application/json").send(readFileSync(p, "utf8"));
  });
  app.post<{ Body: { storyboard: unknown } }>("/api/storyboard", async (req, reply) => {
    if (running) return reply.code(409).send({ error: "busy" });
    const v = validateStoryboard(req.body?.storyboard);
    if (!v.ok) return reply.code(400).send({ error: "invalid storyboard", details: v.errors });
    running = true;
    history = [];
    void rerender(root, v.storyboard as Storyboard, broadcast)
      .catch((err) => broadcast({ stage: "done", status: "error", message: (err as Error).message }))
      .finally(() => { running = false; });
    return { ok: true, warnings: v.warnings };
  });

  return app;
}

export async function startServer(repoRoot: string, port: number): Promise<string> {
  const app = await buildServer(repoRoot);
  await app.listen({ port, host: "127.0.0.1" });
  return `http://localhost:${port}`;
}
