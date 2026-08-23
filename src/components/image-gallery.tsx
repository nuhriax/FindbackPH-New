"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoViewerModal } from "@/components/photo-viewer-modal";

type GalleryImage = {
  url: string;
  alt?: string;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  alt: string;
  /** Optional destination for adding another image to this report. */
  addMoreHref?: string;
  /**
   * When true, the gallery fills the available height.
   * The main image flexes while thumbnails remain pinned below.
   */
  fill?: boolean;
};

export function ImageGallery({
  images,
  alt,
  addMoreHref,
  fill = false,
}: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasImages = images.length > 0;
  const multiple = images.length > 1;
  const current = images[active];

  const goTo = useCallback(
    (index: number) => {
      if (!images.length) return;

      setActive((index + images.length) % images.length);
    },
    [images.length]
  );

  const previous = useCallback(() => {
    goTo(active - 1);
  }, [active, goTo]);

  const next = useCallback(() => {
    goTo(active + 1);
  }, [active, goTo]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!multiple) return;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        previous();
        break;
      case "ArrowRight":
        event.preventDefault();
        next();
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(images.length - 1);
        break;
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || !multiple) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;

    const deltaX = endX - touchStartX.current;
    const swipeThreshold = 50;

    if (Math.abs(deltaX) >= swipeThreshold) {
      if (deltaX > 0) {
        previous();
      } else {
        next();
      }
    }

    touchStartX.current = null;
  };

  if (!hasImages) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-2xl",
          "border border-slate-200/70 bg-ice-50 text-sm text-slate-500",
          fill ? "h-full min-h-48" : "aspect-video"
        )}
      >
        No photos were uploaded for this report.
      </div>
    );
  }

  return (
    <div
      className={cn("w-full", fill && "flex h-full min-h-0 flex-col")}
      onKeyDown={handleKeyDown}
      tabIndex={multiple ? 0 : undefined}
      role={multiple ? "region" : undefined}
      aria-label={multiple ? `Photo gallery: ${alt}` : undefined}
    >
      {/* Main image */}
      <div
        className={cn(
          "group relative w-full select-none overflow-hidden bg-slate-100",
          fill
            ? "min-h-0 flex-1 rounded-2xl"
            : "aspect-video rounded-2xl border border-slate-200/70"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label={`View ${current.alt || alt} fullscreen`}
          className="absolute inset-0 z-0 h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric-500"
        >
          <Image
            src={current.url}
            alt={current.alt || alt}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            unoptimized
            priority={active === 0}
          />
        </button>

        {multiple && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previous();
              }}
              aria-label="Previous photo"
              className={cn(
                "absolute left-3 top-1/2 z-10 flex h-10 w-10",
                "-translate-y-1/2 items-center justify-center rounded-full",
                "bg-slate-900/70 text-white shadow-lg ring-1 ring-white/40",
                "transition hover:bg-slate-900",
                "focus:outline-none focus-visible:ring-2",
                "focus-visible:ring-electric-400",
                "sm:h-11 sm:w-11"
              )}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              aria-label="Next photo"
              className={cn(
                "absolute right-3 top-1/2 z-10 flex h-10 w-10",
                "-translate-y-1/2 items-center justify-center rounded-full",
                "bg-slate-900/70 text-white shadow-lg ring-1 ring-white/40",
                "transition hover:bg-slate-900",
                "focus:outline-none focus-visible:ring-2",
                "focus-visible:ring-electric-400",
                "sm:h-11 sm:w-11"
              )}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>

            <div
              className={cn(
                "absolute right-3 top-3 z-10 rounded-full",
                "bg-slate-900/70 px-2.5 py-1 text-[11px]",
                "font-semibold text-white shadow-md",
                "pointer-events-none"
              )}
              aria-hidden="true"
            >
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {(multiple || addMoreHref) && (
        <div
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 pl-3",
            "scrollbar-thin scrollbar-track-transparent",
            fill ? "mt-3 shrink-0" : "mt-3"
          )}
          role="tablist"
          aria-label="Photo thumbnails"
        >
          {images.map((image, index) => {
            const selected = index === active;

            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`View image ${index + 1} of ${images.length}`}
                onClick={() => goTo(index)}
                className={cn(
                  "relative h-16 w-[5.5rem] flex-shrink-0 overflow-hidden rounded-lg",
                  "border transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2",
                  "focus-visible:ring-electric-500",
                  selected
                    ? "border-electric-500/70 ring-1 ring-electric-500/50"
                    : "border-slate-200 opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `${alt} thumbnail ${index + 1}`}
                  fill
                  sizes="88px"
                  className="object-cover"
                  unoptimized
                />

                {selected && (
                  <span
                    className="absolute inset-0 rounded-lg ring-1 ring-inset ring-electric-500/30"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
          {addMoreHref && (
            <Link
              href={addMoreHref}
              aria-label="Add more photos"
              className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-electric-300 hover:bg-electric-50 hover:text-electric-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500"
            >
              <Plus size={19} strokeWidth={2.5} aria-hidden="true" />
              <span className="mt-0.5 text-[10px] font-medium">Add more</span>
            </Link>
          )}
        </div>
      )}

      {/* Fullscreen viewer */}
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
