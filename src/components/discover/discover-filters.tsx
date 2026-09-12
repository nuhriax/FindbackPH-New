import {
  ChevronDown,
  Filter,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CategoryScroller, type CategoryItem } from "@/components/listing/category-scroller";
import { CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ItemCategory } from "@/types/database";
import {
  ROUTES,
  buildPageHref,
  hasActiveFilters,
  type DateFilter,
  type DiscoverQuery,
  type FeedType,
  type SortOption,
} from "@/lib/discover/params";
import {
  DATE_FILTER_LABELS,
  SORT_LABELS,
  TYPE_LABELS,
} from "@/lib/discover/labels";

/**
 * The Discover control dock — sticky band holding the city search, filter and
 * sort controls, the category scroller and the All/Lost/Found feed switch.
 * Everything builds its navigation through buildPageHref, so URL state stays
 * consistent no matter which control the user touches.
 */
export function DiscoverFilters({
  query,
  counts,
}: {
  query: DiscoverQuery;
  counts: Record<FeedType, number>;
}) {
  const filtersActive = hasActiveFilters(query);

  const categoryItems: CategoryItem[] = [
    {
      key: "all",
      label: "All categories",
      href: buildPageHref(query, { category: "", page: 1 }),
      icon: <LayoutGrid size={20} />,
    },
    ...Object.keys(CATEGORY_LABELS).map((item) => ({
      key: item,
      label: CATEGORY_LABELS[item as keyof typeof CATEGORY_LABELS],
      href: buildPageHref(query, { category: item, page: 1 }),
      icon: CATEGORY_ICONS[item as ItemCategory],
    })),
  ];

  return (
    <div className="rounded-3xl border border-white/60 bg-white/75 p-1.5 shadow-card ring-1 ring-inset ring-slate-900/[0.03] backdrop-blur-2xl">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        {/* City search — plain GET form, works without JS */}
        <form action={ROUTES.explore} method="get" className="min-w-0 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <label htmlFor="discover-city" className="sr-only">
              Search by city or municipality
            </label>

            <input
              id="discover-city"
              type="search"
              name="city"
              defaultValue={query.city}
              maxLength={80}
              placeholder="Search by city or municipality..."
              autoComplete="address-level2"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 hover:bg-slate-100 focus:border-transparent focus:bg-white focus:ring-4 focus:ring-teal-500/20"
            />

            <input type="hidden" name="category" value={query.category} />
            <input type="hidden" name="province" value={query.province} />
            <input type="hidden" name="when" value={query.when} />
            <input type="hidden" name="sort" value={query.sort} />
            <input type="hidden" name="type" value={query.type} />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <DiscoverFilterDropdown query={query} />

            {filtersActive && <ClearFiltersButton query={query} />}
          </div>

          <div className="min-w-0 flex-1 md:hidden">
            <MobileFilterSheet query={query} />
          </div>

          <SortDropdown query={query} />
        </div>
      </div>

      <div className="mt-1.5 flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <CategoryScroller
            items={categoryItems}
            activeKey={query.category || "all"}
          />
        </div>

        <TypeSwitch query={query} counts={counts} />
      </div>
    </div>
  );
}

// === PART 2 MARKER ===

function MobileFilterSheet({ query }: { query: DiscoverQuery }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-12 w-full">
          <SlidersHorizontal className="mr-2 size-4" />
          Filters
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter reports</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          <FilterForm query={query} idPrefix="mobile" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DiscoverFilterDropdown({ query }: { query: DiscoverQuery }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 size-4" />
          Filter
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80">
        <div className="p-4">
          <FilterForm query={query} idPrefix="desktop" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortDropdown({ query }: { query: DiscoverQuery }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex-shrink-0">
          <span className="hidden sm:inline">Sort: {SORT_LABELS[query.sort]}</span>
          <span className="sm:hidden">Sort</span>
          <ChevronDown className="ml-2 size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {(["newest", "oldest", "recently-updated"] as SortOption[]).map((sort) => (
          <DropdownMenuItem key={sort} asChild>
            <Link href={buildPageHref(query, { sort, page: 1 })}>
              {SORT_LABELS[sort]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// === PART 3 MARKER ===

function FilterForm({
  query,
  idPrefix,
}: {
  query: DiscoverQuery;
  idPrefix: string;
}) {
  return (
    <form action={ROUTES.explore} method="get" className="space-y-6">
      <input type="hidden" name="type" value={query.type === "all" ? "" : query.type} />
      <input type="hidden" name="sort" value={query.sort} />
      <input type="hidden" name="city" value={query.city} />

      <div>
        <label
          htmlFor={`${idPrefix}-category`}
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Category
        </label>

        <select
          id={`${idPrefix}-category`}
          name="category"
          defaultValue={query.category}
          className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-navy-900 outline-none transition hover:bg-slate-100 focus:border-transparent focus:bg-white focus:ring-4 focus:ring-teal-500/20"
        >
          <option value="">All categories</option>

          {Object.keys(CATEGORY_LABELS).map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item as keyof typeof CATEGORY_LABELS]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-province`}
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Province or region
        </label>

        <input
          id={`${idPrefix}-province`}
          type="text"
          name="province"
          defaultValue={query.province}
          maxLength={80}
          placeholder="e.g. Cebu"
          className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 hover:bg-slate-100 focus:border-transparent focus:bg-white focus:ring-4 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">Date reported</p>

        <div className="flex flex-col gap-2">
          {(["any", "today", "week", "month", "older"] as DateFilter[]).map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="radio"
                name="when"
                value={option === "any" ? "" : option}
                defaultChecked={option === query.when}
                className="size-4 accent-teal-600"
              />

              <span className="text-sm text-slate-600">
                {DATE_FILTER_LABELS[option]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>

        <ButtonLink
          href={buildPageHref(query, {
            category: "",
            province: "",
            when: "any",
            page: 1,
          })}
          variant="ghost"
          className="flex-1"
        >
          Clear
        </ButtonLink>
      </div>
    </form>
  );
}

// === PART 4 MARKER ===

function FilterChip({
  query,
  label,
  filterKey,
}: {
  query: DiscoverQuery;
  label: string;
  filterKey: keyof DiscoverQuery;
}) {
  return (
    <Link
      href={buildPageHref(query, { [filterKey]: "", page: 1 })}
      className="group inline-flex items-center gap-1.5 rounded-full bg-teal-50 py-1.5 pl-3 pr-2 text-sm font-medium text-teal-800 ring-1 ring-teal-200 transition hover:bg-teal-100"
    >
      {label}
      <X className="size-4 rounded-full group-hover:bg-teal-200/60" />
    </Link>
  );
}

function ClearFiltersButton({ query }: { query: DiscoverQuery }) {
  return (
    <Link
      href={buildPageHref(query, {
        category: "",
        city: "",
        province: "",
        when: "any",
        page: 1,
      })}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-navy-900"
    >
      <X className="size-4" />
      Clear filters
    </Link>
  );
}

function TypeSwitch({
  query,
  counts,
}: {
  query: DiscoverQuery;
  counts: Record<FeedType, number>;
}) {
  return (
    <nav
      aria-label="Feed type"
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {(["all", "lost", "found"] as FeedType[]).map((item) => {
        const active = query.type === item;

        return (
          <Link
            key={item}
            href={buildPageHref(query, { type: item, page: 1 })}
            aria-current={active ? "true" : undefined}
            className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-teal-700"
            }`}
          >
            {TYPE_LABELS[item]}

            <span
              className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${
                active ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-500"
              }`}
            >
              {counts[item]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Active-filter chips row — rendered once, between the dock and the feed. */
export function ActiveFilterChips({ query }: { query: DiscoverQuery }) {
  if (!hasActiveFilters(query)) {
    return null;
  }

  return (
    <div aria-label="Active filters" className="flex flex-wrap items-center gap-2 pb-1">
      {query.city && (
        <FilterChip query={query} label={`City: ${query.city}`} filterKey="city" />
      )}

      {query.province && (
        <FilterChip
          query={query}
          label={`Province: ${query.province}`}
          filterKey="province"
        />
      )}

      {query.category && (
        <FilterChip
          query={query}
          label={`Category: ${CATEGORY_LABELS[query.category as keyof typeof CATEGORY_LABELS]}`}
          filterKey="category"
        />
      )}

      {query.when !== "any" && (
        <FilterChip
          query={query}
          label={`Date: ${DATE_FILTER_LABELS[query.when]}`}
          filterKey="when"
        />
      )}

      <ClearFiltersButton query={query} />
    </div>
  );
}