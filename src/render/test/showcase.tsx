import React from "react";
import { AbsoluteFill } from "remotion";
import { themeFromProfile } from "../theme.js";
import { SceneBackground } from "../background/scene-background.js";
import { BentoGrid } from "../ui-kit/panels.js";
import { CodeSnippet, ApiExchange, LogStream } from "../ui-kit/dev.js";
import { Gauge, MetricGrid, Sparkline } from "../ui-kit/data-extra.js";
import { PricingTiers, Feed, NotificationToast } from "../ui-kit/surfaces.js";
import { BrowserWindow } from "../ui-kit/frames.js";
import type { DesignProfile } from "../../shared/types.js";

/** v3 sampler — verify a representative mix of the new primitives render well. */
const PROFILE: DesignProfile = {
  mode: "dark", glass: true, radius: 16, font: "Inter",
  palette: { bg: "#0a0f1e", surface: "#161f38", text: "#eef2fb", dim: "#93a0b8", accent: "#6ea8fe", accent2: "#c084fc" },
};

export const Showcase: React.FC = () => {
  const theme = themeFromProfile(PROFILE);
  return (
    <AbsoluteFill style={{ fontFamily: theme.fontFamily }}>
      <SceneBackground theme={theme} intensity={0.7} />
      <AbsoluteFill style={{ padding: "4%" }}>
        <BentoGrid theme={theme} cols={3}>
          <CodeSnippet theme={theme} delay={2} lang="ts" caption="install the SDK" code={`import { track } from "trackly";\n\ntrack("pageview", {\n  path: location.pathname,\n});`} />
          <ApiExchange theme={theme} delay={4} method="GET" endpoint="/v1/stats" response={`{ "visitors": 12480, "live": 38 }`} />
          <Gauge theme={theme} delay={6} percent={88} label="UI coverage" />
          <MetricGrid theme={theme} delay={8} metrics={[{ label: "Visitors", value: "12.4k" }, { label: "Live", value: 38 }, { label: "Bounce", value: "21%" }, { label: "Avg", value: "2m" }]} />
          <PricingTiers theme={theme} delay={10} tiers={[{ name: "Free", price: "$0", features: ["1 site", "7-day data"] }, { name: "Pro", price: "$19", features: ["Unlimited", "1-yr data", "API"] }]} />
          <Feed theme={theme} delay={12} items={[{ title: "New visitor from Hanoi", meta: "2s ago" }, { title: "Goal: signup reached", meta: "1m ago" }, { title: "Spike on /pricing", meta: "5m ago" }]} />
        </BentoGrid>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
