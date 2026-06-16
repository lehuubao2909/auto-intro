import React from "react";
import type { Theme } from "../theme.js";

/** Soft browser chrome so a screenshot/clip reads as "product", not a stray image. */
export const BrowserFrame: React.FC<{
  theme: Theme;
  url?: string;
  children: React.ReactNode;
}> = ({ theme, url = "localhost:3000", children }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 20,
        overflow: "hidden",
        background: theme.bgElevated,
        boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
        border: `1px solid ${theme.text}1A`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 22px",
          background: theme.bg,
          borderBottom: `1px solid ${theme.text}14`,
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
        ))}
        <div
          style={{
            marginLeft: 16,
            flex: 1,
            height: 30,
            borderRadius: 8,
            background: theme.bgElevated,
            color: theme.textDim,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  );
};
