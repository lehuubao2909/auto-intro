import React from "react";

/**
 * Per-scene index context. Trailer.tsx wraps each <Series.Sequence> child in
 * <SceneProvider value={i}>; SceneBackground reads it to rotate a hue shift and a
 * background treatment so consecutive scenes look distinct (not the same bg every time).
 */
const SceneIndexContext = React.createContext<number>(0);

export const SceneProvider: React.FC<{ value: number; children: React.ReactNode }> = ({
  value,
  children,
}) => <SceneIndexContext.Provider value={value}>{children}</SceneIndexContext.Provider>;

/** Current scene index (0 when not inside a provider, e.g. standalone Showcase). */
export function useSceneIndex(): number {
  return React.useContext(SceneIndexContext);
}
