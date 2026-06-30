import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny, infer as zInfer } from "zod";
import { config, assertLlmKey } from "./config.js";

/**
 * Provider-agnostic LLM client. Dispatches to Gemini (SDK), OpenAI, or Anthropic
 * (both via fetch — no extra deps) based on `config.llm.provider`. Public surface is
 * unchanged from the old gemini-only client:
 *   - generateText: free-form text.
 *   - generateRawJson: JSON string (caller validates) — used by the Director repair loop.
 *   - generateJson: structured output validated against a zod schema.
 * A tolerant parse path (strip ```json fences) keeps a stray wrapper from breaking us.
 */

export interface GenOpts {
  model: string;
  /** lower = more deterministic. Honored by Gemini/OpenAI(non-reasoning); Anthropic ignores it. */
  temperature?: number;
  /** Gemini-only: send the zod schema as responseJsonSchema (default true). */
  useResponseSchema?: boolean;
}

const MAX_OUTPUT_TOKENS = 16000; // enough for a full storyboard; safe non-streaming

// --- shared retry/backoff on transient errors (503/429/500/overloaded) -----
function isTransient(e: unknown): boolean {
  const err = e as { status?: number; message?: string };
  const s = err.status ?? 0;
  return (
    s === 429 || s === 500 || s === 502 || s === 503 || s === 529 ||
    /UNAVAILABLE|overloaded|rate.?limit|deadline|timeout|ETIMEDOUT|ECONNRESET/i.test(String(err.message ?? ""))
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= retries || !isTransient(e)) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1) ** 2)); // 1.5s, 6s, 13.5s
    }
  }
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// --- Gemini ----------------------------------------------------------------
let gemini: GoogleGenAI | null = null;
function geminiClient(): GoogleGenAI {
  if (!gemini) gemini = new GoogleGenAI({ apiKey: config.llm.apiKey });
  return gemini;
}
async function geminiText(prompt: string, opts: GenOpts, jsonMode: boolean, jsonSchema?: object): Promise<string> {
  const res = await geminiClient().models.generateContent({
    model: opts.model,
    contents: prompt,
    config: {
      temperature: opts.temperature ?? (jsonMode ? 0.5 : 0.4),
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      ...(jsonSchema ? { responseJsonSchema: jsonSchema as Record<string, unknown> } : {}),
    },
  });
  return res.text ?? "";
}

// --- OpenAI (Chat Completions; no temperature → safe on reasoning models) ---
async function openaiText(prompt: string, opts: GenOpts, jsonMode: boolean): Promise<string> {
  const body: Record<string, unknown> = {
    model: opts.model,
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    messages: jsonMode
      ? [{ role: "system", content: "Respond with valid JSON only." }, { role: "user", content: prompt }]
      : [{ role: "user", content: prompt }],
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.llm.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new HttpError(res.status, `OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

// --- Anthropic (Messages; omit temperature — Opus 4.8/4.7 reject it) --------
async function anthropicText(prompt: string, opts: GenOpts, jsonMode: boolean): Promise<string> {
  const content = jsonMode ? `${prompt}\n\nRespond with ONLY valid JSON. No prose, no markdown fences.` : prompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.llm.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: opts.model, max_tokens: MAX_OUTPUT_TOKENS, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new HttpError(res.status, `Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
}

/** Dispatch raw text generation to the active provider (with retry). */
function genText(prompt: string, opts: GenOpts, jsonMode: boolean, jsonSchema?: object): Promise<string> {
  assertLlmKey();
  return withRetry(() => {
    switch (config.llm.provider) {
      case "openai":
        return openaiText(prompt, opts, jsonMode);
      case "anthropic":
        return anthropicText(prompt, opts, jsonMode);
      default:
        return geminiText(prompt, opts, jsonMode, jsonSchema);
    }
  });
}

export async function generateText(prompt: string, opts: GenOpts): Promise<string> {
  return genText(prompt, opts, false);
}

/** Extract the first JSON object/array from a model response (handles ```json fences). */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  if (start === -1) return body;
  const open = body[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < body.length; i++) {
    if (body[i] === open) depth++;
    else if (body[i] === close && --depth === 0) return body.slice(start, i + 1);
  }
  return body.slice(start);
}

/** Generate and return the extracted JSON STRING (no zod validation). */
export async function generateRawJson(prompt: string, opts: GenOpts): Promise<string> {
  return extractJson(await genText(prompt, opts, true));
}

export async function generateJson<S extends ZodTypeAny>(prompt: string, schema: S, opts: GenOpts): Promise<zInfer<S>> {
  let text: string;
  // Gemini supports a native JSON-schema response; other providers use prompt-guided JSON.
  if (config.llm.provider === "gemini" && opts.useResponseSchema !== false) {
    try {
      const jsonSchema = zodToJsonSchema(schema, { target: "openApi3" }) as object;
      text = await genText(prompt, opts, true, jsonSchema);
    } catch {
      text = await genText(`${prompt}\n\nRespond with ONLY valid JSON matching the requested shape.`, opts, true);
    }
  } else {
    text = await genText(prompt, opts, true);
  }

  const raw = extractJson(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `${config.llm.provider} returned non-JSON output (model=${opts.model}): ${(e as Error).message}\n--- raw ---\n${text.slice(0, 800)}`,
    );
  }
  return schema.parse(parsed);
}
