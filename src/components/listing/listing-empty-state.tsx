import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
import { CommunityMotif } from "@/components/ui/community-motif";
import { JeepneyMotif } from "@/components/ui/filipino-motif";
import { ACCENT, type Accent } from "./accents";

/**
 * Compact, purposeful empty state for the Lost/Found listing pages.
 */
export function ListingEmptyState({
  accent,
  title,
  description,
  hasFilters,
  clearHref,
  reportHref,
  reportLabel,
  secondaryHref,
  secondaryLabel,
  secondaryNote,
}: {
  accent: Accent;
  title: string;
  description: string;
  hasFilters: boolean;
  clearHref: string;
  reportHref?: string;
  reportLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  secondaryNote?: string;
}) {
  const a = ACCENT[accent];

  return (
    <div className="relative mt-8 flex flex-col items-center overflow-hidden rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-6 py-12 text-center">
      {/* Uwi thread — dashed teal→sulo route arcing over the empty state,
          ending in a lamp dot. The "journey home" motif, whisper-quiet. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 320 44"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-8 top-3 h-9 opacity-60"
      >
        <defs>
          <linearGradient id="fb-uwi-thread" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#123A63" stopOpacity="0.55" />
            <stop offset="1" stopColor="#F27418" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          d="M4 38 C 80 6, 240 6, 300 30"
          fill="none"
          stroke="url(#fb-uwi-thread)"
          strokeWidth="1.5"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
        <circle cx="303" cy="31" r="3" fill="#F27418" opacity="0.9" />
        <circle cx="303" cy="31" r="6.5" fill="#F27418" opacity="0.18" />
      </svg>
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl border ${a.border} ${a.bgSoft} ${a.text}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-md ${a.glow}`}
        />
        <span className="relative">
          <PackageSearch aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      <CommunityMotif className="mt-6 h-5 w-20 opacity-70" />

      <h2 className="mt-3 text-base font-semibold text-navy-900">{title}</h2>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>

      {secondaryNote && (
        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
          {secondaryNote}
        </p>
      )}

      {/* Warm community line + jeepney — Filipino texture, kept quiet */}
      <JeepneyMotif className="mt-4 h-8 w-32 opacity-70" />
      <p className="mt-1 text-[11px] font-medium italic text-leaf-700/80">
        Tulong-tulong tayo — every item finds its way home.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && (
          <Link
            href={clearHref}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-slate-50 hover:text-blue-700"
          >
            Clear filters
          </Link>
        )}

        {reportHref && reportLabel && (
          <Link
            href={reportHref}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold text-white transition-colors ${a.button} ${a.buttonHover}`}
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            {reportLabel}
          </Link>
        )}

        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
