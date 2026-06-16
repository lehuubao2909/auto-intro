import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA, seriesColor } from "../theme.js";
import { entrance, pop } from "../lib/timing.js";
import type { PrimitiveProps } from "./panels.js";

const ease = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

/** KPI tile — label + count-up value + optional delta. */
export const StatTile: React.FC<PrimitiveProps & { label: string; value: number | string; suffix?: string; delta?: string }> = ({
  theme,
  delay = 0,
  label = "",
  value = 0,
  suffix = "",
  delta,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  const isNum = typeof value === "number";
  const shown = isNum ? Math.round((value as number) * Math.min(1, ease(frame, delay, 24))) : value;
  return (
    <div style={{ ...glassSurface(theme, 0.4), borderRadius: theme.radius, padding: 24, opacity: s, transform: `scale(${0.92 + s * 0.08})`, display: "flex", flexDirection: "column", gap: 8, height: "100%", justifyContent: "center" }}>
      <span style={{ color: theme.textDim, fontSize: 18 }}>{label}</span>
      <span style={{ color: theme.text, fontSize: 52, fontWeight: 800 }}>{shown}{suffix}</span>
      {delta ? <span style={{ color: theme.accent2, fontSize: 18, fontWeight: 600 }}>{delta}</span> : null}
    </div>
  );
};

/** Bar chart — bars grow up with a stagger. */
export const BarChart: React.FC<PrimitiveProps & { values?: number[]; height?: number }> = ({ theme, delay = 0, values = [], height = 200 }) => {
  const frame = useCurrentFrame();
  if (!Array.isArray(values) || values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height }}>
      {values.map((v, i) => {
        const g = ease(frame, delay + i * 4, 20);
        const c = seriesColor(theme, i); // bars cycle the multi-hue ramp
        return (
          <div key={i} style={{ flex: 1, height: `${(v / max) * 100 * g}%`, minHeight: 4, borderRadius: 8,
            background: `linear-gradient(180deg, ${c}, ${hexA(c, 0.4)})` }} />
        );
      })}
    </div>
  );
};

/** Line chart — path draws in (stroke-dashoffset) + area fill fades. */
export const LineChart: React.FC<PrimitiveProps & { values?: number[]; width?: number; height?: number }> = ({ theme, delay = 0, values = [], width = 420, height = 200 }) => {
  const frame = useCurrentFrame();
  if (!Array.isArray(values) || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - (v / max) * height]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const len = 1200;
  const draw = ease(frame, delay, 36);
  return (
    <svg width={width} height={height}>
      <defs>
        {/* horizontal multi-hue stroke gradient (accent → ramp) */}
        <linearGradient id="lc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={seriesColor(theme, 0)} />
          <stop offset="50%" stopColor={seriesColor(theme, 2)} />
          <stop offset="100%" stopColor={seriesColor(theme, 4)} />
        </linearGradient>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(seriesColor(theme, 2), 0.35)} />
          <stop offset="100%" stopColor={hexA(theme.accent, 0)} />
        </linearGradient>
      </defs>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill="url(#lc)" opacity={draw} />
      <path d={d} fill="none" stroke="url(#lc-stroke)" strokeWidth={3.5} strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </svg>
  );
};

/** Donut — arc fills to a percentage with the value in the middle. */
export const DonutChart: React.FC<PrimitiveProps & { percent?: number; label?: string }> = ({ theme, delay = 0, percent = 0, label }) => {
  const frame = useCurrentFrame();
  const r = 80, c = 2 * Math.PI * r;
  const prog = ease(frame, delay, 30); // 0..1 animation
  const fraction = prog * (percent / 100); // portion of the ring to fill
  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="donut-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={seriesColor(theme, 0)} />
          <stop offset="100%" stopColor={seriesColor(theme, 3)} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r={r} fill="none" stroke={hexA(theme.text, 0.1)} strokeWidth={18} />
      <circle cx="100" cy="100" r={r} fill="none" stroke="url(#donut-g)" strokeWidth={18} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - fraction)} transform="rotate(-90 100 100)" />
      <text x="100" y="96" textAnchor="middle" fill={theme.text} fontSize="42" fontWeight="800">{Math.round(prog * percent)}%</text>
      {label ? <text x="100" y="124" textAnchor="middle" fill={theme.textDim} fontSize="16">{label}</text> : null}
    </svg>
  );
};
