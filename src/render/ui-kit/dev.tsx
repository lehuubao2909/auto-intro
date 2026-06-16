/**
 * dev.tsx — developer-tool primitives.
 * Primitives: code-snippet, api-exchange, log-stream, file-tree, code-diff, command-palette
 */
import React, { useEffect, useState } from "react";
import { useCurrentFrame, useVideoConfig, continueRender, delayRender, interpolate, Easing } from "remotion";
import { codeToHtml } from "shiki";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance, riseY } from "../lib/timing.js";
import { Icon } from "../icons/icon.js";
import type { PrimitiveProps } from "./panels.js";

const MONO = '"JetBrains Mono","SF Mono",Menlo,monospace';

function ease(frame: number, start: number, dur: number): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function typed(text: string, frame: number, start: number, cps: number, fps: number): string {
  return text.slice(0, Math.max(0, Math.floor((frame - start) * (cps / fps))));
}

/** Syntax-highlighted code block using Shiki. */
export const CodeSnippet: React.FC<
  PrimitiveProps & { code?: string; lang?: string; caption?: string }
> = ({ theme, delay = 0, code, lang, caption }) => {
  // Coerce to strings — malformed LLM props must never crash the render (C1).
  const codeStr = typeof code === "string" ? code : "";
  const langStr = typeof lang === "string" && lang ? lang : "typescript";
  const frame = useCurrentFrame();
  const [html, setHtml] = useState<string | null>(null);
  const [handle] = useState(() => delayRender(`shiki-snippet-${langStr}`));
  const t = entrance(frame, delay, 16);

  useEffect(() => {
    if (!codeStr) { continueRender(handle); return; }
    let alive = true;
    try {
      codeToHtml(codeStr, { lang: langStr, theme: "github-dark", colorReplacements: { "#0d1117": "transparent" } })
        .then((h) => { if (alive) setHtml(h); })
        .catch(() => { if (alive) setHtml(`<pre>${codeStr.replace(/</g, "&lt;")}</pre>`); })
        .finally(() => continueRender(handle));
    } catch {
      continueRender(handle); // codeToHtml threw synchronously → never leave the handle dangling
    }
    return () => { alive = false; };
  }, [codeStr, langStr, handle]);

  if (!codeStr) return null;
  return (
    <div
      style={{
        ...glassSurface(theme, 0.55),
        borderRadius: theme.radius,
        overflow: "hidden",
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          background: hexA(theme.text, 0.04),
          borderBottom: `1px solid ${hexA(theme.text, 0.08)}`,
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
        ))}
        {caption ? (
          <span style={{ marginLeft: 10, color: theme.textDim, fontSize: 14, fontFamily: MONO }}>
            {caption}
          </span>
        ) : null}
      </div>
      <div
        style={{
          padding: "22px 28px",
          fontSize: 22,
          lineHeight: 1.55,
          fontFamily: MONO,
          color: theme.text,
        }}
        dangerouslySetInnerHTML={{ __html: html ?? `<pre style="margin:0;color:${theme.textDim}">${codeStr.replace(/</g, "&lt;")}</pre>` }}
      />
    </div>
  );
};

/** HTTP request + JSON response card. */
export const ApiExchange: React.FC<
  PrimitiveProps & { method?: string; endpoint?: string; response?: string }
> = ({ theme, delay = 0, method, endpoint = "/api/data", response = "{}" }) => {
  const m = (typeof method === "string" && method ? method : "GET").toUpperCase();
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  const respT = ease(frame, delay + 22, 14);
  const methodColor: Record<string, string> = {
    GET: "#4ade80", POST: "#60a5fa", PUT: "#fbbf24", DELETE: "#f87171", PATCH: "#c084fc",
  };
  const color = methodColor[m] ?? theme.accent;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
        fontFamily: MONO,
        width: "100%",
      }}
    >
      {/* Request row */}
      <div
        style={{
          ...glassSurface(theme, 0.5),
          borderRadius: theme.radius,
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            background: hexA(color, 0.16),
            color,
            fontSize: 18,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 6,
            letterSpacing: 1,
          }}
        >
          {m}
        </span>
        <span style={{ color: theme.text, fontSize: 22 }}>{endpoint}</span>
      </div>
      {/* Response card */}
      <div
        style={{
          ...glassSurface(theme, 0.4),
          borderRadius: theme.radius,
          padding: "16px 22px",
          opacity: respT,
          transform: `translateY(${(1 - respT) * 12}px)`,
        }}
      >
        <div style={{ color: "#4ade80", fontSize: 15, marginBottom: 8, letterSpacing: 0.5 }}>200 OK</div>
        <pre
          style={{
            margin: 0,
            color: theme.textDim,
            fontSize: 20,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {response}
        </pre>
      </div>
    </div>
  );
};

/** Streaming log lines, each appearing with a stagger. */
export const LogStream: React.FC<PrimitiveProps & { lines?: string[] }> = ({
  theme,
  delay = 0,
  lines = [],
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  if (!Array.isArray(lines) || lines.length === 0) return null;
  return (
    <div
      style={{
        ...glassSurface(theme, 0.5),
        borderRadius: theme.radius,
        padding: "20px 24px",
        fontFamily: MONO,
        fontSize: 20,
        lineHeight: 1.7,
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
        overflow: "hidden",
      }}
    >
      {lines.map((line, i) => {
        const lo = ease(frame, delay + i * 5, 10);
        const isErr = /error|fail|warn/i.test(line);
        const isOk = /success|done|ready|ok/i.test(line);
        const color = isErr ? "#f87171" : isOk ? "#4ade80" : theme.textDim;
        return (
          <div key={i} style={{ opacity: lo, color, transform: `translateX(${(1 - lo) * -10}px)` }}>
            <span style={{ color: hexA(theme.text, 0.3), marginRight: 10 }}>{String(i + 1).padStart(2, "0")}</span>
            {line}
          </div>
        );
      })}
    </div>
  );
};

/** Indented file-tree structure from a flat string array. */
export const FileTree: React.FC<PrimitiveProps & { items?: string[] }> = ({
  theme,
  delay = 0,
  items = [],
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div
      style={{
        ...glassSurface(theme, 0.5),
        borderRadius: theme.radius,
        padding: "22px 26px",
        fontFamily: MONO,
        fontSize: 20,
        lineHeight: 1.75,
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
      }}
    >
      {items.map((item, i) => {
        const lo = ease(frame, delay + i * 4, 10);
        const depth = item.match(/^(\s*)/)?.[1]?.length ?? 0;
        const name = item.trimStart();
        const isDir = name.endsWith("/");
        const isFile = name.includes(".");
        const iconName = isDir ? "FolderOpen" : isFile ? "FileCode" : "File";
        const color = isDir ? theme.accent : theme.text;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: depth * 16,
              opacity: lo,
              transform: `translateX(${(1 - lo) * -8}px)`,
            }}
          >
            <Icon name={iconName} size={18} color={isDir ? theme.accent : theme.textDim} animate={false} />
            <span style={{ color }}>{name}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Side-by-side diff — removed (red) + added (green) lines. */
export const CodeDiff: React.FC<PrimitiveProps & { added?: string[]; removed?: string[] }> = ({
  theme,
  delay = 0,
  added,
  removed,
}) => {
  const add = Array.isArray(added) ? added : [];
  const rem = Array.isArray(removed) ? removed : [];
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  if (add.length === 0 && rem.length === 0) return null;
  const maxLen = Math.max(add.length, rem.length, 1);
  return (
    <div
      style={{
        ...glassSurface(theme, 0.5),
        borderRadius: theme.radius,
        overflow: "hidden",
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
        fontFamily: MONO,
        fontSize: 20,
        lineHeight: 1.65,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Removed */}
        <div style={{ borderRight: `1px solid ${hexA(theme.text, 0.1)}`, padding: "18px 20px" }}>
          <div style={{ color: "#f87171", fontSize: 14, marginBottom: 10, fontWeight: 700 }}>Removed</div>
          {rem.map((line, i) => {
            const lo = ease(frame, delay + i * 4, 10);
            return (
              <div key={i} style={{ opacity: lo, color: "#f87171", background: hexA("#f87171", 0.06), borderRadius: 4, padding: "1px 6px", marginBottom: 2 }}>
                <span style={{ opacity: 0.5, marginRight: 8 }}>-</span>{line}
              </div>
            );
          })}
        </div>
        {/* Added */}
        <div style={{ padding: "18px 20px" }}>
          <div style={{ color: "#4ade80", fontSize: 14, marginBottom: 10, fontWeight: 700 }}>Added</div>
          {add.map((line, i) => {
            const lo = ease(frame, delay + maxLen * 4 + i * 4, 10);
            return (
              <div key={i} style={{ opacity: lo, color: "#4ade80", background: hexA("#4ade80", 0.06), borderRadius: 4, padding: "1px 6px", marginBottom: 2 }}>
                <span style={{ opacity: 0.5, marginRight: 8 }}>+</span>{line}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Command palette — search query types in, results appear. */
export const CommandPalette: React.FC<
  PrimitiveProps & { query?: string; results?: string[] }
> = ({ theme, delay = 0, query = "", results = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = entrance(frame, delay, 14);
  const typed_ = query ? typed(query, frame, delay + 6, 24, fps) : "";
  const cursorOn = Math.floor(frame / 14) % 2 === 0;
  const safeResults = Array.isArray(results) ? results : [];
  return (
    <div
      style={{
        ...glassSurface(theme, 0.65),
        borderRadius: theme.radius + 4,
        overflow: "hidden",
        width: "100%",
        maxWidth: 680,
        opacity: t,
        transform: `scale(${0.96 + t * 0.04}) translateY(${riseY(frame, delay)}px)`,
      }}
    >
      {/* Search row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 22px",
          borderBottom: `1px solid ${hexA(theme.text, 0.1)}`,
        }}
      >
        <Icon name="Search" size={22} color={theme.textDim} animate={false} />
        <span style={{ color: theme.text, fontSize: 22, fontFamily: MONO }}>
          {typed_ || <span style={{ color: theme.textDim }}>Search commands…</span>}
          {query ? <span style={{ opacity: cursorOn ? 1 : 0, color: theme.accent }}>|</span> : null}
        </span>
        <span style={{ marginLeft: "auto", color: theme.textDim, fontSize: 14, border: `1px solid ${hexA(theme.text, 0.2)}`, padding: "2px 8px", borderRadius: 6 }}>esc</span>
      </div>
      {/* Results */}
      <div style={{ padding: "10px 10px" }}>
        {safeResults.map((r, i) => {
          const ro = ease(frame, delay + 18 + i * 5, 10);
          const isFirst = i === 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: isFirst ? hexA(theme.accent, 0.12) : "transparent",
                opacity: ro,
                transform: `translateY(${(1 - ro) * 8}px)`,
              }}
            >
              <Icon name="CornerDownLeft" size={16} color={isFirst ? theme.accent : theme.textDim} animate={false} />
              <span style={{ color: isFirst ? theme.text : theme.textDim, fontSize: 20 }}>{r}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
