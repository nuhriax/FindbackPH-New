"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Eye, Gift, MapPin, ZoomIn } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { ItemCategory } from "@/types/database";
import { ACCENT } from "@/components/listing/accents";
import { PhotoViewerModal } from "@/components/photo-viewer-modal";

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
  views,
  reward,
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
  /** Denormalized page-view counter (optional — hidden when not provided). */
  views?: number | null;
  /** Lost items only — rendered as an accent chip when offered (optional). */
  reward?: number | null;
}) {
  const a = ACCENT[kind];
  const [viewerOpen, setViewerOpen] = useState(false);
  const cityLabel = city ?? "";
  const provinceLabel = province ?? "";

  return (
    <>
    <Link
      href={href}
      className="item-card group relative flex h-full flex-col overflow-hidden rounded-card border border-white/60 bg-white/80 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-white hover:bg-white hover:shadow-card-hover"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 ring-1 ring-inset ring-slate-900/5">
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
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-sunrise-50 via-ice-50 to-lavender-50">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-900/5 [&_svg]:h-5 [&_svg]:w-5">
              {CATEGORY_ICONS[category]}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              No photo yet
            </span>
          </div>
        )}

        {/* Legibility scrims — keep badges readable over any photo without
            boxing the image in. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-slate-900/30 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/35 to-transparent"
        />

        {/* Status badge */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ring-1 ring-inset backdrop-blur-sm ${
            kind === "lost"
              ? "bg-red-100/90 text-red-700 ring-red-300/60"
              : "bg-emerald-100/90 text-emerald-700 ring-emerald-300/60"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              kind === "lost" ? "bg-red-500" : "bg-emerald-500"
            }`}
          />
          {kind === "lost" ? "Lost" : "Found"}
        </span>

        {/* View-photo button — opens fullscreen without leaving the page */}
        {imageUrl && (
          <button
            type="button"
            aria-label={`View photo of ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewerOpen(true);
            }}
            className="
              absolute right-3 top-3 z-10 flex h-8 w-8 items-center
              justify-center rounded-full bg-slate-900/70 text-white
              shadow-md ring-1 ring-white/40 backdrop-blur-sm transition-all
              hover:bg-slate-900 hover:scale-105 focus:opacity-100 opacity-90
              md:opacity-0 md:group-hover:opacity-100
            "
          >
            <ZoomIn size={15} />
          </button>
        )}

        {/* Category chip */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-900/5 backdrop-blur-sm [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-slate-400">
          {CATEGORY_ICONS[category]}
          {CATEGORY_LABELS[category]}
        </span>

        {/* Reward chip — lost items with an offered reward only */}
        {kind === "lost" && typeof reward === "number" && reward > 0 && (
          <span
            className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-sunrise-50/95 px-2 py-1 text-[10px] font-bold text-sunrise-700 shadow-sm ring-1 ring-inset ring-sunrise-200/80 backdrop-blur-sm"
            title="Reward offered for this item's safe return"
          >
            <Gift size={11} aria-hidden="true" />
            ₱{reward.toLocaleString()}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate font-display text-[15.5px] font-bold tracking-[-0.01em] text-navy-900 transition-colors duration-200 group-hover:text-electric-700">
          {title}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
          {description ?? ""}
        </p>

        <div className="mt-auto pt-4">
          {/* Meta row — location · views, with the date anchored right */}
          <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 text-slate-400"
              />
              <span className="truncate">
                {cityLabel || provinceLabel
                  ? `${cityLabel}${provinceLabel ? `, ${provinceLabel}` : ""}`
                  : "Location unavailable"}
              </span>

              {typeof views === "number" && (
                <>
                  <span
                    aria-hidden
                    className="h-0.5 w-0.5 shrink-0 rounded-full bg-slate-300"
                  />

                  <span className="flex shrink-0 items-center gap-1 text-slate-400">
                    <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                    {views}
                  </span>
                </>
              )}
            </span>

            <span className="flex shrink-0 items-center gap-1.5">
              <Calendar
                aria-hidden="true"
                className="h-3.5 w-3.5 text-slate-400"
              />
              {reported}
            </span>
          </div>

          {/* View details — footer action, anchored by a hairline divider */}
          <div className="card-footer mt-3.5 flex items-center gap-1.5 border-t border-slate-200/70 pt-3 text-xs font-semibold text-slate-500 transition-colors group-hover:text-electric-700">
            View details
            <ArrowRight
              aria-hidden="true"
              className={`h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 ${a.textStrong}`}
            />
          </div>
        </div>
      </div>
    </Link>

    {/* Fullscreen photo viewer — OUTSIDE the link so closing it never
        triggers navigation */}
    {viewerOpen && imageUrl && (
      <PhotoViewerModal
        images={[{ url: imageUrl, alt: title }]}
        alt={title}
        onClose={() => setViewerOpen(false)}
      />
    )}
    </>
  );
}

