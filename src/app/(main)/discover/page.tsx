import { createClient } from "@/lib/supabase/server";
import { trackServerEvent } from "@/lib/analytics";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
import { SortSelect } from "@/components/listing/sort-select";
import { CategoryScroller } from "@/components/listing/category-scroller";
import { FilterPopover } from "@/components/listing/filter-popover";
import { DiscoverResultsView } from "@/components/listing/discover-results-view";
import { MapMotif } from "@/components/map-motif";
import type { CategoryItem } from "@/components/listing/category-scroller";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";
import { PhilippinesMap } from "@/components/map/philippines-map";
import type { MapPoint } from "@/components/map/philippines-map-impl";
import { lookupCityCoords } from "@/lib/ph-locations";

import { CATEGORY_ICONS } from "@/lib/category-icons";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  HeartHandshake,
  LayoutGrid,
  Lightbulb,
  LockKeyhole,
  MapPin,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isValid } from "date-fns";
import type { ReactNode } from "react";

/* ==========================================================================
   Configuration
   ========================================================================== */

const PAGE_SIZE = 24;
const MAX_SEARCH_LENGTH = 100;
// Per-table fetch cap per page: page N needs the top N*PAGE_SIZE rows of each
// table (merged + re-sorted in memory). True totals come from separate
// count queries, so deep pages stay correct without pulling the whole table.

const ROUTES = {
  explore: "/discover",
  reportLost: "/report/lost",
  reportFound: "/report/found",
} as const;

/* ==========================================================================
   Types
   ========================================================================== */

type SearchParamValue = string | string[] | undefined;

type SearchParams = {
  q?: SearchParamValue;
  category?: SearchParamValue;
  city?: SearchParamValue;
  province?: SearchParamValue;
  when?: SearchParamValue;
  type?: SearchParamValue;
  page?: SearchParamValue;
  sort?: SearchParamValue;
};

type FeedType = "all" | "lost" | "found";
type SortOption = "newest" | "oldest" | "recently-updated";
type DateFilter = "any" | "today" | "week" | "month" | "older";

type FeedItem = {
  id: string;
  kind: "lost" | "found";
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  description: string | null;
  created_at: string;
  updated_at?: string | null;
  view_count?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Lost items only — offered reward, shown as a chip on the card. */
  reward_amount?: number | null;
};

/* ==========================================================================
   Helpers
   ========================================================================== */

function getParam(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

function normalizeSearch(value: string, maxLength = MAX_SEARCH_LENGTH): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parsePage(value: SearchParamValue): number {
  const raw = Number.parseInt(getParam(value), 10);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, 9999);
}

/** Bound how deep pagination will fetch (200 pages ≈ 4,800 rows/table max). */
function safePageUpperBound(page: number): number {
  return Math.min(Math.max(page, 1), 200);
}

function isValidCategory(value: string): value is (typeof CATEGORIES)[number] {
  return CATEGORIES.includes(value as (typeof CATEGORIES)[number]);
}

function isValidSort(value: string): value is SortOption {
  return value === "newest" || value === "oldest" || value === "recently-updated";
}

function isValidType(value: string): value is FeedType {
  return value === "all" || value === "lost" || value === "found";
}

function isValidDateFilter(value: string): value is DateFilter {
  return (
    value === "any" ||
    value === "today" ||
    value === "week" ||
    value === "month" ||
    value === "older"
  );
}

/** Start-of-day boundaries (UTC) for the Date reported filter. */
function dateFilterRange(when: DateFilter): { from?: string; to?: string } {
  if (when === "any") return {};
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const iso = (d: Date) => d.toISOString();
  if (when === "today") return { from: iso(startOfToday) };
  if (when === "week")
    return { from: iso(new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000)) };
  if (when === "month")
    return { from: iso(new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000)) };
  // Older than the last 30 days.
  return { to: iso(new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)) };
}

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  any: "Any time",
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
  older: "Older",
};

/** Discover shows the 9 spec categories; the rest stay searchable via Search + Filters. */
const DISCOVER_CATEGORIES: ItemCategory[] = [
  "phones",
  "wallets",
  "ids",
  "bags",
  "keys",
  "jewelry",
  "electronics",
  "documents",
  "other",
];

/** Short scroller labels keep every pill on one line; full names stay in Filters. */
const DISCOVER_CATEGORY_LABELS: Record<ItemCategory, string> = {
  ...CATEGORY_LABELS,
  phones: "Phones",
  ids: "IDs & Cards",
  bags: "Bags",
  jewelry: "Jewelry",
};

function reportedLabel(value: string): string {
  if (!value) return "Reported recently";
  const date = new Date(value);
  if (!isValid(date)) return "Reported recently";
  return `Reported ${formatDistanceToNow(date, { addSuffix: true })}`;
}

/**
 * Build the points plotted on the Explore page's Philippines map. A report is
 * placed at its saved pin when it has one, otherwise at its city's approximate
 * centroid (static lookup). Reports with neither are simply not plotted —
 * consistent with never exposing exact locations (mirrors /search).
 */
function buildMapPoints(items: FeedItem[]): MapPoint[] {
  const points: MapPoint[] = [];
  for (const item of items) {
    const coords =
      typeof item.latitude === "number" && typeof item.longitude === "number"
        ? ([item.latitude, item.longitude] as [number, number])
        : lookupCityCoords(item.city);
    if (!coords) continue;
    points.push({
      id: `${item.kind}-${item.id}`,
      kind: item.kind,
      // Public maps show a roughly 1 km area, not the reporter's exact pin.
      lat: Math.round(coords[0] * 100) / 100,
      lng: Math.round(coords[1] * 100) / 100,
      title: item.title,
      city: item.city,
      province: item.province,
      href: `/${item.kind}/${item.id}`,
      date: item.created_at,
    });
  }
  return points;
}

function buildPageHref({
  page,
  q,
  category,
  city,
  province,
  when,
  type,
  sort,
}: {
  page: number;
  q: string;
  category: string;
  city: string;
  province: string;
  when: DateFilter;
  type: FeedType;
  sort: SortOption;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (city) params.set("city", city);
  if (province) params.set("province", province);
  if (when !== "any") params.set("when", when);
  if (type !== "all") params.set("type", type);
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${ROUTES.explore}?${query}` : ROUTES.explore;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
/** PostgrestFilterBuilder — the chainable type returned after .select(). */
type FilterBuilder = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

/**
 * Shared filter pipeline for both tables so "Explore" results behave exactly like
 * the standalone Lost/Found pages (same search vector, category, city rules).
 * NOTE: must be called AFTER .select() — supabase-js only exposes filter
 * methods (.eq/.textSearch/.ilike) on the post-select builder.
 */
function applyFilters(
  query: FilterBuilder,
  filters: {
    q: string;
    category: string;
    city: string;
    province: string;
    when: DateFilter;
    sort: SortOption;
  },
  limitCount: number,
) {
  let out = query.eq("status", "active");

  if (filters.q) {
    out = out.textSearch("search_vector", filters.q, { type: "websearch" });
  }
  if (filters.category) {
    out = out.eq("category", filters.category);
  }
  if (filters.city) {
    out = out.ilike("city", `%${filters.city}%`);
  }
  if (filters.province) {
    out = out.ilike("province", `%${filters.province}%`);
  }
  const { from, to } = dateFilterRange(filters.when);
  if (from) out = out.gte("created_at", from);
  if (to) out = out.lt("created_at", to);

  const sortColumn =
    filters.sort === "recently-updated" ? "updated_at" : "created_at";
  return out
    .order(sortColumn, {
      ascending: filters.sort === "oldest",
      nullsFirst: false,
    })
    .limit(limitCount);
}

/** Exact row count for a filtered table — cheap head-only query. */
async function countRows(
  supabase: SupabaseClient,
  table: "lost_items" | "found_items",
  filters: { q: string; category: string; city: string; province: string; when: DateFilter },
): Promise<number> {
  let out = supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "active");
  if (filters.q) out = out.textSearch("search_vector", filters.q, { type: "websearch" });
  if (filters.category) out = out.eq("category", filters.category as ItemCategory);
  if (filters.city) out = out.ilike("city", `%${filters.city}%`);
  if (filters.province) out = out.ilike("province", `%${filters.province}%`);
  const { from, to } = dateFilterRange(filters.when);
  if (from) out = out.gte("created_at", from);
  if (to) out = out.lt("created_at", to);
  const { count } = await out;
  return count ?? 0;
}

type ImageRow = { storage_path: string } & Record<string, string | null>;

async function buildImageMap(
  rows: ImageRow[] | null,
  idKey: "lost_item_id" | "found_item_id",
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!rows) return map;

  const filtered = rows.filter(
    (row) => Boolean(row[idKey]) && Boolean(row.storage_path),
  );
  const signed = await getSignedImageUrls(filtered.map((r) => r.storage_path));

  filtered.forEach((row, idx) => {
    const id = row[idKey] as string;
    if (id && !map.has(id)) {
      map.set(id, signed[idx] ?? getImagePublicUrl(row.storage_path));
    }
  });

  return map;
}

/* ==========================================================================
   Page
   ========================================================================== */

export const metadata = {
  title: { absolute: "Discover — Lost & Found Reports Across the Philippines" },
  description:
    "Browse every active lost and found report across the Philippines in one community feed.",
};

/* ==========================================================================
   Filters form — shared by the desktop popover and the mobile drawer
   ========================================================================== */

const DATE_FILTER_OPTIONS: DateFilter[] = ["any", "today", "week", "month", "older"];

function CityFilterForm({
  idPrefix,
  q,
  category,
  city,
  province,
  when,
  sort,
  type,
}: {
  /** Unique per instance — the sidebar and the mobile drawer can both mount. */
  idPrefix: string;
  q: string;
  category: string;
  city: string;
  province: string;
  when: DateFilter;
  sort: string;
  type: FeedType;
}) {
  return (
    <form action={ROUTES.explore} method="get">
      <input type="hidden" name="q" value={q} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="type" value={type === "all" ? "" : type} />
      <input type="hidden" name="sort" value={sort} />
      <fieldset>
        <legend className="flex items-center gap-1.5 text-xs font-semibold text-navy-900">
          <MapPin size={12} aria-hidden="true" className="text-slate-400" />
          Location
        </legend>
        <label
          htmlFor={`${idPrefix}-city`}
          className="mt-2 block text-[11px] font-medium text-slate-500"
        >
          City or municipality
        </label>
        <input
          id={`${idPrefix}-city`}
          type="search"
          name="city"
          defaultValue={city}
          maxLength={80}
          placeholder="e.g. Quezon City"
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-navy-900 placeholder:text-slate-500 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
        <label
          htmlFor={`${idPrefix}-province`}
          className="mt-2 block text-[11px] font-medium text-slate-500"
        >
          Province or region
        </label>
        <input
          id={`${idPrefix}-province`}
          type="search"
          name="province"
          defaultValue={province}
          maxLength={80}
          placeholder="e.g. Cebu"
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-navy-900 placeholder:text-slate-500 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs font-semibold text-navy-900">
          Date reported
        </legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DATE_FILTER_OPTIONS.map((option) => (
            <label
              key={option}
              className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-xs font-medium transition-colors has-checked:border-teal-700 has-checked:bg-teal-700 has-checked:text-white ${
                option === when
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              <input
                type="radio"
                name="when"
                value={option === "any" ? "" : option}
                defaultChecked={option === when}
                className="sr-only"
              />
              {DATE_FILTER_LABELS[option]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-teal-700 text-xs font-semibold text-white transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/30"
        >
          Apply filters
        </button>
      </div>
      {(city || province || when !== "any") && (
        <p className="mt-2 text-[11px] text-slate-500">
          Filtering by{" "}
          {[city, province, when !== "any" ? DATE_FILTER_LABELS[when] : ""]
            .filter(Boolean)
            .map((part) => `“${part}”`)
            .join(" · ")}
        </p>
      )}
    </form>
  );
}

/* ==========================================================================
   Page-number window for pagination: 1 … (c-1) c (c+1) … total
   ========================================================================== */

function buildPageItems(
  current: number,
  total: number,
): Array<number | "gap-l" | "gap-r"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: Array<number | "gap-l" | "gap-r"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("gap-l");
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < total - 1) items.push("gap-r");
  items.push(total);
  return items;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const q = normalizeSearch(getParam(params.q));
  // Surface silent truncation instead of quietly dropping the user's words.
  const searchTruncated = getParam(params.q).trim().length > MAX_SEARCH_LENGTH;
  const rawCategory = normalizeSearch(getParam(params.category), 50);
  const category = isValidCategory(rawCategory) ? rawCategory : "";
  const city = normalizeSearch(getParam(params.city));
  const rawType = normalizeSearch(getParam(params.type), 10);
  const type: FeedType = isValidType(rawType) ? rawType : "all";
  const rawSort = normalizeSearch(getParam(params.sort), 30);
  const sort: SortOption = isValidSort(rawSort) ? rawSort : "newest";
  const rawWhen = normalizeSearch(getParam(params.when), 10).toLowerCase();
  const when: DateFilter = isValidDateFilter(rawWhen) ? rawWhen : "any";
  const province = normalizeSearch(getParam(params.province));
  const page = parsePage(params.page);

  const hasFilters = Boolean(q || category || city || province || when !== "any");
  const filters = { q, category, city, province, when, sort };

  /* ------------------------------------------------------------------------
     Query both tables (bounded per page), merge, paginate. Exact totals come
     from head-only count queries so pagination is correct at any depth.
     ------------------------------------------------------------------------ */

  // Page N of the merged feed can draw from the top N*PAGE_SIZE of each table.
  const perTableLimit = safePageUpperBound(page) * PAGE_SIZE;

  const [lostRes, foundRes, lostCount, foundCount] = await Promise.all([
    applyFilters(
      supabase.from("lost_items").select(
        "id, title, category, city, province, description, created_at, updated_at, view_count, latitude, longitude, reward_amount",
      ),
      filters,
      perTableLimit,
    ),
    applyFilters(
      supabase.from("found_items").select(
        "id, title, category, city, province, description, created_at, updated_at, view_count, latitude, longitude",
      ),
      filters,
      perTableLimit,
    ),
    countRows(supabase, "lost_items", filters),
    countRows(supabase, "found_items", filters),
  ]);

  const error = lostRes.error ?? foundRes.error;

  const lostItems: FeedItem[] = ((lostRes.data ?? []) as Omit<FeedItem, "kind">[]).map(
    (item) => ({ ...item, kind: "lost" as const }),
  );
  const foundItems: FeedItem[] = ((foundRes.data ?? []) as Omit<FeedItem, "kind">[]).map(
    (item) => ({ ...item, kind: "found" as const }),
  );

  // Type tab filter before pagination so tabs/counts always reflect reality.
  const pool =
    type === "lost"
      ? lostItems
      : type === "found"
        ? foundItems
        : [...lostItems, ...foundItems];

  pool.sort((a, b) => {
    const aKey =
      (sort === "recently-updated" ? a.updated_at : a.created_at) ?? a.created_at;
    const bKey =
      (sort === "recently-updated" ? b.updated_at : b.created_at) ?? b.created_at;
    return sort === "oldest"
      ? aKey.localeCompare(bKey)
      : bKey.localeCompare(aKey);
  });

  const totalCount =
    type === "lost" ? lostCount : type === "found" ? foundCount : lostCount + foundCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rangeStart = (safePage - 1) * PAGE_SIZE;
  const items = pool.slice(rangeStart, rangeStart + PAGE_SIZE);

  // Product analytics: which filters do people use, and do searches return
  // anything? Only the PRESENCE of a query is recorded — never the query text
  // itself — so no personal content lands in the analytics table.
  await trackServerEvent("search_performed", "search", {
    has_query: Boolean(q),
    has_category: Boolean(category),
    has_city: Boolean(city),
    has_province: Boolean(province),
    has_date: when !== "any",
    type,
    sort,
    page,
    result_count: totalCount,
  });

  /* ------------------------------------------------------------------------
     Fetch first image for each result on this page
     ------------------------------------------------------------------------ */

  const lostIds = items.filter((i) => i.kind === "lost").map((i) => i.id);
  const foundIds = items.filter((i) => i.kind === "found").map((i) => i.id);

  const [lostImageRes, foundImageRes] = await Promise.all([
    lostIds.length
      ? supabase
          .from("item_images")
          .select("lost_item_id, storage_path")
          .in("lost_item_id", lostIds)
          .eq("position", 0)
      : Promise.resolve({ data: null }),
    foundIds.length
      ? supabase
          .from("item_images")
          .select("found_item_id, storage_path")
          .in("found_item_id", foundIds)
          .eq("position", 0)
      : Promise.resolve({ data: null }),
  ]);

  const [lostImageMap, foundImageMap] = await Promise.all([
    buildImageMap(
      lostImageRes.data as Array<{ lost_item_id: string; storage_path: string }> | null,
      "lost_item_id",
    ),
    buildImageMap(
      foundImageRes.data as Array<{ found_item_id: string; storage_path: string }> | null,
      "found_item_id",
    ),
  ]);

  const imageMap = new Map<string, string>([...lostImageMap, ...foundImageMap]);

  /* ------------------------------------------------------------------------
     Derived state
     ------------------------------------------------------------------------ */

  const hasResults = items.length > 0;
  const isFirstPage = safePage === 1;
  const isLastPage = safePage >= totalPages;
  const resultStart = totalCount === 0 ? 0 : rangeStart + 1;
  const resultEnd = Math.min(rangeStart + items.length, totalCount);

  const hrefFor = (overrides: Partial<Parameters<typeof buildPageHref>[0]>) =>
    buildPageHref({ page: safePage, q, category, city, province, when, type, sort, ...overrides });

  const previousHref = hrefFor({ page: safePage - 1 });
  const nextHref = hrefFor({ page: safePage + 1 });
  const clearHref = buildPageHref({
    page: 1,
    q: "",
    category: "",
    city: "",
    province: "",
    when: "any",
    type,
    sort,
  });

  const typeTabs: Array<{ label: string; value: FeedType; count: number }> = [
    { label: "All reports", value: "all", count: lostCount + foundCount },
    { label: "Lost", value: "lost", count: lostCount },
    { label: "Found", value: "found", count: foundCount },
  ];

  /* Shared header fragments — one source of truth reused by the results,
     empty, and error branches so the header never drifts between states. */
  const feedHeader = (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <span aria-hidden="true" className="h-px w-6 bg-teal-500/70" />
        The community feed
        <span className="ml-1 font-semibold normal-case tracking-normal text-slate-400">
          {hasResults
            ? `${resultStart.toLocaleString()}–${resultEnd.toLocaleString()} of ${totalCount.toLocaleString()}`
            : `${totalCount.toLocaleString()} ${totalCount === 1 ? "report" : "reports"}`}
          {city ? ` · ${city}` : ""}
          {province && province !== city ? ` · ${province}` : ""}
        </span>
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy-900">
        {hasFilters ? "Matching reports" : "Fresh from your neighbors"}
      </h2>
    </div>
  );

  /* Segmented control — the three report types read as one grouped switch */
  const typeTablist = (
    <div
      className="inline-flex w-full items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto"
      role="tablist"
      aria-label="Report type"
    >
      {typeTabs.map((tab) => {
        const active = type === tab.value;
        return (
          <Link
            key={tab.value}
            href={buildPageHref({
              page: 1,
              q,
              category,
              city,
              province,
              when,
              sort,
              type: tab.value,
            })}
            role="tab"
            aria-selected={active}
            className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-all sm:flex-none ${
              active
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
            }`}
          >
            {tab.value === "lost" && (
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${active ? "bg-red-300" : "bg-red-500"}`}
              />
            )}
            {tab.value === "found" && (
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${active ? "bg-emerald-300" : "bg-emerald-500"}`}
              />
            )}
            {tab.label}
            <span
              className={`inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );

  // Map markers for the current feed (pins first, city centroids as fallback).
  const mapPoints = buildMapPoints(pool);

  return (
    <main
      id="discover-top"
      className="relative flex-1 bg-[linear-gradient(to_bottom,#f0fdfa_0%,rgba(240,253,250,0.6)_20rem,rgba(240,253,250,0.15)_34rem,rgba(240,253,250,0)_46rem)]"
    >
      {/* ================= SEARCH BAND — compact, content-first ================= */}
      <section
        aria-label="Search community reports"
        className="relative overflow-hidden"
      >
        {/* Ambient layer — slim glows + a dot grid keep depth without a tall hero.
            A bottom mask feathers the glows out so the teal tint blends into the
            warm-sand page background instead of stopping at a hard edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent_98%)]"
        >
          <div className="absolute -left-32 -top-44 h-[22rem] w-[22rem] rounded-full bg-teal-200/45 blur-3xl animate-glow-drift" />
          <div className="absolute -right-24 top-6 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "radial-gradient(rgba(15,123,122,0.16) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(ellipse 85% 75% at 50% 0%, black 25%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 0%, black 25%, transparent 78%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-2 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            {/* Left — one-line positioning statement */}
            <div className="max-w-xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800 shadow-sm backdrop-blur">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
                Community lost &amp; found · Philippines
              </p>
              <h1 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight text-navy-900 sm:text-4xl">
                Find what you&apos;re{" "}
                <span className="relative inline-block">
                  looking for.
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1.5 left-0 h-2.5 w-full text-teal-400"
                  >
                    <path d="M2 9 C 60 2, 150 2, 218 8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.75" />
                  </svg>
                </span>
              </h1>
              <p className="mt-2 text-[15px] leading-6 text-slate-600">
                Browse every lost &amp; found report nationwide — free to post,
                private by default.
              </p>
            </div>

            {/* Right — search command bar: What + Where + Search in one row on sm+ */}
            <div className="w-full max-w-2xl lg:max-w-xl">
              <form
                action="/discover"
                method="get"
                role="search"
                aria-label="Search reports"
                className="relative w-full overflow-hidden rounded-2xl border border-teal-100/80 bg-white/95 p-3 text-left shadow-glow transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-600/15 sm:p-3.5"
              >
                {/* Gradient hairline — a quiet premium cue */}
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />
                <input type="hidden" name="type" value={type === "all" ? "" : type} />
                <input type="hidden" name="category" value={category} />
                <input type="hidden" name="province" value={province} />
                <input type="hidden" name="when" value={when === "any" ? "" : when} />
                <input type="hidden" name="sort" value={sort} />

                {/* Fields — What + Where + Search share one row on sm+ */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-600/15">
                    <span aria-hidden="true" className="shrink-0 text-slate-400">
                      <Search size={17} />
                    </span>
                    <input
                      id="explore-search"
                      type="search"
                      name="q"
                      defaultValue={q}
                      maxLength={MAX_SEARCH_LENGTH}
                      aria-label="What are you looking for"
                      placeholder="What? e.g. black wallet"
                      className="h-11 w-full bg-transparent text-[15px] text-navy-900 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-600/15">
                    <span aria-hidden="true" className="shrink-0 text-teal-700">
                      <MapPin size={16} />
                    </span>
                    <input
                      id="explore-city"
                      type="search"
                      name="city"
                      defaultValue={city}
                      maxLength={80}
                      aria-label="City or province"
                      placeholder="Where? e.g. Cebu"
                      className="h-11 w-full bg-transparent text-sm text-navy-900 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/30 active:scale-[0.99]"
                  >
                    Search
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>

                {/* Popular shortcuts */}
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Popular:</span>
                  {[
                    { label: "Wallet", q: "wallet" },
                    { label: "Phone", q: "phone" },
                    { label: "ID", q: "ID" },
                    { label: "Keys", q: "keys" },
                    { label: "Bag", q: "bag" },
                    { label: "AirPods", q: "AirPods" },
                    { label: "Documents", q: "documents" },
                  ].map((term) => (
                    <Link
                      key={term.q}
                      href={hrefFor({ page: 1, q: term.q })}
                      className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {term.label}
                    </Link>
                  ))}
                </p>
              </form>
              {searchTruncated && (
                <p role="status" className="mx-auto mt-2 text-xs text-amber-700">
                  Your search was cut to the first {MAX_SEARCH_LENGTH} characters.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= STICKY CONTROL DOCK — one control zone ================= */}
      <div className="sticky top-[72px] z-30 px-4 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/80 bg-white/95 p-2 pl-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Report-type tabs — the primary segmentation lives with the controls */}
            {typeTablist}

            <span aria-hidden="true" className="hidden h-7 w-px shrink-0 bg-slate-200 md:block" />

            {/* Category rail — full-width row on mobile, inline from md up */}
            <div className="order-last w-full min-w-0 md:order-none md:flex-1">
              <CategoryScroller
                activeKey={category}
                ariaLabel="Categories"
                items={([
                  { key: "", label: "All", icon: <LayoutGrid size={20} /> },
                  ...DISCOVER_CATEGORIES.map((c) => ({
                    key: c,
                    label: DISCOVER_CATEGORY_LABELS[c],
                    icon: CATEGORY_ICONS[c],
                  })),
                ] as Array<{ key: string; label: string; icon: ReactNode }>).map(
                  (cat) => ({
                    key: cat.key,
                    label: cat.label,
                    icon: cat.icon,
                    href: hrefFor({ page: 1, category: cat.key }),
                  }),
                ) satisfies CategoryItem[]}
              />
            </div>

          {/* Refine controls: Filters · Sort · Clear */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <FilterPopover
              label={
                <>
                  <SlidersHorizontal size={13} aria-hidden="true" />
                  <span className="hidden md:inline">Filters</span>
                </>
              }
              badge={
                city || province || when !== "any" ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                    {[city, province, when !== "any" ? "when" : ""].filter(Boolean).length}
                  </span>
                ) : undefined
              }
            >
              <CityFilterForm
                idPrefix="discover-bar"
                q={q}
                category={category}
                city={city}
                province={province}
                when={when}
                sort={sort}
                type={type}
              />
              {hasFilters && (
                <Link
                  href={clearHref}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                  Clear all filters
                </Link>
              )}
            </FilterPopover>

            <form action={ROUTES.explore} method="get" className="relative shrink-0">
              <input type="hidden" name="q" value={q} />
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="city" value={city} />
              <input type="hidden" name="province" value={province} />
              <input type="hidden" name="when" value={when === "any" ? "" : when} />
              <input type="hidden" name="type" value={type === "all" ? "" : type} />
              <SortSelect defaultValue={sort} accent="lost" />
            </form>

            {hasFilters && (
              <Link
                href={clearHref}
                aria-label="Clear all filters"
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Clear</span>
              </Link>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* ================= RESULTS WORKSPACE — feed + map rail ================= */}
      <div id="feed" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {error ? (
          <>
            <div className="mb-6">{feedHeader}</div>
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/60 px-6 py-12 text-center backdrop-blur">
            <span
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-500 shadow-sm"
            >
              <AlertTriangle size={22} />
            </span>
            <p className="mt-4 font-display text-base font-semibold text-navy-900">
              Something went wrong.
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-600">
              We couldn&apos;t load the reports right now. Please try again.
            </p>
            <Link
              href={ROUTES.explore}
              className="btn-primary mt-5 inline-flex h-9 items-center justify-center"
            >
              Try again
            </Link>
            </div>
          </>
        ) : hasResults ? (
          <DiscoverResultsView
            headerLeft={feedHeader}
            recoveryHint={
              <>
                <Lightbulb size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-teal-600" />
                <p className="text-xs leading-5 text-slate-600">
                  <span className="font-semibold text-navy-900">
                    Found a possible match?
                  </span>{" "}
                  Open the report to check its details, then start a secure
                  recovery request.
                </p>
              </>
            }
            map={
              mapPoints.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-navy-900">Approximate report locations</p>
                      <p className="mt-0.5 text-xs text-slate-500">Markers are deliberately imprecise to protect reporters.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <LockKeyhole size={13} aria-hidden="true" /> Privacy protected
                    </span>
                  </div>
                  <div className="h-[420px] sm:h-[520px] xl:h-[560px]">
                    <PhilippinesMap mode="view" points={mapPoints} />
                  </div>
                </div>
              ) : undefined
            }
          >
            {/* Active filter chips — filter context sits right above the cards */}
            {(category || q || city || province || when !== "any") && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {category && (
                  <Link
                    href={hrefFor({ page: 1, category: "" })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-teal-300 hover:text-teal-700"
                  >
                    {CATEGORY_LABELS[category as ItemCategory]}
                    <X aria-hidden="true" className="h-3 w-3 text-slate-400" />
                  </Link>
                )}
                {city && (
                  <Link
                    href={hrefFor({ page: 1, city: "" })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-teal-300 hover:text-teal-700"
                  >
                    <MapPin aria-hidden="true" className="h-3 w-3 text-slate-400" />
                    {city}
                    <X aria-hidden="true" className="h-3 w-3 text-slate-400" />
                  </Link>
                )}
                {province && (
                  <Link
                    href={hrefFor({ page: 1, province: "" })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-teal-300 hover:text-teal-700"
                  >
                    <MapPin aria-hidden="true" className="h-3 w-3 text-slate-400" />
                    {province}
                    <X aria-hidden="true" className="h-3 w-3 text-slate-400" />
                  </Link>
                )}
                {when !== "any" && (
                  <Link
                    href={hrefFor({ page: 1, when: "any" })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-teal-300 hover:text-teal-700"
                  >
                    {DATE_FILTER_LABELS[when]}
                    <X aria-hidden="true" className="h-3 w-3 text-slate-400" />
                  </Link>
                )}
                {q && (
                  <Link
                    href={hrefFor({ page: 1, q: "" })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-teal-300 hover:text-teal-700"
                  >
                    &ldquo;{q}&rdquo;
                    <X aria-hidden="true" className="h-3 w-3 text-slate-400" />
                  </Link>
                )}
                <Link
                  href={buildPageHref({
                    page: 1,
                    q: "",
                    category: "",
                    city: "",
                    province: "",
                    when: "any",
                    sort,
                    type,
                  })}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-full px-2 text-xs font-semibold text-slate-500 underline-offset-4 transition hover:text-red-600 hover:underline"
                >
                  <X aria-hidden="true" className="h-3 w-3" />
                  Clear all
                </Link>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {items.map((item, index) => (
                <Reveal
                  key={`${item.kind}-${item.id}`}
                  delay={(index % 6) * 35}
                  className="h-full"
                >
                  <ItemCard
                    href={`/${item.kind}/${item.id}`}
                    title={item.title}
                    category={item.category}
                    city={item.city ?? ""}
                    province={item.province ?? ""}
                    reported={reportedLabel(item.created_at)}
                    description={item.description ?? ""}
                    kind={item.kind}
                    imageUrl={imageMap.get(item.id)}
                    views={item.view_count}
                    reward={item.kind === "lost" ? item.reward_amount : null}
                  />
                </Reveal>
              ))}
            </div>

            {/* Pagination — numbered pages with an ellipsis window */}
            {totalPages > 1 && (
              <nav
                aria-label="Explore pagination"
                className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur sm:flex-row"
              >
                <p className="text-xs text-slate-600">
                  Page{" "}
                  <span className="font-semibold text-navy-900">{safePage}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-navy-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {/* Previous */}
                  {!isFirstPage ? (
                    <Link
                      href={previousHref}
                      aria-label="Previous page"
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
                    >
                      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Prev
                    </Link>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-full border border-slate-200/70 bg-slate-100 px-4 text-xs font-medium text-slate-400"
                    >
                      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Prev
                    </span>
                  )}

                  {/* Numbered pages */}
                  {buildPageItems(safePage, totalPages).map((item) =>
                    typeof item === "number" ? (
                      <Link
                        key={item}
                        href={hrefFor({ page: item })}
                        aria-current={item === safePage ? "page" : undefined}
                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums transition-colors ${
                          item === safePage
                            ? "bg-teal-600 text-white shadow-sm"
                            : "border border-slate-200/80 bg-white/85 text-slate-600 backdrop-blur hover:border-teal-300 hover:text-teal-700"
                        }`}
                      >
                        {item}
                      </Link>
                    ) : (
                      <span
                        key={item}
                        aria-hidden="true"
                        className="inline-flex h-9 min-w-6 items-center justify-center text-xs text-slate-400"
                      >
                        …
                      </span>
                    ),
                  )}

                  {/* Next */}
                  {!isLastPage ? (
                    <Link
                      href={nextHref}
                      aria-label="Next page"
                      className="inline-flex h-9 items-center gap-1 rounded-full bg-teal-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                    >
                      Next
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-full border border-slate-200/70 bg-slate-100 px-4 text-xs font-medium text-slate-400"
                    >
                      Next
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </DiscoverResultsView>
        ) : (
          <>
            <div className="mb-6">{feedHeader}</div>
            <ListingEmptyState
              accent="lost"
              title="No matching reports yet."
              description={
                hasFilters
                  ? "We couldn't find a report matching your search. Try another keyword, location, or category."
                  : "The board is empty right now — be the first to post, and give a lost item a chance to come home."
              }
              hasFilters={hasFilters}
              clearHref={clearHref}
              reportHref={ROUTES.reportLost}
              reportLabel="Report a lost item"
              secondaryHref={ROUTES.reportFound}
              secondaryLabel="Report a found item"
              secondaryNote="Someone may have your item but hasn't reported it yet."
            />
          </>
         )}

      </div>

      {/* ================= HELP STRIP ================= */}
      <section
        aria-label="Someone out there may have found it — get matched and get it back."
        className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-3xl border border-teal-100 bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-[560px] opacity-20">
            <MapMotif className="h-full w-full" tone="text-teal-200" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-emerald-100/60 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-16 h-52 w-52 rounded-full bg-teal-100/50 blur-3xl" />

          <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">Lost something? You&apos;re not alone</p>
              <h2 className="mt-2 font-display text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
                Someone out there may have found it — get matched and get it back.
              </h2>
              <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-600">
                Post once and we&apos;ll help connect you with people who&apos;ve seen it. Chat
                securely and privately — you decide what to share, and nothing is exposed
                until you say so.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
              <div className="flex flex-wrap gap-2.5 sm:justify-end">
                <Link href={ROUTES.reportLost} className="group inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sunrise-500 px-5 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-px hover:bg-sunrise-400 sm:flex-none">
                  <PackageSearch size={16} aria-hidden="true" />
                  Report lost item
                  <ArrowRight size={15} aria-hidden="true" className="opacity-70 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href={ROUTES.reportFound} className="group inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-px hover:bg-emerald-400 sm:flex-none">
                  <HeartHandshake size={16} aria-hidden="true" />
                  Report found item
                  <ArrowRight size={15} aria-hidden="true" className="opacity-70 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <p className="text-center text-[11px] leading-4 text-slate-500 lg:text-right">
                100% free to post · Free account required · You stay in control
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
