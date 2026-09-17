
import { Clock, MapPin } from "lucide-react";

import type { HeroCard } from "@/components/home/hero";
import { CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";

/**
 * HeroBoard — the hero visual as a VINTAGE NOTICE POSTER pinned to the
 * community cork board. One paper artifact, top-to-bottom like a real
 * "MISSING"-style poster: kicker → giant headline → featured report →
 * small print. Shows only the single latest post. Everything in normal
 * flow, truncation-guarded, nothing overlapping.
 */
export function HeroBoard({
  cards,
  recoveredCount = 0,
}: {
  cards: HeroCard[];
  recoveredCount?: number;
}) {
  const newest = cards[0];
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
      <div className="cork-board rotate-[0.4deg] p-5 pt-8 sm:p-6 sm:pt-9">
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
        <article className="relative -rotate-[0.6deg] border-[3px] border-cork-700 bg-[#FCF5E5] px-5 pb-5 pt-4 shadow-[0_18px_40px_-18px_rgba(36,30,23,0.55)] sm:px-6">
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
            className="mx-auto mt-3 flex items-center justify-center gap-2 text-cork-700/60"
          >
            <span className="h-px w-10 bg-cork-700/40" />
            <span className="text-[10px]">✦</span>
            <span className="h-px w-10 bg-cork-700/40" />
          </span>

          {/* Featured report — full-width meta line, then text + polaroid */}
          <div className="mt-4">
            {/* Ledger — classic poster WHERE / WHEN rows. Label + value on
                one line each, so a long city or province can never drag the
                time onto a ragged second line. */}
            <div className="space-y-1.5 text-[11px] font-bold uppercase tracking-[0.1em]">
              <p className="flex min-w-0 items-baseline gap-2.5">
                <span className="w-14 shrink-0 text-[9px] tracking-[0.22em] text-ink-faint">
                  Where
                </span>
                <span className="inline-flex min-w-0 items-center gap-1 text-ink-soft">
                  <MapPin size={11} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">
                    {[newest.city, newest.province]
                      .filter(Boolean)
                      .join(", ") || "Philippines"}
                  </span>
                </span>
              </p>
              <p className="flex min-w-0 items-baseline gap-2.5">
                <span className="w-14 shrink-0 text-[9px] tracking-[0.22em] text-ink-faint">
                  When
                </span>
                <span className="inline-flex min-w-0 items-center gap-1 text-ink-soft">
                  <Clock size={11} aria-hidden="true" className="shrink-0" />
                  <span className="normal-case">{newest.dateLabel}</span>
                </span>
              </p>
            </div>

            {/* Body — title/quote/chip left, polaroid centered right */}
            <div className="mt-3 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="break-words font-display text-xl font-bold leading-snug text-navy-900">
                  {newest.title}
                </h4>
                {newest.description ? (
                  <p className="mt-1.5 line-clamp-3 text-[12px] italic leading-relaxed text-ink-soft">
                    “{newest.description.trim()}”
                  </p>
                ) : null}
                <p className="mt-2.5 inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-kraft-100/80 px-2 py-1 text-[11px] font-bold text-cork-700">
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
                  className="relative w-28 shrink-0 rotate-2 border-[3px] border-white bg-white p-1 pb-7 shadow-md"
                  aria-hidden="true"
                >
                  <span className="washi-tape -top-2.5 left-1/2 -translate-x-1/2 -rotate-3" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={newest.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0.5 px-1 text-center font-hand text-[11px] leading-tight text-cork-700">
                    as posted by
                    <br />a neighbor
                  </figcaption>
                </figure>
              ) : null}
            </div>
          </div>

          {/* Invitation slip — the poster's own call to action, filling the
              lower sheet like a reply stub on a real notice */}
          <div className="mt-5 flex items-center gap-2.5 rounded-lg border-2 border-dashed border-ink/25 bg-white/40 px-3.5 py-2.5">
            <span aria-hidden="true" className="text-sm">
              ✎
            </span>
            <p className="min-w-0 flex-1 text-[11px] font-bold leading-snug text-ink-soft">
              Lost or found something too? Post your notice — it&apos;s free.
            </p>
          </div>

          {/* Small print footer — a stamped case number on the left, and the
              poster's sign-off on the right. Styled as an action but rendered
              as text: the board is aria-hidden decoration, so a real link
              here would be an a11y violation (focusable inside aria-hidden). */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-cork-700/40 pt-3">
            <span
              className="inline-flex shrink-0 -rotate-2 items-center rounded-[3px] border-2 border-cork-700/50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-cork-700/80 tabular-nums"
              aria-hidden="true"
            >
              № {newest.id.replace(/-/g, "").slice(0, 6).toUpperCase()}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cork-700 underline decoration-cork-700/40 decoration-dotted underline-offset-4">
              <span className="truncate">
                {newestIsLost
                  ? "Found it? Post a sighting — free"
                  : "Lost it? Post a notice — free"}
              </span>
              <span aria-hidden="true" className="shrink-0 text-[12px] leading-none">
                →
              </span>
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}