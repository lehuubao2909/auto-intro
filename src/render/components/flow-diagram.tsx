import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme.js";
import { pop, entrance } from "../lib/timing.js";
import type { Flow } from "../lib/parse-mermaid.js";

/**
 * Left-to-right architecture diagram that builds node-by-node. Deterministic,
 * no mermaid.js/puppeteer needed. Linear chain layout (good enough for one mechanism).
 */
export const FlowDiagram: React.FC<{ flow: Flow; theme: Theme }> = ({ flow, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = flow.nodes.slice(0, 6); // keep it one clear mechanism
  const perNode = 10;

  // Size responsively so 4-6 nodes fit on ONE row (no wrap, no dangling connector).
  const many = nodes.length > 4;
  const fontSize = many ? 26 : 32;
  const pad = many ? "16px 22px" : "26px 34px";
  const nodeMax = many ? 230 : 320;
  const arrowW = many ? 34 : 60;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap", maxWidth: "94%" }}>
      {nodes.map((n, i) => {
        const s = pop(frame, fps, 6 + i * perNode);
        const arrowProg = entrance(frame, 6 + i * perNode + 4, 8);
        return (
          <React.Fragment key={n.id}>
            {i > 0 ? (
              <div
                style={{
                  width: arrowW,
                  flexShrink: 0,
                  height: 4,
                  borderRadius: 2,
                  background: theme.accent,
                  opacity: arrowProg,
                  transform: `scaleX(${arrowProg})`,
                  transformOrigin: "left center",
                }}
              />
            ) : null}
            <div
              style={{
                transform: `scale(${s})`,
                opacity: s,
                padding: pad,
                borderRadius: 18,
                background: theme.bgElevated,
                border: `2px solid ${i === 0 ? theme.accent2 : theme.accent}`,
                color: theme.text,
                fontSize,
                fontWeight: 600,
                textAlign: "center",
                maxWidth: nodeMax,
              }}
            >
              {n.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
