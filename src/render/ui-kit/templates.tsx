import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA, TYPE, seriesColor } from "../theme.js";
import { entrance, riseY, pop } from "../lib/timing.js";
import { stagger, composeEnter, countUp } from "../lib/motion.js";
import { Icon } from "../icons/icon.js";

/**
 * Layout-TEMPLATE primitives (v4) — compositional/editorial surfaces that vary the story
 * shape beyond bento + sequence. SELF-CONTAINED on purpose (they render their own
 * representative UI rather than nesting registry primitives) to avoid a circular import
 * with `ui-kit/index.ts`. All motion-aware (stagger / composeEnter / parallax-ish) and
 * prop-guarded (coerce arrays/strings) so bad Director props never throw.
 */

export interface TemplateProps {
  theme: Theme;
  delay?: number;
}

// --- prop guards -----------------------------------------------------------
function arr<T = unknown>(v: unknown, fb: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fb;
}
const str = (v: unknown, fb = ""): string => (typeof v === "string" ? v : v == null ? fb : String(v));
const num = (v: unknown): number | null => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

/** A faint placeholder line (used inside mock panels). */
const Bar: React.FC<{ theme: Theme; w: string | number; on?: number; frame: number; delay: number }> = ({ theme, w, on = 0.14, frame, delay }) => (
  <div style={{ height: 12, width: w, borderRadius: 6, background: hexA(theme.text, on), opacity: entrance(frame, delay) }} />
);

// --- 1. split-hero ---------------------------------------------------------
export const SplitHero: React.FC<TemplateProps & { title?: string; body?: string; bullets?: string[] }> = ({ theme, delay = 0, title, body, bullets }) => {
  const frame = useCurrentFrame();
  const items = arr<string>(bullets).slice(0, 4);
  return (
    <div style={{ display: "flex", gap: 44, width: "100%", height: "100%", alignItems: "center" }}>
      <div style={{ flex: 1, ...composeEnter(frame, { start: delay, slideX: -44, riseY: 0 }) }}>
        <div style={{ fontSize: TYPE.h1, fontWeight: 800, color: theme.text, letterSpacing: -1, lineHeight: 1.04 }}>{str(title, "Build faster")}</div>
        {body ? <div style={{ marginTop: 16, fontSize: TYPE.body, color: theme.textDim, lineHeight: 1.4, maxWidth: 540 }}>{str(body)}</div> : null}
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, ...composeEnter(frame, { start: delay + stagger(i, 10, 4), riseY: 14 }) }}>
              <Icon name="Check" size={22} color={theme.accent} animate={false} />
              <span style={{ color: theme.text, fontSize: 24 }}>{str(b)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, ...composeEnter(frame, { start: delay + 6, slideX: 44, riseY: 0 }) }}>
        <div style={{ ...glassSurface(theme), borderRadius: theme.radius + 6, height: 360, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ height: 14, width: "48%", borderRadius: 7, background: hexA(theme.accent, 0.85) }} />
          {[0, 1, 2, 3].map((i) => <Bar key={i} theme={theme} w={`${88 - i * 12}%`} frame={frame} delay={delay + 12 + i * 4} />)}
          <div style={{ marginTop: "auto", display: "flex", gap: 12 }}>
            <div style={{ flex: 1, height: 72, borderRadius: 12, background: hexA(theme.accent, 0.18) }} />
            <div style={{ flex: 1, height: 72, borderRadius: 12, background: hexA(theme.accent2, 0.18) }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. stacked-timeline ---------------------------------------------------
export const StackedTimeline: React.FC<TemplateProps & { steps?: Array<{ title?: string; body?: string }> }> = ({ theme, delay = 0, steps }) => {
  const frame = useCurrentFrame();
  const items = arr<{ title?: string; body?: string }>(steps).slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%", maxWidth: 760, margin: "0 auto" }}>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", ...composeEnter(frame, { start: delay + stagger(i, 6, 6), slideX: -30 }) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: hexA(theme.accent, 0.9), color: theme.bg, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{i + 1}</div>
            {i < items.length - 1 ? <div style={{ width: 2, flex: 1, minHeight: 30, background: hexA(theme.text, 0.18), marginTop: 4 }} /> : null}
          </div>
          <div style={{ ...glassSurface(theme, 0.4), borderRadius: theme.radius, padding: "16px 20px", flex: 1 }}>
            <div style={{ color: theme.text, fontSize: 26, fontWeight: 700 }}>{str(s?.title, `Step ${i + 1}`)}</div>
            {s?.body ? <div style={{ color: theme.textDim, fontSize: 19, marginTop: 4 }}>{str(s.body)}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 3. metric-banner ------------------------------------------------------
export const MetricBanner: React.FC<TemplateProps & { metrics?: Array<{ label?: string; value?: string | number; suffix?: string }> }> = ({ theme, delay = 0, metrics }) => {
  const frame = useCurrentFrame();
  const items = arr<{ label?: string; value?: string | number; suffix?: string }>(metrics).slice(0, 4);
  return (
    <div style={{ display: "flex", gap: 28, width: "100%", justifyContent: "center", alignItems: "stretch" }}>
      {items.map((m, i) => {
        const n = num(m?.value);
        const shown = n != null ? `${countUp(frame, n, delay + stagger(i, 4, 5), 28)}${str(m?.suffix)}` : str(m?.value, "—");
        return (
          <div key={i} style={{ ...glassSurface(theme), borderRadius: theme.radius + 4, padding: "28px 32px", textAlign: "center", flex: 1, maxWidth: 320, ...composeEnter(frame, { start: delay + stagger(i, 4, 5), riseY: 26 }) }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: seriesColor(theme, i), letterSpacing: -2 }}>{shown}</div>
            <div style={{ fontSize: 22, color: theme.textDim, marginTop: 6 }}>{str(m?.label)}</div>
          </div>
        );
      })}
    </div>
  );
};

// --- 4. quote-card ---------------------------------------------------------
export const QuoteCard: React.FC<TemplateProps & { quote?: string; author?: string; role?: string }> = ({ theme, delay = 0, quote, author, role }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...glassSurface(theme), borderRadius: theme.radius + 8, padding: 48, maxWidth: 900, margin: "0 auto", ...composeEnter(frame, { start: delay, riseY: 30 }) }}>
      <div style={{ fontSize: 96, lineHeight: 0.6, color: hexA(theme.accent, 0.6), fontWeight: 900, height: 48 }}>&ldquo;</div>
      <div style={{ fontSize: TYPE.h2, color: theme.text, lineHeight: 1.35, fontWeight: 600 }}>{str(quote, "It just works.")}</div>
      <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14, opacity: entrance(frame, delay + 12) }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: hexA(theme.accent, 0.85) }} />
        <div>
          <div style={{ color: theme.text, fontSize: 22, fontWeight: 700 }}>{str(author, "Happy user")}</div>
          {role ? <div style={{ color: theme.textDim, fontSize: 18 }}>{str(role)}</div> : null}
        </div>
      </div>
    </div>
  );
};

// --- 5. before-after (wipe reveal) -----------------------------------------
export const BeforeAfter: React.FC<TemplateProps & { before?: string; after?: string; label?: string }> = ({ theme, delay = 0, before, after, label }) => {
  const frame = useCurrentFrame();
  const split = 30 + entrance(frame, delay + 8, 40) * 45; // wipe 30%→75%
  const Half: React.FC<{ text: string; bg: string; fg: string; tag: string; align: "left" | "right" }> = ({ text, bg, fg, tag, align }) => (
    <div style={{ flex: 1, background: bg, padding: 28, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: align === "left" ? "flex-start" : "flex-end" }}>
      <div style={{ fontSize: 16, letterSpacing: 2, color: fg, opacity: 0.7, textTransform: "uppercase" }}>{tag}</div>
      <div style={{ fontSize: TYPE.h2, fontWeight: 800, color: fg }}>{text}</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 980, height: 360, margin: "0 auto", borderRadius: theme.radius + 6, overflow: "hidden", display: "flex", ...composeEnter(frame, { start: delay, riseY: 24 }) }}>
      <Half text={str(before, "Before")} bg={hexA(theme.text, 0.08)} fg={theme.textDim} tag="before" align="left" />
      <Half text={str(after, "After")} bg={hexA(theme.accent, 0.2)} fg={theme.text} tag="after" align="right" />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${split}%`, width: 3, background: theme.accent, boxShadow: `0 0 18px ${hexA(theme.accent, 0.8)}` }} />
      {label ? <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", color: theme.textDim, fontSize: 18 }}>{str(label)}</div> : null}
    </div>
  );
};

// --- 6. device-mockup-trio (parallax depths) -------------------------------
export const DeviceMockupTrio: React.FC<TemplateProps & { screens?: string[] }> = ({ theme, delay = 0, screens }) => {
  const frame = useCurrentFrame();
  const labels = arr<string>(screens, ["Home", "Detail", "Profile"]).slice(0, 3);
  const depths = [26, 0, 26]; // outer phones sit lower → center pops forward
  return (
    <div style={{ display: "flex", gap: 28, justifyContent: "center", alignItems: "center", height: "100%" }}>
      {labels.map((lbl, i) => {
        const ent = composeEnter(frame, { start: delay + stagger(i, 4, 6), riseY: 20 + depths[i % 3] });
        return (
          <div key={i} style={{ ...ent, transform: `${ent.transform} scale(${i === 1 ? 1.08 : 0.96})` }}>
            <div style={{ ...glassSurface(theme), width: 200, height: 400, borderRadius: 30, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ height: 26, borderRadius: 8, background: hexA(theme.accent, 0.75) }} />
              {[0, 1, 2, 3, 4].map((k) => <Bar key={k} theme={theme} w={`${90 - (k % 3) * 18}%`} frame={frame} delay={delay + 10 + i * 4 + k * 2} />)}
              <div style={{ marginTop: "auto", textAlign: "center", color: theme.textDim, fontSize: 16 }}>{str(lbl)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- 7. tab-switcher -------------------------------------------------------
export const TabSwitcher: React.FC<TemplateProps & { tabs?: string[]; active?: number }> = ({ theme, delay = 0, tabs, active }) => {
  const frame = useCurrentFrame();
  const labels = arr<string>(tabs, ["Overview", "Activity", "Settings"]).slice(0, 4);
  const act = Math.max(0, Math.min(labels.length - 1, num(active) ?? 0));
  return (
    <div style={{ ...glassSurface(theme), borderRadius: theme.radius + 6, padding: 24, width: "100%", maxWidth: 860, margin: "0 auto", ...composeEnter(frame, { start: delay, riseY: 26 }) }}>
      <div style={{ display: "flex", gap: 10, borderBottom: `1px solid ${hexA(theme.text, 0.12)}`, paddingBottom: 14 }}>
        {labels.map((t, i) => (
          <div key={i} style={{ padding: "8px 18px", borderRadius: 999, fontSize: 20, fontWeight: 600, color: i === act ? theme.bg : theme.textDim, background: i === act ? theme.accent : "transparent", opacity: entrance(frame, delay + stagger(i, 4, 3)) }}>{str(t)}</div>
        ))}
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => <Bar key={i} theme={theme} w={`${92 - i * 14}%`} on={0.16} frame={frame} delay={delay + 14 + i * 4} />)}
      </div>
    </div>
  );
};

// --- 8. map-pins -----------------------------------------------------------
export const MapPins: React.FC<TemplateProps & { points?: Array<{ x?: number; y?: number; label?: string }> }> = ({ theme, delay = 0, points }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pts = arr<{ x?: number; y?: number; label?: string }>(points, [
    { x: 22, y: 40 }, { x: 48, y: 30 }, { x: 70, y: 55 }, { x: 84, y: 38 }, { x: 36, y: 66 },
  ]).slice(0, 8);
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 960, height: 420, margin: "0 auto", borderRadius: theme.radius + 6, overflow: "hidden", background: hexA(theme.text, 0.05), ...composeEnter(frame, { start: delay, riseY: 22 }) }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${hexA(theme.text, 0.16)} 1.5px, transparent 1.5px)`, backgroundSize: "26px 26px", opacity: 0.7 }} />
      {pts.map((p, i) => {
        const t = pop(frame, fps, delay + stagger(i, 6, 5));
        const x = Math.max(2, Math.min(98, num(p?.x) ?? 50));
        const y = Math.max(2, Math.min(98, num(p?.y) ?? 50));
        return (
          <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-100%) scale(${t})` }}>
            <div style={{ width: 18, height: 18, borderRadius: "50% 50% 50% 0", background: seriesColor(theme, i), transform: "rotate(-45deg)", boxShadow: `0 0 14px ${hexA(seriesColor(theme, i), 0.8)}` }} />
          </div>
        );
      })}
    </div>
  );
};

// --- 9. code-to-ui ---------------------------------------------------------
export const CodeToUi: React.FC<TemplateProps & { code?: string; lang?: string; result?: string }> = ({ theme, delay = 0, code, result }) => {
  const frame = useCurrentFrame();
  const lines = str(code, "import { run } from \"app\";\nrun();").split("\n").slice(0, 8);
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center", width: "100%", maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ flex: 1, ...glassSurface(theme), borderRadius: theme.radius + 4, padding: 22, fontFamily: "monospace", ...composeEnter(frame, { start: delay, slideX: -36 }) }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: "flex", gap: 14, fontSize: 19, lineHeight: 1.6, opacity: entrance(frame, delay + stagger(i, 6, 3)) }}>
            <span style={{ color: hexA(theme.text, 0.35), width: 18, textAlign: "right" }}>{i + 1}</span>
            <span style={{ color: i === 0 ? theme.accent2 : theme.text, whiteSpace: "pre" }}>{ln}</span>
          </div>
        ))}
      </div>
      <Icon name="ArrowRight" size={40} color={theme.accent} animate={false} />
      <div style={{ flex: 1, ...glassSurface(theme), borderRadius: theme.radius + 4, padding: 24, minHeight: 220, display: "flex", flexDirection: "column", gap: 14, ...composeEnter(frame, { start: delay + 10, slideX: 36 }) }}>
        <div style={{ height: 16, width: "45%", borderRadius: 8, background: hexA(theme.accent, 0.85) }} />
        {[0, 1, 2].map((i) => <Bar key={i} theme={theme} w={`${85 - i * 16}%`} on={0.16} frame={frame} delay={delay + 18 + i * 4} />)}
        <div style={{ marginTop: "auto", color: theme.textDim, fontSize: 18 }}>{str(result, "✓ Result rendered")}</div>
      </div>
    </div>
  );
};

// --- 10. feature-spotlight (center node + orbiting labels) ------------------
export const FeatureSpotlight: React.FC<TemplateProps & { title?: string; labels?: string[] }> = ({ theme, delay = 0, title, labels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = arr<string>(labels, ["Fast", "Secure", "Simple", "Scalable"]).slice(0, 6);
  const s = pop(frame, fps, delay);
  const R = 200;
  return (
    <div style={{ position: "relative", width: 620, height: 460, margin: "0 auto" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${s})`, width: 200, height: 200, borderRadius: "50%", background: hexA(theme.accent, 0.18), border: `2px solid ${hexA(theme.accent, 0.6)}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 18 }}>
        <span style={{ color: theme.text, fontSize: 28, fontWeight: 800 }}>{str(title, "Core")}</span>
      </div>
      {items.map((lbl, i) => {
        const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
        const t = entrance(frame, delay + stagger(i, 10, 5), 16);
        const x = Math.cos(a) * R * t;
        const y = Math.sin(a) * R * t;
        return (
          <div key={i} style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, opacity: t }}>
            <div style={{ ...glassSurface(theme, 0.5), borderRadius: 999, padding: "10px 20px", color: theme.text, fontSize: 20, fontWeight: 600, whiteSpace: "nowrap" }}>{str(lbl)}</div>
          </div>
        );
      })}
    </div>
  );
};
