import { ArrowLeftRight, Clock, MapPin, Scissors } from "lucide-react";

import type { HeroCard } from "@/components/home/hero";
import { CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { computeMatchScore, MATCH_THRESHOLD } from "@/lib/matching-score";

/**
 * HeroBoard — the hero visual as a VINTAGE NOTICE POSTER pinned to the
 * community cork board. One paper artifact, top-to-bottom like a real
 * "MISSING"-style poster: kicker → giant headline → featured report →
 * a cut line → the reply item → small print. Everything in normal flow,
 * truncation-guarded, nothing overlapping.
 */
export function HeroBoard({
  cards,
  recoveredCount = 0,
}: {
  cards: HeroCard[];
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

  const replyCard: HeroCard | null = bestMatch ?? cards[1] ?? null;
  const hasMatch = bestMatch !== null;
  const newestIsLost = newest.kind === "lost";

  return (
    <div className="relative mx-auto w-full max-w-[26rem]">
      {recoveredCount > 0 && (
        <span
          className="stamp-badge absolute -top-3 right-1 z-30 rotate-[-8deg] bg-white/85 px-3 py-1.5 text-stamp shadow-md"
          aria-hidden="true"
        >
          RETURNED!
        </span>
      )}

      {/* Cork board backing — the poster is pinned to it */}
      <div className="cork-board rotate-[0.4deg] p-4 pt-7 sm:p-5 sm:pt-8">
        {/* Pushpin holding the poster */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2.5 z-20 h-3.5 w-3.5 -translate-x-1/2 rounded-full shadow-[0_2px_4px_rgba(36,30,23,0.5)]"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #FFD9A0, #E19122 55%, #C97F1E)",
          }}
        />

        {/* THE POSTER — one sheet of aged paper with a double-rule frame */}
        <article className="relative -rotate-[0.6deg] border-[3px] border-cork-700 bg-[#FCF5E5] px-5 pb-4 pt-5 shadow-[0_18px_40px_-18px_rgba(36,30,23,0.55)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-1.5 border border-cork-700/35"
          />

          {/* Kicker */}
          <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-ink-soft">
            ★ Community Notice ★
          </p>

          {/* Giant headline — the poster moment */}
          <h3
            className={`mt-2 text-center font-display text-[2.6rem] font-black uppercase leading-none tracking-tight ${
              newestIsLost ? "text-coral-600" : "text-ocean-600"
            }`}
          >
            {newestIsLost ? "Missing" : "Found!"}
          </h3>
          <p className="notice-annotation mt-1 text-center text-[1.1rem] leading-none">
            {newestIsLost
              ? "have you seen me?"
              : "someone is smiling right now"}
          </p>

          <span
            aria-hidden="true"
            className="mx-auto mt-3 block h-0.5 w-24 rounded-full bg-cork-700/50"
          />

          {/* Featured report */}
          <div className="mt-4 flex items-start gap-3.5">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                <MapPin size={11} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{newest.city || "Philippines"}</span>
                <span aria-hidden="true" className="text-ink-faint">
                  ·
                </span>
                <Clock size={11} aria-hidden="true" className="shrink-0" />
                {newest.dateLabel}
              </p>
              <h4 className="mt-1.5 line-clamp-3 break-words font-display text-lg font-bold leading-snug text-navy-900">
                {newest.title}
              </h4>
              <p className="mt-1.5 inline-flex min-w-0 items-center gap-1.5 rounded-md bg-kraft-100/80 px-2 py-1 text-[11px] font-bold text-cork-700">
                <span className="[&_svg]:size-3.5 [&_svg]:shrink-0">
                  {CATEGORY_ICONS[newest.category]}
                </span>
                <span className="truncate">
                  {CATEGORY_LABELS[newest.category] ?? "Other"}
                </span>
              </p>
            </div>

            {newest.imageUrl ? (
              <figure
                className="relative shrink-0 rotate-2 border-[3px] border-white bg-slate-100 p-0.5 shadow-md"
                aria-hidden="true"
              >
                <span className="washi-tape -top-2.5 left-1/2 -translate-x-1/2 -rotate-3" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={newest.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-24 w-24 object-cover"
                />
              </figure>
            ) : null}
          </div>

          {/* Cut line — classic poster scissors rule */}
          {replyCard && (
            <div
              className="relative mt-5 flex items-center gap-2"
              aria-hidden="true"
            >
              <span className="h-0 flex-1 border-t-2 border-dashed border-ink/25" />
              <Scissors
                size={13}
                className="shrink-0 -scale-x-100 text-ink/40"
              />
              <span className="h-0 flex-1 border-t-2 border-dashed border-ink/25" />
            </div>
          )}

          {/* Reply item — below the cut */}
          {replyCard && (
            <div className="mt-3.5 flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1 h-9 w-1 shrink-0 rounded-full ${
                  replyCard.kind === "lost" ? "bg-coral-500" : "bg-ocean-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                {hasMatch ? (
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm">
                    <ArrowLeftRight size={10} aria-hidden="true" />
                    Possible match
                  </p>
                ) : (
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-faint">
                    Also on the board
                  </p>
                )}
                <h4 className="mt-1 line-clamp-2 break-words text-[13px] font-bold leading-snug text-navy-900">
                  {replyCard.title}
                </h4>
                <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-medium text-ink-soft">
                  <MapPin size={11} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">
                    {replyCard.city || "Philippines"}
                  </span>
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                  {replyCard.dateLabel}
                </p>
              </div>
              {replyCard.imageUrl ? (
                <figure
                  className="shrink-0 -rotate-2 border-2 border-white bg-slate-100 p-0.5 shadow-sm"
                  aria-hidden="true"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={replyCard.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 object-cover"
                  />
                </figure>
              ) : null}
            </div>
          )}

          {/* Small print footer */}
          <p className="mt-4 border-t border-cork-700/30 pt-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Post yours free — findback.ph
          </p>
        </article>
      </div>
    </div>
  );
}