/**
 * UI-kit registry — maps a primitive NAME (string the Director references) to its
 * React component. P3 scene renderers + P6 Director both use these names; the
 * validator checks Director output against `PRIMITIVE_NAMES`.
 */
import React from "react";
import { Panel, Card, BentoGrid, PanelHeader } from "./panels.js";
import { StatTile, BarChart, LineChart, DonutChart } from "./data-viz.js";
import { SidebarNav, Table, KanbanColumn } from "./chrome.js";
import { ChatBubble, InputField, Button, Toggle } from "./interaction.js";
import { Terminal, ProgressSteps } from "./flow.js";
import { MobileFrame, BrowserWindow } from "./frames.js";
import { CodeSnippet, ApiExchange, LogStream, FileTree, CodeDiff, CommandPalette } from "./dev.js";
import { WorldMap, Sparkline, MetricGrid, Gauge, Leaderboard, Heatmap } from "./data-extra.js";
import { Feed, Calendar, ProfileCard, NotificationToast, PricingTiers, ProductCard, SettingsList, Tabs, Modal, Form, StepWizard, Comparison } from "./surfaces.js";
import { PRIMITIVE_NAMES, type PrimitiveName } from "../../shared/primitive-names.js";

// Director-facing primitives (keys MUST match shared PRIMITIVE_NAMES). `panel-header`
// is an internal helper, intentionally not exposed here.
export const UI_KIT: Record<PrimitiveName, React.ComponentType<any>> = {
  // --- original ---
  panel: Panel,
  card: Card,
  "bento-grid": BentoGrid,
  "stat-tile": StatTile,
  "bar-chart": BarChart,
  "line-chart": LineChart,
  "donut-chart": DonutChart,
  "sidebar-nav": SidebarNav,
  table: Table,
  "kanban-column": KanbanColumn,
  "chat-bubble": ChatBubble,
  "input-field": InputField,
  button: Button,
  toggle: Toggle,
  terminal: Terminal,
  "progress-steps": ProgressSteps,
  // --- frames ---
  "mobile-frame": MobileFrame,
  "browser-window": BrowserWindow,
  // --- dev ---
  "code-snippet": CodeSnippet,
  "api-exchange": ApiExchange,
  "log-stream": LogStream,
  "file-tree": FileTree,
  "code-diff": CodeDiff,
  "command-palette": CommandPalette,
  // --- data-extra ---
  "world-map": WorldMap,
  sparkline: Sparkline,
  "metric-grid": MetricGrid,
  gauge: Gauge,
  leaderboard: Leaderboard,
  heatmap: Heatmap,
  // --- surfaces ---
  feed: Feed,
  calendar: Calendar,
  "profile-card": ProfileCard,
  "notification-toast": NotificationToast,
  "pricing-tiers": PricingTiers,
  "product-card": ProductCard,
  "settings-list": SettingsList,
  tabs: Tabs,
  modal: Modal,
  form: Form,
  "step-wizard": StepWizard,
  comparison: Comparison,
};

export { PRIMITIVE_NAMES };
export type { PrimitiveName };
export {
  Panel, Card, BentoGrid, PanelHeader,
  StatTile, BarChart, LineChart, DonutChart,
  SidebarNav, Table, KanbanColumn,
  ChatBubble, InputField, Button, Toggle,
  Terminal, ProgressSteps,
  MobileFrame, BrowserWindow,
  CodeSnippet, ApiExchange, LogStream, FileTree, CodeDiff, CommandPalette,
  WorldMap, Sparkline, MetricGrid, Gauge, Leaderboard, Heatmap,
  Feed, Calendar, ProfileCard, NotificationToast, PricingTiers, ProductCard,
  SettingsList, Tabs, Modal, Form, StepWizard, Comparison,
};
