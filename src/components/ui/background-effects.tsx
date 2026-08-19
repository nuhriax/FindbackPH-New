"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AmbientGlow, GridBackground, LightStreak } from "./background-system";

/**
 * Reusable luminous atmospheric background — the "Layer 1 — Atmosphere"
 * of the design system. Renders a few soft blurred color fields (icy blue /
 * lavender / cyan) plus extremely subtle rising light particles. Sits behind
 * all content (fixed, pointer-events-none) and respects reduced motion.
 *
 * The base soft-white/icy gradient lives on `body` in globals.css; this adds
 * the gentle drifting depth + flowing light so every page shares the same
 * luminous identity.
 *
 * The drifting fields and light trails are composed from the shared primitives
 * in `./background-system` so there is a single source of truth.
 */
export function BackgroundEffects({ className }: { className?: string }) {
  // Start with `false` so the initial client render matches the server
  // (where `window` is undefined and particles are always rendered).
  // The real value is populated in the effect below — any post-hydration
  // state change is handled gracefully by React without a hydration error.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(reduce.matches);

    const onChange = () => setReduced(reduce.matches);
    reduce.addEventListener("change", onChange);
    return () => reduce.removeEventListener("change", onChange);
  }, []);

  const particles = useMemo(() => {
    const seed = [18, 34, 52, 71, 90, 108, 126, 145, 162, 181];
    return seed.map((n, i) => ({
      left: `${(n * 7) % 100}%`,
      bottom: `${(n * 13) % 40}%`,
      size: 2 + ((n * 3) % 4),
      duration: 14 + ((n * 5) % 12),
      delay: (i * 1.6) % 9,
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      {/* Extremely subtle technical grid, shared across the whole site */}
      <GridBackground />

      {/* Drifting color fields */}
      <AmbientGlow tone="blue" className="-left-40 -top-40 h-[34rem] w-[34rem]" />
      <AmbientGlow tone="lavender" className="right-[-12rem] top-[-6rem] h-[30rem] w-[30rem]" delay={-8} />
      <AmbientGlow tone="cyan" className="bottom-[-14rem] left-1/3 h-[32rem] w-[32rem]" delay={-16} />
      <AmbientGlow tone="ice" className="left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2" delay={-4} />

      {/* Flowing light trails */}
      <LightStreak tone="blue" className="left-[8%] top-[18%] rotate-[-18deg]" />
      <LightStreak tone="lavender" className="right-[10%] top-[34%] rotate-[14deg]" delay={-9} />
      <LightStreak tone="cyan" className="bottom-[14%] left-[22%] rotate-[10deg]" delay={-14} />

      {/* Rising light particles */}
      {!reduced &&
        particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-electric-200/70"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              animation: `particle-rise ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
    </div>
  );
}

