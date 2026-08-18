"use client";

import { useId } from "react";
import {
  HeartHandshake,
  MapPin,
  Smartphone,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_ACTIVITIES, type ActivityKind } from "./home-data";

const ICONS: Record<ActivityKind, LucideIcon> = {
  lost: Smartphone,
  found: WalletCards,
  match: Sparkles,
  returned: HeartHandshake,
  near: MapPin,
};
const COLORS: Record<ActivityKind, string> = {
  lost: "text-blue-300",
  found: "text-emerald-300",
  match: "text-indigo-300",
  returned: "text-cyan-300",
  near: "text-amber-300",
};
const CHIP: Record<ActivityKind, string> = {
  lost: "bg-blue-500/10",
  found: "bg-emerald-500/10",
  match: "bg-indigo-500/10",
  returned: "bg-cyan-500/10",
  near: "bg-amber-500/10",
};

/**
 * A seamless, auto-scrolling ticker of recent community activity. Duplicated
 * content is translated -50% for an infinite loop; pauses on hover.
 * Simulated feed (the site has no real-time backend yet).
 */
export function ActivityMarquee({ className }: { className?: string }) {
  const uid = useId();
  const items = [...DEMO_ACTIVITIES, ...DEMO_ACTIVITIES];

  return (
    <div
      className={cn(
        "ticker-paused relative flex overflow-hidden border-y border-white/5 bg-navy-900/40 py-3",
        className
      )}
      aria-hidden="true"
    >
      <div className="ticker-track flex shrink-0 items-center gap-8 whitespace-nowrap pr-8">
        {items.map((a, i) => {
          const Icon = ICONS[a.kind];
          return (
            <span
              key={`${uid}-${i}`}
              className="inline-flex items-center gap-2 text-xs text-slate-400"
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-lg",
                  CHIP[a.kind],
                  COLORS[a.kind]
                )}
              >
                <Icon size={13} />
              </span>
              <span className="font-semibold text-slate-200">{a.title}</span>
              <span className="hidden text-slate-500 sm:inline">· {a.city}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
