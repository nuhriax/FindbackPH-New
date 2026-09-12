import { ArrowRight, ShieldCheck } from "lucide-react";
import { after } from "next/server";
import { ButtonLink } from "@/components/ui/button";
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
import { buildPageHref, ROUTES, type SearchParams } from "@/lib/discover/params";
import { fetchDiscoverPage } from "@/lib/discover/query";
import { trackServerEvent } from "@/lib/analytics";

export const metadata = {
  title: {
    absolute: "Discover — Lost & Found Reports Across the Philippines",
  },
  description:
    "Browse active lost and found reports from communities across the Philippines.",
};

/**
 * Discover — orchestration only. Param parsing, querying and all UI live in
 * src/lib/discover/* and src/components/discover/*; this component wires them
 * together in the canonical order: header → sticky dock → chips → feed+map.
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const data = await fetchDiscoverPage(await searchParams);
  const { query } = data;

  // Analytics off the critical path — the response ships before this runs.
  after(async () => {
    await trackServerEvent("search_performed", "search", {
      has_category: Boolean(query.category),
      has_city: Boolean(query.city),
      has_province: Boolean(query.province),
      has_date: query.when !== "any",
      type: query.type,
      sort: query.sort,
      page: data.safePage,
      result_count: data.totalCount,
    });
  });

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
                reportHref={ROUTES.reportLost}
                reportLabel="Report a lost item"
                secondaryHref={ROUTES.reportFound}
                secondaryLabel="Post something you found"
                secondaryNote="Found something on your way home? Posting it takes under two minutes and may reunite it with its owner today."
              />
            )}
          </DiscoverResultsView>
        )}

        <HelpSection />
      </main>
    </div>
  );
}

/** Footer-adjacent help strip — glass panel that tints the luminous canvas. */
function HelpSection() {
  return (
    <section className="pb-20 pt-14">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 px-5 py-8 shadow-soft ring-1 ring-inset ring-slate-900/[0.03] backdrop-blur-xl sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-teal-500/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm shadow-teal-600/25">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>

            <div className="max-w-xl">
              <h2 className="font-display text-lg font-bold text-navy-900">
                Looking for your item?
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your belongings might be closer than you think. Search reports from people across the Philippines, connect privately, and take the next step toward bringing them home.
              </p>
            </div>
          </div>

          <ButtonLink href="/how-it-works" variant="outline" className="group shrink-0">
            How it works
            <ArrowRight
              aria-hidden="true"
              className="ml-2 size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
            />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}