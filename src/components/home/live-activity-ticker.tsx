"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
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

  return (
    <div
      className={cn(
        "relative mx-auto flex w-fit max-w-full items-center gap-2.5 border-x border-cork-900/30 bg-kraft-100 px-4 py-2 text-xs shadow-sm",
        className
      )}
    >
      {/* Clothespin holding the note to the sampayan string */}
      <span
        aria-hidden="true"
        className="absolute -top-1 left-1/2 h-3 w-2 -translate-x-1/2 rounded-sm bg-cork-700 shadow-sm"
      />

      <span className="flex shrink-0 items-center gap-1.5 font-bold uppercase tracking-wider text-stamp">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" />
        </span>
        Live
      </span>

      <span
        aria-live="polite"
        className="min-w-0 truncate text-ink"
        key={`${item.kind}-${item.title}`}
      >
        <span
          className={cn(
            "font-bold",
            item.kind === "lost" ? "text-coral-700" : "text-ocean-600"
          )}
        >
          {item.kind === "lost" ? "Lost: " : "Found: "}
        </span>
        {item.title}
        {item.city ? (
          <span className="inline-flex items-center gap-1 text-ink-soft">
            {" · "}
            <MapPin size={10} className="inline" aria-hidden="true" />
            {item.city}
          </span>
        ) : null}
        <span className="text-ink-faint"> · {item.dateLabel}</span>
      </span>

      {totalActive > 0 && (
        <span className="hidden shrink-0 rounded-full bg-cork-100 px-2 py-0.5 text-[10px] font-bold text-cork-700 sm:inline">
          {totalActive} active
        </span>
      )}
    </div>
  );
}
