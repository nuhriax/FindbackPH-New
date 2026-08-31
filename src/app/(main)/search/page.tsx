import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { getSignedImageUrls, getImagePublicUrl } from "@/lib/storage";
import { formatDistanceToNow, isValid } from "date-fns";
import {
  ArrowRight,
  Camera,
  Check,
  Clock,
  Filter,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { CommunityMotif } from "@/components/ui/community-motif";
import { PhilippinesMap } from "@/components/map/philippines-map";
import type { MapPoint } from "@/components/map/philippines-map-impl";
import { lookupCityCoords } from "@/lib/ph-locations";

export const metadata = {
  title: "Search Lost & Found Items",
  description:
    "Search lost and found reports across the Philippines by keyword, category, and city to find a match for what you've lost or found.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    category?: string;
    type?: string;
    when?: string;
    photos?: string;
  }>;
};

const WHEN_FILTERS = ["today", "week", "month"] as const;
type WhenFilter = (typeof WHEN_FILTERS)[number];

const WHEN_LABELS: Record<WhenFilter, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

type SearchItem = {
  id: string;
  title: string;
  category: any;
  city: string | null;
  province: string | null;
  description: string | null;
  created_at: string | null;
  // Optional pin coordinates; null for pre-map reports / unpinned reports.
  latitude?: number | null;
  longitude?: number | null;
  // Denormalized page-view counter (optional until the 104 migration runs).
  view_count?: number | null;
};

const SEARCH_LIMIT = 30;

function normalizeQuery(
  value: string | undefined,
  maxLength = 80,
): string {
  return (value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Escape LIKE wildcards so user input is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Wrap a value for PostgREST `.or()` so commas/quotes can't break parsing. */
function orLiteral(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Build the points plotted on the search page's Philippines map. A report is
 * placed at its saved pin when it has one, otherwise at its city's approximate
 * centroid (static lookup). Reports with neither are simply not plotted —
 * consistent with never exposing exact locations.
 */
function buildMapPoints(
  items: SearchItem[],
  kind: "lost" | "found",
  hrefPrefix: "/lost" | "/found"
): MapPoint[] {
  const points: MapPoint[] = [];
  for (const item of items) {
    const coords =
      typeof item.latitude === "number" && typeof item.longitude === "number"
        ? ([item.latitude, item.longitude] as [number, number])
        : lookupCityCoords(item.city);
    if (!coords) continue;
    points.push({
      id: `${kind}-${item.id}`,
      kind,
      lat: coords[0],
      lng: coords[1],
      title: item.title,
      city: item.city,
      province: item.province,
      href: `${hrefPrefix}/${item.id}`,
      date: item.created_at,
    });
  }
  return points;
}

/** ISO timestamp that starts the window for a date filter (server time). */
function whenCutoff(when: WhenFilter): string {
  const now = new Date();

  if (when === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  const days = when === "week" ? 7 : 30;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

/**
 * Keep only items that have at least one photo recorded in item_images.
 * Real filtering against a real table — no client-side guessing.
 */
async function filterWithPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "lost_items" | "found_items",
  rows: SearchItem[],
): Promise<SearchItem[]> {
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return rows;

  const column = table === "lost_items" ? "lost_item_id" : "found_item_id";
  const { data } = await supabase
    .from("item_images")
    .select(column)
    .in(column, ids);

  const withPhotoIds = new Set(
    ((data ?? []) as Record<string, string>[]).map((row) => row[column]),
  );

  return rows.filter((row) => withPhotoIds.has(row.id));
}

/**
 * Build a map of item id -> photo URL for the given result rows, using the
 * same signed-URL flow as the home / lost / found listing pages.
 */
async function loadImageMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "lost_items" | "found_items",
  rows: SearchItem[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return map;

  const column = table === "lost_items" ? "lost_item_id" : "found_item_id";
  const { data: rawImages } = await supabase
    .from("item_images")
    .select(`${column}, storage_path, position`)
    .in(column, ids)
    .order("position", { ascending: true });

  const images = (rawImages ?? []) as unknown as Record<
    string,
    string | null
  >[];

  const paths = Array.from(
    new Set(images.map((img) => img.storage_path).filter(Boolean)),
  ) as string[];
  if (paths.length === 0) return map;

  const signed = await getSignedImageUrls(paths);
  const urlByPath = new Map(
    paths.map((path, idx) => [path, signed[idx] ?? getImagePublicUrl(path)]),
  );

  for (const img of images) {
    const key = img[column];
    const url = img.storage_path ? urlByPath.get(img.storage_path) : undefined;
    if (typeof key === "string" && url && !map.has(key)) {
      map.set(key, url);
    }
  }

  return map;
}

/** PostgREST error for "column does not exist" (coordinate columns not migrated yet). */
function isMissingColumnError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "object" && "code" in err) {
    if ((err as { code?: string }).code === "42703") return true;
  }
  const message =
    typeof err === "string"
      ? err
      : typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message)
        : "";
  return /column .*latitude|column .*longitude/i.test(message);
}

/**
 * Fetch a single table for the search page. Runs each table independently so
 * that if one fails (e.g. a missing column or an unparseable query) the other
 * still renders — the page is never blank.
 */
async function searchTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "lost_items" | "found_items",
  filters: {
    q: string;
    category: string;
    city: string;
    when: WhenFilter | "";
    photos: boolean;
  },
): Promise<{ data: SearchItem[] | null; error: unknown }> {
  const { q, category, city, when, photos } = filters;

  // Coordinates are optional: the base columns always work, and lat/lng are
  // appended when the deployed DB has the 103 migration applied.
  const BASE_COLUMNS =
    "id, title, category, city, province, description, created_at, view_count";
  const COLUMNS = `${BASE_COLUMNS}, latitude, longitude`;

  async function fetchRows(
    columns: string
  ): Promise<{ rows: SearchItem[] | null; error: unknown }> {
    let query: any = supabase
      .from(table as any)
      .select(columns)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT);

    if (category) {
      query = query.eq("category", category);
    }

    if (city) {
      query = query.ilike("city", `%${escapeLike(city)}%`);
    }

    if (when) {
      // Real date filter — created_at is an indexed timestamptz column.
      query = query.gte("created_at", whenCutoff(when));
    }

    if (!q) {
      const res = await query;
      if (res.error) return { rows: null, error: res.error };
      return { rows: ((res.data ?? []) as unknown as SearchItem[]), error: null };
    }

    // Prefer Postgres full-text search. If the query can't be parsed or the
    // search column is missing in the deployed DB, fall back to a LIKE search so
    // users always get results instead of a blank page.
    const fts = await query.textSearch("search_vector", q, {
      type: "websearch",
    });
    if (!fts.error) {
      return { rows: ((fts.data ?? []) as unknown as SearchItem[]), error: null };
    }

    const pattern = `%${escapeLike(q)}%`;
    const like = await supabase
      .from(table as any)
      .select(columns)
      .eq("status", "active")
      .or(
        [
          `title.ilike.${orLiteral(pattern)}`,
          `description.ilike.${orLiteral(pattern)}`,
          `category.ilike.${orLiteral(pattern)}`,
          `city.ilike.${orLiteral(pattern)}`,
          `province.ilike.${orLiteral(pattern)}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT);
    if (like.error) return { rows: null, error: like.error };
    return { rows: ((like.data ?? []) as unknown as SearchItem[]), error: null };
  }

  try {
    // First attempt includes the coordinate columns; if the deployed DB
    // predates the migration (42703 / "column does not exist"), retry with
    // the base columns so search keeps working — the map just falls back to
    // city centroids for those reports.
    let result = await fetchRows(COLUMNS);
    if (result.error && isMissingColumnError(result.error)) {
      result = await fetchRows(BASE_COLUMNS);
    }
    if (result.error) return { data: null, error: result.error };

    let rows = result.rows as SearchItem[];

    // Real "with photo" filtering against item_images.
    if (photos) {
      rows = await filterWithPhotos(supabase, table, rows);
    }

    return { data: rows, error: null };
  } catch (err) {
    // Never let a thrown (rather than returned) exception blank the page.
    return { data: null, error: err };
  }
}
export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  const q = normalizeQuery(sp.q);
  const city = normalizeQuery(sp.city, 50);
  const category = normalizeQuery(sp.category, 50);
  const type = ["lost", "found"].includes((sp.type ?? "").trim())
    ? (sp.type ?? "").trim()
    : "";

  // Date-window filter — only accepted values pass through.
  const rawWhen = (sp.when ?? "").trim();
  const when: WhenFilter | "" = WHEN_FILTERS.includes(rawWhen as WhenFilter)
    ? (rawWhen as WhenFilter)
    : "";

  // "With photo" filter — real filter backed by the item_images table.
  const photos = (sp.photos ?? "").trim() === "1";

  /** Build a /search href preserving all current filters, with overrides. */
  function buildHref(overrides: {
    type?: string;
    when?: string;
    photos?: string;
  }): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    const nextType = overrides.type ?? type;
    if (nextType) params.set("type", nextType);
    const nextWhen = overrides.when !== undefined ? overrides.when : when;
    if (nextWhen) params.set("when", nextWhen);
    const nextPhotos =
      overrides.photos !== undefined ? overrides.photos : photos ? "1" : "";
    if (nextPhotos) params.set("photos", nextPhotos);
    return `/search${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const activeCategory = CATEGORIES.includes(category as any)
    ? category
    : "";

  // Query both tables independently — one failing should never blank the page.
  const [lostResult, foundResult] = await Promise.all([
    searchTable(supabase, "lost_items", {
      q,
      category: activeCategory,
      city,
      when,
      photos,
    }),
    searchTable(supabase, "found_items", {
      q,
      category: activeCategory,
      city,
      when,
      photos,
    }),
  ]);

  const lostItems = (type === "found" ? [] : (lostResult.data ?? [])) as SearchItem[];
  const foundItems = (type === "lost" ? [] : (foundResult.data ?? [])) as SearchItem[];

  // Attach real photos to results (same signed-URL flow as other listing pages).
  const [lostImageMap, foundImageMap] = await Promise.all([
    loadImageMap(supabase, "lost_items", lostItems),
    loadImageMap(supabase, "found_items", foundItems),
  ]);

  // Only show the full error screen when BOTH sources fail.
  const error = lostResult.error && foundResult.error
    ? lostResult.error
    : null;

  const totalResults = lostItems.length + foundItems.length;

  // LOST/FOUND markers for the Philippines map view (pins first, city
  // centroids as fallback).
  const mapPoints = [
    ...buildMapPoints(foundItems, "found", "/found"),
    ...buildMapPoints(lostItems, "lost", "/lost"),
  ];

  const hasSearch =
    Boolean(q) ||
    Boolean(city) ||
    Boolean(activeCategory) ||
    Boolean(type) ||
    Boolean(when) ||
    photos;

  const hasResults = totalResults > 0;

  const clearHref = "/search";

  return (
    <main className="min-h-screen">
      {/* ================================================================
          HEADER
      ================================================================= */}

      <section className="border-b border-slate-200/70 bg-white/25">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-electric-200 bg-electric-50 px-3 py-1.5 text-xs font-semibold text-electric-700 shadow-sm">
                <Search size={13} />
                FindBack PH Search
              </span>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Find a lost or found item
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Search by keyword, location, or category — every report is
                posted by a real person who wants to see it come home.
              </p>
            </div>

            {/* ============================================================
                SEARCH FORM
            ============================================================= */}

            <form
              action="/search"
              method="GET"
              className="mt-6 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-card ring-1 ring-slate-200/50 backdrop-blur-xl"
            >
              <div className="grid gap-2 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]">
                {/* Item */}
                <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-electric-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-electric-100">
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
                <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-electric-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-electric-100">
                  <span
                    aria-hidden="true"
                    className="text-sm text-slate-500"
                  >
                    <MapPin size={16} className="shrink-0" />
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
                    className="h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-electric-300 focus:bg-white focus:ring-2 focus:ring-electric-100"
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
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-electric-500 px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,123,114,0.8)] transition hover:bg-electric-400 active:scale-[0.98]"
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

                {type && <FilterTag label={type === "lost" ? "Lost" : "Found"} />}

                {when && <FilterTag label={WHEN_LABELS[when]} />}

                {photos && <FilterTag label="With photo" />}

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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Filter chips */}
        <div className="mb-7 flex flex-wrap items-center gap-2">
          {/* Lost / Found */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-white/75 p-1.5 shadow-sm backdrop-blur">
            {[
              { label: "All", value: "" },
              { label: "Lost", value: "lost" },
              { label: "Found", value: "found" },
            ].map((opt) => {
              const active = type === opt.value;
              return (
                <Link
                  key={opt.label}
                  href={buildHref({ type: opt.value })}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-lg bg-electric-500 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      : "rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-electric-50 hover:text-electric-700"
                  }
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>

          {/* Date window — backed by created_at in the database */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-white/75 p-1.5 shadow-sm backdrop-blur">
            <Clock size={14} className="ml-2 mr-0.5 shrink-0 text-slate-400" />
            {[
              { label: "Anytime", value: "" },
              ...WHEN_FILTERS.map((w) => ({
                label: WHEN_LABELS[w],
                value: w as string,
              })),
            ].map((opt) => {
              const active = when === opt.value;
              return (
                <Link
                  key={opt.label}
                  href={buildHref({ when: opt.value })}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-lg bg-electric-600 px-3 py-2 text-xs font-semibold text-white shadow-sm sm:text-sm"
                      : "rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-electric-50 hover:text-electric-700 sm:text-sm"
                  }
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>

          {/* With photo — backed by the item_images table */}
          <Link
            href={buildHref({ photos: photos ? "" : "1" })}
            aria-current={photos ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-sm backdrop-blur transition ${
              photos
                ? "border-electric-300 bg-electric-500 text-white"
                : "border-slate-200/80 bg-white/75 text-slate-600 hover:border-electric-300 hover:text-electric-700"
            }`}
          >
            <Camera size={14} />
            With photo
          </Link>
        </div>

        {error ? (
          <SearchError />
        ) : (
          <>
            {/* Results summary */}
            <div role="status" aria-live="polite" className="flex flex-col gap-3 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-700">
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
              <div className="space-y-12 pt-7">
                {/* ========================================================
                    MAP VIEW — Philippines only, LOST/FOUND markers
                ========================================================= */}

                {mapPoints.length > 0 && (
                  <section aria-label="Map view">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="font-display text-xl font-bold text-navy-900 sm:text-2xl">
                          Map view
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                          Explore Lost &amp; Found reports across the
                          Philippines. Approximate locations of {mapPoints.length}{" "}
                          {mapPoints.length === 1 ? "report" : "reports"} —
                          click a marker for details.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 h-[560px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-[640px]">
                      <PhilippinesMap mode="view" points={mapPoints} />
                    </div>
                  </section>
                )}

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
                    imageMap={foundImageMap}
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
                    imageMap={lostImageMap}
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
  imageMap,
}: {
  title: string;
  description: string;
  items: SearchItem[];
  hrefPrefix: "/lost" | "/found";
  kind: "lost" | "found";
  imageMap: Map<string, string>;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${
                kind === "lost"
                  ? "bg-sunrise-400"
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

      <div className="mt-6 flex flex-wrap justify-center gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <ItemCard
              href={`/search/${item.id}`}
              title={item.title}
              category={item.category}
              city={item.city}
              province={item.province}
              reported={formatRelative(item.created_at)}
              description={item.description}
              kind={kind}
              imageUrl={imageMap.get(item.id) ?? null}
              views={item.view_count}
            />
          </div>
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

      <CommunityMotif className="mx-auto mt-6 h-6 w-20 opacity-80" />

      <h3 className="mt-4 font-display text-xl font-bold text-navy-900">
        {hasFilters
          ? "No matching reports found."
          : "No reports yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {hasFilters
          ? "Try another keyword, location, or category."
          : "Nothing to show just yet — but something out there might still be waiting to come home. Check again soon, or be the first to post."}
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

      {!hasFilters && (
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Or explore a popular category
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {CATEGORIES.filter((c) =>
              ["phone", "wallet", "keys", "electronics", "jewelry"].includes(c)
            ).map((c) => (
              <Link
                key={c}
                href={`/search?category=${encodeURIComponent(c)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {CATEGORY_LABELS[c]}
              </Link>
            ))}
          </div>
        </div>
      )}
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
