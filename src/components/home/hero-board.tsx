import { ArrowLeftRight, Clock, MapPin } from "lucide-react";

import type { HeroCard } from "@/components/home/hero";
import { CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { computeMatchScore, MATCH_THRESHOLD } from "@/lib/matching-score";

/**
 * HeroBoard — senior UI/UX restructure.
 * Old board scattered 3 equal absolute cards + floating polaroid + chip
 * with no reading order and constant overlaps. New board is ONE vertical
 * story in normal flow: header -> primary notice -> connector -> reply
 * slip -> proof line. Photos dock INSIDE cards; nothing ever overlaps text.
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

  const replyCard: HeroCard | null = bestMatch ?? cards[1] ?? null;
  const hasMatch = bestMatch !== null;

  return (
    <div className="relative mx-auto w-full max-w-[24rem]">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">
          Community board
        </p>
        {totalActive > 0 && (
          <p className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/90 py-1 pl-2.5 pr-3 text-[11px] font-bold text-ink shadow-sm backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {totalActive} active
          </p>
        )}
      </div>

      <NoticeSlip card={newest} tilt="-rotate-1" featured />

      {replyCard && (
        <div className="flex items-center gap-2.5 px-6 py-2.5" aria-hidden="true">
          <span className="h-px flex-1 border-t-2 border-dashed border-ocean-300/70" />
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] shadow-sm ${
              hasMatch
                ? "bg-emerald-600 text-white"
                : "border border-ink/10 bg-white/90 text-ink-soft"
            }`}
          >
            {hasMatch ? (
              <>
                <ArrowLeftRight size={11} aria-hidden="true" />
                Possible match
              </>
            ) : (
              <>
                <Clock size={11} aria-hidden="true" />
                Latest reply
              </>
            )}
          </span>
          <span className="h-px flex-1 border-t-2 border-dashed border-ocean-300/70" />
        </div>
      )}

      {replyCard && (
        <div className="pl-8">
          <NoticeSlip card={replyCard} tilt="rotate-1" />
        </div>
      )}

      {recoveredCount > 0 && (
        <p className="mt-3 inline-flex -rotate-1 items-center gap-1.5 rounded-lg border border-sun-500/30 bg-sun-100/80 px-2.5 py-1 text-[11px] font-bold text-cork-700 shadow-sm">
          <span aria-hidden="true">✓</span>
          {recoveredCount} {recoveredCount === 1 ? "reunion" : "reunions"} and counting
        </p>
      )}
    </div>
  );
}

function NoticeSlip({
  card,
  tilt,
  featured = false,
}: {
  card: HeroCard;
  tilt: "-rotate-1" | "rotate-1";
  featured?: boolean;
}) {
  const isLost = card.kind === "lost";
  const categoryLabel = CATEGORY_LABELS[card.category] ?? "Other";

  return (
    <article className={`notice-card relative ${tilt} p-4 ${featured ? "pt-5 shadow-card" : "pt-4 shadow-sm"}`}>
      <span
        className={`washi-tape -top-2 ${featured ? "left-10 -rotate-6" : "left-8 rotate-3"}`}
        aria-hidden="true"
      />
      <span
        aria-hidden="true"
        className={`absolute inset-y-4 left-0 w-1 rounded-full ${isLost ? "bg-coral-500" : "bg-ocean-500"}`}
      />
      <div className="flex items-start gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${
                isLost ? "bg-coral-600 text-white" : "bg-ocean-600 text-white"
              }`}
            >
              {isLost ? "Lost" : "Found"}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold text-ink-soft">
              <MapPin size={11} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{card.city || "Philippines"}</span>
            </span>
          </div>
          <h3
            className={`mt-1.5 line-clamp-2 break-words font-bold leading-snug text-navy-900 ${
              featured ? "min-h-[2.75rem] text-[15px]" : "text-[13px]"
            }`}
          >
            {card.title}
          </h3>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-ink-soft">
            <span className="inline-flex min-w-0 items-center gap-1 [&_svg]:size-3.5 [&_svg]:shrink-0">
              {CATEGORY_ICONS[card.category]}
              <span className="truncate">{categoryLabel}</span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-ink-faint">·</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock size={11} aria-hidden="true" />
              {card.dateLabel}
            </span>
          </p>
        </div>
        {card.imageUrl ? (
          <figure className="shrink-0 -rotate-2 overflow-hidden rounded-lg border-2 border-white bg-slate-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.imageUrl} alt="" loading="lazy" className="h-16 w-16 object-cover" />
          </figure>
        ) : null}
      </div>
    </article>
  );
}