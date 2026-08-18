import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { formatDistanceToNow, isValid } from "date-fns";
import {
  ArrowRight,
  Check,
  Filter,
  Search,
  X,
} from "lucide-react";

export const metadata = {
  title: "Search — FindBack PH",
  description: "Search lost and found reports on FindBack PH.",
};

type SearchPageProps = {
  searchParams: {
    q?: string;
    city?: string;
    category?: string;
  };
};

type SearchItem = {
  id: string;
  title: string;
  category: any;
  city: string | null;
  province: string | null;
  description: string | null;
  created_at: string | null;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const supabase = createClient();

  const q = searchParams.q?.trim() || "";
  const city = searchParams.city?.trim() || "";
  const category = searchParams.category?.trim() || "";

  const activeCategory = CATEGORIES.includes(category as any)
    ? category
    : "";

  function applyFilters(query: any) {
    if (q) {
      query = query.textSearch("search_vector", q, {
        type: "websearch",
      });
    }

    if (activeCategory) {
      query = query.eq("category", activeCategory);
    }

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    return query;
  }

  let lostQuery = supabase
    .from("lost_items")
    .select(
      "id, title, category, city, province, description, created_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  let foundQuery = supabase
    .from("found_items")
    .select(
      "id, title, category, city, province, description, created_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  lostQuery = applyFilters(lostQuery);
  foundQuery = applyFilters(foundQuery);

  const [lostRes, foundRes] = await Promise.all([
    lostQuery,
    foundQuery,
  ]);

  const lostItems = (lostRes.data ?? []) as SearchItem[];
  const foundItems = (foundRes.data ?? []) as SearchItem[];

  const error = lostRes.error || foundRes.error;

  const totalResults = lostItems.length + foundItems.length;

  const hasSearch =
    Boolean(q) || Boolean(city) || Boolean(activeCategory);

  const hasResults = totalResults > 0;

  const clearHref = "/search";

  return (
    <main className="min-h-screen">
      {/* ================================================================
          HEADER
      ================================================================= */}

      <section className="border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <Search size={13} />
                FindBack PH Search
              </span>

              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
                Find a lost or found item
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Search community reports by item, location, or category.
              </p>
            </div>

            {/* ============================================================
                SEARCH FORM
            ============================================================= */}

            <form
              action="/search"
              method="GET"
              className="mt-8 rounded-2xl border border-slate-200/70 bg-white/90 p-2 shadow-soft ring-1 ring-slate-200/40 backdrop-blur-xl"
            >
              <div className="grid gap-2 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]">
                {/* Item */}
                <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-300 focus-within:bg-white">
                  <Search
                    size={17}
                    className="shrink-0 text-blue-500"
                  />

                  <input
                    name="q"
                    type="search"
                    defaultValue={q}
                    placeholder="What are you looking for?"
                    aria-label="Search item"
                    className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Location */}
                <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-300 focus-within:bg-white">
                  <span className="text-sm text-slate-500">
                    @
                  </span>

                  <input
                    name="city"
                    type="search"
                    defaultValue={city}
                    placeholder="City or location"
                    aria-label="Search location"
                    className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* Category */}
                <div className="relative">
                  <Filter
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <select
                    name="category"
                    defaultValue={activeCategory}
                    aria-label="Filter by category"
                    className="h-[48px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-300"
                  >
                    <option value="">All categories</option>

                    {CATEGORIES.map((itemCategory) => (
                      <option
                        key={itemCategory}
                        value={itemCategory}
                      >
                        {CATEGORY_LABELS[itemCategory]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <button
                  type="submit"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-electric-500 px-6 text-sm font-semibold text-white transition hover:bg-electric-400 active:scale-[0.98]"
                >
                  <Search size={16} />
                  Search
                </button>
              </div>
            </form>

            {/* ============================================================
                ACTIVE FILTERS
            ============================================================= */}

            {hasSearch && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="mr-1 text-xs text-slate-500">
                  Filters:
                </span>

                {q && (
                  <FilterTag label={`"${q}"`} />
                )}

                {city && (
                  <FilterTag label={city} />
                )}

                {activeCategory && (
                  <FilterTag
                    label={
                      CATEGORY_LABELS[
                        activeCategory as keyof typeof CATEGORY_LABELS
                      ]
                    }
                  />
                )}

                <Link
                  href={clearHref}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-slate-500 transition hover:text-blue-700"
                >
                  <X size={12} />
                  Clear
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          RESULTS
      ================================================================= */}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {error ? (
          <SearchError />
        ) : (
          <>
            {/* Results summary */}
            <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Search results
                </p>

                <h2 className="mt-2 font-display text-2xl font-bold text-navy-900">
                  {hasSearch
                    ? hasResults
                      ? `${totalResults} ${
                          totalResults === 1
                            ? "result"
                            : "results"
                        } found`
                      : "No matching reports"
                    : "Recent reports"}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {hasSearch
                    ? "Results from active lost and found reports."
                    : "Browse the latest reports from the community."}
                </p>
              </div>

              {hasResults && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    {foundItems.length} found
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span>
                    {lostItems.length} lost
                  </span>
                </div>
              )}
            </div>

            {!hasResults ? (
              <EmptySearch hasFilters={hasSearch} />
            ) : (
              <div className="space-y-14">
                {/* ========================================================
                    FOUND ITEMS
                ========================================================= */}

                {foundItems.length > 0 && (
                  <SearchGroup
                    title="Found items"
                    description="Items reported by people who found something."
                    items={foundItems}
                    hrefPrefix="/found"
                    kind="found"
                  />
                )}

                {/* ========================================================
                    LOST ITEMS
                ========================================================= */}

                {lostItems.length > 0 && (
                  <SearchGroup
                    title="Lost items"
                    description="Items reported by people looking for their belongings."
                    items={lostItems}
                    hrefPrefix="/lost"
                    kind="lost"
                  />
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

/* ============================================================================
   SEARCH GROUP
============================================================================ */

function SearchGroup({
  title,
  description,
  items,
  hrefPrefix,
  kind,
}: {
  title: string;
  description: string;
  items: SearchItem[];
  hrefPrefix: "/lost" | "/found";
  kind: "lost" | "found";
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${
                kind === "lost"
                  ? "bg-indigo-400"
                  : "bg-emerald-400"
              }`}
            />

            <h2 className="font-display text-xl font-bold text-navy-900 sm:text-2xl">
              {title}
            </h2>

            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {items.length}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        </div>

        <Link
          href={hrefPrefix}
          className="hidden items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 sm:inline-flex"
        >
          View all
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            href={`${hrefPrefix}/${item.id}`}
            title={item.title}
            category={item.category}
            city={item.city}
            province={item.province}
            reported={formatRelative(item.created_at)}
            description={item.description}
            kind={kind}
          />
        ))}
      </div>

      <div className="mt-5 sm:hidden">
        <Link
          href={hrefPrefix}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600"
        >
          View all {title.toLowerCase()}
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}

/* ============================================================================
   FILTER TAG
============================================================================ */

function FilterTag({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
      <Check size={11} />
      <span className="truncate">{label}</span>
    </span>
  );
}

/* ============================================================================
   EMPTY SEARCH
============================================================================ */

function EmptySearch({
  hasFilters,
}: {
  hasFilters: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center sm:py-20">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
        <Search size={22} />
      </div>

      <h3 className="mt-5 font-display text-xl font-bold text-navy-900">
        {hasFilters
          ? "No matching reports"
          : "No reports yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {hasFilters
          ? "Try a different item name, location, or category. You can also browse all active reports."
          : "There are currently no active lost or found reports to display."}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {hasFilters && (
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-slate-50"
          >
            Clear search
          </Link>
        )}

        <Link
          href="/report/lost"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-electric-400"
        >
          Report a lost item
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

/* ============================================================================
   ERROR
============================================================================ */

function SearchError() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
        <Search size={21} />
      </div>

      <h2 className="mt-5 font-display text-xl font-bold text-navy-900">
        Search temporarily unavailable
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Something went wrong while loading the reports.
        Please try again.
      </p>

      <Link
        href="/search"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-electric-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-electric-400"
      >
        Try again
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

/* ============================================================================
   DATE
============================================================================ */

function formatRelative(
  value: string | null | undefined
): string {
  if (!value) {
    return "Reported recently";
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return "Reported recently";
  }

  return `Reported ${formatDistanceToNow(date, {
    addSuffix: true,
  })}`;
}