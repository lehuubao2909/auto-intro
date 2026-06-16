import React, { useEffect, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { codeToHtml } from "shiki";
import type { Theme } from "../theme.js";
import { entrance } from "../lib/timing.js";

/**
 * Syntax-highlighted code via Shiki. Async highlight is gated with delayRender so
 * frames stay deterministic. Used ONLY for the optional `code` scene (≤14 lines).
 */
export const CodeBlock: React.FC<{
  code: string;
  lang: string;
  theme: Theme;
  highlight?: Array<[number, number]>;
}> = ({ code, lang, theme }) => {
  const frame = useCurrentFrame();
  const [html, setHtml] = useState<string | null>(null);
  const [handle] = useState(() => delayRender(`shiki-${lang}`));

  useEffect(() => {
    let alive = true;
    codeToHtml(code, { lang, theme: "github-dark", colorReplacements: { "#0d1117": "transparent" } })
      .then((h) => {
        if (alive) setHtml(h);
      })
      .catch(() => {
        if (alive) setHtml(`<pre>${code.replace(/</g, "&lt;")}</pre>`);
      })
      .finally(() => continueRender(handle));
    return () => {
      alive = false;
    };
  }, [code, lang, handle]);

  return (
    <div
      style={{
        opacity: entrance(frame, 0, 18),
        background: theme.bgElevated,
        border: `1px solid ${theme.text}1A`,
        borderRadius: 18,
        padding: "32px 40px",
        fontSize: 30,
        lineHeight: 1.5,
        fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
        maxWidth: "82%",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      }}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
};
