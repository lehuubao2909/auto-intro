import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as simpleIcons from "simple-icons";
import { pop } from "../lib/timing.js";

/**
 * Tech-stack brand logo via simple-icons (real SVG path + brand hex). Used in the
 * techstack beat. Name examples: "Next.js", "React", "TypeScript", "Tailwind CSS".
 * Falls back to a text chip when no brand match.
 */

type SimpleIcon = { title: string; slug: string; hex: string; path: string };

function findIcon(name: string): SimpleIcon | null {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const all = Object.values(simpleIcons as Record<string, unknown>).filter(
    (v): v is SimpleIcon => !!v && typeof v === "object" && "path" in (v as object) && "title" in (v as object),
  );
  return (
    all.find((i) => i.title.toLowerCase().replace(/[^a-z0-9]/g, "") === norm) ??
    all.find((i) => i.slug === norm) ??
    null
  );
}

export const TechIcon: React.FC<{ name: string; size?: number; color?: string; delay?: number }> = ({
  name,
  size = 56,
  color,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, delay);
  const icon = findIcon(name);
  if (!icon) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${s})`, opacity: s }}>
      <path d={icon.path} fill={color ?? `#${icon.hex}`} />
    </svg>
  );
};

/** True if a brand logo exists for this name (Director/renderer can decide chip vs logo). */
export function hasTechIcon(name: string): boolean {
  return findIcon(name) !== null;
}
