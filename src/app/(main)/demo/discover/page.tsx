import { notFound } from "next/navigation";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";
import { DiscoverResultsView } from "@/components/listing/discover-results-view";
import { DiscoverHeader } from "@/components/discover/discover-header";
import {
  ActiveFilterChips,
  DiscoverFilters,
} from "@/components/discover/discover-filters";
import {
  DiscoverErrorState,
  DiscoverResultsGrid,
  FeedHeaderLeft,
} from "@/components/discover/discover-results";
import { DiscoverMapCard } from "@/components/discover/discover-map-card";
import { buildPageHref, type SearchParams } from "@/lib/discover/params";
import { fetchDemoDiscoverPage } from "@/lib/demo/mock-discover";
import { DEMO_MODE } from "@/lib/demo/config";

export const metadata = {
  title: { absolute: "Demo feed — FindBack PH (sample data)" },
  robots: { index: false, follow: false },
};

/**
 * Demo Scenes 2–3 — the REAL discover feed (header, filters, results grid,
 * map, empty state) rendered over the labeled sample fixture. The demo bar
 * (layout) carries scene navigation; no analytics fire in demo mode.
 */
export default async function DemoDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams & { q?: string }>;
}) {
  if (!DEMO_MODE) notFound();

  const raw = await searchParams;
  const data = fetchDemoDiscoverPage(raw);
  const { query } = data;

  return (
    <div className="min-h-screen text-navy-900">
      <DiscoverHeader
        counts={{ lost: data.counts.lost, found: data.counts.found }}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-3 md:sticky md:top-16 md:z-30">
          <DiscoverFilters query={query} counts={data.counts} />
        </div>

        {data.error ? (
          <DiscoverErrorState />
        ) : (
          <DiscoverResultsView
            headerLeft={
              <FeedHeaderLeft
                totalCount={data.totalCount}
                type={query.type}
                city={query.city}
              />
            }
            map={<DiscoverMapCard points={data.mapPoints} />}
          >
            <ActiveFilterChips query={query} />

            {data.items.length > 0 ? (
              <DiscoverResultsGrid
                query={query}
                items={data.items}
                imageMap={data.imageMap}
                totalCount={data.totalCount}
                totalPages={data.totalPages}
                safePage={data.safePage}
              />
            ) : (
              <ListingEmptyState
                accent="discover"
                title="No matching items found"
                description="Try widening your filters, or check back soon — new reports land every day."
                hasFilters={Boolean(
                  query.category || query.city || query.province || query.when !== "any"
                )}
                clearHref={buildPageHref(query, {
                  category: "",
                  city: "",
                  province: "",
                  when: "any",
                  page: 1,
                })}
                reportHref="/report/lost"
                reportLabel="Report a lost item"
                secondaryHref="/report/found"
                secondaryLabel="Post something you found"
                secondaryNote="Found something on your way home? Posting it takes under two minutes and may reunite it with its owner today."
              />
            )}
          </DiscoverResultsView>
        )}
      </main>
    </div>
  );
}
