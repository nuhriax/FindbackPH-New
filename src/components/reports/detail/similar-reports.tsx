import Link from "next/link";
import { ImageIcon, LayoutGrid, MapPin } from "lucide-react";

import type { SimilarItem } from "../report-detail-types";

/* ============================================================
   SIMILAR REPORTS — other active reports, same category
============================================================ */

export function SimilarReports({
  categoryLabel,
  province,
  similarItems,
}: {
  categoryLabel: string;
  province: string | null;
  similarItems: SimilarItem[];
}) {
  if (similarItems.length === 0) return null;

  return (
    <section
      className="mt-8"
      aria-label="Similar reports"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <LayoutGrid size={14} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-900">
            More {categoryLabel.toLowerCase()} reports
          </p>
          <p className="text-xs text-slate-400">
            {province
              ? `Other active reports in ${province}`
              : "Other active reports on FindBack PH"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {similarItems.map((s) => (
          <SimilarCard key={s.id} item={s} />
        ))}
      </div>
    </section>
  );
}

function SimilarCard({ item: s }: { item: SimilarItem }) {
  const href = s.kind === "lost" ? `/lost/${s.id}` : `/found/${s.id}`;

  const sLocation =
    [s.city, s.province].filter(Boolean).join(", ") ||
    "Location not set";

  const sDays = s.createdAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(s.createdAt).getTime()) / 86_400_000,
        ),
      )
    : null;
  const sDaysLabel =
    sDays === null
      ? null
      : sDays === 0
        ? "Posted today"
        : sDays === 1
          ? "Posted yesterday"
          : `Posted ${sDays} days ago`;

  return (
    <Link
      href={href}
      className="
        group overflow-hidden rounded-xl border border-slate-200/80
        bg-white transition-all hover:border-slate-300 hover:shadow-md
      "
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {s.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.imageUrl}
            alt={s.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageIcon size={28} />
          </div>
        )}

        <span
          className={`
            absolute left-2 top-2 rounded-full px-2 py-0.5
            text-[9px] font-bold uppercase tracking-wide text-white shadow-sm
            ${s.kind === "lost" ? "bg-red-500/90" : "bg-emerald-500/90"}
          `}
        >
          {s.kind}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
          {s.title}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={11} className="shrink-0" />
          <span className="line-clamp-1">{sLocation}</span>
        </div>
        {sDaysLabel && (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {sDaysLabel}
          </p>
        )}
      </div>
    </Link>
  );
}
