"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoViewerModal } from "@/components/photo-viewer-modal";

export function ImageGallery({
  images,
  alt,
  fill = false,
}: {
  images: { url: string; alt?: string }[];
  alt: string;
  /**
   * When true the gallery stretches to fill its parent's height (main photo
   * flexes, thumbnails pinned below) instead of using a fixed 16:9 box.
   */
  fill?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-slate-200/70 bg-ice-50 text-sm text-slate-500">
        No photos were uploaded for this report.
      </div>
    );
  }

  const current = images[active];
  const multiple = images.length > 1;

  /** Wraps around in both directions. */
  function goTo(index: number) {
    setActive(((index % images.length) + images.length) % images.length);
  }

  return (
    <div className={cn("w-full", fill && "flex h-full min-h-0 flex-col")}>
      <div
        className={cn(
          "group relative w-full select-none overflow-hidden",
          fill
            ? // Fill mode: stretch to the remaining height of the parent card.
              "min-h-0 flex-1"
            : // Standalone mode: fixed 16:9 frame.
              "aspect-video rounded-2xl border border-slate-200/70"
        )}
      >
        {/* Clicking the photo opens the fullscreen viewer (never changes it).
            object-cover fills the frame edge-to-edge; the fullscreen viewer
            shows the complete uncropped picture. */}
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label="View photo fullscreen"
          className="absolute inset-0 z-0 h-full w-full cursor-zoom-in"
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || alt}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
            unoptimized
          />
        </button>

        {/* Prev / next arrows — always visible when there is more than one */}
        {multiple && (
          <>
            <span
              role="button"
              tabIndex={0}
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                goTo(active - 1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  goTo(active - 1);
                }
              }}
              className="
                absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2
                items-center justify-center rounded-full bg-slate-900/70
                text-white shadow-lg ring-1 ring-white/40 transition-all
                hover:bg-slate-900 focus:outline-none focus-visible:ring-2
                focus-visible:ring-electric-400 sm:h-11 sm:w-11
              "
            >
              <ChevronLeft size={22} />
            </span>

            <span
              role="button"
              tabIndex={0}
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                goTo(active + 1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  goTo(active + 1);
                }
              }}
              className="
                absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2
                items-center justify-center rounded-full bg-slate-900/70
                text-white shadow-lg ring-1 ring-white/40 transition-all
                hover:bg-slate-900 focus:outline-none focus-visible:ring-2
                focus-visible:ring-electric-400 sm:h-11 sm:w-11
              "
            >
              <ChevronRight size={22} />
            </span>

            {/* Counter chip */}
            <span
              className="
                absolute right-3 top-3 z-20 rounded-full bg-slate-900/70 px-2.5
                py-1 text-[11px] font-semibold text-white shadow-md
              "
            >
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className={cn(
            "flex gap-2 overflow-x-auto pb-1",
            fill ? "mt-3 shrink-0" : "mt-3"
          )}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition-all",
                i === active
                  ? "border-electric-500/70 ring-1 ring-electric-500/50"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen viewer (shared component) */}
      {viewerOpen && (
        <PhotoViewerModal
          images={images}
          alt={alt}
          initialIndex={active}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
