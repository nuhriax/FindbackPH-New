import {
  ArrowRight,
  HeartHandshake,
  LockKeyhole,
  MapPinned,
  PackageSearch,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/discover/params";

/**
 * Discover masthead — elevated: larger display type, gradient accent on the
 * key phrase, stat chips instead of a plain meta row, and the two primary
 * actions with an arrow nudge. Same teal/navy brand, more presence.
 */
export function DiscoverHeader({
  counts,
}: {
  counts: {
    lost: number;
    found: number;
  };
}) {
  const total = counts.lost + counts.found;

  return (
    <header className="relative overflow-hidden">
      {/* No opaque band — the site's luminous background shows through so the
          masthead melts seamlessly into the page canvas. */}
      {/* Decorative glows — kept whisper-quiet so the site's dotted arcs and
          circles stay the only visible background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-teal-500/[0.05] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 size-72 rounded-full bg-sunrise-500/[0.04] blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* CTAs sit right after the copy (fixed gap) instead of pushed to the
            far edge, so the description→action relationship reads clearly. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-14">
          <div className="max-w-2xl">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 ring-1 ring-inset ring-teal-200/70">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-sulo-500 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-sulo-600" />
                </span>
                FindBackPH · Philippines
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-navy-900 sm:text-5xl lg:text-[3.4rem]">
                Find what you lost,{" "}

                <span className="bg-gradient-to-r from-teal-600 via-sulo-500 to-sulo-600 bg-clip-text text-transparent">
              Return what you found.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
               Find lost belongings reported by people across the Philippines. Search by item, location, or category, and connect with the person who may help bring them home.

              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={ROUTES.reportLost} size="lg" className="group">
                <PackageSearch className="mr-2 size-4" />
                Report Lost
                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </ButtonLink>

              <ButtonLink
                href={ROUTES.reportFound}
                variant="outline"
                size="lg"
                className="group"
              >
                <HeartHandshake className="mr-2 size-4" />
                Report Found
                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        {/* Stat chips — wider track so labels never crowd or clip; the first
            chip speaks to the live state of the feed, including the
            "just launched" zero case. */}
        <Reveal delay={0.2}>
          <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-sulo-200/60 bg-white/60 px-4 py-3 shadow-soft backdrop-blur-md">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sulo-50 text-sulo-700 ring-1 ring-inset ring-sulo-200/70">
                <PackageSearch className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold tabular-nums leading-none text-navy-900">
                  {total > 0 ? total.toLocaleString() : "Live"}
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-500">
                  {total > 0
                    ? `Active report${total === 1 ? "" : "s"} right now`
                    : "New reports land daily"}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/50 bg-white/60 px-4 py-3 shadow-soft backdrop-blur-md">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200/70">
                <LockKeyhole className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold leading-none text-navy-900">
                  Private contact
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-500">
                  Details stay between you
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/50 bg-white/60 px-4 py-3 shadow-soft backdrop-blur-md">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200/70">
                <MapPinned className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold leading-none text-navy-900">
                  Philippines only
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-500">
                  Nationwide community feed
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </header>
  );
}