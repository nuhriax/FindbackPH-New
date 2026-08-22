import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { getImagePublicUrl } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
import { ListingHero } from "@/components/listing/listing-hero";
import { ListingSearch } from "@/components/listing/listing-search";
import { ListingCategories } from "@/components/listing/listing-categories";
import { ListingResultsHeader } from "@/components/listing/listing-results-header";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Target,
} from "lucide-react";
import Link from "next/link";
import { format, isValid, differenceInCalendarDays } from "date-fns";

/* ==========================================================================
   Configuration
   ========================================================================== */

const PAGE_SIZE = 24;
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 9999;

const ROUTES = {
  found: "/found",
  reportFound: "/report/found",
} as const;

/* ==========================================================================
   Types
   ========================================================================== */

type Param = string | string[] | undefined;

type SearchParams = {
  q?: Param;
  category?: Param;
  city?: Param;
  page?: Param;
  sort?: Param;
};

type FoundItem = {
  id: string;
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  date_found: string | null;
  description: string | null;
  created_at: string;
};

type LostItem = {
  id: string;
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  date_lost: string | null;
  description: string | null;
};

type FoundImage = {
  found_item_id: string;
  storage_path: string;
  position?: number | null;
};

type LostImage = {
  lost_item_id: string;
  storage_path: string;
  position?: number | null;
};

type MatchResult = {
  score: number;
  matchedSignals: string[];
};

type SortOption = "newest" | "oldest" | "recently-updated";

/* ==========================================================================
   Helpers
   ========================================================================== */

function firstParam(value: Param): string {
  return Array.isArray(value)
    ? value[0]?.trim() ?? ""
    : value?.trim() ?? "";
}

function clean(
  value: string,
  max = MAX_QUERY_LENGTH,
): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parsePage(value: Param): number {
  const parsed = Number.parseInt(firstParam(value), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, MAX_PAGE);
}

function validCategory(
  value: string,
): value is ItemCategory {
  return CATEGORIES.includes(value as ItemCategory);
}

function isValidSort(value: string): value is SortOption {
  return (
    value === "newest" ||
    value === "oldest" ||
    value === "recently-updated"
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  return isValid(date)
    ? format(date, "MMM d, yyyy")
    : "Date unavailable";
}

function formatRelativeDate(
  value: string | null,
): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return "Date unavailable";
  }

  const days = differenceInCalendarDays(
    new Date(),
    date,
  );

  if (days === 0) {
    return "Found today";
  }

  if (days === 1) {
    return "Found yesterday";
  }

  if (days > 1 && days < 30) {
    return `Found ${days} days ago`;
  }

  return format(date, "MMM d, yyyy");
}

function reportedLabel(value: string | null): string {
  if (!value) {
    return "Reported recently";
  }

  const relative = formatRelativeDate(value);

  if (relative.startsWith("Found")) {
    return relative.replace("Found", "Reported");
  }

  return `Reported ${relative}`;
}

function normalizedWords(
  value: string | null,
): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3),
  );
}

function wordOverlap(
  a: string | null,
  b: string | null,
): number {
  const left = normalizedWords(a);
  const right = normalizedWords(b);

  if (!left.size || !right.size) {
    return 0;
  }

  let matches = 0;

  for (const word of left) {
    if (right.has(word)) {
      matches += 1;
    }
  }

  return matches / Math.max(left.size, right.size);
}

/* ==========================================================================
   MATCHING
   ========================================================================== */

/**
 * Explainable deterministic matching.
 *
 * This is intentionally presented as "possible match" rather than
 * an AI probability. The score is based only on information available
 * in the current lost/found records.
 */
function calculateMatch(
  found: FoundItem,
  lost: LostItem,
): MatchResult {
  let score = 0;

  const matchedSignals: string[] = [];

  /* Category */
  if (
    found.category &&
    found.category === lost.category
  ) {
    score += 35;
    matchedSignals.push("Same category");
  }

  /* City */
  const foundCity = found.city
    ?.toLowerCase()
    .trim();

  const lostCity = lost.city
    ?.toLowerCase()
    .trim();

  if (
    foundCity &&
    lostCity &&
    (
      foundCity === lostCity ||
      foundCity.includes(lostCity) ||
      lostCity.includes(foundCity)
    )
  ) {
    score += 25;
    matchedSignals.push("Same city");
  }

  /* Province */
  const foundProvince = found.province
    ?.toLowerCase()
    .trim();

  const lostProvince = lost.province
    ?.toLowerCase()
    .trim();

  if (
    foundProvince &&
    lostProvince &&
    foundProvince === lostProvince
  ) {
    score += 10;
    matchedSignals.push("Same province");
  }

  /* Title */
  const titleOverlap = wordOverlap(
    found.title,
    lost.title,
  );

  if (titleOverlap >= 0.34) {
    score += 20;
    matchedSignals.push("Similar item details");
  } else if (titleOverlap >= 0.2) {
    score += 12;
    matchedSignals.push("Related item details");
  }

  /* Description */
  const descriptionOverlap = wordOverlap(
    found.description,
    lost.description,
  );

  if (descriptionOverlap >= 0.25) {
    score += 10;
    matchedSignals.push("Similar description");
  }

  /* Dates */
  if (
    found.date_found &&
    lost.date_lost
  ) {
    const foundDate = new Date(
      found.date_found,
    );

    const lostDate = new Date(
      lost.date_lost,
    );

    if (
      isValid(foundDate) &&
      isValid(lostDate)
    ) {
      const days = Math.abs(
        differenceInCalendarDays(
          foundDate,
          lostDate,
        ),
      );

      if (days <= 7) {
        score += 10;
        matchedSignals.push(
          "Close report dates",
        );
      } else if (days <= 30) {
        score += 5;
      }
    }
  }

  return {
    score: Math.min(score, 100),
    matchedSignals:
      matchedSignals.slice(0, 3),
  };
}

/* ==========================================================================
   URL
   ========================================================================== */

function buildHref({
  page,
  q,
  category,
  city,
  sort,
}: {
  page: number;
  q: string;
  category: string;
  city: string;
  sort: SortOption;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (category) {
    params.set("category", category);
  }

  if (city) {
    params.set("city", city);
  }

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `${ROUTES.found}?${query}`
    : ROUTES.found;
}

/* ==========================================================================
   IMAGE MAP
   ========================================================================== */

function imageMap(
  images: Array<{
    storage_path: string;
    found_item_id?: string;
    lost_item_id?: string;
  }>,
  key:
    | "found_item_id"
    | "lost_item_id",
) {
  const map = new Map<string, string>();

  for (const image of images) {
    const id = image[key];

    if (
      id &&
      image.storage_path &&
      !map.has(id)
    ) {
      map.set(
        id,
        getImagePublicUrl(
          image.storage_path,
        ),
      );
    }
  }

  return map;
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export const metadata = {
  title: { absolute: "Found Items Philippines — Help Return Them" },
  description:
    "Browse found-item reports across the Philippines and help return something to its rightful owner. Search by category and city, then connect safely.",
};

export default async function FoundItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = createClient();
  const params = await searchParams;

  /* ------------------------------------------------------------------------
     URL STATE
     ------------------------------------------------------------------------ */

  const q = clean(
    firstParam(params.q),
  );

  const rawCategory = clean(
    firstParam(params.category),
    50,
  );

  const category =
    validCategory(rawCategory)
      ? rawCategory
      : "";

  const city = clean(
    firstParam(params.city),
  );

  const rawSort = clean(
    firstParam(params.sort),
    30,
  );

  const sort: SortOption = isValidSort(rawSort)
    ? rawSort
    : "newest";

  const requestedPage =
    parsePage(params.page);

  const hasFilters = Boolean(
    q || category || city,
  );

  /* ------------------------------------------------------------------------
     SORT CONFIGURATION
     ------------------------------------------------------------------------ */

  const sortColumn =
    sort === "recently-updated"
      ? "updated_at"
      : "created_at";

  const ascending = sort === "oldest";

  /* ------------------------------------------------------------------------
     FOUND QUERY
     ------------------------------------------------------------------------ */

  let query = supabase
    .from("found_items")
    .select(
      `
        id,
        title,
        category,
        city,
        province,
        date_found,
        description,
        created_at
      `,
      {
        count: "exact",
      },
    )
    .eq("status", "active")
    .order(sortColumn, {
      ascending,
    });

  if (q) {
    query = query.textSearch(
      "search_vector",
      q,
      {
        type: "websearch",
      },
    );
  }

  if (category) {
    query = query.eq(
      "category",
      category,
    );
  }

  if (city) {
    query = query.ilike(
      "city",
      `%${city}%`,
    );
  }

  const countQuery =
    query.range(0, 0);

  const {
    count: totalCountRaw,
    error: countError,
  } = await countQuery;

  const totalCount =
    countError
      ? 0
      : totalCountRaw ?? 0;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalCount / PAGE_SIZE,
    ),
  );

  const page = Math.min(
    requestedPage,
    totalPages,
  );

  const rangeStart =
    (page - 1) * PAGE_SIZE;

  const rangeEnd =
    rangeStart + PAGE_SIZE - 1;

  const {
    data: rawItems,
    error,
  } = await query.range(
    rangeStart,
    rangeEnd,
  );

  const items =
    (rawItems ?? []) as FoundItem[];

  const combinedError =
    error ?? countError;

  /* ------------------------------------------------------------------------
     FOUND IMAGES
     ------------------------------------------------------------------------ */

  const itemIds = items.map(
    (item) => item.id,
  );

  let foundImageMap =
    new Map<string, string>();

  if (itemIds.length) {
    const {
      data: rawImages,
    } = await supabase
      .from("item_images")
      .select(
        "found_item_id, storage_path, position",
      )
      .in(
        "found_item_id",
        itemIds,
      )
      .order("position", {
        ascending: true,
      });

    foundImageMap = imageMap(
      (rawImages ?? []) as FoundImage[],
      "found_item_id",
    );
  }

  /* ------------------------------------------------------------------------
     POSSIBLE MATCHES
     ------------------------------------------------------------------------ */

  const shouldCalculateMatches =
    items.length > 0 &&
    (hasFilters ||
      totalCount <= 100);

  let bestMatchByFoundId =
    new Map<
      string,
      MatchResult
    >();

  if (shouldCalculateMatches) {
    let lostQuery = supabase
      .from("lost_items")
      .select(
        `
          id,
          title,
          category,
          city,
          province,
          date_lost,
          description
        `,
      )
      .eq("status", "active")
      .limit(100);

    if (category) {
      lostQuery = lostQuery.eq(
        "category",
        category,
      );
    }

    if (city) {
      lostQuery = lostQuery.ilike(
        "city",
        `%${city}%`,
      );
    }

    const {
      data: rawLostItems,
    } = await lostQuery;

    const lostItems =
      (rawLostItems ?? []) as LostItem[];

    for (const found of items) {
      let best:
        | MatchResult
        | null = null;

      for (const lost of lostItems) {
        const result =
          calculateMatch(
            found,
            lost,
          );

        if (
          !best ||
          result.score > best.score
        ) {
          best = result;
        }
      }

      if (
        best &&
        best.score >= 45
      ) {
        bestMatchByFoundId.set(
          found.id,
          best,
        );
      }
    }
  }

  /* ------------------------------------------------------------------------
     DERIVED STATE
     ------------------------------------------------------------------------ */

  const resultStart =
    totalCount > 0
      ? rangeStart + 1
      : 0;

  const resultEnd = Math.min(
    rangeStart + items.length,
    totalCount,
  );

  const categoryLabel =
    category
      ? CATEGORY_LABELS[
          category
        ] ?? category
      : "";

  const previousHref =
    buildHref({
      page: page - 1,
      q,
      category,
      city,
      sort,
    });

  const nextHref =
    buildHref({
      page: page + 1,
      q,
      category,
      city,
      sort,
    });

  const showEmpty =
    !combinedError &&
    items.length === 0;

  const isFirstPage =
    page === 1;

  const isLastPage =
    page >= totalPages;

  /* ------------------------------------------------------------------------
     FILTER CHIPS
     ------------------------------------------------------------------------ */

  const chips: { label: string; href: string }[] = [];

  if (q) {
    chips.push({
      label: `Search: ${q}`,
      href: buildHref({ page: 1, q: "", category, city, sort }),
    });
  }

  if (category) {
    chips.push({
      label: `Category: ${categoryLabel}`,
      href: buildHref({ page: 1, q, category: "", city, sort }),
    });
  }

  if (city) {
    chips.push({
      label: `Location: ${city}`,
      href: buildHref({ page: 1, q, category, city: "", sort }),
    });
  }
/* ==========================================================================
     UI
     ========================================================================== */

  return (
    <main className="min-h-screen">

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <ListingHero
          accent="found"
          eyebrow="Returning belongings"
          title={
            <>
              Someone found it.{" "}
                            <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Help bring it home.
              </span>
            </>
          }
          description="Browse items reported by people who found something. Search by details, location, and category to discover a possible match."
          ctaHref={ROUTES.reportFound}
          ctaLabel="Report something you found"
        />

        {/* Hero stats */}
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-slate-600">
          <span className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold tabular-nums text-emerald-600">
              0+
            </span>
            Active reports
          </span>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-slate-300 sm:block"
          />
          <span className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold tabular-nums text-emerald-600">
              0+
            </span>
            Reports submitted
          </span>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-slate-300 sm:block"
          />
          <span className="flex items-center gap-1.5">
            <MapPin
              aria-hidden="true"
              className="h-3.5 w-3.5 text-emerald-600"
            />
            Philippines-wide
          </span>
        </div>

        {/* Search */}
        <div className="mt-6">
          <ListingSearch
            accent="found"
            idPrefix="found"
            q={q}
            category={category}
            city={city}
            sort={sort}
            maxLength={MAX_QUERY_LENGTH}
            buttonLabel="Find matches"
            chips={chips}
            clearAllHref={ROUTES.found}
          />
        </div>

        {/* Categories */}
        <ListingCategories
          accent="found"
          activeCategory={category}
          buildHref={(itemCategory) =>
            buildHref({
              page: 1,
              q,
              category: itemCategory,
              city,
              sort,
            })
          }
        />

        {/* Error state */}
        {combinedError ? (
          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/70 px-6 py-12 text-center backdrop-blur">
            <p className="text-sm text-slate-600">
              We couldn&apos;t load the current reports.
            </p>
            <Link
              href={ROUTES.found}
              className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
            >
              Try again
            </Link>
          </div>
        ) : items.length > 0 ? (
          <>
{/* Results header */}
            <ListingResultsHeader
              accent="found"
              title={hasFilters ? "Possible matches" : "Recently found"}
              count={`${totalCount.toLocaleString()} ${
                totalCount === 1 ? "report" : "reports"
              }`}
              description={
                hasFilters
                  ? `Showing ${resultStart.toLocaleString()}–${resultEnd.toLocaleString()} reports matching your search.`
                  : "Browse the latest reports from the community."
              }
              sort={sort}
              hiddenFields={[
                { name: "q", value: q },
                { name: "category", value: category },
                { name: "city", value: city },
              ].filter((field) => Boolean(field.value))}
              viewAllHref={ROUTES.found}
            />

            {/* Results grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => {
                const match = bestMatchByFoundId.get(item.id);

                return (
                  <Reveal
                    key={item.id}
                    delay={(index % 6) * 35}
                    className="h-full"
                  >
                    <article className="group relative h-full">
                      {match && (
                                                <div className="relative z-10 mb-[-1px] overflow-hidden rounded-t-[1.125rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                                <Target aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                                  Possible match
                                </p>
                                <p className="mt-0.5 text-[10px] text-emerald-600/70">
                                  {match.matchedSignals[0] ?? "Similar details"}
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                              Strong match
                            </span>
                          </div>
                        </div>
                      )}

                      <ItemCard
                        href={`${ROUTES.found}/${item.id}`}
                        title={item.title}
                        category={item.category}
                        city={item.city ?? ""}
                        province={item.province ?? ""}
                        reported={reportedLabel(item.created_at)}
                        description={item.description ?? ""}
                        kind="found"
                        imageUrl={foundImageMap.get(item.id)}
                      />

                      {match && match.matchedSignals.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                          {match.matchedSignals.slice(1).map((signal) => (
                            <span
                              key={signal}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600"
                            >
                              <Check aria-hidden="true" className="h-2.5 w-2.5 text-emerald-500" />
                              {signal}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
{/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Found item pagination"
                className="mt-10 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur sm:flex-row"
              >
                <p className="text-xs text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-navy-900">{page}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-navy-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex gap-2">
                  {!isFirstPage ? (
                    <Link
                      href={previousHref}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
                    >
                      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-xs font-medium text-slate-400">
                      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Previous
                    </span>
                  )}

                  {!isLastPage ? (
                    <Link
                      href={nextHref}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
                    >
                      Next
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-xs font-medium text-slate-400">
                      Next
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : (
          /* Empty state */
          <ListingEmptyState
            accent="found"
            title="No found items yet"
            description="Be the first to report something you found and help return it to its owner."
            hasFilters={hasFilters}
            clearHref={ROUTES.found}
            reportHref={ROUTES.reportFound}
            reportLabel="Report found item"
          />
        )}
      </div>
    </main>
  );
}