import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny, infer as zInfer } from "zod";
import { config, assertGeminiKey } from "./config.js";

/**
 * Thin Gemini wrapper (the only LLM provider). Two helpers:
 *   - generateText: free-form text.
 *   - generateJson: structured output validated against a zod schema, with a
 *     tolerant parse path (strip code fences) so a stray ```json wrapper never breaks us.
 *
 * Model defaults come from config (director vs triage); callers pass `model`.
 */

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  assertGeminiKey();
  if (!client) client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return client;
}

export interface GenOpts {
  model: string;
  /** lower = more deterministic; director wants some creativity, triage near-0 */
  temperature?: number;
  /**
   * Send the zod schema as Gemini `responseJsonSchema` (default true). Set false for
   * large/complex schemas (e.g. discriminated unions) where a strong prompt + few-shot
   * yields better output; zod still validates the result afterwards.
   */
  useResponseSchema?: boolean;
}

type GenParams = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

/** generateContent with retry+backoff on transient errors (503/429/500/overloaded). */
async function genContent(params: GenParams, retries = 3): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await ai().models.generateContent(params);
      return res.text ?? "";
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const transient =
        err.status === 503 || err.status === 429 || err.status === 500 ||
        /UNAVAILABLE|overloaded|rate.?limit|deadline|timeout/i.test(String(err.message ?? ""));
      if (attempt >= retries || !transient) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1) ** 2)); // 1.5s, 6s, 13.5s
    }
  }
}

export async function generateText(prompt: string, opts: GenOpts): Promise<string> {
  return genContent({ model: opts.model, contents: prompt, config: { temperature: opts.temperature ?? 0.4 } });
}

/** Extract the first JSON object/array from a model response (handles ```json fences). */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  if (start === -1) return body;
  // walk to the matching close to tolerate trailing prose
  const open = body[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < body.length; i++) {
    if (body[i] === open) depth++;
    else if (body[i] === close && --depth === 0) return body.slice(start, i + 1);
  }
  return body.slice(start);
}

/**
 * Generate and return the extracted JSON STRING (no zod validation). Use when the
 * caller validates separately and needs the raw text (e.g. Director repair loop).
 */
export async function generateRawJson(prompt: string, opts: GenOpts): Promise<string> {
  const text = await genContent({
    model: opts.model,
    contents: prompt,
    config: { temperature: opts.temperature ?? 0.5, responseMimeType: "application/json" },
  });
  return extractJson(text);
}

export async function generateJson<S extends ZodTypeAny>(
  prompt: string,
  schema: S,
  opts: GenOpts,
): Promise<zInfer<S>> {
  let text: string;
  try {
    if (opts.useResponseSchema === false) throw new Error("skip-schema");
    const jsonSchema = zodToJsonSchema(schema, { target: "openApi3" });
    text = await genContent({
      model: opts.model,
      contents: prompt,
      config: {
        temperature: opts.temperature ?? 0.4,
        responseMimeType: "application/json",
        // Newer SDKs accept JSON Schema directly; falls back to prompt-guided JSON below.
        responseJsonSchema: jsonSchema as unknown as Record<string, unknown>,
      },
    });
  } catch {
    // Structured-output unsupported/rejected → retry relying on the prompt to emit JSON.
    text = await genContent({
      model: opts.model,
      contents: `${prompt}\n\nRespond with ONLY valid JSON matching the requested shape. No prose, no markdown fences.`,
      config: { temperature: opts.temperature ?? 0.4, responseMimeType: "application/json" },
    });
  }

  const raw = extractJson(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Gemini returned non-JSON output (model=${opts.model}): ${(e as Error).message}\n--- raw ---\n${text.slice(0, 800)}`);
  }
  return schema.parse(parsed);
}
