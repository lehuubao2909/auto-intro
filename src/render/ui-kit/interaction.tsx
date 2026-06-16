import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance, pop } from "../lib/timing.js";
import { Icon } from "../icons/icon.js";
import type { PrimitiveProps } from "./panels.js";

/** Reveal text character-by-character (typing) based on frame. */
function typed(text: string, frame: number, start: number, cps = 28, fps = 30): string {
  const chars = Math.floor(Math.max(0, frame - start) * (cps / fps));
  return text.slice(0, chars);
}

/** Chat bubble — user or AI, optional typing reveal + optional bullet list. */
export const ChatBubble: React.FC<PrimitiveProps & { from?: "user" | "ai"; text?: string; bullets?: string[]; typing?: boolean }> = ({
  theme,
  delay = 0,
  from = "ai",
  text = "",
  bullets,
  typing = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = entrance(frame, delay, 12);
  const ai = from === "ai";
  const shown = typing ? typed(text, frame, delay + 6, 30, fps) : text;
  return (
    <div style={{ display: "flex", justifyContent: ai ? "flex-start" : "flex-end", opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
      <div style={{ display: "flex", gap: 12, maxWidth: "78%", flexDirection: ai ? "row" : "row-reverse" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: ai ? hexA(theme.accent, 0.2) : hexA(theme.text, 0.12), display: "grid", placeItems: "center" }}>
          <Icon name={ai ? "Sparkles" : "User"} size={22} color={ai ? theme.accent : theme.textDim} animate={false} />
        </div>
        <div style={{ ...glassSurface(theme, ai ? 0.5 : 0.3), borderRadius: 16, padding: "16px 20px", color: theme.text, fontSize: 21, lineHeight: 1.45 }}>
          {shown}
          {bullets ? (
            <ul style={{ margin: "10px 0 0", paddingLeft: 20, color: theme.textDim, fontSize: 19 }}>
              {bullets.map((b, i) => {
                const bt = entrance(frame, delay + 18 + i * 6, 10);
                return <li key={i} style={{ opacity: bt, marginBottom: 4 }}>{b}</li>;
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/** Input field — slides in, types a query, blinking cursor. */
export const InputField: React.FC<PrimitiveProps & { placeholder?: string; query?: string }> = ({ theme, delay = 0, placeholder = "Search…", query }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = entrance(frame, delay, 12);
  const text = query ? typed(query, frame, delay + 8, 24, fps) : "";
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{ ...glassSurface(theme, 0.4), borderRadius: 999, padding: "16px 22px", display: "flex", alignItems: "center", gap: 12, opacity: t, transform: `scale(${0.96 + t * 0.04})` }}>
      <Icon name="Search" size={22} color={theme.textDim} animate={false} />
      <span style={{ color: text ? theme.text : theme.textDim, fontSize: 21 }}>
        {text || placeholder}{query ? <span style={{ opacity: cursorOn ? 1 : 0, color: theme.accent }}>|</span> : null}
      </span>
    </div>
  );
};

/** Pill button. */
export const Button: React.FC<PrimitiveProps & { label: string; variant?: "solid" | "ghost"; icon?: string }> = ({ theme, delay = 0, label, variant = "solid", icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  const solid = variant === "solid";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 26px", borderRadius: 999, transform: `scale(${s})`, opacity: s,
      background: solid ? theme.accent : "transparent", border: solid ? "none" : `1px solid ${hexA(theme.text, 0.2)}`,
      color: solid ? theme.bg : theme.text, fontSize: 20, fontWeight: 700 }}>
      {icon ? <Icon name={icon} size={20} color={solid ? theme.bg : theme.text} animate={false} /> : null}
      {label}
    </div>
  );
};

/** Toggle switch — animates on. */
export const Toggle: React.FC<PrimitiveProps & { on?: boolean; label?: string }> = ({ theme, delay = 0, on = true, label }) => {
  const frame = useCurrentFrame();
  const p = interpolate(entrance(frame, delay + 6, 14), [0, 1], [0, on ? 1 : 0]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 56, height: 32, borderRadius: 999, background: on ? hexA(theme.accent, 0.3 + 0.4 * p) : hexA(theme.text, 0.12), position: "relative", transition: "none" }}>
        <div style={{ position: "absolute", top: 4, left: 4 + p * 24, width: 24, height: 24, borderRadius: "50%", background: on ? theme.accent : theme.textDim }} />
      </div>
      {label ? <span style={{ color: theme.text, fontSize: 19 }}>{label}</span> : null}
    </div>
  );
};
