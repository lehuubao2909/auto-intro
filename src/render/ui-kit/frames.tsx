/**
 * frames.tsx — device/browser chrome wrappers.
 * Primitives: mobile-frame, browser-window
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Theme } from "../theme.js";
import { glassSurface, hexA } from "../theme.js";
import { entrance, riseY } from "../lib/timing.js";
import type { PrimitiveProps } from "./panels.js";

/** Phone chrome wrapping content. children renders inside the screen area. */
export const MobileFrame: React.FC<
  PrimitiveProps & { title?: string; children?: React.ReactNode }
> = ({ theme, delay = 0, title = "App", children }) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 16);
  return (
    <div
      style={{
        opacity: t,
        transform: `translateY(${riseY(frame, delay, 16, 28)}px) scale(${0.97 + t * 0.03})`,
        display: "inline-flex",
        flexDirection: "column",
        width: 340,
        height: 680,
        borderRadius: 48,
        border: `3px solid ${hexA(theme.text, 0.18)}`,
        background: theme.bg,
        overflow: "hidden",
        boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          height: 48,
          background: hexA(theme.text, 0.04),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${hexA(theme.text, 0.08)}`,
          flexShrink: 0,
        }}
      >
        {/* notch pill */}
        <div
          style={{
            width: 90,
            height: 22,
            borderRadius: 999,
            background: hexA(theme.text, 0.14),
          }}
        />
      </div>
      {/* Nav bar */}
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderBottom: `1px solid ${hexA(theme.text, 0.06)}`,
        }}
      >
        <span style={{ color: theme.text, fontSize: 16, fontWeight: 700 }}>{title}</span>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>{children}</div>
      {/* Home indicator */}
      <div
        style={{
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 100, height: 5, borderRadius: 999, background: hexA(theme.text, 0.2) }} />
      </div>
    </div>
  );
};

/** Browser chrome wrapping content. children renders inside the viewport. */
export const BrowserWindow: React.FC<
  PrimitiveProps & { url?: string; children?: React.ReactNode }
> = ({ theme, delay = 0, url = "https://app.example.com", children }) => {
  const frame = useCurrentFrame();
  const t = entrance(frame, delay, 16);
  return (
    <div
      style={{
        ...glassSurface(theme, 0.6),
        opacity: t,
        transform: `translateY(${riseY(frame, delay, 16, 26)}px) scale(${0.98 + t * 0.02})`,
        borderRadius: theme.radius + 4,
        overflow: "hidden",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 18px",
          background: hexA(theme.text, 0.04),
          borderBottom: `1px solid ${hexA(theme.text, 0.08)}`,
          flexShrink: 0,
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c, flexShrink: 0 }} />
        ))}
        {/* Address bar */}
        <div
          style={{
            flex: 1,
            height: 30,
            borderRadius: 999,
            background: hexA(theme.text, 0.08),
            display: "flex",
            alignItems: "center",
            paddingLeft: 14,
            marginLeft: 10,
          }}
        >
          <span style={{ color: theme.textDim, fontSize: 14, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {url}
          </span>
        </div>
      </div>
      {/* Viewport */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", height: "calc(100% - 52px)" }}>
        {children}
      </div>
    </div>
  );
};
