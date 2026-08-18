"use client";

import { useMemo, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable luminous background system for FindBack PH.
 *
 * The "Layer 1 — Atmosphere" design language is composed from a few small,
 * declarative primitives so every page shares the same soft white + blue /
 * lavender glowing aesthetic without copy-pasting styles:
 *
 *   - <AmbientGlow />   large soft blurred color field (blue / lavender / cyan)
 *   - <GlowOrb />       tiny glowing particle that floats gently
 *   - <LightStreak />   thin flowing light streak
 *   - <GridBackground/> extremely subtle technical grid veil
 *   - <PageBackground /> composed fixed background (glows + grid + streaks)
 *
 * All effects are `pointer-events-none`, `aria-hidden`, clipped with
 * `overflow-hidden` so they never cause horizontal scrolling, and are fully
 * disabled under `prefers-reduced-motion` (gated by the global CSS rule in
 * globals.css and the `reduced` flag for JS-driven delays).
 */

export type GlowTone = "blue" | "lavender" | "cyan" | "indigo" | "ice";

const GLOW_BG: Record<GlowTone, string> = {
  blue: "bg-electric-300/40",
  lavender: "bg-lavender-200/50",
  cyan: "bg-cyan-200/45",
  indigo: "bg-indigo-200/50",
  ice: "bg-ice-100/55",
};

const STREAK_BG: Record<GlowTone, string> = {
  blue: "via-electric-200/70",
  lavender: "via-lavender-200/70",
  cyan: "via-cyan-200/60",
  indigo: "via-indigo-200/70",
  ice: "via-ice-200/70",
};

/* ---------------------------------------------------------------------------
   AmbientGlow — a single large soft blurred color field that drifts slowly.
   --------------------------------------------------------------------------- */

export function AmbientGlow({
  tone = "blue",
  className,
  style,
  delay = 0,
}: {
  tone?: GlowTone;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute rounded-full blur-3xl animate-glow-drift",
        GLOW_BG[tone],
        className
      )}
      style={{ animationDelay: `${delay}s`, ...style }}
    />
  );
}

/* ---------------------------------------------------------------------------
   GlowOrb — a tiny floating glowing particle / orb of light.
   --------------------------------------------------------------------------- */

export function GlowOrb({
  tone = "blue",
  className,
  style,
  size = 6,
  delay = 0,
}: {
  tone?: GlowTone;
  className?: string;
  style?: CSSProperties;
  size?: number;
  delay?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute rounded-full animate-float",
        GLOW_BG[tone],
        className
      )}
      style={{ width: size, height: size, animationDelay: `${delay}s`, ...style }}
    />
  );
}

/* ---------------------------------------------------------------------------
   LightStreak — a thin flowing light streak crossing the page.
   --------------------------------------------------------------------------- */

export function LightStreak({
  tone = "blue",
  className,
  style,
  delay = 0,
}: {
  tone?: GlowTone;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute h-px w-72 bg-gradient-to-r from-transparent via-electric-200/70 to-transparent blur-[1px] animate-float-slow",
        className
      )}
      style={{ animationDelay: `${delay}s`, ...style }}
    />
  );
}

/* ---------------------------------------------------------------------------
   GridBackground — an extremely subtle technical grid veil (masked at edges).
   --------------------------------------------------------------------------- */

export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-grid-soft [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]",
        className
      )}
    />
  );
}

/* ---------------------------------------------------------------------------
   PageBackground — a composed, reusable fixed background for a page/section.
   Layers a few ambient glows plus an optional technical grid + light streaks.
   Meant to sit behind content (`-z-10`, pointer-events-none, overflow-hidden).
   --------------------------------------------------------------------------- */

export function PageBackground({
  variant = "soft",
  className,
}: {
  variant?: "soft" | "tech";
  className?: string;
}) {
  const streaks = useMemo(
    () =>
      [
        { tone: "blue" as GlowTone, className: "left-[8%] top-[20%] rotate-[-18deg]", delay: 0 },
        { tone: "lavender" as GlowTone, className: "right-[10%] top-[34%] rotate-[14deg]", delay: -9 },
        { tone: "cyan" as GlowTone, className: "bottom-[16%] left-[22%] rotate-[10deg]", delay: -14 },
      ] as const,
    []
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      {/* Ambient color fields */}
      <AmbientGlow tone="blue" className="-left-40 -top-40 h-[34rem] w-[34rem]" />
      <AmbientGlow tone="lavender" className="right-[-12rem] top-[-6rem] h-[30rem] w-[30rem]" delay={-8} />
      <AmbientGlow tone="cyan" className="bottom-[-14rem] left-1/3 h-[32rem] w-[32rem]" delay={-16} />
      <AmbientGlow tone="ice" className="left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2" delay={-4} />

      {/* Optional technical grid */}
      {variant === "tech" && <GridBackground />}

      {/* Flowing light streaks */}
      {streaks.map((s, i) => (
        <LightStreak key={i} tone={s.tone} className={s.className} delay={s.delay} />
      ))}
    </div>
  );
}
