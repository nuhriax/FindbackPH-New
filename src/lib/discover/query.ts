import { createClient } from "@/lib/supabase/server";
import { getSignedImageUrls, getImagePublicUrl } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { lookupCityCoords } from "@/lib/ph-locations";
import type { MapPoint } from "@/components/map/philippines-map-impl";
import {
  MAX_FEED_PAGES,
  PAGE_SIZE,
  dateFilterRange,
  parseDiscoverParams,
  type DiscoverQuery,
  type SearchParams,
} from "./params";

/**
 * Discover feed — the single data layer.
 *
 * One entry point (`fetchDiscoverPage`) resolves everything the page renders:
 * merged feed items, first-image URLs, per-type counts, pagination state and
 * map points. The where-clause exists exactly once (`withFeedFilters`) and is
 * shared by row and count queries, so the two can never drift apart.
 */

export type FeedItem = {
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
  reward_amount?: number | null;
};

export type DiscoverData = {
  query: DiscoverQuery;
  /** The PAGE_SIZE items rendered on this page (already merged + sliced). */
  items: FeedItem[];
  /** First-image URL per item id (missing entry = no image). */
  imageMap: Map<string, string>;
  counts: { all: number; lost: number; found: number };
  totalCount: number;
  totalPages: number;
  /** Page clamped to what actually exists (URL may claim a deeper page). */
  safePage: number;
  /** Approximate points for the map — from the whole fetched window, not
   *  just the visible page, so the map stays useful while paging. */
  mapPoints: MapPoint[];
  /** True when Supabase errored — the page renders its inline error state. */
  error: boolean;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type FilterBuilder = ReturnType<
  ReturnType<SupabaseClient["from"]>["select"]
>;

type FeedFilters = Pick<
  DiscoverQuery,
  "category" | "city" | "province" | "when" | "sort"
>;

const LOST_COLUMNS =
  "id, title, category, city, province, description, created_at, updated_at, view_count, latitude, longitude, reward_amount";

const FOUND_COLUMNS =
  "id, title, category, city, province, description, created_at, updated_at, view_count, latitude, longitude";

/** The one where-clause builder shared by row and count queries. */
function applyFeedFilters(
  query: FilterBuilder,
  filters: FeedFilters
): FilterBuilder {
  let result = query.eq("status", "active");

  if (filters.category) {
    result = result.eq("category", filters.category as ItemCategory);
  }

  if (filters.city) {
    result = result.ilike("city", `%${filters.city}%`);
  }

  if (filters.province) {
    result = result.ilike("province", `%${filters.province}%`);
  }

  const { from, to } = dateFilterRange(filters.when);

  if (from) {
    result = result.gte("created_at", from);
  }

  if (to) {
    result = result.lt("created_at", to);
  }

  return result;
}

function feedRows(
  supabase: SupabaseClient,
  table: "lost_items" | "found_items",
  filters: FeedFilters,
  limitCount: number
) {
  const columns = table === "lost_items" ? LOST_COLUMNS : FOUND_COLUMNS;
  const sortColumn =
    filters.sort === "recently-updated" ? "updated_at" : "created_at";

  return applyFeedFilters(supabase.from(table).select(columns), filters)
    .order(sortColumn, {
      ascending: filters.sort === "oldest",
      nullsFirst: false,
    })
    .limit(limitCount);
}

async function countRows(
  supabase: SupabaseClient,
  table: "lost_items" | "found_items",
  filters: FeedFilters
): Promise<number> {
  const { count } = await applyFeedFilters(
    supabase.from(table).select("id", { count: "exact", head: true }),
    filters
  );

  return count ?? 0;
}

// === APPEND MARKER ===

type ImageRow = {
  storage_path: string;
  lost_item_id?: string | null;
  found_item_id?: string | null;
};

async function buildImageMap(
  rows: ImageRow[] | null,
  idKey: "lost_item_id" | "found_item_id"
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  if (!rows || rows.length === 0) {
    return imageMap;
  }

  const validRows = rows.filter(
    (row) => Boolean(row[idKey]) && Boolean(row.storage_path)
  );

  if (validRows.length === 0) {
    return imageMap;
  }

  const signedUrls = await getSignedImageUrls(
    validRows.map((row) => row.storage_path)
  );

  validRows.forEach((row, index) => {
    const itemId = row[idKey];

    if (!itemId || imageMap.has(itemId)) {
      return;
    }

    imageMap.set(
      itemId,
      signedUrls[index] ?? getImagePublicUrl(row.storage_path)
    );
  });

  return imageMap;
}

function buildMapPoints(items: FeedItem[]): MapPoint[] {
  const points: MapPoint[] = [];

  for (const item of items) {
    const coords =
      typeof item.latitude === "number" && typeof item.longitude === "number"
        ? ([item.latitude, item.longitude] as [number, number])
        : lookupCityCoords(item.city);

    if (!coords) {
      continue;
    }

    points.push({
      id: `${item.kind}-${item.id}`,
      kind: item.kind,
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

/** Sort key for the merged feed — falls back to created_at for null updates. */
function sortKey(item: FeedItem, sort: DiscoverQuery["sort"]): string {
  return (
    (sort === "recently-updated" ? item.updated_at : item.created_at) ??
    item.created_at
  );
}

// === APPEND MARKER 2 ===

/**
 * Resolve everything the Discover page renders in one call. All Supabase
 * round-trips run in parallel; nothing throws — a failed query degrades to the
 * page's inline error state instead of crashing the route.
 */
export async function fetchDiscoverPage(
  searchParams: SearchParams
): Promise<DiscoverData> {
  const query = parseDiscoverParams(searchParams);
  const supabase = await createClient();

  const filters: FeedFilters = {
    category: query.category,
    city: query.city,
    province: query.province,
    when: query.when,
    sort: query.sort,
  };

  // Rows needed to render `query.page` after the merge. parsePage caps the
  // page at MAX_FEED_PAGES, so this never balloons past ~480 rows per table.
  const perTableLimit = query.page * PAGE_SIZE;

  try {
    const [lostResult, foundResult, lostCount, foundCount] = await Promise.all([
      feedRows(supabase, "lost_items", filters, perTableLimit),
      feedRows(supabase, "found_items", filters, perTableLimit),
      countRows(supabase, "lost_items", filters),
      countRows(supabase, "found_items", filters),
    ]);

    const queryError = lostResult.error ?? foundResult.error;

    const lostItems: FeedItem[] = ((lostResult.data ?? []) as Record<string, unknown>[]).map(
      (item) => ({ ...item, kind: "lost" as const })
    ) as FeedItem[];

    const foundItems: FeedItem[] = ((foundResult.data ?? []) as Record<string, unknown>[]).map(
      (item) => ({ ...item, kind: "found" as const })
    ) as FeedItem[];

    const allItems =
      query.type === "lost"
        ? lostItems
        : query.type === "found"
          ? foundItems
          : [...lostItems, ...foundItems];

    allItems.sort((a, b) => {
      const first = sortKey(a, query.sort);
      const second = sortKey(b, query.sort);

      return query.sort === "oldest"
        ? first.localeCompare(second)
        : second.localeCompare(first);
    });

    const counts = {
      all: lostCount + foundCount,
      lost: lostCount,
      found: foundCount,
    };

    const totalCount =
      query.type === "lost"
        ? counts.lost
        : query.type === "found"
          ? counts.found
          : counts.all;

    const totalPages = Math.max(
      1,
      Math.min(MAX_FEED_PAGES, Math.ceil(totalCount / PAGE_SIZE))
    );

    const safePage = Math.min(query.page, totalPages);
    const rangeStart = (safePage - 1) * PAGE_SIZE;
    const items = allItems.slice(rangeStart, rangeStart + PAGE_SIZE);

    const lostIds = items.filter((item) => item.kind === "lost").map((item) => item.id);
    const foundIds = items.filter((item) => item.kind === "found").map((item) => item.id);

    const [lostImagesResult, foundImagesResult] = await Promise.all([
      lostIds.length > 0
        ? supabase
            .from("item_images")
            .select("lost_item_id, storage_path")
            .in("lost_item_id", lostIds)
            .eq("position", 0)
        : Promise.resolve({ data: null }),

      foundIds.length > 0
        ? supabase
            .from("item_images")
            .select("found_item_id, storage_path")
            .in("found_item_id", foundIds)
            .eq("position", 0)
        : Promise.resolve({ data: null }),
    ]);

    const [lostImageMap, foundImageMap] = await Promise.all([
      buildImageMap(
        lostImagesResult.data as Array<{
          lost_item_id: string;
          storage_path: string;
        }> | null,
        "lost_item_id"
      ),
      buildImageMap(
        foundImagesResult.data as Array<{
          found_item_id: string;
          storage_path: string;
        }> | null,
        "found_item_id"
      ),
    ]);

    const imageMap = new Map<string, string>([
      ...lostImageMap,
      ...foundImageMap,
    ]);

    return {
      query,
      items,
      imageMap,
      counts,
      totalCount,
      totalPages,
      safePage,
      mapPoints: buildMapPoints(allItems),
      error: Boolean(queryError),
    };
  } catch {
    // Network/infra failure — degrade to the page's inline error state.
    return {
      query,
      items: [],
      imageMap: new Map(),
      counts: { all: 0, lost: 0, found: 0 },
      totalCount: 0,
      totalPages: 1,
      safePage: 1,
      mapPoints: [],
      error: true,
    };
  }
}