"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShaderTone = "deep" | "aurora" | "ember";

const TONES: Record<ShaderTone, { base: string; blooms: string[] }> = {
  // Deep Philippine-sea teal → the site's signature dark CTA surface.
  deep: {
    base: "linear-gradient(130deg, #052A33 0%, #083B46 34%, #0C6262 68%, #0F7B72 100%)",
    blooms: ["#46ABAA", "#2BA3AB", "#7CC9C6", "#20948F"],
  },
  // Cool auroral gradient that nods at the global BackgroundEffects.
  aurora: {
    base: "linear-gradient(150deg, #EAF7F5 0%, #B3E4DD 40%, #7CC9C6 74%, #46ABAA 100%)",
    blooms: ["#D6EFEB", "#EBD9E1", "#7CC9C6", "#EAF9F9"],
  },
  // Warm sunset coral for callouts about “lost” things returning.
  ember: {
    base: "linear-gradient(140deg, #6E2D06 0%, #B5490C 36%, #DE3810 72%, #F27418 100%)",
    blooms: ["#F59341", "#F8B574", "#DE3810", "#FFE6CC"],
  },
};

type ShaderProps = {
  tone?: ShaderTone;
  /** Secondary accent bloom color to override tone bloom[0]. */
  accent?: string;
  /** Base CSS background. Overrides `tone` when provided. */
  background?: string;
  className?: string;
  /** Show a faint dotted overlay for a printed / technical feel. */
  dots?: boolean;
  children?: ReactNode;
};

/**
 * Shader — an organic, slowly-flowing gradient backdrop in the spirit of
 * ShaderGradient. The official `shadercgradient` npm renderer is a heavy
 * Three.js canvas build with missing peer deps and non-standard types, so this
 * reproduces its signature “living mesh of color” reachably — pure CSS, GPU
 * friendly, and always on-palette. Use as a full-bleed band behind a CTA or
 * section (wrap with `relative overflow-hidden`).
 */
export function Shader({
  tone = "deep",
  accent,
  background,
  dots = false,
  className,
  children,
}: ShaderProps) {
  const palette = TONES[tone];
  const blooms = accent ? [accent, ...palette.blooms.slice(1)] : palette.blooms;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Flowing fluid field */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 scale-[1.3]">
        <div
          className="absolute inset-0"
          style={{ background: background ?? palette.base }}
        />
        {blooms.map((color, i) => (
          <div
            key={i}
            className="absolute rounded-full mix-blend-screen"
            style={{
              left: `${-20 + i * 30}%`,
              top: `${-25 + ((i * 41) % 70)}%`,
              width: `${72 * (1 + 0.12 * i)}%`,
              paddingBottom: `${72 * (1 + 0.12 * i)}%`,
              filter: `blur(${52 + i * 8}px)`,
              background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
              opacity: 0.85,
              animation:
                i % 2 === 0
                  ? `glow-drift ${20 + i * 7}s ease-in-out infinite`
                  : `float-slow ${24 + i * 6}s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>

      {/* Fine dot grid */}
      {dots && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      )}

      <div className="relative h-full">{children}</div>
    </div>
  );
}