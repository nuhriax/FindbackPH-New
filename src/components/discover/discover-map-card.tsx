import { LockKeyhole, MapPinned } from "lucide-react";
import { PhilippinesMap } from "@/components/map/philippines-map";
import type { MapPoint } from "@/components/map/philippines-map-impl";

/**
 * The map rail card — sticky companion to the feed on xl, toggled view below.
 * Privacy posture is stated in-card: points are approximate areas, never exact
 * addresses.
 */
export function DiscoverMapCard({ points }: { points: MapPoint[] }) {
  const empty = points.length === 0;

  return (
    <div
      id="discover-map"
      className="relative flex h-[560px] flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-card ring-1 ring-inset ring-slate-900/[0.03]"
    >
      {/* Brand accent hairline across the top of the card */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-teal-600 via-sulo-400 to-sulo-500"
      />

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
          <MapPinned className="size-4 text-teal-600" />
          Report locations
        </h3>

        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200/70">
          <LockKeyhole className="size-3" />
          Approximate
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <PhilippinesMap mode="view" points={points} />

        {empty && (
          <div className="absolute left-1/2 top-1/2 z-10 flex max-w-[13rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl bg-white/90 px-4 py-3 text-center shadow-sm ring-1 ring-inset ring-slate-900/[0.04] backdrop-blur-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200/70">
              <MapPinned className="size-3.5" aria-hidden="true" />
            </span>

            <p className="mt-1.5 text-[11px] font-semibold leading-tight text-navy-900">
              No reports to plot yet
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
              Locations appear as reports come in.
            </p>
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 border-t border-slate-100 bg-teal-50/50 px-4 py-3 text-[11px] leading-4 text-slate-600">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-teal-600" />
        Points are rounded to a general area. Exact addresses are never shown.
      </p>
    </div>
  );
}