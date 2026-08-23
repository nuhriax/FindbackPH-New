import { Clock3, MapPin, PackageSearch } from "lucide-react";
import { ACCENT, type Accent } from "./accents";

type Stat = {
  icon: typeof PackageSearch;
  value: number;
  label: string;
};

/**
 * Live community stats strip shared by the Lost / Found listing pages so both
 * surface real numbers ("active reports", "total reports", coverage) instead of
 * static placeholders. Renders as responsive cards powered by the accent color.
 */
export function ListingStats({
  accent,
  activeCount,
  totalCount,
  noun,
}: {
  accent: Accent;
  /** Reports currently active and waiting to be matched. */
  activeCount: number;
  /** All reports ever submitted for this category. */
  totalCount: number;
  /** "found" or "lost" — used for the human labels. */
  noun: "found" | "lost";
}) {
  const a = ACCENT[accent];
  const title = noun === "found" ? "Found" : "Lost";

  const stats: Stat[] = [
    {
      icon: PackageSearch,
      value: activeCount,
      label: `Active ${title.toLowerCase()} reports`,
    },
    {
      icon: Clock3,
      value: totalCount,
      label: "Total reports submitted",
    },
  ];

  return (
    <section aria-label="Community activity" className="mt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3.5 shadow-sm backdrop-blur"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${a.border} ${a.bgSoft} ${a.text}`}
            >
              <stat.icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight tabular-nums text-navy-900">
                {stat.value.toLocaleString()}
              </p>
              <p className="truncate text-[11px] font-medium text-slate-600">
                {stat.label}
              </p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3.5 shadow-sm backdrop-blur">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${a.border} ${a.bgSoft} ${a.text}`}
          >
            <MapPin aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-600">Coverage</p>
            <p className="text-sm font-semibold text-navy-900">Philippines-wide</p>
          </div>
        </div>
      </div>
    </section>
  );
}