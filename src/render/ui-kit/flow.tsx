import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance } from "../lib/timing.js";
import { Icon } from "../icons/icon.js";
import type { PrimitiveProps } from "./panels.js";

/** Reveal text char-by-char (typing) from a start frame. */
function typed(text: string, frame: number, start: number, cps: number, fps: number): string {
  return text.slice(0, Math.max(0, Math.floor((frame - start) * (cps / fps))));
}

/**
 * Terminal window — the hero beat for CLI / dev tools. Types a command after a `$`
 * prompt, then streams output lines. Tells "here's how you run it".
 */
export const Terminal: React.FC<PrimitiveProps & { command?: string; output?: string[]; title?: string }> = ({
  theme,
  delay = 0,
  command = "",
  output = [],
  title = "zsh",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = entrance(frame, delay, 14);
  const cmdShown = typed(command, frame, delay + 6, 22, fps);
  const cmdDone = cmdShown.length >= command.length;
  const cursorOn = Math.floor(frame / 14) % 2 === 0;
  const afterCmd = delay + 6 + (command.length / 22) * fps + 8;

  return (
    <div
      style={{
        ...glassSurface(theme, 0.6),
        width: "100%",
        maxWidth: 880,
        borderRadius: theme.radius + 2,
        overflow: "hidden",
        opacity: t,
        transform: `translateY(${(1 - t) * 24}px) scale(${0.98 + t * 0.02})`,
        fontFamily: '"JetBrains Mono","SF Mono",Menlo,monospace',
      }}
    >
      <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: hexA(theme.text, 0.04), borderBottom: `1px solid ${hexA(theme.text, 0.08)}` }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ marginLeft: 12, color: theme.textDim, fontSize: 15 }}>{title}</span>
      </div>
      <div style={{ padding: "24px 26px", fontSize: 24, lineHeight: 1.6 }}>
        <div>
          <span style={{ color: theme.accent }}>$ </span>
          <span style={{ color: theme.text }}>{cmdShown}</span>
          {!cmdDone ? <span style={{ opacity: cursorOn ? 1 : 0, color: theme.accent }}>▋</span> : null}
        </div>
        {cmdDone
          ? output.map((line, i) => {
              const o = entrance(frame, afterCmd + i * 6, 8);
              const isOk = /✓|done|ready|success/i.test(line);
              return (
                <div key={i} style={{ opacity: o, color: isOk ? "#4ade80" : theme.textDim, marginTop: 4 }}>
                  {line}
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
};

/**
 * Progress steps — the "what runs" beat. Stages complete one-by-one over the scene
 * (check → done, spinner → active, dim → pending). Narrates the product's process.
 */
export const ProgressSteps: React.FC<PrimitiveProps & { steps?: string[]; title?: string }> = ({
  theme,
  delay = 0,
  steps = [],
  title,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (steps.length === 0) return null;
  // spread completion across most of the scene
  const span = Math.max(1, durationInFrames - delay - 20);
  const per = span / steps.length;
  const spin = (frame * 8) % 360;

  return (
    <div style={{ ...glassSurface(theme, 0.5), borderRadius: theme.radius + 2, padding: 30, width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
      {title ? <div style={{ color: theme.textDim, fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{title}</div> : null}
      {steps.map((s, i) => {
        const startF = delay + i * per;
        const appear = entrance(frame, startF, 8);
        const done = frame > startF + per * 0.8;
        const active = frame >= startF && !done;
        const color = done ? "#4ade80" : active ? theme.accent : theme.textDim;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.4 + appear * 0.6 }}>
            <div style={{ width: 28, height: 28, display: "grid", placeItems: "center" }}>
              {done ? (
                <Icon name="Check" size={24} color="#4ade80" animate={false} />
              ) : active ? (
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: `3px solid ${hexA(theme.accent, 0.25)}`, borderTopColor: theme.accent, transform: `rotate(${spin}deg)` }} />
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${hexA(theme.text, 0.2)}` }} />
              )}
            </div>
            <span style={{ color: done || active ? theme.text : theme.textDim, fontSize: 24, fontWeight: active ? 700 : 500 }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
};
