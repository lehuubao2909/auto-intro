# Phase 2 — Animated UI primitive library (THE CORE WIN)

**Priority:** P0 (de-risk) · **Status:** pending · **Depends:** P1

## Overview
The reusable set of **vector UI components** that recreate a product's surface, themed + animated.
After this phase a great-looking recreated-UI video exists from a hand storyboard — regardless of analysis.

## Key insights
- Pure CSS/SVG, theme-driven (P1), glassmorphism. NO images. Build-in animation baked into each.
- Animations: container slide/scale-in, children stagger, skeleton→content, SVG stroke-draw (charts/lines),
  count-up numbers, typing for text fields/chat. All from `useCurrentFrame` (deterministic).
- Each primitive takes simple data props (labels, values, items) so the Director fills real content.

## Requirements — ~14 primitives (cap scope)
`Panel` (glass frame), `SidebarNav` (icon+label items, active state), `StatTile` (label+value count-up),
`BarChart`, `LineChart`, `DonutChart` (SVG draw/grow), `Card` (title+body+icon), `ChatBubble`
(user/AI, typing), `InputField` (typing + cursor), `Button`, `Toggle`, `Table` (rows stagger),
`KanbanColumn` (cards drop in), `BentoGrid` (tile container that lays children in a grid + staggers).
Each: theme-aware, `animateIn` from a start frame, sized for 1080p.

## Related files
- Create: `src/render/ui-kit/*.tsx` (one file per primitive or small groups), `src/render/ui-kit/index.ts`
  (registry: name → component, for the Director to reference by string).
- Reuse: theme + icons + SceneBackground from P1. Repurpose `KenBurnsImg`/`BrowserFrame` only if useful (likely drop).

## Implementation steps
1. Build `Panel` + `BentoGrid` (layout backbone) first.
2. Data-display set: StatTile, BarChart, LineChart, DonutChart (SVG stroke-draw + grow).
3. App-chrome set: SidebarNav, Card, Table, KanbanColumn.
4. Interaction set: ChatBubble (typing), InputField (typing+cursor), Button, Toggle.
5. A `ui-kit/index.ts` registry mapping primitive name → component (+ prop schema notes).
6. Render a hand "kitchen-sink" composition (a bento dashboard + chat + chart) → verify polish + render time.

## Todo
- [ ] Panel + BentoGrid
- [ ] StatTile, BarChart, LineChart, DonutChart (SVG draw)
- [ ] SidebarNav, Card, Table, KanbanColumn
- [ ] ChatBubble, InputField, Button, Toggle
- [ ] ui-kit registry (name → component)
- [ ] Kitchen-sink render + perf check

## Success criteria
- Hand composition renders a NeuraFlow-quality glass dashboard + chat + animated charts.
- All primitives theme-swap correctly (dark/light, accent change).
- Render time + disk acceptable (note caps if needed).

## Risks
- Scope creep (too many primitives) → hard cap at ~14; add more post-v1.
- SVG chart animation fiddly → use stroke-dasharray/offset + interpolate; keep data small.
