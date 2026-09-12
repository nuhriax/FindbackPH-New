"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AmbientGlow } from "./background-system";

// SULO (guiding-light) — lightweight Filipino atmosphere (~250 lines).
// Parol star-grid + sulo beam + uwi thread. No particles, no radar,
// no violet/blue wash. CSS/SVG only, route-gated + reduced-motion safe.

const SULO_AMBER = "#f27418";
const SULO_SOFT = "#fb923c";
const BRAND_TEAL = "#123A63";
const TEAL_SOFT = "#7cc9c6";

function StarGrid() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-[0.055]"
    >
      <defs>
        <pattern id="fb-sulo-stars" width="72" height="72" patternUnits="userSpaceOnUse">
          <path
            d="M36 26l2.6 7.4L46 36l-7.4 2.6L36 46l-2.6-7.4L26 36l7.4-2.6z"
            fill="none"
            stroke={BRAND_TEAL}
            strokeWidth="1"
          />
          <circle cx="62" cy="58" r="1.4" fill={SULO_AMBER} opacity="0.7" />
        </pattern>
        <radialGradient id="fb-sulo-fade" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="62%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="fb-sulo-mask">
          <rect width="100%" height="100%" fill="url(#fb-sulo-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#fb-sulo-stars)" mask="url(#fb-sulo-mask)" />
      {/* A few larger outlined parol stars */}
      <g fill="none" stroke={SULO_AMBER} strokeWidth="1.2" opacity="0.5">
        <path d="M180 220l4 11.5 11.5 4-11.5 4-4 11.5-4-11.5-11.5-4 11.5-4z" />
        <path d="M1210 300l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" />
        <path d="M720 640l3.4 9.6 9.6 3.4-9.6 3.4-3.4 9.6-3.4-9.6-9.6-3.4 9.6-3.4z" />
      </g>
    </svg>
  );
}

export function SuloBackground({ className }: { className?: string }) {
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const handler = () => setReduced(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className
      )}
    >
      <div className="site-bg-base absolute inset-0 bg-[#fbf6ef]" />
      <div className="site-bg-haze absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_42%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.9)_38%,rgba(255,243,229,0.5)_70%,rgba(254,215,170,0.22)_100%)]" />

      <AmbientGlow tone="blue" className="site-bg-glow -left-[18rem] -top-[18rem] h-[42rem] w-[42rem]" />
      <AmbientGlow tone="cyan" className="site-bg-glow -left-[10rem] top-[35%] h-[30rem] w-[30rem]" delay={-7} />
      {/* Sulo beam — one diagonal warm beam */}
      <div
        aria-hidden="true"
        className="site-bg-glow absolute -right-[12rem] -top-[16rem] h-[46rem] w-[46rem] rotate-[24deg] bg-[linear-gradient(115deg,transparent_30%,rgba(242,116,24,0.10)_55%,rgba(251,146,60,0.05)_75%,transparent_95%)] blur-2xl"
      />
      <AmbientGlow tone="ice" className="site-bg-glow bottom-[-20rem] left-[22%] h-[38rem] w-[38rem]" delay={-21} />

      <StarGrid />

      {/* Uwi thread — teal→amber journey line across the upper canvas */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="fb-sulo-thread" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={BRAND_TEAL} />
            <stop offset="0.4" stopColor={TEAL_SOFT} />
            <stop offset="0.7" stopColor={SULO_SOFT} />
            <stop offset="1" stopColor={SULO_AMBER} />
          </linearGradient>
        </defs>
        <path
          d="M-40 300 C 300 220, 560 420, 900 320 S 1300 260, 1500 340"
          fill="none"
          stroke="url(#fb-sulo-thread)"
          strokeWidth="1.6"
          strokeDasharray="2 9"
          strokeLinecap="round"
          opacity="0.55"
          className={mounted && !reduced ? "fb-dotflow" : undefined}
        />
        <path
          d="M-40 640 C 320 560, 640 740, 1000 640 S 1300 600, 1500 660"
          fill="none"
          stroke="url(#fb-sulo-thread)"
          strokeWidth="1.3"
          strokeDasharray="1 10"
          strokeLinecap="round"
          opacity="0.35"
          className={mounted && !reduced ? "fb-dotflow-slow" : undefined}
        />
      </svg>

      {/* Foreground haze for readability */}
      <div className="site-bg-haze absolute inset-0 bg-[radial-gradient(ellipse_42%_35%_at_50%_45%,rgba(255,255,255,0.58),rgba(255,255,255,0.12)_55%,transparent_80%)]" />
    </div>
  );
}
