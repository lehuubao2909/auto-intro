/**
 * Canonical UI-kit primitive names (plain strings, no React) — single source so the
 * storyboard schema (enum), the validator, and the render registry all agree.
 * The render-side `ui-kit/index.ts` registry MUST key off exactly these.
 */
export const PRIMITIVE_NAMES = [
  // --- original 16 ---
  "panel",
  "card",
  "bento-grid",
  "stat-tile",
  "bar-chart",
  "line-chart",
  "donut-chart",
  "sidebar-nav",
  "table",
  "kanban-column",
  "chat-bubble",
  "input-field",
  "button",
  "toggle",
  "terminal",
  "progress-steps",
  // --- frames (2) ---
  "mobile-frame",
  "browser-window",
  // --- dev (6) ---
  "code-snippet",
  "api-exchange",
  "log-stream",
  "file-tree",
  "code-diff",
  "command-palette",
  // --- data-extra (6) ---
  "world-map",
  "sparkline",
  "metric-grid",
  "gauge",
  "leaderboard",
  "heatmap",
  // --- surfaces (12) ---
  "feed",
  "calendar",
  "profile-card",
  "notification-toast",
  "pricing-tiers",
  "product-card",
  "settings-list",
  "tabs",
  "modal",
  "form",
  "step-wizard",
  "comparison",
  // --- layout templates (10) — compositional/editorial, motion-aware ---
  "split-hero",
  "stacked-timeline",
  "metric-banner",
  "quote-card",
  "before-after",
  "device-mockup-trio",
  "tab-switcher",
  "map-pins",
  "code-to-ui",
  "feature-spotlight",
] as const;

export type PrimitiveName = (typeof PRIMITIVE_NAMES)[number];
