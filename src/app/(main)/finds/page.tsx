import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { getImagePublicUrl, getSignedImageUrls } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
import { ListingHero } from "@/components/listing/listing-hero";
import { ListingSearch } from "@/components/listing/listing-search";
import { ListingResultsHeader } from "@/components/listing/listing-results-header";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";

import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isValid } from "date-fns";

/* ==========================================================================
   Configuration
   ========================================================================== */

const PAGE_SIZE = 24;
const MAX_SEARCH_LENGTH = 100;
const MAX_FETCH_ROWS = 999; // both tables merged, paginated in memory

const ROUTES = {
  finds: "/finds",
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
  return query ? `${ROUTES.finds}?${query}` : ROUTES.finds;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Shared filter pipeline for both tables so "Finds" results behave exactly like
 * the standalone Lost/Found pages (same search vector, category, city rules).
 */
function applyFilters(
  query: ReturnType<SupabaseClient["from"]>,
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
  title: { absolute: "Finds — Lost & Found Reports Across the Philippines" },
  description:
    "Browse every active lost and found report across the Philippines in one feed. Search by keyword, category, and city to find a match.",
};

export default async function FindsPage({
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
    applyFilters(supabase.from("lost_items"), filters).select(
      "id, title, category, city, province, description, created_at, updated_at, view_count",
    ),
    applyFilters(supabase.from("found_items"), filters).select(
      "id, title, category, city, province, description, created_at, updated_at, view_count",
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
    { label: "All finds", value: "all", count: lostCount + foundCount },
    { label: "Lost", value: "lost", count: lostCount },
    { label: "Found", value: "found", count: foundCount },
  ];

  return (
    <main className="flex-1">
      {/* ================= HERO ================= */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <ListingHero
          accent="lost"
          eyebrow="All reports in one feed"
          title={
            <>
              Every find,{" "}
              <span className="bg-gradient-to-r from-sunrise-600 to-emerald-600 bg-clip-text text-transparent">
                one feed
              </span>
            </>
          }
          description="Browse lost and found reports side by side. Spot something familiar, then jump into the full report to reunite it with its owner."
          ctaHref={ROUTES.reportLost}
          ctaLabel="Report a lost item"
          secondaryHref={ROUTES.reportFound}
          secondaryLabel="Report a found item"
          trust={[
            { icon: AlertTriangle, label: "Lost reports" },
            { icon: ArrowRight, label: "Match" },
            { icon: ArrowRight, label: "Return" },
          ]}
        />
      </div>

      {/* ================= SEARCH + TABS ================= */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8">
          <ListingSearch
            accent="lost"
            idPrefix="finds"
            q={q}
            category={category}
            city={city}
            sort={sort}
            maxLength={MAX_SEARCH_LENGTH}
            buttonLabel="Search finds"
            clearAllHref={hasFilters ? clearHref : undefined}
          />
        </div>

        {/* Type tabs */}
        <div
          className="mt-5 flex flex-wrap items-center gap-2"
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
                    ? "bg-navy-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
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
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ================= RESULTS ================= */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              href={ROUTES.finds}
              className="btn-primary mt-5 inline-flex h-9 items-center justify-center"
            >
              Try again
            </Link>
          </div>
        ) : hasResults ? (
          <>
            <ListingResultsHeader
              accent="lost"
              title={hasFilters ? "Matching finds" : "Latest finds"}
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
                aria-label="Finds pagination"
                className="mt-10 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur sm:flex-row"
              >
                <p className="text-xs text-slate-500">
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
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-navy-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
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
          <ListingEmptyState
            accent="lost"
            title="No finds yet"
            description={
              hasFilters
                ? "Try changing your search, category, or location filters — or check the dedicated Lost and Found pages."
                : "Be the first to report an item and give it a chance to come home."
            }
            hasFilters={hasFilters}
            clearHref={clearHref}
            reportHref={ROUTES.reportLost}
            reportLabel="Report a lost item"
          />
        )}
      </div>

      {/* ================= BOTTOM CTA ================= */}
      <section
        aria-label="Post a report"
        className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-navy-900 via-blue-950 to-violet-950 px-6 py-12 text-center shadow-[0_35px_100px_-25px_rgba(15,23,42,0.5)] sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-electric-400/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl"
          />
          <h2 className="relative font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Lost something — or found something?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100/90 sm:text-base">
            Post a report and our matching engine alerts you the moment a
            counterpart appears on the other side.
          </p>
          <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ROUTES.reportLost}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl"
            >
              Report a lost item
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href={ROUTES.reportFound}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              Report a found item
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}