import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import {
  CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/validation";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
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

const MATCH_THRESHOLDS = {
  possible: 45,
  likely: 65,
  strong: 80,
} as const;

const MATCH_WEIGHTS = {
  category: 30,
  city: 20,
  province: 10,
  title: 20,
  description: 10,
  date: 10,
} as const;

/**
 * Words that are generally too generic to be useful
 * when comparing item descriptions.
 */
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "have",
  "has",
  "was",
  "were",
  "lost",
  "found",
  "item",
  "thing",
]);

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

type MatchStrength =
  | "possible"
  | "likely"
  | "strong";

type MatchResult = {
  score: number;
  strength: MatchStrength;
  matchedSignals: string[];
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
   Matching Helpers
   ========================================================================== */

function normalizeText(
  value: string | null,
): string {
  return (
    value
      ?.toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function normalizedWords(
  value: string | null,
): Set<string> {
  const normalized = normalizeText(value);

  if (!normalized) {
    return new Set();
  }

  return new Set(
    normalized
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(
        (word) =>
          word.length >= 3 &&
          !STOP_WORDS.has(word),
      ),
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

  return (
    matches /
    Math.max(left.size, right.size)
  );
}

function normalizeLocation(
  value: string | null,
): string {
  return normalizeText(value);
}

function sameLocation(
  a: string | null,
  b: string | null,
): boolean {
  const left = normalizeLocation(a);
  const right = normalizeLocation(b);

  if (!left || !right) {
    return false;
  }

  return (
    left === right ||
    left.includes(right) ||
    right.includes(left)
  );
}

function getDateMatchScore(
  foundDateValue: string | null,
  lostDateValue: string | null,
): number {
  const foundDate =
    parseDateOnly(foundDateValue);

  const lostDate =
    parseDateOnly(lostDateValue);

  if (!foundDate || !lostDate) {
    return 0;
  }

  const days = Math.abs(
    differenceInCalendarDays(
      foundDate,
      lostDate,
    ),
  );

  if (days <= 3) {
    return MATCH_WEIGHTS.date;
  }

  if (days <= 7) {
    return MATCH_WEIGHTS.date * 0.7;
  }

  if (days <= 30) {
    return MATCH_WEIGHTS.date * 0.4;
  }

  return 0;
}

function getMatchStrength(
  score: number,
): MatchStrength | null {
  if (
    score >= MATCH_THRESHOLDS.strong
  ) {
    return "strong";
  }

  if (
    score >= MATCH_THRESHOLDS.likely
  ) {
    return "likely";
  }

  if (
    score >= MATCH_THRESHOLDS.possible
  ) {
    return "possible";
  }

  return null;
}

function calculateMatch(
  found: FoundItem,
  lost: LostItem,
): MatchResult | null {
  let score = 0;

  const matchedSignals: string[] = [];

  /* ------------------------------------------------------------------------
     Category
     ------------------------------------------------------------------------ */

  if (
    found.category &&
    found.category === lost.category
  ) {
    score += MATCH_WEIGHTS.category;

    matchedSignals.push(
      "Same category",
    );
  }

  /* ------------------------------------------------------------------------
     City
     ------------------------------------------------------------------------ */

  if (
    sameLocation(
      found.city,
      lost.city,
    )
  ) {
    score += MATCH_WEIGHTS.city;

    matchedSignals.push(
      "Same city",
    );
  }

  /* ------------------------------------------------------------------------
     Province
     ------------------------------------------------------------------------ */

  if (
    sameLocation(
      found.province,
      lost.province,
    )
  ) {
    score += MATCH_WEIGHTS.province;

    matchedSignals.push(
      "Same province",
    );
  }

  /* ------------------------------------------------------------------------
     Title
     ------------------------------------------------------------------------ */

  const titleOverlap =
    wordOverlap(
      found.title,
      lost.title,
    );

  if (titleOverlap >= 0.5) {
    score += MATCH_WEIGHTS.title;

    matchedSignals.push(
      "Very similar item details",
    );
  } else if (titleOverlap >= 0.3) {
    score +=
      MATCH_WEIGHTS.title * 0.6;

    matchedSignals.push(
      "Similar item details",
    );
  } else if (titleOverlap >= 0.2) {
    score +=
      MATCH_WEIGHTS.title * 0.35;

    matchedSignals.push(
      "Related item details",
    );
  }

  /* ------------------------------------------------------------------------
     Description
     ------------------------------------------------------------------------ */

  const descriptionOverlap =
    wordOverlap(
      found.description,
      lost.description,
    );

  if (descriptionOverlap >= 0.3) {
    score += MATCH_WEIGHTS.description;

    matchedSignals.push(
      "Similar description",
    );
  } else if (
    descriptionOverlap >= 0.2
  ) {
    score +=
      MATCH_WEIGHTS.description * 0.5;

    matchedSignals.push(
      "Related description",
    );
  }

  /* ------------------------------------------------------------------------
     Dates
     ------------------------------------------------------------------------ */

  const dateScore =
    getDateMatchScore(
      found.date_found,
      lost.date_lost,
    );

  if (dateScore > 0) {
    score += dateScore;

    matchedSignals.push(
      "Close report dates",
    );
  }

  const normalizedScore = Math.min(
    Math.round(score),
    100,
  );

  const strength =
    getMatchStrength(
      normalizedScore,
    );

  if (!strength) {
    return null;
  }

  return {
    score: normalizedScore,
    strength,
    matchedSignals:
      matchedSignals.slice(0, 3),
  };
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
  supabase: ReturnType<
    typeof createClient
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
  supabase: ReturnType<
    typeof createClient
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
      date_lost,
      description
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
      "Found Items Philippines — Help Return Them",
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
    createClient();

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
          date_found,
          description,
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
            found,
            lost,
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
              another go — your
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
                  ? `Showing ${resultStart.toLocaleString()}–${resultEnd.toLocaleString()} reports matching your search.`
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
                                    {matchLabel}
                                  </p>

                                  <p className="mt-0.5 truncate text-[10px] text-emerald-600/70">
                                    {match.matchedSignals[0] ??
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
                            .matchedSignals
                            .length >
                            1 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                              {match.matchedSignals
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
            in under a minute —
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