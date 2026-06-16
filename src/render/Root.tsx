import React from "react";
import { Composition } from "remotion";
import { Trailer } from "./Trailer.js";
import { Showcase } from "./test/showcase.js";
import type { Storyboard } from "../shared/storyboard-schema.js";

/** Minimal default so Remotion Studio renders something without inputProps. */
const DEFAULT_STORYBOARD: Storyboard = {
  meta: {
    title: "AutoIntro",
    fps: 30,
    width: 1920,
    height: 1080,
    theme: "cinematic-dark",
    accent: "#41A3EF",
    accent2: "#FCCE50",
    totalSeconds: 50,
    media: {},
  },
  scenes: [
    { type: "title", durationInFrames: 75, text: "AutoIntro", sub: "repo → code trailer" },
    { type: "techstack", durationInFrames: 80, items: [{ name: "Remotion" }, { name: "TypeScript" }, { name: "Gemini" }] },
    { type: "outro", durationInFrames: 90, text: "AutoIntro", cta: "npx auto-intro" },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition id="Showcase" component={Showcase} fps={30} width={1920} height={1080} durationInFrames={120} />
    <Composition
      id="Trailer"
      component={Trailer}
      defaultProps={{ storyboard: DEFAULT_STORYBOARD }}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={245}
      calculateMetadata={({ props }) => {
        const sb = props.storyboard;
        const total = sb.scenes.reduce((a, s) => a + s.durationInFrames, 0);
        return {
          durationInFrames: Math.max(1, total),
          fps: sb.meta.fps,
          width: sb.meta.width,
          height: sb.meta.height,
        };
      }}
    />
    </>
  );
};
