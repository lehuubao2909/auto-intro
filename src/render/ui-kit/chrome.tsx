import React from "react";
import { useCurrentFrame } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance, riseY } from "../lib/timing.js";
import { Icon } from "../icons/icon.js";
import type { PrimitiveProps } from "./panels.js";

/** App sidebar — icon+label items, one active (accent) state, staggered in. */
export const SidebarNav: React.FC<PrimitiveProps & { items?: Array<{ icon: string; label: string }>; active?: number }> = ({
  theme,
  delay = 0,
  items = [],
  active = 0,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...glassSurface(theme, 0.5), borderRadius: theme.radius, padding: 16, width: 240, height: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => {
        const t = entrance(frame, delay + i * 4, 12);
        const on = i === active;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
            background: on ? hexA(theme.accent, 0.16) : "transparent", opacity: t, transform: `translateX(${(1 - t) * -16}px)` }}>
            <Icon name={it.icon} size={22} color={on ? theme.accent : theme.textDim} animate={false} />
            <span style={{ color: on ? theme.text : theme.textDim, fontSize: 19, fontWeight: on ? 700 : 500 }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Table — header + rows that stagger in. */
export const Table: React.FC<PrimitiveProps & { columns?: string[]; rows?: string[][] }> = ({ theme, delay = 0, columns = [], rows = [] }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, padding: "0 12px 12px", borderBottom: `1px solid ${hexA(theme.text, 0.1)}` }}>
        {columns.map((c) => <span key={c} style={{ color: theme.textDim, fontSize: 17, fontWeight: 600 }}>{c}</span>)}
      </div>
      {rows.map((r, i) => {
        const t = entrance(frame, delay + i * 5, 12);
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, padding: "14px 12px", opacity: t, transform: `translateY(${riseY(frame, delay + i * 5, 12, 14)}px)`, borderBottom: `1px solid ${hexA(theme.text, 0.05)}` }}>
            {r.map((cell, j) => <span key={j} style={{ color: theme.text, fontSize: 18 }}>{cell}</span>)}
          </div>
        );
      })}
    </div>
  );
};

/** Kanban column — cards drop in sequentially. */
export const KanbanColumn: React.FC<PrimitiveProps & { title?: string; cards?: string[] }> = ({ theme, delay = 0, title = "", cards = [] }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...glassSurface(theme, 0.4), borderRadius: theme.radius, padding: 16, width: 260, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ color: theme.textDim, fontSize: 17, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
      {cards.map((c, i) => {
        const t = entrance(frame, delay + i * 6, 12);
        return (
          <div key={i} style={{ background: hexA(theme.text, 0.06), borderRadius: 10, padding: 14, color: theme.text, fontSize: 18,
            opacity: t, transform: `translateY(${riseY(frame, delay + i * 6, 12, 18)}px)`, borderLeft: `3px solid ${theme.accent}` }}>{c}</div>
        );
      })}
    </div>
  );
};
