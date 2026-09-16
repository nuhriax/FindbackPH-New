import { BadgeCheck, Search } from "lucide-react";

import { MapMotif } from "@/components/map-motif";
import { HeroSearch } from "@/components/home/hero-search";
import { LiveActivityTicker } from "@/components/home/live-activity-ticker";
import type { TickerItem } from "@/components/home/live-activity-ticker";

export type HeroCard = TickerItem & {
  kind: "lost" | "found";
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
}: {
  totalActive: number;
  recent: HeroCard[];
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

        {/* ── RIGHT: live notice board visual ── */}
        <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden="true">
          <div className="relative aspect-[4/3.4]">
            <MapMotif className="absolute inset-0 opacity-70" tone="text-ocean-300" />

            {cards.length > 0 ? (
              <>
                {/* Pinned notice chips — real reports, slightly rotated like a corkboard */}
                <div className="notice-card absolute left-0 top-4 w-60 -rotate-2 p-4 pt-5">
                  <span className="washi-tape -top-2 left-1/2 -translate-x-1/2 -rotate-2" aria-hidden="true" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-coral-600">
                    Lost · {cards[0].city || "PH"}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-navy-900">
                    {cards[0].title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {cards[0].dateLabel}
                  </p>
                </div>

                {cards[1] && (
                  <div className="notice-card absolute right-0 top-24 w-56 rotate-2 p-4 pt-5">
                    <span className="washi-tape -top-2 left-1/2 -translate-x-1/2 rotate-3" aria-hidden="true" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ocean-600">
                      Found · {cards[1].city || "PH"}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-navy-900">
                      {cards[1].title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {cards[1].dateLabel}
                    </p>
                  </div>
                )}

                {cards[2] ? (
                  <div className="notice-card absolute bottom-2 left-6 w-52 -rotate-1 p-4 pt-5">
                    <span className="washi-tape -top-2 left-3 -rotate-6" aria-hidden="true" />
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                        cards[2].kind === "lost" ? "text-coral-600" : "text-ocean-600"
                      }`}
                    >
                      {cards[2].kind === "lost" ? "Lost" : "Found"} ·{" "}
                      {cards[2].city || "PH"}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-navy-900">
                      {cards[2].title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {cards[2].dateLabel}
                    </p>
                  </div>
                ) : null}

                {/* Polaroid of the newest notice — real photo when available */}
                {cards[0].imageUrl ? (
                  <div className="absolute -left-4 bottom-20 w-32 rotate-3 rounded-sm bg-white p-1.5 pb-6 shadow-[0_12px_30px_-12px_rgba(51,46,38,0.4)]">
                    <span className="washi-tape -top-2 left-1/2 -translate-x-1/2 -rotate-3" aria-hidden="true" />
                    {/* eslint-disable-next-line @next/next/no-img-element -- static small polaroid, next/image adds no value here */}
                    <img
                      src={cards[0].imageUrl}
                      alt=""
                      className="aspect-square w-full rounded-[2px] object-cover"
                    />
                    <p className="absolute inset-x-0 bottom-1.5 text-center font-hand text-[11px] leading-none text-cork-700">
                      spotted in {cards[0].city || "PH"}
                    </p>
                  </div>
                ) : null}

                {/* Match tag — kraft tag tied to the board */}
                <div className="absolute -right-2 bottom-16 flex rotate-1 items-center gap-2 border border-ink/15 bg-kraft-200 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Search size={11} aria-hidden="true" />
                  </span>
                  Possible matches found
                </div>

                {/* Stamp — recovered proof */}
                <span
                  className="stamp-badge absolute -top-3 right-6 rotate-[-8deg] bg-white/80 px-2.5 py-1 text-stamp"
                  aria-hidden="true"
                >
                  NAIBALIK NA!
                </span>
              </>
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

      {/* Sampayan — the ticker IS the hero's bottom edge (chapter 01 proof).
          Same data as the board visual above; nothing new is introduced.
          -mx breaks out of the section's side padding so the cork band runs
          truly edge-to-edge instead of floating with gaps at the corners. */}
      {cards.length > 0 && (
        <div className="relative -mx-4 mt-10 border-y border-cork-900/25 bg-cork-500/95 py-3 shadow-inner sm:-mx-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-cork-900/40"
          />
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <LiveActivityTicker
              items={cards.map((r) => ({
                title: r.title,
                kind: r.kind,
                city: r.city,
                dateLabel: r.dateLabel,
              }))}
              totalActive={totalActive}
            />
          </div>
        </div>
      )}
    </section>
  );
}

