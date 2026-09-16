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
 *
 * Senior UI/UX pass:
 *  - Brand accents only: Lost wears coral, Found wears ocean (never emerald).
 *  - Reading order left→right: status pill → title (primary) → city · time
 *    (secondary, muted) → count (tertiary) → the single CTA. One accent per
 *    zone; the pill and the button share the same hue so the encoding is
 *    consistent without repeating it on every element.
 *  - A single pulsing dot lives INSIDE the status pill (one motion element,
 *    one label — not a dot + pill + colored button all shouting).
 *  - Rotation dots are in normal flow (mt-2.5), so they can never collide
 *    with content below like the old absolutely-positioned -bottom-4 dots.
 */

const ROTATE_MS = 4500;

const KIND_STYLES = {
  lost: {
    dot: "bg-coral-500",
    pill: "bg-coral-100 text-coral-700",
    button: "bg-coral-600 hover:bg-coral-700 focus-visible:ring-coral-400",
  },
  found: {
    dot: "bg-ocean-400",
    pill: "bg-ocean-100 text-ocean-700",
    button: "bg-ocean-600 hover:bg-ocean-700 focus-visible:ring-ocean-400",
  },
} as const;

export function LiveActivityTicker({
  items,
  className,
}: {
  items: TickerItem[];
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
  const kind = KIND_STYLES[item.kind];

  return (
    <div
      className={cn(
        "relative mx-auto w-fit max-w-full rounded-2xl border border-ink/10 bg-white/85 py-2 pl-3 pr-2 shadow-[0_10px_30px_-14px_rgba(36,30,23,0.28)] backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status — one pill: pulsing dot + kind label, brand-coded */}
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]",
            kind.pill
          )}
        >
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                kind.dot
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-1.5 w-1.5 rounded-full",
                kind.dot
              )}
            />
          </span>
          {item.kind === "lost" ? "Lost" : "Found"}
        </span>

        {/* Report — the one thing this strip is about. Title is the primary
            line; city + time are demoted to one muted meta run. Truncates. */}
        <span
          aria-live="polite"
          key={`${item.kind}-${item.title}`}
          className="flex min-w-0 items-center gap-2 text-sm"
        >
          <span className="min-w-0 truncate font-semibold text-ink">
            {item.title}
          </span>
          <span
            aria-hidden="true"
            className="hidden shrink-0 text-ink-faint sm:inline"
          >
            ·
          </span>
          <span className="hidden min-w-0 items-center gap-1 text-xs font-medium text-ink-soft sm:inline-flex">
            <MapPin size={11} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{item.city || "Philippines"}</span>
          </span>
          <span className="shrink-0 text-xs text-ink-faint">
            {item.dateLabel}
          </span>
        </span>

        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-ink/10" />

        {/* Proof + action — the only loud element is the CTA; the active
            count deliberately lives in the hero eyebrow, not here (dedup). */}
        <span className="flex shrink-0 items-center">
          <Link
            href="/discover"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              kind.button
            )}
          >
            View
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </span>
      </div>

      {/* Rotation dots — in flow, centered; only when there's more than one */}
      {items.length > 1 && (
        <div
          className="mt-2 flex items-center justify-center gap-1"
          aria-hidden="true"
        >
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === index ? "w-4 bg-ink/40" : "w-1 bg-ink/15"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
