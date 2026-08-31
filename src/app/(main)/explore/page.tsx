import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
import { ListingResultsHeader } from "@/components/listing/listing-results-header";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";

import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  HeartHandshake,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isValid } from "date-fns";

/* ==========================================================================
   Configuration
   ========================================================================== */

const PAGE_SIZE = 24;
const MAX_SEARCH_LENGTH = 100;
const MAX_FETCH_ROWS = 999; // both tables merged, paginated in memory

const ROUTES = {
  explore: "/explore",
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
  type?: SearchParamValue;
  page?: SearchParamValue;
  sort?: SearchParamValue;
};

type FeedType = "all" | "lost" | "found";
type SortOption = "newest" | "oldest" | "recently-updated";

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

function isValidCategory(value: string): value is (typeof CATEGORIES)[number] {
  return CATEGORIES.includes(value as (typeof CATEGORIES)[number]);
}

function isValidSort(value: string): value is SortOption {
  return value === "newest" || value === "oldest" || value === "recently-updated";
}

function isValidType(value: string): value is FeedType {
  return value === "all" || value === "lost" || value === "found";
}

function reportedLabel(value: string): string {
  if (!value) return "Reported recently";
  const date = new Date(value);
  if (!isValid(date)) return "Reported recently";
  return `Reported ${formatDistanceToNow(date, { addSuffix: true })}`;
}

function buildPageHref({
  page,
  q,
  category,
  city,
  type,
  sort,
}: {
  page: number;
  q: string;
  category: string;
  city: string;
  type: FeedType;
  sort: SortOption;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (city) params.set("city", city);
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
  filters: { q: string; category: string; city: string; sort: SortOption },
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

  const sortColumn =
    filters.sort === "recently-updated" ? "updated_at" : "created_at";
  return out
    .order(sortColumn, {
      ascending: filters.sort === "oldest",
      nullsFirst: false,
    })
    .limit(MAX_FETCH_ROWS);
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
  title: { absolute: "Explore — Lost & Found Reports Across the Philippines" },
  description:
    "Browse every active lost and found report across the Philippines in one community feed.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const q = normalizeSearch(getParam(params.q));
  const rawCategory = normalizeSearch(getParam(params.category), 50);
  const category = isValidCategory(rawCategory) ? rawCategory : "";
  const city = normalizeSearch(getParam(params.city));
  const rawType = normalizeSearch(getParam(params.type), 10);
  const type: FeedType = isValidType(rawType) ? rawType : "all";
  const rawSort = normalizeSearch(getParam(params.sort), 30);
  const sort: SortOption = isValidSort(rawSort) ? rawSort : "newest";
  const page = parsePage(params.page);

  const hasFilters = Boolean(q || category || city);
  const filters = { q, category, city, sort };

  /* ------------------------------------------------------------------------
     Query both tables, merge, paginate in memory
     ------------------------------------------------------------------------ */

  const [lostRes, foundRes] = await Promise.all([
    applyFilters(
      supabase.from("lost_items").select(
        "id, title, category, city, province, description, created_at, updated_at, view_count",
      ),
      filters,
    ),
    applyFilters(
      supabase.from("found_items").select(
        "id, title, category, city, province, description, created_at, updated_at, view_count",
      ),
      filters,
    ),
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

  const totalCount = pool.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rangeStart = (safePage - 1) * PAGE_SIZE;
  const items = pool.slice(rangeStart, rangeStart + PAGE_SIZE);

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
  const lostCount = lostItems.length;
  const foundCount = foundItems.length;

  const hrefFor = (overrides: Partial<Parameters<typeof buildPageHref>[0]>) =>
    buildPageHref({ page: safePage, q, category, city, type, sort, ...overrides });

  const previousHref = hrefFor({ page: safePage - 1 });
  const nextHref = hrefFor({ page: safePage + 1 });
  const clearHref = buildPageHref({
    page: 1,
    q: "",
    category: "",
    city: "",
    type,
    sort,
  });

  const typeTabs: Array<{ label: string; value: FeedType; count: number }> = [
    { label: "All reports", value: "all", count: lostCount + foundCount },
    { label: "Lost", value: "lost", count: lostCount },
    { label: "Found", value: "found", count: foundCount },
  ];

  return (
    <main className="flex-1">
      {/* ================= HERO — SPLIT IDENTITY ================= */}
      <section aria-label="Explore community reports">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ice-600 backdrop-blur">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-sunrise-500" />
              Explore community reports
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-navy-900 sm:text-5xl">
              Explore{" "}
              <span className="bg-gradient-to-r from-sunrise-600 to-sunrise-400 bg-clip-text text-transparent">
                every
              </span>{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                report
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-ice-600 sm:text-lg">
              One live feed of everything people across the Philippines have
              lost — and everything waiting to be returned.
            </p>
          </div>

          {/* Two doors */}
          <div className="mt-10 grid overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-card sm:grid-cols-2">
            {/* Lost door */}
            <div className="relative border-b border-cream-200 p-6 sm:border-b-0 sm:border-r sm:p-8">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sunrise-500 to-sunrise-300"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sunrise-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sunrise-700">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-sunrise-500"
                  />
                  Lost
                </span>
                <span className="text-xs font-medium tabular-nums text-ice-500">
                  {lostCount} active {lostCount === 1 ? "report" : "reports"}
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                Lost something?
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-ice-600">
                Post it in seconds — someone out there may already be holding
                it.
              </p>
              <Link
                href={ROUTES.reportLost}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-sunrise-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sunrise-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunrise-500/40 active:scale-[0.98]"
              >
                Report a lost item
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>

            {/* Found door */}
            <div className="relative p-6 sm:p-8">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                  />
                  Found
                </span>
                <span className="text-xs font-medium tabular-nums text-ice-500">
                  {foundCount} active {foundCount === 1 ? "report" : "reports"}
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                Found something?
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-ice-600">
                Return it to its owner — and make someone&apos;s whole week.
              </p>
              <Link
                href={ROUTES.reportFound}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 active:scale-[0.98]"
              >
                Report a found item
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FILTER BAR ================= */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Type tabs */}
        <div
          className="mt-8 flex flex-wrap items-center gap-2"
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
                  sort,
                  type: tab.value,
                })}
                role="tab"
                aria-selected={active}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                  active
                    ? "bg-electric-600 text-white shadow-sm"
                    : "border border-cream-300 bg-white/90 text-ice-600 hover:border-electric-300 hover:bg-electric-50 hover:text-electric-700"
                }`}
              >
                {tab.value === "lost" && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-red-500"
                  />
                )}
                {tab.value === "found" && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-emerald-500"
                  />
                )}
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-cream-100 text-ice-600"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Quick category browsing */}
        <div className="mt-4 -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2">
            <Link
              href={hrefFor({ page: 1, category: "" })}
              aria-current={!category ? "true" : undefined}
              className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-medium transition-colors ${
                !category
                  ? "bg-electric-600 text-white"
                  : "border border-cream-300 bg-white/90 text-ice-600 hover:border-electric-300 hover:bg-electric-50 hover:text-electric-700"
              }`}
            >
              All categories
            </Link>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Link
                  key={c}
                  href={hrefFor({ page: 1, category: active ? "" : c })}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-electric-600 text-white"
                      : "border border-cream-300 bg-white/90 text-ice-600 hover:border-electric-300 hover:bg-electric-50 hover:text-electric-700"
                  }`}
                >
                  {CATEGORY_LABELS[c]}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search tool link */}
        <p className="mt-3 pb-2 text-sm text-ice-600">
          Looking for something specific?{" "}
          <Link
            href="/search"
            className="inline-flex items-center gap-1 font-medium text-electric-700 underline-offset-4 transition hover:text-electric-600 hover:underline"
          >
            Search reports
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>

      {/* ================= MAIN ================= */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-6 pb-4">
          {/* Feed */}
          <div className="min-w-0">
            {/* Active filter chips */}
            {(category || q || city) && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {category && (
                  <Link
                    href={hrefFor({ page: 1, category: "" })}
                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3 text-xs font-medium text-ice-700 shadow-sm transition-colors hover:border-electric-300 hover:text-electric-700"
                  >
                    {CATEGORY_LABELS[category as ItemCategory]}
                    <X aria-hidden="true" className="h-3 w-3 text-ice-400" />
                  </Link>
                )}
                <Link
                  href={buildPageHref({
                    page: 1,
                    q: "",
                    category: "",
                    city: "",
                    sort,
                    type,
                  })}
                  className="text-xs font-medium text-ice-500 underline-offset-4 transition hover:text-electric-700 hover:underline"
                >
                  Clear all
                </Link>
              </div>
            )}

            {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/60 px-6 py-12 text-center backdrop-blur">
            <span
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-500 shadow-sm"
            >
              <AlertTriangle size={22} />
            </span>
            <p className="mt-4 font-display text-base font-semibold text-navy-900">
              We hit a snag loading reports
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-600">
              This is usually temporary. Give it another go — your filters will
              stay exactly where you left them.
            </p>
            <Link
              href={ROUTES.explore}
              className="btn-primary mt-5 inline-flex h-9 items-center justify-center"
            >
              Try again
            </Link>
          </div>
        ) : hasResults ? (
          <>
            <ListingResultsHeader
              accent="lost"
              title={hasFilters ? "Matching reports" : "Latest reports"}
              count={`${totalCount.toLocaleString()} ${
                totalCount === 1 ? "report" : "reports"
              }`}
              description={
                hasFilters
                  ? `Showing ${resultStart.toLocaleString()}–${resultEnd.toLocaleString()} reports matching your search.`
                  : "The newest lost and found reports from the community."
              }
              sort={sort}
              hiddenFields={[
                { name: "q", value: q },
                { name: "category", value: category },
                { name: "city", value: city },
                { name: "type", value: type === "all" ? "" : type },
              ].filter((field) => Boolean(field.value))}
              viewAllHref={hrefFor({ page: 1 })}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  />
                </Reveal>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Explore pagination"
                className="mt-10 flex flex-col items-center justify-between gap-3 rounded-xl border border-cream-200 bg-white/70 px-4 py-3 backdrop-blur sm:flex-row"
              >
                <p className="text-xs text-ice-600">
                  Page{" "}
                  <span className="font-semibold text-navy-900">{safePage}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-navy-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex gap-2">
                  {!isFirstPage ? (
                    <Link
                      href={previousHref}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3.5 text-xs font-medium text-ice-600 transition-colors hover:border-electric-300 hover:text-electric-700"
                    >
                      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-cream-200 bg-cream-100 px-3.5 text-xs font-medium text-ice-400">
                      <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Previous
                    </span>
                  )}

                  {!isLastPage ? (
                    <Link
                      href={nextHref}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-electric-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-electric-700"
                    >
                      Next
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-cream-200 bg-cream-100 px-3.5 text-xs font-medium text-ice-400">
                      Next
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : (
          <>
            <ListingEmptyState
              accent="lost"
              title="No reports yet"
              description={
                hasFilters
                  ? "Try changing your search, category, or type tab — new reports appear here the moment they're posted."
                  : "Be the first to report an item and give it a chance to come home."
              }
              hasFilters={hasFilters}
              clearHref={clearHref}
              reportHref={ROUTES.reportLost}
              reportLabel="Report a lost item"
            />
            {!hasResults && !hasFilters && (
              <p className="mt-4 text-center text-sm text-ice-600">
                Found something?{" "}
                <Link
                  href={ROUTES.reportFound}
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Post a found report →
                </Link>
              </p>
            )}
            <p className="mt-3 text-center text-sm text-ice-600">
              Looking for something specific?{" "}
              <Link
                href="/search"
                className="inline-flex items-center gap-1 font-medium text-electric-700 underline-offset-4 transition hover:text-electric-600 hover:underline"
              >
                Search reports
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </p>
          </>
         )}
          </div>{/* /feed column */}
        </div>{/* /grid */}
      </div>

      {/* ================= BOTTOM CTA — TWO DOORS ================= */}
      <section
        aria-label="Post a report"
        className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8"
      >
        <div className="relative grid overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-card sm:grid-cols-2">
          {/* Lost door */}
          <div className="relative border-b border-cream-200 bg-gradient-to-br from-sunrise-50/80 via-white to-white p-8 sm:border-b-0 sm:border-r sm:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sunrise-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sunrise-700">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-sunrise-500"
              />
              Lost
            </span>
            <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
              Lost something?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ice-600">
              Post a report and get alerted when a matching found report
              appears. Your contact details stay private until you choose to
              share them.
            </p>
            <Link
              href={ROUTES.reportLost}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sunrise-500 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-sunrise-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunrise-500/40 active:scale-[0.98] sm:w-auto"
            >
              Report a lost item
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>

          {/* Found door */}
          <div className="relative bg-gradient-to-bl from-emerald-50/80 via-white to-white p-8 sm:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
              Found
            </span>
            <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
              Found something?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ice-600">
              Post what you found and we&apos;ll surface it to anyone who lost
              the same item — so it can find its way home.
            </p>
            <Link
              href={ROUTES.reportFound}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/40 active:scale-[0.98] sm:w-auto"
            >
              Report a found item
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>

          {/* Center badge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cream-300 bg-white text-emerald-600 shadow-lg">
              <HeartHandshake size={24} />
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}