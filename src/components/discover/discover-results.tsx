import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ItemCard } from "@/components/item-card";
import { Reveal } from "@/components/reveal";
import { PAGE_SIZE, buildPageHref, type DiscoverQuery } from "@/lib/discover/params";
import { reportedLabel } from "@/lib/discover/labels";
import type { FeedItem } from "@/lib/discover/query";

/**
 * The feed column — result cards, pagination, and the inline error/empty
 * states. Pure presentation: all data arrives resolved via props.
 */

export function FeedHeaderLeft({
  totalCount,
  type,
  city,
}: {
  totalCount: number;
  type: DiscoverQuery["type"];
  city: string;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 ring-1 ring-inset ring-teal-200/70">
        <span className="size-1.5 rounded-full bg-teal-600" aria-hidden="true" />
        Community feed
      </p>

      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
        Latest reports
      </h2>

      {/* aria-live: announced when a filter/sort/page change re-renders it */}
      <p role="status" className="mt-1 text-sm text-slate-500">
        <span className="font-semibold tabular-nums text-navy-900">
          {totalCount}
        </span>{" "}
        active report
        {totalCount === 1 ? "" : "s"}
        {type !== "all" && (
          <>
            {" · "}
            {type === "lost" ? "lost items" : "found items"}
          </>
        )}
        {city && (
          <>
            {" · near "}
            <span className="font-medium text-navy-900">{city}</span>
          </>
        )}
        {" · "}
        <a
          href="#discover-map"
          className="font-semibold text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline"
        >
          View on map
        </a>
      </p>
    </div>
  );
}

export function DiscoverErrorState() {
  return (
    <div
      role="alert"
      className="my-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3.5"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />

      <div>
        <h2 className="text-sm font-bold text-navy-900">Something went wrong</h2>

        <p className="mt-0.5 text-sm text-slate-600">
          We couldn&apos;t load the community reports right now. Please refresh
          the page or try again in a moment.
        </p>
      </div>
    </div>
  );
}

// === PART 2 MARKER ===

export function DiscoverResultsGrid({
  query,
  items,
  imageMap,
  totalCount,
  totalPages,
  safePage,
}: {
  query: DiscoverQuery;
  items: FeedItem[];
  imageMap: Map<string, string>;
  totalCount: number;
  totalPages: number;
  safePage: number;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="Reports">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 2xl:grid-cols-3">
        {items.map((item, index) => (
          <Reveal
            key={`${item.kind}-${item.id}`}
            // Capped so deep pages never feel sluggish — 0.3s max stagger.
            delay={Math.min(index * 0.04, 0.3)}
          >
            <ItemCard
              href={`/${item.kind}/${item.id}`}
              kind={item.kind}
              title={item.title}
              category={item.category}
              city={item.city}
              province={item.province}
              imageUrl={imageMap.get(item.id)}
              reported={reportedLabel(item.created_at)}
              description={item.description}
              views={item.view_count}
              reward={item.reward_amount}
            />
          </Reveal>
        ))}
      </div>

      <Pagination
        query={query}
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalCount}
      />
    </section>
  );
}

// === PART 3 MARKER ===

function pageWindowItems(
  current: number,
  total: number
): Array<number | "gap"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: Array<number | "gap"> = [];
  const windowSize = 1;

  if (current > windowSize + 2) {
    items.push(1, "gap");
  } else {
    for (let index = 1; index < current - windowSize; index++) {
      items.push(index);
    }
  }

  for (
    let index = Math.max(1, current - windowSize);
    index <= Math.min(total, current + windowSize);
    index++
  ) {
    items.push(index);
  }

  if (current < total - windowSize - 1) {
    items.push("gap", total);
  } else {
    for (let index = current + windowSize + 1; index <= total; index++) {
      items.push(index);
    }
  }

  return items;
}

const PAGE_LINK_CLASS =
  "inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-300 hover:text-teal-700";
const PAGE_ACTIVE_CLASS =
  "inline-flex size-9 items-center justify-center rounded-lg bg-teal-700 font-semibold text-white shadow-sm";

function Pagination({
  query,
  currentPage,
  totalPages,
  totalItems,
}: {
  query: DiscoverQuery;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = pageWindowItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-col gap-5 border-t border-slate-200/70 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-slate-500">
        Showing{" "}
        <span className="font-medium text-navy-900">
          {(currentPage - 1) * PAGE_SIZE + 1}
        </span>{" "}
        to{" "}
        <span className="font-medium text-navy-900">
          {Math.min(currentPage * PAGE_SIZE, totalItems)}
        </span>{" "}
        of{" "}
        <span className="font-medium text-navy-900">{totalItems}</span> results
      </p>

      <ul className="flex items-center gap-1">
        {currentPage > 1 && (
          <li>
            <Link
              href={buildPageHref(query, { page: currentPage - 1 })}
              className={PAGE_LINK_CLASS}
              aria-label="Previous page"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </li>
        )}

        {pageItems.map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-slate-400"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={buildPageHref(query, { page: item })}
                aria-current={item === currentPage ? "page" : undefined}
                className={
                  item === currentPage ? PAGE_ACTIVE_CLASS : PAGE_LINK_CLASS
                }
              >
                {item}
              </Link>
            </li>
          )
        )}

        {currentPage < totalPages && (
          <li>
            <Link
              href={buildPageHref(query, { page: currentPage + 1 })}
              className={PAGE_LINK_CLASS}
              aria-label="Next page"
            >
              <ArrowRight className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}