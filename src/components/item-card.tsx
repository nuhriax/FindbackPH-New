import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ItemCategory } from "@/types/database";
import { ACCENT } from "@/components/listing/accents";

export function ItemCard({
  href,
  title,
  category,
  city,
  province,
  reported,
  description,
  kind,
  imageUrl,
}: {
  href: string;
  title: string;
  category: ItemCategory;
  city: string | null;
  province: string | null;
  reported: string;
  description: string | null;
  kind: "lost" | "found";
  imageUrl?: string | null;
}) {
  const a = ACCENT[kind];
  const cityLabel = city ?? "";
  const provinceLabel = province ?? "";

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-slate-200/70 bg-white/80 shadow-soft backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-card-hover"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ice-50 via-slate-50 to-ice-100 text-slate-400 [&_svg]:h-7 [&_svg]:w-7">
            {CATEGORY_ICONS[category]}
            <span className="text-[11px] text-slate-400">No photo yet</span>
          </div>
        )}

        {/* Status badge */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
            kind === "lost" ? "bg-indigo-100/90 text-indigo-700" : "bg-emerald-100/90 text-emerald-700"
          }`}
        >
          {kind === "lost" ? "Lost" : "Found"}
        </span>

        {/* Category chip */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur-md [&_svg]:h-3 [&_svg]:w-3">
          {CATEGORY_ICONS[category]}
          {CATEGORY_LABELS[category]}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-medium text-navy-900 transition-colors duration-200 group-hover:text-blue-700">
          {title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {description ?? ""}
        </p>

        <div className="mt-auto pt-4">
          {/* Location + reported */}
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {cityLabel}
                {provinceLabel ? `, ${provinceLabel}` : ""}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1.5">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
              {reported}
            </span>
          </div>

          {/* View details */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3">
            <span className="text-xs font-medium text-slate-600 transition-colors group-hover:text-blue-700">
              View details
            </span>
            <ArrowRight
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${a.textStrong}`}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

