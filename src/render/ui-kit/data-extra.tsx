/**
 * data-extra.tsx — additional data-visualisation primitives.
 * Primitives: world-map, sparkline, metric-grid, gauge, leaderboard, heatmap
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA, seriesColor } from "../theme.js";
import { entrance, riseY, pop } from "../lib/timing.js";
import { useVideoConfig } from "remotion";
import type { PrimitiveProps } from "./panels.js";

function ease(frame: number, start: number, dur: number): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

// ---------------------------------------------------------------------------
// WorldMap — stylised dotted grid with a few pulsing accent points
// ---------------------------------------------------------------------------

/** Simplified Mercator approximation for well-known city coordinates. */
const CITY_COORDS: Array<[number, number]> = [
  [51.5, -0.1],   // London
  [40.7, -74.0],  // New York
  [35.7, 139.7],  // Tokyo
  [37.8, -122.4], // San Francisco
  [-33.9, 151.2], // Sydney
  [48.9, 2.3],    // Paris
  [1.3, 103.8],   // Singapore
  [55.8, 37.6],   // Moscow
];

function mercator(lat: number, lon: number, w: number, h: number): [number, number] {
  const x = ((lon + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad / 2 + Math.PI / 4)) / Math.PI) / 2) * h;
  return [x, y];
}

/** Dotted world map with pulsing city markers. */
export const WorldMap: React.FC<PrimitiveProps & { points?: number }> = ({
  theme,
  delay = 0,
  points = 4,
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 18);
  const W = 760, H = 380;
  const safePoints = Math.min(Math.max(0, points ?? 4), CITY_COORDS.length);
  const selectedCities = CITY_COORDS.slice(0, safePoints);

  // Generate dot grid (land approximation using a simple sine mask)
  const dots: Array<[number, number]> = [];
  const cols = 76, rows = 38;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = 85 - (r / rows) * 170;
      const lon = -180 + (c / cols) * 360;
      // Very rough land mask: skip deep ocean bands
      const y = r / rows;
      // Exclude obvious ocean only — keep it simple so it looks like a world
      if (y > 0.75 && (lon < -60 || lon > 60)) continue; // southern ocean
      if (y < 0.08) continue; // arctic blank
      dots.push([c * (W / cols) + 5, r * (H / rows) + 5]);
    }
  }

  const pulseA = 0.3 + 0.4 * Math.abs(Math.sin((frame / 24) * Math.PI));

  return (
    <div style={{ opacity: t, transform: `scale(${0.97 + t * 0.03})` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2} fill={hexA(theme.text, 0.14)} />
        ))}
        {selectedCities.map(([lat, lon], i) => {
          const [cx, cy] = mercator(lat, lon, W, H);
          const a = ease(frame, delay + 12 + i * 6, 12);
          return (
            <g key={i} opacity={a}>
              <circle cx={cx} cy={cy} r={12} fill={hexA(theme.accent, 0.12)} stroke={theme.accent} strokeWidth={1.5} opacity={pulseA} />
              <circle cx={cx} cy={cy} r={5} fill={theme.accent} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sparkline — tiny inline line chart
// ---------------------------------------------------------------------------

/** Compact sparkline for embedding inside dashboards. */
export const Sparkline: React.FC<PrimitiveProps & { values?: number[]; width?: number; height?: number }> = ({
  theme,
  delay = 0,
  values = [],
  width = 240,
  height = 60,
}) => {
  const frame = useCurrentFrame();
  if (!Array.isArray(values) || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - ((v - min) / range) * height,
  ]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const draw = ease(frame, delay, 28);
  const len = 600;
  const trend = values[values.length - 1] >= values[0];
  const color = trend ? "#4ade80" : "#f87171";
  return (
    <svg width={width} height={height}>
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      {pts.length > 0 ? (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={4} fill={color} opacity={draw} />
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// MetricGrid — grid of label+value tiles
// ---------------------------------------------------------------------------

/** Grid of KPI tiles — compact multi-metric overview. */
export const MetricGrid: React.FC<
  PrimitiveProps & { metrics?: Array<{ label: string; value: string | number }> }
> = ({ theme, delay = 0, metrics = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  if (safeMetrics.length === 0) return null;
  const cols = Math.min(safeMetrics.length, 4);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14, width: "100%" }}>
      {safeMetrics.map((m, i) => {
        const s = pop(frame, fps, delay + i * 4);
        const c = seriesColor(theme, i); // each tile a different ramp color
        return (
          <div
            key={i}
            style={{
              ...glassSurface(theme, 0.4),
              borderRadius: theme.radius,
              borderTop: `3px solid ${c}`,
              padding: "18px 20px",
              opacity: s,
              transform: `scale(${0.9 + s * 0.1})`,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ color: theme.textDim, fontSize: 16 }}>{m.label}</span>
            <span style={{ color: c, fontSize: 34, fontWeight: 800 }}>{m.value}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gauge — radial arc gauge
// ---------------------------------------------------------------------------

/** Half-circle gauge that fills to a percentage. */
export const Gauge: React.FC<PrimitiveProps & { percent?: number; label?: string }> = ({
  theme,
  delay = 0,
  percent = 0,
  label,
}) => {
  const frame = useCurrentFrame();
  const prog = ease(frame, delay, 30);
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  const r = 90, cx = 110, cy = 110;
  // Arc from 180° to 0° (half circle on top)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweep = (prog * pct / 100) * Math.PI;
  const angle = startAngle - sweep;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(angle);
  const y2 = cy + r * Math.sin(angle);
  const largeArc = sweep > Math.PI ? 1 : 0;
  const arcD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  const trackD = `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  const displayed = Math.round(prog * pct);
  return (
    <svg width={220} height={130} viewBox="0 0 220 130">
      <defs>
        <linearGradient id="gauge-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={seriesColor(theme, 1)} />
          <stop offset="100%" stopColor={seriesColor(theme, 0)} />
        </linearGradient>
      </defs>
      <path d={trackD} fill="none" stroke={hexA(theme.text, 0.1)} strokeWidth={16} strokeLinecap="round" />
      {sweep > 0 ? (
        <path d={arcD} fill="none" stroke="url(#gauge-g)" strokeWidth={16} strokeLinecap="round" />
      ) : null}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={theme.text} fontSize="42" fontWeight="800">{displayed}%</text>
      {label ? <text x={cx} y={cy + 18} textAnchor="middle" fill={theme.textDim} fontSize="16">{label}</text> : null}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Leaderboard — ranked list with animated bars
// ---------------------------------------------------------------------------

/** Ranked list with relative bars — scores, rankings, any ordered data. */
export const Leaderboard: React.FC<
  PrimitiveProps & { rows?: Array<{ name: string; value: string | number }> }
> = ({ theme, delay = 0, rows = [] }) => {
  const frame = useCurrentFrame();
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) return null;
  const numericValues = safeRows.map((r) => (typeof r.value === "number" ? r.value : 0));
  const maxVal = Math.max(...numericValues, 1);
  return (
    <div
      style={{
        ...glassSurface(theme, 0.45),
        borderRadius: theme.radius,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {safeRows.map((row, i) => {
        const lo = ease(frame, delay + i * 6, 14);
        const barPct = typeof row.value === "number" ? (row.value / maxVal) * 100 * lo : 0;
        const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
        const rankColor = i < 3 ? medals[i] : theme.textDim;
        const barColor = seriesColor(theme, i); // bars cycle the multi-hue ramp
        return (
          <div key={i} style={{ opacity: lo, transform: `translateX(${(1 - lo) * -16}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <span style={{ color: rankColor, fontSize: 18, fontWeight: 800, width: 26 }}>
                {i + 1}
              </span>
              <span style={{ color: theme.text, fontSize: 20, flex: 1 }}>{row.name}</span>
              <span style={{ color: barColor, fontSize: 20, fontWeight: 700 }}>{row.value}</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: hexA(theme.text, 0.08) }}>
              <div
                style={{
                  height: "100%",
                  width: `${barPct}%`,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${barColor}, ${hexA(barColor, 0.5)})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Heatmap — GitHub-contribution-style grid
// ---------------------------------------------------------------------------

/** Contribution heatmap grid — weeks × 7 days. */
export const Heatmap: React.FC<PrimitiveProps & { weeks?: number }> = ({
  theme,
  delay = 0,
  weeks = 26,
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 18);
  const safeWeeks = Math.max(1, Math.min(weeks ?? 26, 52));
  const days = 7;
  // Deterministic pseudo-random fill
  const cellSize = 18, gap = 4;
  const cells: Array<{ col: number; row: number; intensity: number }> = [];
  for (let w = 0; w < safeWeeks; w++) {
    for (let d = 0; d < days; d++) {
      const seed = (w * 7 + d) * 2654435761;
      const intensity = ((seed >>> 0) % 5) / 4; // 0..1 in 5 steps
      cells.push({ col: w, row: d, intensity });
    }
  }
  const totalWidth = safeWeeks * (cellSize + gap);
  const totalHeight = days * (cellSize + gap);
  return (
    <div style={{ opacity: t }}>
      <svg width={totalWidth} height={totalHeight}>
        {cells.map(({ col, row, intensity }, idx) => {
          const cellDelay = delay + (col * days + row) * 0.8;
          const co = ease(frame, cellDelay, 6);
          return (
            <rect
              key={idx}
              x={col * (cellSize + gap)}
              y={row * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={intensity === 0 ? hexA(theme.text, 0.07) : hexA(theme.accent, 0.15 + intensity * 0.7)}
              opacity={co}
            />
          );
        })}
      </svg>
    </div>
  );
};
