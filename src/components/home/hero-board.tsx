import { Search } from "lucide-react";

import type { HeroCard } from "@/components/home/hero";
import { computeMatchScore, MATCH_THRESHOLD } from "@/lib/matching-score";

/**
 * HeroBoard — the live notice-board visual on the homepage hero.
 *
 * Layout contract:
 *  - Every new post pins to the LEFT as the big top card.
 *  - When that post has a possible match (real scoring engine, opposite
 *    kind only), the best match docks on the OTHER SIDE (bottom-right)
 *    as the reply, tied back with a match tag.
 *  - No match → the second newest post fills the right side instead.
 */
export function HeroBoard({
  cards,
  totalActive,
  recoveredCount = 0,
}: {
  cards: HeroCard[];
  totalActive: number;
  recoveredCount?: number;
}) {
  const newest = cards[0];
  const opposites = cards.slice(1).filter((c) => c.kind !== newest.kind);

  let bestMatch: HeroCard | null = null;
  let bestScore = 0;
  for (const c of opposites) {
    const score = computeMatchScore(
      {
        category: newest.category,
        id: newest.id,
        city: newest.city ?? null,
        province: newest.province ?? null,
        approximate_location: null,
        date_lost: null,
        title: newest.title,
        description: newest.description ?? "",
        distinguishing_features: null,
      },
      {
        category: c.category,
        id: c.id,
        city: c.city ?? null,
        province: c.province ?? null,
        approximate_location: null,
        date_found: null,
        title: c.title,
        description: c.description ?? "",
        distinguishing_features: null,
      }
    );
    if (score > MATCH_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  }

  const rightCard: HeroCard | null = bestMatch ?? cards[1] ?? null;
  const hasMatch = bestMatch !== null;
  const third = cards[2] && cards[2] !== rightCard ? cards[2] : null;

  return (
    <>
      <div className="notice-card absolute left-0 top-4 w-60 -rotate-2 p-4 pt-5">
        <span className="washi-tape -top-2 left-1/2 -translate-x-1/2 -rotate-2" aria-hidden="true" />
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
            newest.kind === "lost" ? "text-coral-600" : "text-ocean-600"
          }`}
        >
          {newest.kind === "lost" ? "Lost" : "Found"} · {newest.city || "PH"}
        </p>
        <p className="mt-1 truncate text-sm font-bold text-navy-900">
          {newest.title}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-soft">{newest.dateLabel}</p>
      </div>

      {rightCard && (
        <div className="notice-card absolute right-0 top-24 w-56 rotate-2 p-4 pt-5">
          <span className="washi-tape -top-2 left-1/2 -translate-x-1/2 rotate-3" aria-hidden="true" />
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
              rightCard.kind === "lost" ? "text-coral-600" : "text-ocean-600"
            }`}
          >
            {hasMatch ? "Match" : rightCard.kind === "lost" ? "Lost" : "Found"} ·{" "}
            {rightCard.city || "PH"}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-navy-900">
            {rightCard.title}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-soft">
            {rightCard.dateLabel}
          </p>
        </div>
      )}

      {third ? (
        <div className="notice-card absolute bottom-0 left-0 z-10 w-52 -rotate-1 p-4 pt-5">
          <span className="washi-tape -top-2 left-3 -rotate-6" aria-hidden="true" />
          <p
            className={`truncate text-[10px] font-bold uppercase tracking-[0.14em] ${
              third.kind === "lost" ? "text-coral-600" : "text-ocean-600"
            }`}
          >
            {third.kind === "lost" ? "Lost" : "Found"} · {third.city || "PH"}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-navy-900" title={third.title}>
            {third.title}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-soft">{third.dateLabel}</p>
        </div>
      ) : null}


      {newest.imageUrl ? (
        <div className="absolute bottom-6 left-[13.75rem] z-20 w-[7.5rem] rotate-2 rounded-sm bg-white p-1.5 pb-6 shadow-[0_12px_30px_-12px_rgba(51,46,38,0.4)]">
          <span className="washi-tape -top-2 left-1/2 -translate-x-1/2 -rotate-3" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static small polaroid, next/image adds no value here */}
          <img
            src={newest.imageUrl}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-[2px] bg-slate-100 object-cover"
          />
          <p className="absolute inset-x-1 bottom-1.5 truncate text-center font-hand text-[11px] leading-none text-cork-700">
            spotted in {newest.city || "PH"}
          </p>
        </div>
      ) : null}

      {hasMatch ? (
        <div className="absolute -right-2 bottom-16 flex rotate-1 items-center gap-2 border border-ink/15 bg-kraft-200 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
            <Search size={11} aria-hidden="true" />
          </span>
          Possible match found
        </div>
      ) : (
        totalActive > 1 && (
          <div className="absolute -right-2 bottom-16 flex rotate-1 items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-3.5 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur-sm">
            {totalActive} active notices
          </div>
        )
      )}

      {recoveredCount > 0 && (
        <span
          className="stamp-badge absolute -top-3 right-6 rotate-[-8deg] bg-white/80 px-2.5 py-1 text-stamp"
          aria-hidden="true"
        >
          RETURNED!
        </span>
      )}
    </>
  );
}