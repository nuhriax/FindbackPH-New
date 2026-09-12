import { CATEGORIES } from "@/lib/validation";
import type { ItemCategory } from "@/types/database";

/**
 * Discover page — URL/param contract and query-state helpers.
 *
 * Everything about how the feed's state is encoded in the URL lives here so
 * the page component stays pure orchestration and every control (search form,
 * dropdowns, chips, pagination) builds hrefs through the same function.
 */

export const ROUTES = {
  explore: "/discover",
  reportLost: "/report/lost",
  reportFound: "/report/found",
} as const;

/** Items rendered per page in the merged feed. */
export const PAGE_SIZE = 24;

/**
 * Deep pages used to transfer `page × PAGE_SIZE` rows per table before slicing
 * to a single page — up to 4,800 rows of JSON for page 200. The feed is clamped
 * to this window instead: page 20 is the deepest reachable page, and
 * `totalPages` is reported clamped so pagination never shows a dead page.
 */
export const MAX_FEED_PAGES = 20;

export type SearchParamValue = string | string[] | undefined;

export type SearchParams = {
  category?: SearchParamValue;
  city?: SearchParamValue;
  province?: SearchParamValue;
  when?: SearchParamValue;
  type?: SearchParamValue;
  page?: SearchParamValue;
  sort?: SearchParamValue;
};

export type FeedType = "all" | "lost" | "found";

export type SortOption = "newest" | "oldest" | "recently-updated";

export type DateFilter = "any" | "today" | "week" | "month" | "older";

/**
 * The fully-validated feed state — every value is normalized and safe to
 * render or hand to Supabase without further checks.
 */
export type DiscoverQuery = {
  category: string;
  city: string;
  province: string;
  when: DateFilter;
  type: FeedType;
  sort: SortOption;
  page: number;
};

export function getParam(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export function normalizeParam(value: string, maxLength = 100): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function parsePage(value: SearchParamValue): number {
  const parsed = Number.parseInt(getParam(value), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, MAX_FEED_PAGES);
}

export function isValidCategory(value: string): value is ItemCategory {
  return CATEGORIES.includes(value as ItemCategory);
}

export function isValidSort(value: string): value is SortOption {
  return value === "newest" || value === "oldest" || value === "recently-updated";
}

export function isValidType(value: string): value is FeedType {
  return value === "all" || value === "lost" || value === "found";
}

export function isValidDateFilter(value: string): value is DateFilter {
  return (
    value === "any" ||
    value === "today" ||
    value === "week" ||
    value === "month" ||
    value === "older"
  );
}

/**
 * Parse raw searchParams into the validated feed state. Invalid values fall
 * back to defaults instead of erroring, so a hand-edited URL always renders.
 */
export function parseDiscoverParams(params: SearchParams): DiscoverQuery {
  const rawCategory = normalizeParam(getParam(params.category), 50);
  const category = isValidCategory(rawCategory) ? rawCategory : "";

  const city = normalizeParam(getParam(params.city));

  const rawType = normalizeParam(getParam(params.type), 10).toLowerCase();
  const type: FeedType = isValidType(rawType) ? rawType : "all";

  const rawSort = normalizeParam(getParam(params.sort), 30).toLowerCase();
  const sort: SortOption = isValidSort(rawSort) ? rawSort : "newest";

  const rawWhen = normalizeParam(getParam(params.when), 20).toLowerCase();
  const when: DateFilter = isValidDateFilter(rawWhen) ? rawWhen : "any";

  const province = normalizeParam(getParam(params.province));

  return {
    category,
    city,
    province,
    when,
    type,
    sort,
    page: parsePage(params.page),
  };
}

/**
 * Build a /discover href for the given feed state. Unset/neutral values are
 * omitted so URLs stay clean and shareable.
 */
export function buildPageHref(
  baseParams: DiscoverQuery,
  overrides: Partial<DiscoverQuery>
): string {
  const params = new URLSearchParams();
  const current = {
    ...baseParams,
    ...overrides,
  };

  if (current.category) params.set("category", current.category);
  if (current.city) params.set("city", current.city);
  if (current.province) params.set("province", current.province);
  if (current.when !== "any") params.set("when", current.when);
  if (current.type !== "all") params.set("type", current.type);
  if (current.sort !== "newest") params.set("sort", current.sort);
  if (current.page > 1) params.set("page", String(current.page));

  const query = params.toString();

  return query ? `${ROUTES.explore}?${query}` : ROUTES.explore;
}

/** UTC-day boundaries behind the "when" filter options. */
export function dateFilterRange(
  when: DateFilter
): {
  from?: string;
  to?: string;
} {
  if (when === "any") {
    return {};
  }

  const now = new Date();

  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const toIso = (date: Date) => date.toISOString();

  if (when === "today") {
    return { from: toIso(startOfToday) };
  }

  if (when === "week") {
    return {
      from: toIso(
        new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000)
      ),
    };
  }

  if (when === "month") {
    return {
      from: toIso(
        new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000)
      ),
    };
  }

  if (when === "older") {
    return {
      to: toIso(
        new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)
      ),
    };
  }

  return {};
}

/** True when any filter that narrows the feed is active. */
export function hasActiveFilters(query: DiscoverQuery): boolean {
  return Boolean(
    query.category || query.city || query.province || query.when !== "any"
  );
}