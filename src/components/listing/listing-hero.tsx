import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ACCENT, type Accent } from "./accents";

/**
 * Shared compact hero for the Lost/Found listing pages. Left side carries a
 * small eyebrow label, the headline and a one-line description; the right side
 * holds the primary call-to-action. Kept intentionally short.
 */
export function ListingHero({
  accent,
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  accent: Accent;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  const a = ACCENT[accent];

  return (
    <section className="card relative overflow-hidden rounded-2xl">
      {/* Subtle radial light on the right so the card doesn't feel empty */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full ${a.glow} blur-3xl`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-0 h-56 w-56 rounded-full bg-blue-100/40 blur-2xl"
      />

      <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p
            className={`inline-flex items-center gap-2 rounded-full border ${a.border} ${a.bgSoft} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${a.text}`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full bg-current ${a.textStrong}`}
            />
            {eyebrow}
          </p>

          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className={`group inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors sm:w-auto ${a.button} ${a.buttonHover}`}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {ctaLabel}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
