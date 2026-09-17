import { PAGE_SIZE, dateFilterRange, parseDiscoverParams, type SearchParams } from "@/lib/discover/params";
import type { DiscoverData } from "@/lib/discover/query";
import {
  DEMO_REPORTS,
  demoFeedItems,
  demoImageMap,
  demoMapPoints,
} from "./fixture";

/**
 * Demo feed — an in-memory mirror of fetchDiscoverPage (src/lib/discover/
 * query.ts) with the SAME return contract, so /demo/discover can reuse every
 * real feed component. Filters (category/city/province/when/sort) apply to
 * the sample set exactly as they do to the live database, including a text
 * `q` match against title + description (the real feed has no free-text
 * search yet — the demo shows the intended behavior without touching the
 * production query path).
 */
export function fetchDemoDiscoverPage(
  params: SearchParams & { q?: string }
): DiscoverData {
  const query = parseDiscoverParams(params);
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";

  const { from, to } = dateFilterRange(query.when);

  const matches = demoFeedItems().filter((item) => {
    if (query.category && item.category !== query.category) return false;
    if (query.city && !item.city?.toLowerCase().includes(query.city.toLowerCase()))
      return false;
    if (
      query.province &&
      !item.province?.toLowerCase().includes(query.province.toLowerCase())
    )
      return false;
    if (from && item.created_at < from) return false;
    if (to && item.created_at >= to) return false;
    if (query.type !== "all" && item.kind !== query.type) return false;
    if (q) {
      const haystack = `${item.title} ${item.description ?? ""} ${item.city ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sortKey = (item: { created_at: string; updated_at?: string | null }) =>
    query.sort === "recently-updated" ? item.updated_at ?? item.created_at : item.created_at;

  matches.sort((a, b) => {
    const first = sortKey(a);
    const second = sortKey(b);
    return query.sort === "oldest"
      ? first.localeCompare(second)
      : second.localeCompare(first);
  });

  const lostCount = matches.filter((i) => i.kind === "lost").length;
  const foundCount = matches.filter((i) => i.kind === "found").length;
  const counts = { all: lostCount + foundCount, lost: lostCount, found: foundCount };

  const totalCount = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(query.page, totalPages);
  const items = matches.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Image + map points come from the WHOLE demo set (same contract as the
  // live feed: imageMap covers visible items, mapPoints stay stable).
  const imageMap = demoImageMap();
  const mapPoints = demoMapPoints();

  return {
    query,
    items,
    imageMap,
    counts,
    totalCount,
    totalPages,
    safePage,
    mapPoints,
    error: false,
  };
}

/** Demo "possible matches" for a demo report id (phones pair across kinds). */
export function getDemoMatches(id: string) {
  const report = DEMO_REPORTS.find((r) => r.id === id);
  if (!report || report.category !== "phones") return [];

  return DEMO_REPORTS.filter(
    (r) => r.id !== id && r.category === "phones" && r.kind !== report.kind
  ).map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    category: r.category,
    city: r.city,
    province: r.province,
    score: null,
  }));
}

/** Other demo reports in the same category (for the "Similar reports" rail). */
export function getDemoSimilar(id: string) {
  const report = DEMO_REPORTS.find((r) => r.id === id);
  if (!report) return [];

  return DEMO_REPORTS.filter((r) => r.id !== id && r.category === report.category)
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      category: r.category,
      city: r.city,
      province: r.province,
      createdAt: new Date(Date.now() - r.hoursAgo * 3_600_000).toISOString(),
      imageUrl: r.photo,
    }));
}
