"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fullscreen frosted-glass photo viewer. Shows the complete uncropped
 * picture(s) with prev/next arrows, touch swipe, keyboard controls, and a
 * close button. Background matches the site's light aesthetic.
 *
 * Controlled externally: render it conditionally (`open`) and call `onClose`.
 */
export function PhotoViewerModal({
  images,
  alt,
  initialIndex = 0,
  onClose,
}: {
  images: { url: string; alt?: string }[];
  alt: string;
  initialIndex?: number;
  onClose: () => void;
}) {
  const [active, setActive] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const current = images[active];
  const multiple = images.length > 1;

  /** Wraps around in both directions. */
  function goTo(index: number) {
    setActive(((index % images.length) + images.length) % images.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null || !multiple) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < 40) return;
    // Swipe left -> next, swipe right -> previous.
    goTo(delta < 0 ? active + 1 : active - 1);
  }

  // Keyboard controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight")
        setActive((a) => (a + 1) % images.length);
      else if (e.key === "ArrowLeft")
        setActive((a) => (a - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, images.length]);

  // Lock page scrolling behind the viewer.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="
        fixed inset-0 z-[200] flex flex-col items-center
        justify-center bg-white/80 p-4 backdrop-blur-2xl
      "
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        type="button"
        aria-label="Close viewer"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="
          absolute right-4 top-4 z-10 flex h-11 w-11 items-center
          justify-center rounded-full bg-slate-900/80 text-white shadow-lg
          ring-1 ring-white/40 transition-colors hover:bg-slate-900
        "
      >
        <X size={22} />
      </button>

      {/* The photo itself — shown whole (object-contain), never cropped */}
      <div
        className="relative h-full max-h-[82vh] w-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || alt}
          fill
          sizes="100vw"
          className="object-contain"
          unoptimized
        />
      </div>

      {/* Arrows inside the viewer */}
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
              absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2
              cursor-pointer items-center justify-center rounded-full
              bg-slate-900/80 text-white shadow-lg ring-1 ring-white/40
              transition-colors hover:bg-slate-900 sm:left-6 sm:h-14 sm:w-14
            "
          >
            <ChevronLeft size={28} />
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
              absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2
              cursor-pointer items-center justify-center rounded-full
              bg-slate-900/80 text-white shadow-lg ring-1 ring-white/40
              transition-colors hover:bg-slate-900 sm:right-6 sm:h-14 sm:w-14
            "
          >
            <ChevronRight size={28} />
          </span>
        </>
      )}

      {/* Counter + dots */}
      <div className="mt-4 flex shrink-0 flex-col items-center gap-2">
        <p className="text-sm font-medium text-slate-700">
          {multiple ? `${active + 1} / ${images.length}` : alt}
        </p>
        {multiple && (
          <div className="flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full bg-slate-800 transition-all",
                  i === active ? "w-5 opacity-100" : "w-1.5 opacity-40"
                )}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Click outside the photo or press Esc to close
        </p>
      </div>
    </div>
  );
}