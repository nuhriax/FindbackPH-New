"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuroraProps = {
  colors?: string[];
  /** How much each bloom is softened. 30–90px is typical. */
  blur?: number;
  /** Global opacity of the color field. */
  opacity?: number;
  className?: string;
  children?: ReactNode;
};

/**
 * Aurora — a living, drifting field of soft gradient light, inspired by React
 * Bits' Aurora background. Each color renders as a blurred radial bloom that
 * slowly translates and scales (using the global `glow-drift` keyframes).
 * Designed to sit behind content (`pointer-events-none`) and to clear easily
 * from view if the OS requests reduced motion (global CSS pauses animations).
 */
export function Aurora({
  colors = ["#D6EFEB", "#F9E0DE", "#C7A8BA", "#7CC9C6", "#FBD0A5"],
  blur = 70,
  opacity = 0.6,
  className,
  children,
}: AuroraProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          // A warm base so the cool blooms have somewhere to live.
          background:
            "linear-gradient(135deg, rgba(251,246,239,0) 0%, rgba(251,246,239,0.25) 45%, rgba(251,246,239,0) 100%)",
        }}
      />
      {colors.map((color, i) => (
        <div
          key={i}
          className="absolute"
          style={{
              left: `${-15 + i * 22}%`,
              top: `${-10 + ((i * 29) % 60)}%`,
              width: `${66 * (1 + 0.1 * i)}%`,
              paddingBottom: `${66 * (1 + 0.1 * i)}%`,
              filter: `blur(${blur}px)`,
              background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
              opacity,
              animation: i % 3 === 0 ? `glow-drift ${16 + i * 6}s ease-in-out infinite` : `float-slow ${18 + i * 5}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
      ))}
      {children}
    </div>
  );
}