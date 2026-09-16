import { BadgeCheck } from "lucide-react";

import { MapMotif } from "@/components/map-motif";
import { HeroSearch } from "@/components/home/hero-search";
import { LiveActivityTicker } from "@/components/home/live-activity-ticker";
import { HeroBoard } from "@/components/home/hero-board";
import type { TickerItem } from "@/components/home/live-activity-ticker";

export type HeroCard = TickerItem & {
  kind: "lost" | "found";
  /** Full card data for real match scoring on the board. */
  id: string;
  category: import("@/types/database").ItemCategory;
  province: string;
  description: string;
  imageUrl?: string | null;
};

/**
 * Hero — dual-intent hero for the homepage.
 *
 * Left: live badge, headline with PH-specific promise, HeroSearch (intent tabs
 * + location), differentiated CTAs, trust proof line.
 * Right: real community reports as pinned notice-card chips over a MapMotif —
 * the "live notice board" moment. Falls back to a static proof panel when the
 * platform has no reports yet (day-one state).
 */
export function Hero({
  totalActive,
  recent,
  recoveredCount = 0,
}: {
  totalActive: number;
  recent: HeroCard[];
  /** Real reunions platform-wide — gates the "returned" proof stamp. */
  recoveredCount?: number;
}) {
  const cards = recent.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-transparent px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
      {/* Atmosphere comes from the site-wide fixed background (SuloBackground) —
          this section stays transparent so the floating navbar pill above reads
          clean with zero strip/framing behind it. */}

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        {/* ── LEFT: action column ── */}
        <div className="text-center lg:text-left">
          {/* Tape strip eyebrow — a note taped to the board, not a SaaS pill */}
          <p className="mx-auto inline-flex -rotate-1 items-center gap-2 border border-ink/15 bg-kraft-200/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink shadow-sm lg:mx-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" />
            </span>
            {totalActive > 0
              ? `Live · ${totalActive.toLocaleString()} active notices`
              : "The community board is live"}
          </p>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-navy-900 sm:text-5xl lg:text-[3.4rem]">
            <span className="font-hand font-normal text-3xl text-cork-700 sm:text-4xl lg:text-[2.6rem]">
              Lost something?&nbsp;
            </span>
            Every lost thing
            <span className="hand-underline block text-ocean-500">
              has a way home.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft lg:mx-0 sm:text-lg">
            Report in two minutes, get matched automatically, and coordinate a
            safe handover — your contacts stay private until you choose to
            share them.
          </p>

          <div className="mt-7">
            <HeroSearch />
          </div>

          {/* Handwritten helper — the one Caveat arrow moment */}
          <p className="notice-annotation mt-4 hidden text-lg lg:block" aria-hidden="true">
            it&apos;s free — no fees, just neighbors helping
          </p>

          {/* Proof line */}
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-soft lg:justify-start">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={13} className="text-emerald-600" aria-hidden="true" />
              Free forever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={13} className="text-emerald-600" aria-hidden="true" />
              Private by default
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={13} className="text-emerald-600" aria-hidden="true" />
              Safe handovers
            </span>
          </p>
        </div>

        {/* ── RIGHT: live board — newest post pinned left, matches on the
            other side. Newest report is always the big top card; its best
            opposite-kind match (if any) docks bottom-right as the reply. */}
        <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden="true">
          <div className="relative min-h-[24rem] py-2">
            <MapMotif className="absolute inset-0 opacity-70" tone="text-ocean-300" />

            {cards.length > 0 ? (
              <HeroBoard
                cards={cards}
                recoveredCount={recoveredCount}
              />
            ) : (
              /* Day-one fallback: invite instead of empty board */
              <div className="notice-card absolute inset-x-8 top-1/2 -translate-y-1/2 p-6 text-center">
                <p className="font-display text-lg font-bold text-navy-900">
                  Be the first pin on the board
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Report a lost or found item and start your community&apos;s
                  notice board.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sampayan — the ticker hangs on the string with no band behind it,
          so the page background flows straight through. It shows reports
          BEYOND the two already pinned on the board — the board is the
          headline, the ticker is the long tail. Never the same item twice. */}
      {recent.length > 2 && (
        <div className="relative mt-10">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <LiveActivityTicker
              items={recent.slice(2, 6).map((r) => ({
                title: r.title,
                kind: r.kind,
                city: r.city,
                dateLabel: r.dateLabel,
              }))}
            />
          </div>
        </div>
      )}
    </section>
  );
}

