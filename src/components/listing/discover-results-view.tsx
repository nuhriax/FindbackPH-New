"use client";

import { LayoutGrid, MapPin } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Owns Discover's results workspace: the feed on the left and — on xl screens
 * — a persistent, sticky map rail on the right, so geography is never more
 * than a glance away. Below xl the map becomes a toggleable view via the
 * Grid/Map segmented control. The map is a view of the same result set rather
 * than a second section users must discover after scrolling.
 */
export function DiscoverResultsView({
  children,
  map,
  recoveryHint,
  headerLeft,
}: {
  children: ReactNode;
  map?: ReactNode;
  recoveryHint?: ReactNode;
  /** Server-rendered feed title block (eyebrow + heading). */
  headerLeft?: ReactNode;
}) {
  const [view, setView] = useState<"grid" | "map">("grid");

  useEffect(() => {
    const syncMapLink = () => {
      if (window.location.hash === "#discover-map" && map) setView("map");
    };
    syncMapLink();
    window.addEventListener("hashchange", syncMapLink);
    return () => window.removeEventListener("hashchange", syncMapLink);
  }, [map]);

  return (
    <section aria-label="Report results">
      {/* Workspace header — title left; view toggle right. The toggle is
          hidden on xl, where grid + map render side by side. */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {headerLeft}
        {map && (
          <div
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm xl:hidden"
            role="tablist"
            aria-label="Results view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "grid"}
              onClick={() => setView("grid")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                view === "grid"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              Grid
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              onClick={() => setView("map")}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                view === "map"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              <MapPin size={14} aria-hidden="true" />
              Map
            </button>
          </div>
        )}
      </div>

      {/* Recovery nudge — a slim tinted callout under the header */}
      {recoveryHint && (
        <div className="mb-6 inline-flex max-w-2xl items-start gap-2 rounded-xl border border-teal-100 bg-teal-50/70 px-3.5 py-2.5">
          {recoveryHint}
        </div>
      )}

      {/* Split workspace — persistent map rail on xl; toggle below xl */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-7">
        <div className={`min-w-0 flex-1 ${view === "map" ? "hidden xl:block" : ""}`}>
          {children}
        </div>
        {map && (
          <aside
            aria-label="Report locations map"
            className={`shrink-0 xl:sticky xl:top-[148px] xl:block xl:w-[360px] 2xl:w-[400px] ${
              view === "map" ? "w-full" : "hidden"
            }`}
          >
            {map}
          </aside>
        )}
      </div>
    </section>
  );
}
