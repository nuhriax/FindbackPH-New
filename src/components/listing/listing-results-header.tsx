import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SortSelect } from "./sort-select";
import type { Accent } from "./accents";

type HiddenField = {
  name: string;
  value: string;
};

/**
 * Results section header shared by the Lost/Found listing pages: title, live
 * result count, contextual description, and the sort control on the right.
 */
export function ListingResultsHeader({
  accent,
  title,
  count,
  description,
  sort,
  hiddenFields,
  viewAllHref,
}: {
  accent: Accent;
  title: string;
  count: string;
  description: string;
  sort: string;
  hiddenFields: HiddenField[];
  viewAllHref?: string;
}) {
  return (
    <section className="mt-10 border-b border-slate-200/70 pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-navy-900">
              {title}
            </h2>
            <span className="rounded-md border border-slate-200 bg-white/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-500">
              {count}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-blue-700"
            >
              View all reports
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          )}

          <form method="GET" className="relative">
            {hiddenFields.map((field) => (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                value={field.value}
              />
            ))}
            <SortSelect defaultValue={sort} accent={accent} />
          </form>
        </div>
      </div>
    </section>
  );
}
