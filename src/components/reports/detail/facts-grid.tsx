import { Banknote, Calendar, Lock, MapPin, Smartphone } from "lucide-react";

import type { DetailItem } from "../report-detail-types";

/* ============================================================
   KEY FACTS — compact location · date · reward chips under the
   title, so the essentials are scannable in one glance.
============================================================ */

export function FactsRow({
  isLost,
  item,
  location,
  daysAgoLabel,
  categoryLabel,
  showReward = true,
}: {
  isLost: boolean;
  item: DetailItem;
  location: string;
  daysAgoLabel: string | null;
  categoryLabel: string;
  /** False hides the reward tile (it moves to the right-rail stats). */
  showReward?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile
          icon={<Smartphone size={13} className="shrink-0 text-slate-500" />}
          label="Model"
          value={item.title}
          title={item.title}
        />
        <MetricTile
          icon={<MapPin size={13} className="shrink-0 text-sky-600" />}
          label="Location"
          value={location}
          title={location}
        />

        <MetricTile
          icon={<Calendar size={13} className="shrink-0 text-amber-600" />}
          label={isLost ? "Lost on" : "Found on"}
          value={
            <span className="block whitespace-normal leading-5">
              {item.dateLabel || "Not provided"}
              {daysAgoLabel && (
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                  {daysAgoLabel}
                </span>
              )}
            </span>
          }
          wrap
          title={item.dateLabel || undefined}
        />

        {showReward && item.reward !== null && (
          <MetricTile
            icon={<Banknote size={13} className="shrink-0 text-emerald-600" />}
            label="Reward"
            value={`₱${item.reward.toLocaleString()}`}
            valueClassName="font-bold text-emerald-700"
            tileClassName="border-emerald-200/80 bg-emerald-50/80"
            title={`₱${item.reward.toLocaleString()}`}
          />
        )}
      </div>

      {/* Holding location (found items only) — where the finder is
          keeping the item, so owners know it's safe. */}
      {!isLost && item.holdingInfo && (
        <div
          className="
            mt-2
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-emerald-200/70
            border-l-2
            border-l-emerald-500
            bg-emerald-50/70
            px-3
            py-2
          "
        >
          <Lock size={13} className="shrink-0 text-emerald-600" />

          <p className="min-w-0 text-xs text-slate-600">
            <span className="font-semibold text-emerald-700">
              Currently kept at:{" "}
            </span>
            {item.holdingInfo}
          </p>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  valueClassName = "font-bold text-slate-900",
  tileClassName = "",
  title,
  wrap = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  tileClassName?: string;
  title?: string;
  wrap?: boolean;
}) {
  return (
    <div
      className={`
        min-w-0
        rounded-xl
        border
        border-slate-200/80
        bg-white/70
        px-3.5
        py-3
        shadow-sm
        backdrop-blur
        ${tileClassName}
      `}
    >
      <p
        className="
          flex
          items-center
          gap-1.5
          text-[11px]
          font-medium
          text-slate-500
        "
      >
        {icon}
        {label}
      </p>

      <p className={`mt-1 text-sm ${wrap ? "" : "truncate"} ${valueClassName}`} title={title}>
        {value}
      </p>
    </div>
  );
}
