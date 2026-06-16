/**
 * surfaces.tsx — UI surface primitives: feeds, cards, forms, overlays.
 * Primitives: feed, calendar, profile-card, notification-toast, pricing-tiers,
 *             product-card, settings-list, tabs, modal, form, step-wizard, comparison
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance, riseY, pop } from "../lib/timing.js";
import { Icon } from "../icons/icon.js";
import type { PrimitiveProps } from "./panels.js";

function ease(frame: number, start: number, dur: number): number {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

// ---------------------------------------------------------------------------
// Feed — list of items with title + optional meta
// ---------------------------------------------------------------------------

/** Activity / news feed — items slide in with a stagger. */
export const Feed: React.FC<
  PrimitiveProps & { items?: Array<{ title: string; meta?: string }> }
> = ({ theme, delay = 0, items = [] }) => {
  const frame = useCurrentFrame();
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {safeItems.map((item, i) => {
        const lo = ease(frame, delay + i * 6, 14);
        return (
          <div
            key={i}
            style={{
              ...glassSurface(theme, 0.4),
              borderRadius: theme.radius,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: lo,
              transform: `translateX(${(1 - lo) * -18}px)`,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: hexA(theme.accent, 0.16),
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="Activity" size={20} color={theme.accent} animate={false} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: theme.text, fontSize: 20, fontWeight: 600 }}>{item.title}</div>
              {item.meta ? (
                <div style={{ color: theme.textDim, fontSize: 16, marginTop: 2 }}>{item.meta}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calendar — monthly grid with optional highlight dots
// ---------------------------------------------------------------------------

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/** Monthly calendar grid with optional highlighted days. */
export const Calendar: React.FC<
  PrimitiveProps & { month?: number; highlights?: number[] }
> = ({ theme, delay = 0, month = 1, highlights = [] }) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 16);
  const safeMonth = Math.max(1, Math.min(12, month ?? 1));
  const safeHighlights = Array.isArray(highlights) ? highlights : [];
  // Use a fixed year for determinism
  const year = 2025;
  const firstDay = new Date(year, safeMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, safeMonth, 0).getDate();
  // Adjust so week starts Monday
  const offset = (firstDay + 6) % 7;
  const cells: Array<number | null> = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      style={{
        ...glassSurface(theme, 0.45),
        borderRadius: theme.radius,
        padding: "22px 24px",
        width: "100%",
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
      }}
    >
      {/* Month header */}
      <div style={{ color: theme.text, fontSize: 22, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
        {MONTHS[safeMonth - 1]} {year}
      </div>
      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", color: theme.textDim, fontSize: 16, fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>
      {/* Date cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          const isHighlight = day !== null && safeHighlights.includes(day);
          const cellDelay = delay + 8 + i * 1.2;
          const co = ease(frame, cellDelay, 8);
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "8px 0",
                borderRadius: 8,
                background: isHighlight ? hexA(theme.accent, 0.2) : "transparent",
                color: day === null ? "transparent" : isHighlight ? theme.accent : theme.text,
                fontSize: 18,
                fontWeight: isHighlight ? 700 : 400,
                opacity: day === null ? 0 : co,
              }}
            >
              {day ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ProfileCard — avatar placeholder + name/role + stat chips
// ---------------------------------------------------------------------------

/** User / team member profile card. */
export const ProfileCard: React.FC<
  PrimitiveProps & {
    name?: string;
    role?: string;
    stats?: Array<{ label: string; value: string | number }>;
  }
> = ({ theme, delay = 0, name = "User", role, stats = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  const safeStats = Array.isArray(stats) ? stats : [];
  return (
    <div
      style={{
        ...glassSurface(theme, 0.5),
        borderRadius: theme.radius + 4,
        padding: "30px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity: s,
        transform: `scale(${0.92 + s * 0.08})`,
        width: 280,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2 ?? theme.accent})`,
          display: "grid",
          placeItems: "center",
          boxShadow: `0 0 0 4px ${hexA(theme.accent, 0.2)}`,
        }}
      >
        <Icon name="User" size={40} color={theme.bg} animate={false} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: theme.text, fontSize: 24, fontWeight: 700 }}>{name}</div>
        {role ? <div style={{ color: theme.textDim, fontSize: 18, marginTop: 4 }}>{role}</div> : null}
      </div>
      {safeStats.length > 0 ? (
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          {safeStats.map((st, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: theme.text, fontSize: 22, fontWeight: 800 }}>{st.value}</div>
              <div style={{ color: theme.textDim, fontSize: 15 }}>{st.label}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// NotificationToast — slide-in toast banner
// ---------------------------------------------------------------------------

/** Notification toast that slides in from above. */
export const NotificationToast: React.FC<
  PrimitiveProps & { title?: string; body?: string; icon?: string }
> = ({ theme, delay = 0, title = "Notification", body, icon = "Bell" }) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  return (
    <div
      style={{
        ...glassSurface(theme, 0.7),
        borderRadius: theme.radius,
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        maxWidth: 420,
        opacity: t,
        transform: `translateY(${(1 - t) * -20}px) scale(${0.97 + t * 0.03})`,
        borderLeft: `3px solid ${theme.accent}`,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: hexA(theme.accent, 0.16),
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon ?? "Bell"} size={20} color={theme.accent} animate={false} />
      </div>
      <div>
        <div style={{ color: theme.text, fontSize: 19, fontWeight: 700 }}>{title}</div>
        {body ? <div style={{ color: theme.textDim, fontSize: 16, marginTop: 4 }}>{body}</div> : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PricingTiers — 2-3 column pricing cards
// ---------------------------------------------------------------------------

/** Pricing tier cards with feature lists. */
export const PricingTiers: React.FC<
  PrimitiveProps & {
    tiers?: Array<{ name: string; price: string; features: string[] }>;
  }
> = ({ theme, delay = 0, tiers = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safeTiers = Array.isArray(tiers) ? tiers : [];
  if (safeTiers.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
      {safeTiers.map((tier, i) => {
        const s = pop(frame, fps, delay + i * 6);
        const isMiddle = i === Math.floor(safeTiers.length / 2);
        return (
          <div
            key={i}
            style={{
              ...glassSurface(theme, isMiddle ? 0.6 : 0.4),
              borderRadius: theme.radius,
              padding: "26px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
              opacity: s,
              transform: `scale(${0.92 + s * 0.08}) translateY(${isMiddle ? -8 : 0}px)`,
              border: isMiddle ? `1px solid ${hexA(theme.accent, 0.4)}` : undefined,
            }}
          >
            <div style={{ color: theme.textDim, fontSize: 17, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
              {tier.name}
            </div>
            <div style={{ color: theme.text, fontSize: 38, fontWeight: 800 }}>{tier.price}</div>
            <div style={{ height: 1, background: hexA(theme.text, 0.08) }} />
            {(Array.isArray(tier.features) ? tier.features : []).map((f, j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="Check" size={16} color={theme.accent} animate={false} />
                <span style={{ color: theme.textDim, fontSize: 17 }}>{f}</span>
              </div>
            ))}
            {isMiddle ? (
              <div
                style={{
                  marginTop: "auto",
                  background: theme.accent,
                  color: theme.bg,
                  borderRadius: 999,
                  padding: "10px 0",
                  textAlign: "center",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Get started
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ProductCard — e-commerce style
// ---------------------------------------------------------------------------

/** E-commerce product card with image placeholder, title, price, optional tag. */
export const ProductCard: React.FC<
  PrimitiveProps & { title?: string; price?: string; tag?: string }
> = ({ theme, delay = 0, title = "Product", price, tag }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  return (
    <div
      style={{
        ...glassSurface(theme, 0.45),
        borderRadius: theme.radius,
        overflow: "hidden",
        width: 260,
        opacity: s,
        transform: `scale(${0.92 + s * 0.08})`,
      }}
    >
      {/* Image placeholder */}
      <div
        style={{
          height: 180,
          background: `linear-gradient(135deg, ${hexA(theme.accent, 0.2)}, ${hexA(theme.accent2 ?? theme.accent, 0.1)})`,
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        <Icon name="Package" size={56} color={hexA(theme.accent, 0.5)} animate={false} />
        {tag ? (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: theme.accent,
              color: theme.bg,
              fontSize: 13,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {tag}
          </div>
        ) : null}
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ color: theme.text, fontSize: 20, fontWeight: 700 }}>{title}</div>
        {price ? (
          <div style={{ color: theme.accent, fontSize: 24, fontWeight: 800, marginTop: 6 }}>{price}</div>
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SettingsList — toggle-style settings rows
// ---------------------------------------------------------------------------

/** Settings list with label + toggle per row. */
export const SettingsList: React.FC<
  PrimitiveProps & { items?: Array<{ label: string; on?: boolean }> }
> = ({ theme, delay = 0, items = [] }) => {
  const frame = useCurrentFrame();
  const safeItems = Array.isArray(items) ? items : [];
  if (safeItems.length === 0) return null;
  return (
    <div
      style={{
        ...glassSurface(theme, 0.45),
        borderRadius: theme.radius,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {safeItems.map((item, i) => {
        const lo = ease(frame, delay + i * 5, 12);
        const on = item.on !== false;
        const p = ease(frame, delay + i * 5 + 6, 14);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 22px",
              borderBottom: i < safeItems.length - 1 ? `1px solid ${hexA(theme.text, 0.06)}` : undefined,
              opacity: lo,
              transform: `translateX(${(1 - lo) * -12}px)`,
            }}
          >
            <span style={{ flex: 1, color: theme.text, fontSize: 20 }}>{item.label}</span>
            {/* Toggle */}
            <div
              style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                background: on ? hexA(theme.accent, 0.3 + 0.35 * p) : hexA(theme.text, 0.1),
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: on ? 4 + p * 20 : 4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: on ? theme.accent : theme.textDim,
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
// Tabs — tab bar with active indicator
// ---------------------------------------------------------------------------

/** Tab bar — active tab gets accent underline. */
export const Tabs: React.FC<PrimitiveProps & { tabs?: string[]; active?: number }> = ({
  theme,
  delay = 0,
  tabs = [],
  active = 0,
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 14);
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  if (safeTabs.length === 0) return null;
  const safeActive = Math.max(0, Math.min(active ?? 0, safeTabs.length - 1));
  return (
    <div
      style={{
        display: "flex",
        borderBottom: `1px solid ${hexA(theme.text, 0.1)}`,
        gap: 0,
        opacity: t,
      }}
    >
      {safeTabs.map((tab, i) => {
        const isActive = i === safeActive;
        const lo = ease(frame, delay + i * 4, 12);
        return (
          <div
            key={i}
            style={{
              padding: "12px 24px",
              color: isActive ? theme.text : theme.textDim,
              fontSize: 20,
              fontWeight: isActive ? 700 : 500,
              borderBottom: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
              opacity: lo,
              transform: `translateY(${(1 - lo) * 8}px)`,
              cursor: "default",
            }}
          >
            {tab}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Modal — centered dialog overlay
// ---------------------------------------------------------------------------

/** Centered modal dialog with title and body. */
export const Modal: React.FC<PrimitiveProps & { title?: string; body?: string }> = ({
  theme,
  delay = 0,
  title = "Dialog",
  body,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  const backdropT = ease(frame, delay, 10);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0,0,0,${0.45 * backdropT})`,
          borderRadius: theme.radius,
        }}
      />
      {/* Dialog */}
      <div
        style={{
          ...glassSurface(theme, 0.7),
          borderRadius: theme.radius + 4,
          padding: "32px 36px",
          width: 480,
          position: "relative",
          opacity: s,
          transform: `scale(${0.88 + s * 0.12})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ color: theme.text, fontSize: 24, fontWeight: 700 }}>{title}</span>
          <Icon name="X" size={22} color={theme.textDim} animate={false} />
        </div>
        {body ? <div style={{ color: theme.textDim, fontSize: 19, lineHeight: 1.5 }}>{body}</div> : null}
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <div style={{ padding: "10px 22px", borderRadius: 999, border: `1px solid ${hexA(theme.text, 0.18)}`, color: theme.textDim, fontSize: 18 }}>
            Cancel
          </div>
          <div style={{ padding: "10px 22px", borderRadius: 999, background: theme.accent, color: theme.bg, fontSize: 18, fontWeight: 700 }}>
            Confirm
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Form — labelled input fields + submit button
// ---------------------------------------------------------------------------

/** Form with labelled input fields + submit button. */
export const Form: React.FC<
  PrimitiveProps & { fields?: string[]; submitLabel?: string }
> = ({ theme, delay = 0, fields = [], submitLabel = "Submit" }) => {
  const frame = useCurrentFrame();
  const safeFields = Array.isArray(fields) ? fields : [];
  const t = entrance(frame, delay, 14);
  if (safeFields.length === 0) return null;
  return (
    <div
      style={{
        ...glassSurface(theme, 0.45),
        borderRadius: theme.radius,
        padding: "28px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        opacity: t,
        transform: `translateY(${riseY(frame, delay)}px)`,
        width: "100%",
      }}
    >
      {safeFields.map((field, i) => {
        const lo = ease(frame, delay + 4 + i * 6, 12);
        return (
          <div key={i} style={{ opacity: lo, transform: `translateY(${(1 - lo) * 10}px)` }}>
            <div style={{ color: theme.textDim, fontSize: 16, marginBottom: 6 }}>{field}</div>
            <div
              style={{
                height: 44,
                borderRadius: 10,
                background: hexA(theme.text, 0.06),
                border: `1px solid ${hexA(theme.text, 0.12)}`,
              }}
            />
          </div>
        );
      })}
      <div
        style={{
          marginTop: 4,
          background: theme.accent,
          color: theme.bg,
          borderRadius: 999,
          padding: "13px 0",
          textAlign: "center",
          fontSize: 19,
          fontWeight: 700,
          opacity: ease(frame, delay + 4 + safeFields.length * 6, 12),
        }}
      >
        {submitLabel}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// StepWizard — horizontal stepped progress indicator
// ---------------------------------------------------------------------------

/** Horizontal step wizard — shows active step with accent highlight. */
export const StepWizard: React.FC<PrimitiveProps & { steps?: string[]; active?: number }> = ({
  theme,
  delay = 0,
  steps = [],
  active = 0,
}) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 16);
  const safeSteps = Array.isArray(steps) ? steps : [];
  if (safeSteps.length === 0) return null;
  const safeActive = Math.max(0, Math.min(active ?? 0, safeSteps.length - 1));
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", opacity: t }}>
      {safeSteps.map((step, i) => {
        const isDone = i < safeActive;
        const isActive = i === safeActive;
        const lo = ease(frame, delay + i * 5, 12);
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: lo }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: isDone
                    ? theme.accent
                    : isActive
                    ? hexA(theme.accent, 0.2)
                    : hexA(theme.text, 0.08),
                  border: isActive ? `2px solid ${theme.accent}` : "none",
                }}
              >
                {isDone ? (
                  <Icon name="Check" size={18} color={theme.bg} animate={false} />
                ) : (
                  <span style={{ color: isActive ? theme.accent : theme.textDim, fontSize: 16, fontWeight: 700 }}>
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  color: isActive ? theme.text : theme.textDim,
                  fontSize: 16,
                  fontWeight: isActive ? 700 : 400,
                  textAlign: "center",
                  maxWidth: 80,
                }}
              >
                {step}
              </span>
            </div>
            {i < safeSteps.length - 1 ? (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginBottom: 24,
                  background: i < safeActive ? theme.accent : hexA(theme.text, 0.1),
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Comparison — before/after two-panel split
// ---------------------------------------------------------------------------

/** Before/after comparison — two side-by-side labeled panels. */
export const Comparison: React.FC<PrimitiveProps & { before?: string; after?: string }> = ({
  theme,
  delay = 0,
  before = "Before",
  after = "After",
}) => {
  const frame = useCurrentFrame();
  const leftT = ease(frame, delay, 16);
  const rightT = ease(frame, delay + 10, 16);
  return (
    <div style={{ display: "flex", gap: 16, width: "100%", height: "100%" }}>
      {/* Before */}
      <div
        style={{
          ...glassSurface(theme, 0.4),
          flex: 1,
          borderRadius: theme.radius,
          padding: "24px 26px",
          opacity: leftT,
          transform: `translateX(${(1 - leftT) * -20}px)`,
          borderTop: `3px solid ${hexA("#f87171", 0.6)}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Icon name="X" size={18} color="#f87171" animate={false} />
          <span style={{ color: "#f87171", fontSize: 17, fontWeight: 700 }}>Before</span>
        </div>
        <div style={{ color: theme.textDim, fontSize: 20, lineHeight: 1.5 }}>{before}</div>
      </div>
      {/* After */}
      <div
        style={{
          ...glassSurface(theme, 0.5),
          flex: 1,
          borderRadius: theme.radius,
          padding: "24px 26px",
          opacity: rightT,
          transform: `translateX(${(1 - rightT) * 20}px)`,
          borderTop: `3px solid ${hexA(theme.accent, 0.7)}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Icon name="Check" size={18} color={theme.accent} animate={false} />
          <span style={{ color: theme.accent, fontSize: 17, fontWeight: 700 }}>After</span>
        </div>
        <div style={{ color: theme.text, fontSize: 20, lineHeight: 1.5 }}>{after}</div>
      </div>
    </div>
  );
};
