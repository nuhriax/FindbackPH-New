import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import {
  CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/validation";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
import {
  calculateMatch,
  MATCH_THRESHOLDS,
  type MatchResult,
  type MatchStrength,
  type MatchableItem,
} from "@/lib/matching";
import { ListingHero } from "@/components/listing/listing-hero";
import { ListingSearch } from "@/components/listing/listing-search";
import { ListingCategories } from "@/components/listing/listing-categories";
import { ListingResultsHeader } from "@/components/listing/listing-results-header";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";
import { ListingStats } from "@/components/listing/listing-stats";
import { ListingGuide } from "@/components/listing/listing-guide";

import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
  Heart,
  Lock,
  ShieldCheck,
  Target,
} from "lucide-react";

import Link from "next/link";
import {
  format,
  isValid,
  differenceInCalendarDays,
} from "date-fns";

/* ==========================================================================
   Configuration
   ========================================================================== */

const PAGE_SIZE = 24;
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 9999;
const MAX_MATCH_CANDIDATES = 150;

const ROUTES = {
  found: "/found",
  reportFound: "/report/found",
  lost: "/lost",
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

type SortOption =
  | "newest"
  | "oldest"
  | "recently-updated";

type FoundItem = {
  id: string;
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  approximate_location: string | null;
  date_found: string | null;
  description: string | null;
  distinguishing_features: string | null;
  created_at: string;
};

type LostItem = {
  id: string;
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  approximate_location: string | null;
  date_lost: string | null;
  description: string | null;
  distinguishing_features: string | null;
};

type FoundImage = {
  found_item_id: string;
  storage_path: string;
  position?: number | null;
};

type FoundStats = {
  activeCount: number;
  totalCount: number;
  categoryCounts: Partial<
    Record<ItemCategory, number>
  >;
};

/* ==========================================================================
   URL / Validation Helpers
   ========================================================================== */

function firstParam(value: Param): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
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
  const parsed = Number.parseInt(
    firstParam(value),
    10,
  );

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, MAX_PAGE);
}

function validCategory(
  value: string,
): value is ItemCategory {
  return CATEGORIES.includes(
    value as ItemCategory,
  );
}

function isValidSort(
  value: string,
): value is SortOption {
  return (
    value === "newest" ||
    value === "oldest" ||
    value === "recently-updated"
  );
}

/* ==========================================================================
   Date Helpers
   ========================================================================== */

/**
 * Parses a YYYY-MM-DD value as a local calendar date.
 *
 * This avoids timezone surprises that can happen when
 * new Date("2026-08-23") is interpreted as UTC.
 */
function parseDateOnly(
  value: string | null,
): Date | null {
  if (!value) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  );

  return isValid(date) ? date : null;
}

function formatDate(
  value: string | null,
): string {
  const date = parseDateOnly(value);

  if (!date) {
    return "Date unavailable";
  }

  return format(date, "MMM d, yyyy");
}

function formatRelativeDate(
  value: string | null,
): string {
  const date = parseDateOnly(value);

  if (!date) {
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

function reportedLabel(
  value: string | null,
): string {
  const date = parseDateOnly(value);

  if (!date) {
    return "Reported recently";
  }

  const days = differenceInCalendarDays(
    new Date(),
    date,
  );

  if (days === 0) {
    return "Reported today";
  }

  if (days === 1) {
    return "Reported yesterday";
  }

  if (days > 1 && days < 30) {
    return `Reported ${days} days ago`;
  }

  return `Reported ${format(date, "MMM d, yyyy")}`;
}

/* ==========================================================================
   URL Helpers
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
}): string {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (category) {
    params.set(
      "category",
      category,
    );
  }

  if (city) {
    params.set("city", city);
  }

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  const query =
    params.toString();

  return query
    ? `${ROUTES.found}?${query}`
    : ROUTES.found;
}

/* ==========================================================================
   Image Helpers
   ========================================================================== */

async function imageMap(
  images: FoundImage[],
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(
    new Set(images.map((i) => i.storage_path).filter(Boolean)),
  );
  const signed = await getSignedImageUrls(uniquePaths);
  const urlByPath = new Map(
    uniquePaths.map((p, i) => [p, signed[i]]),
  );

  const map =
    new Map<string, string>();

  for (const image of images) {
    if (
      !image.found_item_id ||
      !image.storage_path
    ) {
      continue;
    }

    if (map.has(image.found_item_id)) {
      continue;
    }

    map.set(
      image.found_item_id,
      urlByPath.get(
        image.storage_path,
      ) ?? getImagePublicUrl(
        image.storage_path,
      ),
    );
  }

  return map;
}

/* ==========================================================================
   Stats
   ========================================================================== */

/**
 * Gets the main totals.
 *
 * Category counts are intentionally kept in this function for compatibility
 * with the existing Supabase schema. For a larger production dataset,
 * replace these category queries with a single RPC/grouped query.
 */
async function fetchFoundCounts(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
): Promise<FoundStats> {
  const [
    activeRes,
    totalRes,
    ...categoryResults
  ] = await Promise.all([
    supabase
      .from("found_items")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("found_items")
      .select("*", {
        count: "exact",
        head: true,
      }),

    ...CATEGORIES.map(
      (itemCategory) =>
        supabase
          .from("found_items")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "active")
          .eq(
            "category",
            itemCategory,
          ),
    ),
  ]);

  const categoryCounts: Partial<
    Record<ItemCategory, number>
  > = {};

  for (
    let index = 0;
    index < CATEGORIES.length;
    index += 1
  ) {
    const itemCategory =
      CATEGORIES[index];

    const count =
      categoryResults[index]
        ?.count ?? 0;

    if (count > 0) {
      categoryCounts[
        itemCategory
      ] = count;
    }
  }

  return {
    activeCount:
      activeRes.count ?? 0,

    totalCount:
      totalRes.count ?? 0,

    categoryCounts,
  };
}

/* ==========================================================================
   Match Candidates
   ========================================================================== */

async function fetchLostCandidates(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  category: string,
  city: string,
): Promise<LostItem[]> {
  let query = supabase
    .from("lost_items")
    .select(`
      id,
      title,
      category,
      city,
      province,
      approximate_location,
      date_lost,
      description,
      distinguishing_features
    `)
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    })
    .limit(MAX_MATCH_CANDIDATES);

  /**
   * Category is a very strong signal, so use it
   * to reduce the candidate pool when possible.
   */
  if (category) {
    query = query.eq(
      "category",
      category,
    );
  }

  /**
   * City filtering can make matching considerably
   * cheaper for filtered searches.
   */
  if (city) {
    query = query.ilike(
      "city",
      `%${city}%`,
    );
  }

  const {
    data,
  } = await query;

  return (data ??
    []) as LostItem[];
}

/* ==========================================================================
   Page
   ========================================================================== */

export const metadata = {
  title: {
    absolute:
      "Found Items Philippines â€” Help Return Them",
  },

  description:
    "Browse found-item reports across the Philippines and help return something to its rightful owner. Search by category and city, then connect safely.",
};

export default async function FoundItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase =
    await createClient();

  const params =
    await searchParams;

  /* ------------------------------------------------------------------------
     URL STATE
     ------------------------------------------------------------------------ */

  const q = clean(
    firstParam(params.q),
  );

  const rawCategory =
    clean(
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

  const rawSort =
    clean(
      firstParam(params.sort),
      30,
    );

  const sort: SortOption =
    isValidSort(rawSort)
      ? rawSort
      : "newest";

  const requestedPage =
    parsePage(params.page);

  const hasFilters =
    Boolean(
      q ||
        category ||
        city,
    );

  /* ------------------------------------------------------------------------
     SORT
     ------------------------------------------------------------------------ */

  const sortColumn =
    sort ===
    "recently-updated"
      ? "updated_at"
      : "created_at";

  const ascending =
    sort === "oldest";

  /* ------------------------------------------------------------------------
     BASE FILTERS
     ------------------------------------------------------------------------ */

  function applyFoundFilters<
    T extends {
      textSearch: (
        column: string,
        query: string,
        options: {
          type: "websearch";
        },
      ) => T;
      eq: (
        column: string,
        value: string,
      ) => T;
      ilike: (
        column: string,
        pattern: string,
      ) => T;
    },
  >(query: T): T {
    let result = query;

    if (q) {
      result =
        result.textSearch(
          "search_vector",
          q,
          {
            type: "websearch",
          },
        );
    }

    if (category) {
      result =
        result.eq(
          "category",
          category,
        );
    }

    if (city) {
      result =
        result.ilike(
          "city",
          `%${city}%`,
        );
    }

    return result;
  }

  /* ------------------------------------------------------------------------
     COUNT + STATS
     ------------------------------------------------------------------------ */

  const countQuery =
    applyFoundFilters(
      supabase
        .from("found_items")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "active"),
    );

  const [
    countResult,
    stats,
  ] = await Promise.all([
    countQuery,
    fetchFoundCounts(
      supabase,
    ),
  ]);

  const totalCount =
    countResult.error
      ? 0
      : countResult.count ?? 0;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          PAGE_SIZE,
      ),
    );

  const page = Math.min(
    requestedPage,
    totalPages,
  );

  const rangeStart =
    (page - 1) *
    PAGE_SIZE;

  const rangeEnd =
    rangeStart +
    PAGE_SIZE -
    1;

  /* ------------------------------------------------------------------------
     FOUND ITEMS
     ------------------------------------------------------------------------ */

  const foundQuery =
    applyFoundFilters(
      supabase
        .from("found_items")
        .select(`
          id,
          title,
          category,
          city,
          province,
          approximate_location,
          date_found,
          description,
          distinguishing_features,
          created_at
        `)
        .eq("status", "active")
        .order(sortColumn, {
          ascending,
        }),
    );

  const {
    data: rawItems,
    error,
  } = await foundQuery.range(
    rangeStart,
    rangeEnd,
  );

  const items =
    (rawItems ??
      []) as FoundItem[];

  const combinedError =
    error ??
    countResult.error;

  /* ------------------------------------------------------------------------
     IMAGE QUERY
     ------------------------------------------------------------------------ */

  const itemIds =
    items.map(
      (item) => item.id,
    );

  let foundImageMap =
    new Map<
      string,
      string
    >();

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
        nullsFirst: false,
      });

    foundImageMap =
      await imageMap(
        (rawImages ??
          []) as FoundImage[],
      );
  }

  /* ------------------------------------------------------------------------
     POSSIBLE MATCHES
     ------------------------------------------------------------------------ */

  const shouldCalculateMatches =
    items.length > 0 &&
    (hasFilters ||
      totalCount <= 100);

  const bestMatchByFoundId =
    new Map<
      string,
      MatchResult
    >();

  if (
    shouldCalculateMatches
  ) {
    const lostItems =
      await fetchLostCandidates(
        supabase,
        category,
        city,
      );

    for (const found of items) {
      let best:
        | MatchResult
        | null = null;

      for (const lost of lostItems) {
        const result =
          calculateMatch(
            {
              id: found.id,
              title: found.title,
              category: found.category,
              city: found.city,
              province: found.province,
              approximate_location:
                found.approximate_location,
              date: found.date_found,
              description: found.description,
              distinguishing_features:
                found.distinguishing_features,
            } satisfies MatchableItem,
            {
              id: lost.id,
              title: lost.title,
              category: lost.category,
              city: lost.city,
              province: lost.province,
              approximate_location:
                lost.approximate_location,
              date: lost.date_lost,
              description: lost.description,
              distinguishing_features:
                lost.distinguishing_features,
            } satisfies MatchableItem,
          );

        if (
          result &&
          (!best ||
            result.score >
              best.score)
        ) {
          best = result;

          /**
           * If we already found a very strong
           * candidate, there is little value in
           * checking every remaining candidate.
           */
          if (
            best.score >=
            MATCH_THRESHOLDS.strong
          ) {
            break;
          }
        }
      }

      if (best) {
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

  const resultEnd =
    Math.min(
      rangeStart +
        items.length,
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

  const chips: {
    label: string;
    href: string;
  }[] = [];

  if (q) {
    chips.push({
      label: `Search: ${q}`,
      href: buildHref({
        page: 1,
        q: "",
        category,
        city,
        sort,
      }),
    });
  }

  if (category) {
    chips.push({
      label: `Category: ${categoryLabel}`,
      href: buildHref({
        page: 1,
        q,
        category: "",
        city,
        sort,
      }),
    });
  }

  if (city) {
    chips.push({
      label: `Location: ${city}`,
      href: buildHref({
        page: 1,
        q,
        category,
        city: "",
        sort,
      }),
    });
  }

  /* ------------------------------------------------------------------------
     UI
     ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">

        {/* ==================================================================
            HERO
            ================================================================== */}

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
          ctaHref={
            ROUTES.reportFound
          }
          ctaLabel="Report something you found"
          secondaryHref={
            ROUTES.lost
          }
          secondaryLabel="Browse lost items"
          trust={[
            {
              icon: ShieldCheck,
              label:
                "Verified community",
            },
            {
              icon: Lock,
              label:
                "Private contact",
            },
            {
              icon: Heart,
              label:
                "Free to post",
            },
          ]}
        />

        {/* ==================================================================
            STATS
            ================================================================== */}

        <ListingStats
          accent="found"
          activeCount={
            stats.activeCount
          }
          totalCount={
            stats.totalCount
          }
          noun="found"
        />

        {/* ==================================================================
            SEARCH
            ================================================================== */}

        <div className="mt-6">
          <ListingSearch
            accent="found"
            idPrefix="found"
            q={q}
            category={category}
            city={city}
            sort={sort}
            maxLength={
              MAX_QUERY_LENGTH
            }
            buttonLabel="Find matches"
            chips={chips}
            clearAllHref={
              ROUTES.found
            }
          />
        </div>

        {/* ==================================================================
            CATEGORIES
            ================================================================== */}

        <ListingCategories
          accent="found"
          activeCategory={
            category
          }
          counts={
            stats.categoryCounts
          }
          buildHref={(
            itemCategory,
          ) =>
            buildHref({
              page: 1,
              q,
              category:
                itemCategory,
              city,
              sort,
            })
          }
        />

        {/* ==================================================================
            GUIDE
            ================================================================== */}

        <ListingGuide
          accent="found"
        />

        {/* ==================================================================
            RETURN JOURNEY â€” REPORT â†’ VERIFY â†’ CONNECT â†’ RETURN
            ================================================================== */}

        <section
          aria-label="How returning works"
          className="mt-8 rounded-[2rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white/60 p-6 backdrop-blur sm:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
            The return journey
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">
            From your hands back home.
          </h2>
          <ol className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                label: "REPORT",
                description:
                  "Describe what you found â€” item name, category, where and when. Add a photo so the owner can recognize it.",
              },
              {
                number: "02",
                label: "VERIFY",
                description:
                  "When someone claims it, ask them to describe a detail you kept private. Confirm ownership before anything else.",
              },
              {
                number: "03",
                label: "CONNECT",
                description:
                  "Message through FindBack. No phone numbers or personal contact details needed on the public report.",
              },
              {
                number: "04",
                label: "RETURN",
                description:
                  "Meet somewhere visible and staffed â€” a barangay hall or mall guard station â€” and complete the handover.",
              },
            ].map((s) => (
              <li key={s.number} className="border-t border-emerald-200/70 pt-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-600">{s.number}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">
                    {s.label}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {s.description}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-slate-600">
            <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <span className="font-semibold text-navy-900">Finder&apos;s reminder:</span> never publish
              full ID numbers, phone numbers, or exact private addresses on a public report â€” verify
              ownership privately instead.
            </span>
          </p>
        </section>

        {/* ==================================================================
            ERROR
            ================================================================== */}

        {combinedError ? (
          <div className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/60 px-6 py-12 text-center backdrop-blur">
            <span
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-500 shadow-sm"
            >
              <AlertTriangle
                size={22}
              />
            </span>

            <p className="mt-4 font-display text-base font-semibold text-navy-900">
              We hit a snag loading
              reports
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-600">
              This is usually
              temporary. Give it
              another go â€” your
              filters will stay
              exactly where you
              left them.
            </p>

            <Link
              href={
                ROUTES.found
              }
              className="btn-primary mt-5 inline-flex h-9 items-center justify-center"
            >
              Try again
            </Link>
          </div>
        ) : items.length > 0 ? (
          <>
            {/* ==============================================================
                RESULTS HEADER
                ============================================================== */}

            <ListingResultsHeader
              accent="found"
              title={
                hasFilters
                  ? "Possible matches"
                  : "Recently found"
              }
              count={`${totalCount.toLocaleString()} ${
                totalCount === 1
                  ? "report"
                  : "reports"
              }`}
              description={
                hasFilters
                  ? `Showing ${resultStart.toLocaleString()}â€“${resultEnd.toLocaleString()} reports matching your search.`
                  : "Browse the latest reports from the community."
              }
              sort={sort}
              hiddenFields={[
                {
                  name: "q",
                  value: q,
                },
                {
                  name: "category",
                  value:
                    category,
                },
                {
                  name: "city",
                  value: city,
                },
              ].filter(
                (field) =>
                  Boolean(
                    field.value,
                  ),
              )}
              viewAllHref={
                ROUTES.found
              }
            />

            {/* ==============================================================
                RESULTS GRID
                ============================================================== */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(
                (
                  item,
                  index,
                ) => {
                  const match =
                    bestMatchByFoundId.get(
                      item.id,
                    );

                  const matchLabel =
                    match?.strength ===
                    "strong"
                      ? "Strong match"
                      : match?.strength ===
                          "likely"
                        ? "Likely match"
                        : "Possible match";

                  return (
                    <Reveal
                      key={
                        item.id
                      }
                      delay={
                        (index %
                          6) *
                        35
                      }
                      className="h-full"
                    >
                      <article className="group relative h-full">

                        {/* ==================================================
                            MATCH BANNER
                            ================================================== */}

                        {match && (
                          <div className="relative z-10 mb-[-1px] overflow-hidden rounded-t-[1.125rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
                            <div className="flex items-center justify-between gap-3 px-4 py-3">

                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                                  <Target
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5 text-emerald-600"
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                                    {match.score}%{" "}
                                    {matchLabel}
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] text-emerald-600/70">
                                    {match.signals[0] ??
                                      "Similar details"}
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0 rounded-full border border-emerald-200 bg-white/70 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                Review
                              </span>
                            </div>
                          </div>
                        )}

                        {/* ==================================================
                            ITEM CARD
                            ================================================== */}

                        <ItemCard
                          href={`${ROUTES.found}/${item.id}`}
                          title={
                            item.title
                          }
                          category={
                            item.category
                          }
                          city={
                            item.city ??
                            ""
                          }
                          province={
                            item.province ??
                            ""
                          }
                          reported={reportedLabel(
                            item.created_at,
                          )}
                          description={
                            item.description ??
                            ""
                          }
                          kind="found"
                          imageUrl={foundImageMap.get(
                            item.id,
                          )}
                        />

                        {/* ==================================================
                            MATCH SIGNALS
                            ================================================== */}

                        {match &&
                          match
                            .signals
                            .length >
                            1 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                              {match.signals
                                .slice(
                                  1,
                                )
                                .map(
                                  (
                                    signal,
                                  ) => (
                                    <span
                                      key={
                                        signal
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-600"
                                    >
                                      <Check
                                        aria-hidden="true"
                                        className="h-2.5 w-2.5 text-emerald-500"
                                      />
                                      {
                                        signal
                                      }
                                    </span>
                                  ),
                                )}
                            </div>
                          )}
                      </article>
                    </Reveal>
                  );
                },
              )}
            </div>

            {/* ==============================================================
                PAGINATION
                ============================================================== */}

            {totalPages >
              1 && (
              <nav
                aria-label="Found item pagination"
                className="mt-10 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur sm:flex-row"
              >
                <p className="text-xs text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-navy-900">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-navy-900">
                    {
                      totalPages
                    }
                  </span>
                </p>

                <div className="flex gap-2">

                  {/* Previous */}

                  {!isFirstPage ? (
                    <Link
                      href={
                        previousHref
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
                    >
                      <ArrowLeft
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-xs font-medium text-slate-400">
                      <ArrowLeft
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                      Previous
                    </span>
                  )}

                  {/* Next */}

                  {!isLastPage ? (
                    <Link
                      href={
                        nextHref
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
                    >
                      Next
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-xs font-medium text-slate-400">
                      Next
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                      />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : showEmpty ? (
          /* ================================================================
             EMPTY STATE
             ================================================================ */

          <ListingEmptyState
            accent="found"
            title={
              hasFilters
                ? "No matching found items"
                : "No found items yet"
            }
            description={
              hasFilters
                ? "Try changing your search, location, or category. You can also browse all found reports."
                : "Be the first to report something you found and help return it to its owner."
            }
            hasFilters={
              hasFilters
            }
            clearHref={
              ROUTES.found
            }
            reportHref={
              ROUTES.reportFound
            }
            reportLabel="Report found item"
          />
        ) : null}
      </div>

      {/* ====================================================================
          BOTTOM CTA
          ==================================================================== */}

      <section
        aria-label="Post a report"
        className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-emerald-950 via-navy-900 to-blue-950 px-6 py-12 text-center shadow-[0_35px_100px_-25px_rgba(15,23,42,0.5)] sm:px-12">

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
          />

          <h2 className="relative font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Found something?
            Don&apos;t let it
            wait.
          </h2>

          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-100/90 sm:text-base">
            Post a found report
            in under a minute â€”
            we&apos;ll compare it
            against active lost
            reports and help you
            arrange a safe return.
          </p>

          <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={
                ROUTES.reportFound
              }
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl"
            >
              Report a found item

              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </Link>

            <Link
              href={ROUTES.lost}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              Browse lost items
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
