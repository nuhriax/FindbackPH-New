import Link from "next/link";
import { ChevronDown, LayoutGrid, MapPin, Search, X } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { ACCENT, type Accent } from "./accents";

type FilterChip = {
  label: string;
  href: string;
};

/**
 * Premium search panel shared by the Lost/Found listing pages. A single row on
 * desktop (keyword · category · location · submit) that stacks on mobile.
 * When filters are active, removable chips render underneath.
 */
export function ListingSearch({
  accent,
  idPrefix,
  q,
  category,
  city,
  sort,
  maxLength,
  buttonLabel,
  chips,
  clearAllHref,
}: {
  accent: Accent;
  idPrefix: string;
  q: string;
  category: string;
  city: string;
  sort?: string;
  maxLength: number;
  buttonLabel: string;
  chips?: FilterChip[];
  clearAllHref?: string;
}) {
  const a = ACCENT[accent];

  return (
    <section aria-label="Search" className="relative z-10">
      <form
        method="GET"
        role="search"
        className="rounded-2xl border border-slate-200/70 bg-white/90 p-2.5 shadow-soft ring-1 ring-slate-200/40"
      >
        <div className="flex flex-col gap-2 lg:flex-row">
          {/* Keyword */}
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <label htmlFor={`${idPrefix}-q`} className="sr-only">
              Search by details, brand, or model
            </label>
            <input
              id={`${idPrefix}-q`}
              name="q"
              type="search"
              defaultValue={q}
              maxLength={maxLength}
              placeholder="Search item, brand, color, model..."
              autoComplete="off"
              spellCheck={false}
              className={`h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3.5 text-sm text-navy-900 outline-none transition-colors placeholder:text-slate-400 hover:bg-slate-100 focus:border-transparent focus:bg-white focus:ring-4 ${a.focus}`}
            />
          </div>

          {/* Category */}
          <div className="relative lg:w-52">
            <LayoutGrid
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <label htmlFor={`${idPrefix}-category`} className="sr-only">
              Filter by category
            </label>
            <select
              id={`${idPrefix}-category`}
              name="category"
              defaultValue={category}
              className={`h-11 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:ring-4 ${a.focus}`}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((itemCategory) => (
                <option key={itemCategory} value={itemCategory}>
                  {CATEGORY_LABELS[itemCategory]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* City */}
          <div className="relative lg:w-52">
            <MapPin
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <label htmlFor={`${idPrefix}-city`} className="sr-only">
              Search by city or location
            </label>
            <input
              id={`${idPrefix}-city`}
              name="city"
              type="search"
              defaultValue={city}
              maxLength={maxLength}
              placeholder="City or location"
              autoComplete="address-level2"
              className={`h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3.5 text-sm text-navy-900 outline-none transition-colors placeholder:text-slate-400 hover:bg-slate-100 focus:border-transparent focus:bg-white focus:ring-4 ${a.focus}`}
            />
          </div>

          {sort && sort !== "newest" && (
            <input type="hidden" name="sort" value={sort} />
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition-colors ${a.button} ${a.buttonHover}`}
          >
            <Search aria-hidden="true" className="h-4 w-4" />
            {buttonLabel}
          </button>
        </div>

        <p className="px-1.5 pb-0.5 pt-2.5 text-[11px] text-slate-500">
          Better results come from specific details like brand, color, model, or
          location.
        </p>
      </form>

      {/* Active filter chips */}
      {chips && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
            >
              {chip.label}
              <X aria-hidden="true" className="h-3 w-3 text-slate-400" />
            </Link>
          ))}
          <Link
            href={clearAllHref ?? "/"}
            className="inline-flex min-h-[36px] items-center px-2 py-2 text-xs font-medium text-slate-500 transition-colors hover:text-blue-700"
          >
            Clear all
          </Link>
        </div>
      )}
    </section>
  );
}
