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

      {/* The physical board — cork surface, wooden frame. Kraft cards pinned
          to it pop with real depth instead of floating on the page. */}
      <div className="cork-board rotate-[0.4deg] p-5 pt-8 sm:p-6 sm:pt-9">
        {/* Board sign — a small taped-on label, not a UI heading */}
        <div className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2">
          <span className="inline-flex -rotate-1 items-center gap-2 rounded-md border border-cork-700/40 bg-kraft-100 px-4 py-1.5 shadow-md">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-coral-500 shadow-[0_1px_2px_rgba(36,30,23,0.4)]"
            />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-cork-700">
              Community Board
            </span>
          </span>
        </div>

        <NoticeSlip card={newest} tilt="-rotate-1" featured />

        {/* Connector — a physical thread with a medallion tying the two
            notices together: match = emerald seal, otherwise a quiet tag. */}
        {replyCard && (
          <div className="relative z-10 -my-0.5 flex flex-col items-center">
            <span
              aria-hidden="true"
              className="h-4 w-0 border-l-2 border-dashed border-kraft-100/70"
            />
            <span
              className={`inline-flex rotate-1 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-md ring-1 ${
                hasMatch
                  ? "bg-emerald-500 text-white ring-emerald-700/40"
                  : "bg-kraft-100 text-cork-700 ring-cork-700/30"
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
            <span
              aria-hidden="true"
              className="h-4 w-0 border-l-2 border-dashed border-kraft-100/70"
            />
          </div>
        )}

        {replyCard && (
          <div className="pl-5">
            <NoticeSlip card={replyCard} tilt="rotate-1" />
          </div>
        )}

        {/* Handwritten on the cork — the human touch, bottom of the board */}
        <p
          className="notice-annotation mt-5 text-center text-[1.15rem]"
          style={{ color: "#F0E4C6" }}
          aria-hidden="true"
        >
          every notice here is a neighbor helping ✎
        </p>
      </div>
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
        className={`washi-tape -top-2 ${
          featured ? "left-10 -rotate-6" : "right-8 rotate-3"
        }`}
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
            <img
              src={card.imageUrl}
              alt=""
              loading="lazy"
              className={`object-cover ${featured ? "h-20 w-20" : "h-16 w-16"}`}
            />
          </figure>
        ) : null}
      </div>
    </article>
  );
}