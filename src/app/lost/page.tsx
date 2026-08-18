import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { getImagePublicUrl } from "@/lib/storage";
import type { ItemCategory } from "@/types/database";
import { Reveal } from "@/components/reveal";
import { ListingHero } from "@/components/listing/listing-hero";
import { ListingSearch } from "@/components/listing/listing-search";
import { ListingCategories } from "@/components/listing/listing-categories";
import { ListingResultsHeader } from "@/components/listing/listing-results-header";
import { ListingEmptyState } from "@/components/listing/listing-empty-state";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow, isValid } from "date-fns";

/* ==========================================================================
   Configuration
   ========================================================================== */

const PAGE_SIZE = 30;
const MAX_SEARCH_LENGTH = 100;

const ROUTES = {
  lost: "/lost",
  reportLost: "/report/lost",
} as const;

/* ==========================================================================
   Types
   ========================================================================== */

type SearchParamValue = string | string[] | undefined;

type SearchParams = {
  q?: SearchParamValue;
  category?: SearchParamValue;
  city?: SearchParamValue;
  page?: SearchParamValue;
  sort?: SearchParamValue;
};

type LostItem = {
  id: string;
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  date_lost: string | null;
  description: string | null;
  created_at: string;
};

type ItemImage = {
  lost_item_id: string;
  storage_path: string;
};

type SortOption = "newest" | "oldest" | "recently-updated";

/* ==========================================================================
   Helpers
   ========================================================================== */

function getParam(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function normalizeSearch(
  value: string,
  maxLength = MAX_SEARCH_LENGTH,
): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parsePage(value: SearchParamValue): number {
  const raw = Number.parseInt(getParam(value), 10);

  if (!Number.isFinite(raw) || raw < 1) {
    return 1;
  }

  return Math.min(raw, 9999);
}

function isValidCategory(
  value: string,
): value is (typeof CATEGORIES)[number] {
  return CATEGORIES.includes(
    value as (typeof CATEGORIES)[number],
  );
}

function isValidSort(value: string): value is SortOption {
  return (
    value === "newest" ||
    value === "oldest" ||
    value === "recently-updated"
  );
}

function formatLostDate(value: string | null): string {
  if (!value) {
    return "Date unknown";
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return "Date unknown";
  }

  return format(date, "MMM d, yyyy");
}

function formatRelativeDate(value: string | null): string {
  if (!value) {
    return "Recently reported";
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return "Recently reported";
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
  });
}

function reportedLabel(value: string): string {
  const relative = formatRelativeDate(value);

  return relative === "Recently reported"
    ? "Reported recently"
    : `Reported ${relative}`;
}

function createImageMap(images: ItemImage[]): Map<string, string> {
  return new Map(
    images
      .filter(
        (image) =>
          Boolean(image.lost_item_id) &&
          Boolean(image.storage_path),
      )
      .map((image) => [
        image.lost_item_id,
        getImagePublicUrl(image.storage_path),
      ]),
  );
}

function buildPageHref({
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
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (city) params.set("city", city);

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `${ROUTES.lost}?${query}`
    : ROUTES.lost;
}

/* ==========================================================================
   Page
   ========================================================================== */

export default async function LostItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = createClient();
  const params = await searchParams;

  /* ------------------------------------------------------------------------
     Parse URL state
     ------------------------------------------------------------------------ */

  const q = normalizeSearch(getParam(params.q));

  const rawCategory = normalizeSearch(
    getParam(params.category),
    50,
  );

  const category = isValidCategory(rawCategory)
    ? rawCategory
    : "";

  const city = normalizeSearch(getParam(params.city));

  const rawSort = normalizeSearch(
    getParam(params.sort),
    30,
  );

  const sort: SortOption = isValidSort(rawSort)
    ? rawSort
    : "newest";

  const page = parsePage(params.page);

  const hasFilters = Boolean(q || category || city);

  const rangeStart = (page - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  /* ------------------------------------------------------------------------
     Sort configuration
     ------------------------------------------------------------------------ */

  const sortColumn =
    sort === "recently-updated"
      ? "updated_at"
      : "created_at";

  const ascending = sort === "oldest";

  /* ------------------------------------------------------------------------
     Query lost items
     ------------------------------------------------------------------------ */

  let query = supabase
    .from("lost_items")
    .select(
      `
        id,
        title,
        category,
        city,
        province,
        date_lost,
        description,
        created_at
      `,
      { count: "exact" },
    )
    .eq("status", "active")
    .order(sortColumn, {
      ascending,
      nullsFirst: false,
    })
    .range(rangeStart, rangeEnd);

  if (q) {
    query = query.textSearch(
      "search_vector",
      q,
      {
        type: "websearch",
      },
    );
  }

  if (category) {
    query = query.eq(
      "category",
      category,
    );
  }

  if (city) {
    query = query.ilike(
      "city",
      `%${city}%`,
    );
  }

  const {
    data: rawItems,
    error,
    count,
  } = await query;

  const items = (rawItems ?? []) as LostItem[];

  const totalCount = count ?? 0;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalCount / PAGE_SIZE,
    ),
  );

  /* ------------------------------------------------------------------------
     Fetch first image for each result
     ------------------------------------------------------------------------ */

  const itemIds = items.map(
    (item) => item.id,
  );

  let imageMap = new Map<
    string,
    string
  >();

  if (itemIds.length > 0) {
    const {
      data: rawImages,
    } = await supabase
      .from("item_images")
      .select(
        "lost_item_id, storage_path",
      )
      .in(
        "lost_item_id",
        itemIds,
      )
      .eq("position", 0);

    imageMap = createImageMap(
      (rawImages ?? []) as ItemImage[],
    );
  }

  /* ------------------------------------------------------------------------
     Derived state
     ------------------------------------------------------------------------ */

  const hasResults = items.length > 0;
  const showEmptyState = !error && !hasResults;
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages;

  const categoryLabel = category
    ? CATEGORY_LABELS[
        category as keyof typeof CATEGORY_LABELS
      ] ?? category
    : "";

  const previousHref = buildPageHref({
    page: page - 1,
    q,
    category,
    city,
    sort,
  });

  const nextHref = buildPageHref({
    page: page + 1,
    q,
    category,
    city,
    sort,
  });

  const resultStart =
    totalCount === 0
      ? 0
      : rangeStart + 1;

  const resultEnd =
    Math.min(
      rangeStart + items.length,
      totalCount,
    );

  /* ------------------------------------------------------------------------
     Filter chips
     ------------------------------------------------------------------------ */

  const chips: { label: string; href: string }[] = [];

  if (q) {
    chips.push({
      label: `Search: ${q}`,
      href: buildPageHref({ page: 1, q: "", category, city, sort }),
    });
  }

  if (category) {
    chips.push({
      label: `Category: ${categoryLabel}`,
      href: buildPageHref({ page: 1, q, category: "", city, sort }),
    });
  }

  if (city) {
    chips.push({
      label: `Location: ${city}`,
      href: buildPageHref({ page: 1, q, category, city: "", sort }),
    });
  }
/* ==========================================================================
     UI
     ========================================================================== */

  return (
    <main className="min-h-screen">

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <ListingHero
          accent="lost"
          eyebrow="Lost item recovery"
          title={
            <>
              Find what you{" "}
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                lost.
              </span>
            </>
          }
          description="Search lost-item reports across the Philippines and discover possible matches."
          ctaHref={ROUTES.reportLost}
          ctaLabel="Report lost item"
        />

        {/* Search */}
        <div className="mt-6">
          <ListingSearch
            accent="lost"
            idPrefix="lost"
            q={q}
            category={category}
            city={city}
            sort={sort}
            maxLength={MAX_SEARCH_LENGTH}
            buttonLabel="Search"
            chips={chips}
            clearAllHref={ROUTES.lost}
          />
        </div>

        {/* Categories */}
        <ListingCategories
          accent="lost"
          activeCategory={category}
          buildHref={(itemCategory) =>
            buildPageHref({
              page: 1,
              q,
              category: itemCategory,
              city,
              sort,
            })
          }
        />

        {/* Error state */}
        {error ? (
          <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/70 px-6 py-12 text-center backdrop-blur">
            <p className="text-sm text-slate-600">
              We couldn&apos;t load the current reports.
            </p>
            <Link
              href={ROUTES.lost}
              className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
            >
              Try again
            </Link>
          </div>
        ) : items.length > 0 ? (
          <>
            {/* Results header */}
            <ListingResultsHeader
              accent="lost"
              title={hasFilters ? "Matching reports" : "Recently reported"}
              count={`${totalCount.toLocaleString()} ${
                totalCount === 1 ? "report" : "reports"
              }`}
              description={
                hasFilters
                  ? `Showing ${resultStart.toLocaleString()}–${resultEnd.toLocaleString()} reports matching your search.`
                  : "Browse the latest reports from the community."
              }
              sort={sort}
              hiddenFields={[
                { name: "q", value: q },
                { name: "category", value: category },
                { name: "city", value: city },
              ].filter((field) => Boolean(field.value))}
              viewAllHref={ROUTES.lost}
            />

            {/* Results grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <Reveal
                  key={item.id}
                  delay={(index % 6) * 35}
                  className="h-full"
                >
                  <ItemCard
                    href={`${ROUTES.lost}/${item.id}`}
                    title={item.title}
                    category={item.category}
                    city={item.city ?? ""}
                    province={item.province ?? ""}
                    reported={reportedLabel(item.created_at)}
                    description={item.description ?? ""}
                    kind="lost"
                    imageUrl={imageMap.get(item.id)}
                  />
                </Reveal>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Lost item pagination"
                className="mt-10 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur sm:flex-row"
              >
                <p className="text-xs text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-navy-900">{page}</span>{" "}
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
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-500 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-400"
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
          /* Empty state */
          <ListingEmptyState
            accent="lost"
            title="No lost items found"
            description={
              hasFilters
                ? "Try changing your search, category, or location filters."
                : "Be the first to report a lost item and give it a chance to come home."
            }
            hasFilters={hasFilters}
            clearHref={ROUTES.lost}
            reportHref={ROUTES.reportLost}
            reportLabel="Report a lost item"
          />
        )}
      </div>
    </main>
  );
}