"use client";

import { useEffect, useState } from "react";
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

const KIND_STYLES: Record<
  ActivityKind,
  { icon: LucideIcon; text: string; chip: string }
> = {
  lost: { icon: Smartphone, text: "text-blue-600", chip: "bg-blue-50" },
  found: { icon: WalletCards, text: "text-emerald-600", chip: "bg-emerald-50" },
  match: { icon: Sparkles, text: "text-indigo-600", chip: "bg-indigo-50" },
  returned: {
    icon: HeartHandshake,
    text: "text-emerald-600",
    chip: "bg-emerald-50",
  },
  near: { icon: MapPin, text: "text-amber-600", chip: "bg-amber-50" },
};

function formatAgo(seconds: number) {
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds} sec ago`;
  return `${Math.round(seconds / 60)} min ago`;
}

/**
 * Live activity ticker. The feed is DEMO data — the site has no real-time
 * backend yet — so it is explicitly labeled "Simulated".
 */
export function LiveActivity({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      interval = setInterval(
        () => setIdx((i) => (i + 1) % DEMO_ACTIVITIES.length),
        4200
      );
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const item = DEMO_ACTIVITIES[idx];
  const style = KIND_STYLES[item.kind];
  const Icon = style.icon;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
      </span>

      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-blue-600">
        Live
      </span>

      <span className="shrink-0 text-slate-300" aria-hidden="true">
        ·
      </span>

      <div
        key={idx}
        className="fade-in flex min-w-0 items-center gap-1.5"
        role="status"
        aria-live="polite"
      >
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", style.chip, style.text)}>
          <Icon size={13} />
        </span>
        <span className="truncate text-xs font-semibold text-slate-800">
          {item.title}
        </span>
        <span className="hidden text-xs text-slate-500 md:inline">
          · {item.city}
        </span>
        <span className="shrink-0 text-[10px] text-slate-400">
          {formatAgo(item.secondsAgo)}
        </span>
      </div>

      <span
        className="ml-auto shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600"
        title="This activity is simulated for demonstration."
      >
        Simulated
      </span>
    </div>
  );
}
