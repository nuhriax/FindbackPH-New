"use client";

import { useEffect, useRef, useState } from "react";
import {
  Lock,
  MapPin,
  PackageCheck,
  Radar,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PH_CITIES,
  PH_DOT_SPOTS,
  PH_ISLAND_PATHS,
  PH_VIEWBOX,
} from "./home-data";
import { LiveActivity } from "./live-activity";

/**
 * Hero product visual — a "live network" Philippines map.
 *
 * Signals continuously travel between cities (roaming pulses), city markers
 * ping, a radar scan-line sweeps the map, cards float, and the live activity
 * ticker cycles beneath the map — giving the hero a video-like, always-moving
 * real-time feel. Respects prefers-reduced-motion.
 */

const ACTIVE_CITIES = ["Manila", "Quezon City", "Cebu", "Davao", "Baguio", "Iloilo"];

type Signal = { from: string; to: string; speed: number; color: string; offset: number };

const SIGNALS: Signal[] = [
  { from: "Manila", to: "Cebu", speed: 0.09, color: "#3B82F6", offset: 0 },
  { from: "Quezon City", to: "Davao", speed: 0.07, color: "#22D3EE", offset: 0.2 },
  { from: "Manila", to: "Baguio", speed: 0.11, color: "#34D399", offset: 0.45 },
  { from: "Cebu", to: "Iloilo", speed: 0.13, color: "#818CF8", offset: 0.7 },
  { from: "Davao", to: "Cebu", speed: 0.06, color: "#F472B6", offset: 0.85 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function AnimatedHeroVisual({ className }: { className?: string }) {
  const [t, setT] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reduced.current = true;
      return;
    }
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      acc += dt;
      if (acc >= 1 / 30) {
        acc = 0;
        setT((p) => (p + dt) % 100000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const city = (name: string) => PH_CITIES.find((c) => c.name === name);

  return (
    <div className={cn("relative mx-auto w-full max-w-md lg:max-w-none", className)}>
      {/* Ambient glow behind the panel */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-electric-500/[0.14] blur-3xl animate-glow-drift" />

      {/* Main panel */}
      <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-navy-900/60 shadow-card ring-1 ring-inset ring-white/5 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
            <Radar size={13} className="text-electric-300" />
            Live network
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>
        {/* Map */}
        <div className="px-3 pt-3 sm:px-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-navy-950/60">
            <svg
              viewBox={PH_VIEWBOX}
              role="img"
              aria-label="Animated map of the Philippines showing live lost and found activity"
              className="h-auto w-full"
            >
              <defs>
                <linearGradient id="hv-land" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1E2A4A" />
                  <stop offset="100%" stopColor="#141C36" />
                </linearGradient>
              </defs>

              <g
                fill="url(#hv-land)"
                stroke="#3B82F6"
                strokeOpacity="0.32"
                strokeWidth={1.4}
                strokeLinejoin="round"
              >
                {PH_ISLAND_PATHS.map((p, i) => (
                  <path key={i} d={p.d} />
                ))}
                {PH_DOT_SPOTS.map((d, i) => (
                  <circle key={`dot-${i}`} cx={d.x} cy={d.y} r={d.r} />
                ))}
              </g>

              {/* Roaming signals between cities */}
              {SIGNALS.map((s, i) => {
                const a = city(s.from);
                const b = city(s.to);
                if (!a || !b) return null;
                const prog = reduced.current ? 0.35 : (t * s.speed + s.offset) % 1;
                const x = lerp(a.x, b.x, prog);
                const y = lerp(a.y, b.y, prog);
                return (
                  <g key={i}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={s.color}
                      strokeOpacity={0.22}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={s.color}
                      strokeOpacity={0.9}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeDasharray="1 10"
                      className="ph-conn-line"
                    />
                    <circle cx={x} cy={y} r={7} fill={s.color} opacity={0.18} />
                    <circle
                      cx={x}
                      cy={y}
                      r={3}
                      fill={s.color}
                      stroke="#fff"
                      strokeOpacity={0.8}
                      strokeWidth={1}
                    />
                  </g>
                );
              })}

              {/* Pulsing city markers */}
              {ACTIVE_CITIES.map((name) => {
                const c = city(name);
                if (!c) return null;
                return (
                  <g key={name}>
                    <circle cx={c.x} cy={c.y} r={9} fill="#3B82F6" opacity={0.18} className="ph-ping" />
                    <circle cx={c.x} cy={c.y} r={3.4} fill="#5B9CFF" stroke="#0B1020" strokeWidth={1.5} />
                  </g>
                );
              })}
            </svg>

            {/* Radar scan line */}
            <div
              className="scan-line pointer-events-none absolute left-0 right-0 h-10 -translate-y-1/2 bg-gradient-to-b from-transparent via-electric-400/20 to-transparent"
              aria-hidden="true"
            />

            {/* Corner badge */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
              <span className="rounded-lg border border-white/10 bg-navy-900/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur">
                12 reconnects today
              </span>
            </div>
          </div>


          {/* Legend */}
          <div className="flex items-center gap-4 py-3 text-[10px] font-medium text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Lost
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Found
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-300" /> Match
            </span>
          </div>
        </div>

        {/* Live activity ticker */}
        <div className="border-t border-white/5 px-5 py-3.5">
          <LiveActivity />
        </div>
      </div>



      {/* Floating found-item card */}
      <div className="animate-float absolute -right-3 -top-3 z-20 hidden items-center gap-3 rounded-2xl border border-white/10 bg-navy-900/90 px-4 py-3 shadow-card backdrop-blur-md sm:flex">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-navy-800 to-navy-900">
          <Smartphone size={20} className="text-slate-200" />
        </div>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <PackageCheck size={11} /> Found item
          </p>
          <p className="truncate text-sm font-medium text-white">iPhone 15 Pro (titanium)</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin size={10} /> Pasay City · 0.8 km
          </p>
        </div>
      </div>

      {/* Floating match badge */}
      <div className="animate-bob absolute -bottom-3 -left-3 z-20 hidden items-center gap-2 rounded-xl border border-emerald-500/25 bg-navy-900/90 px-3 py-2 shadow-card backdrop-blur-md sm:flex">
        <Sparkles size={13} className="text-emerald-300" />
        <span className="text-xs font-semibold text-white">
          Possible match · <span className="text-emerald-300">92%</span>
        </span>
      </div>

      {/* Floating privacy label */}
      <div className="absolute -right-4 top-24 z-20 hidden items-center gap-2 rounded-xl border border-white/10 bg-navy-900/90 px-3 py-2 shadow-card backdrop-blur-md lg:flex">
        <Lock size={13} className="text-electric-300" />
        <span className="text-xs font-medium text-white">Contact stays private</span>
      </div>
    </div>
  );
}
