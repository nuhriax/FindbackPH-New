"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type TickerItem = {
  title: string;
  kind: "lost" | "found";
  city: string;
  dateLabel: string;
};

/**
 * LiveActivityTicker — rotating "what's happening right now" strip under the
 * hero. Turns the homepage's Realtime refresh (LiveReportsRefresh) into
 * visible social proof: the freshest community reports cycle every few
 * seconds. Server-rendered first item so the strip is never empty without JS.
 */

const ROTATE_MS = 4500;

export function LiveActivityTicker({
  items,
  totalActive,
  className,
}: {
  items: TickerItem[];
  totalActive: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      ROTATE_MS
    );
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[Math.min(index, items.length - 1)];
  const isLost = item.kind === "lost";

  return (
    <div
      className={cn(
        "relative mx-auto w-fit max-w-full rounded-2xl border border-slate-200/70 bg-white/80 py-2 pl-4 pr-2 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.25)] backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status — pulsing dot + kind label, color-coded by report type */}
        <span className="flex shrink-0 items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                isLost ? "bg-coral-500" : "bg-emerald-500"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isLost ? "bg-coral-600" : "bg-emerald-600"
              )}
            />
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
              isLost
                ? "bg-coral-100 text-coral-700"
                : "bg-emerald-100 text-emerald-700"
            )}
          >
            {isLost ? "Lost" : "Found"}
          </span>
        </span>

        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-slate-200" />

        {/* Report — the one thing this strip is about. Truncates cleanly. */}
        <span
          aria-live="polite"
          key={`${item.kind}-${item.title}`}
          className="flex min-w-0 items-baseline gap-x-1.5 gap-y-0 text-sm"
        >
          <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">
            {item.title}
          </span>
          {item.city ? (
            <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-slate-500 sm:inline-flex">
              <MapPin size={11} aria-hidden="true" />
              {item.city}
            </span>
          ) : null}
          <span className="shrink-0 text-xs text-slate-400">
            {item.dateLabel}
          </span>
        </span>

        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-slate-200" />

        {/* Proof + action — count and the single next step */}
        <span className="flex shrink-0 items-center gap-2">
          {totalActive > 0 && (
            <span className="hidden text-[11px] font-semibold tabular-nums text-slate-500 md:inline">
              {totalActive.toLocaleString()} active
            </span>
          )}
          <Link
            href="/discover"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              isLost
                ? "bg-coral-600 hover:bg-coral-700 focus-visible:ring-coral-400"
                : "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-400"
            )}
          >
            View
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </span>
      </div>

      {/* Rotation dots — only when there's something to rotate through */}
      {items.length > 1 && (
        <div
          className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1"
          aria-hidden="true"
        >
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === index ? "w-4 bg-slate-400" : "w-1 bg-slate-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
