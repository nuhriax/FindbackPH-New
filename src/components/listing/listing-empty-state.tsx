import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
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
}: {
  accent: Accent;
  title: string;
  description: string;
  hasFilters: boolean;
  clearHref: string;
  reportHref: string;
  reportLabel: string;
}) {
  const a = ACCENT[accent];

  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-6 py-12 text-center">
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

      <h2 className="mt-4 text-base font-semibold text-navy-900">{title}</h2>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
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

        <Link
          href={reportHref}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold text-white transition-colors ${a.button} ${a.buttonHover}`}
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          {reportLabel}
        </Link>
      </div>
    </div>
  );
}
