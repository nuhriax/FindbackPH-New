"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable luminous atmospheric background — the "Layer 1 — Atmosphere"
 * of the design system. Renders a few soft blurred color fields (icy blue /
 * lavender / cyan) plus extremely subtle rising light particles. Sits behind
 * all content (fixed, pointer-events-none) and respects reduced motion.
 *
 * The base soft-white/icy gradient lives on `body` in globals.css; this adds
 * the gentle drifting depth + flowing light so every page shares the same
 * luminous identity.
 */
export function BackgroundEffects({ className }: { className?: string }) {
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      /* Re-render not needed — animation is pure CSS and already gated below */
    };
    reduce.addEventListener("change", onChange);
    return () => reduce.removeEventListener("change", onChange);
  }, [reduced]);

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
      {/* Drifting color fields */}
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-ice-200/50 blur-3xl animate-glow-drift" />
      <div className="absolute right-[-12rem] top-[-6rem] h-[30rem] w-[30rem] rounded-full bg-lavender-200/45 blur-3xl animate-glow-drift [animation-delay:-8s]" />
      <div className="absolute bottom-[-14rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-sky-100/50 blur-3xl animate-glow-drift [animation-delay:-16s]" />
      <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ice-100/40 blur-3xl animate-glow-drift [animation-delay:-4s]" />

      {/* Flowing light trails */}
      <div className="absolute left-[8%] top-[18%] h-px w-64 rotate-[-18deg] bg-gradient-to-r from-transparent via-electric-200/70 to-transparent blur-[1px] animate-float-slow" />
      <div className="absolute right-[10%] top-[34%] h-px w-72 rotate-[14deg] bg-gradient-to-r from-transparent via-lavender-200/70 to-transparent blur-[1px] animate-float-slow [animation-delay:-9s]" />
      <div className="absolute bottom-[14%] left-[22%] h-px w-56 rotate-[10deg] bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent blur-[1px] animate-float-slow [animation-delay:-14s]" />

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
