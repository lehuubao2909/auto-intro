import React from "react";

/**
 * Render-phase error boundary: if a child throws while rendering (e.g. a primitive
 * fed malformed LLM props), render `fallback` (default: nothing) instead of letting
 * the throw abort the ENTIRE Remotion render. Used at both scene and element level.
 */
export class RenderBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
