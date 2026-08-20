"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type ShinyTextProps = {
  text: string;
  className?: string;
  /**
   * Duration of one full sheen sweep, in seconds. Lower = faster sweep.
   * @default 6
   */
  duration?: number;
  /** Hex color of the sheen stripe. Defaults to a cool white glow. */
  sheen?: string;
  /** Text color used when reduced motion is on (so it stays legible). */
  fallbackColor?: string;
};

/**
 * ShinyText — a shimmering sheen sweep across the letters, inspired by React
 * Bits' ShinyText. Works best on a darker/colored surface where the moving
 * light reads clearly. Renders as transparent + `background-clip: text` so the
 * stripe is the only visible ink. Respects reduced motion by rendering a
 * legible solid fallback instead of an invisible clipped layer.
 */
export function ShinyText({
  text,
  className,
  duration = 6,
  sheen = "#ffffff",
  fallbackColor = "rgba(255,255,255,0.85)",
}: ShinyTextProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <span className={cn("inline-block", className)} style={{ color: fallbackColor }}>
        {text}
      </span>
    );
  }

  const style: CSSProperties = {
    backgroundImage: `linear-gradient(120deg, rgba(255,255,255,0) 0%, ${sheen} 55%, rgba(255,255,255,0) 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    backgroundSize: "180% 100%",
    backgroundRepeat: "no-repeat",
    animation: `shine-x ${duration}s linear infinite`,
  };

  return (
    <span className={cn("inline-block", className)} style={style}>
      {text}
    </span>
  );
}