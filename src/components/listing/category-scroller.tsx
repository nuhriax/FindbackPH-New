"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export type CategoryItem = {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
};

/**
 * Horizontally scrollable category bar for the Discover page.
 * - Keeps Filters/Sort controls visible by never growing past its flex slot.
 * - Shows arrow buttons only when there is something to scroll.
 * - Auto-scrolls the active category into view on mount / change.
 */
export function CategoryScroller({
  items,
  activeKey,
  ariaLabel = "Browse by category",
}: {
  items: CategoryItem[];
  activeKey: string;
  ariaLabel?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows]);

  // Bring the active category into view without centering-jump on load.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[aria-current="true"]');
    if (!active) return;
    const overflowLeft = active.offsetLeft - el.offsetLeft < el.scrollLeft;
    const overflowRight =
      active.offsetLeft - el.offsetLeft + active.offsetWidth >
      el.scrollLeft + el.clientWidth;
    if (overflowLeft || overflowRight) {
      el.scrollTo({
        left: active.offsetLeft - el.offsetLeft - 12,
        behavior: "smooth",
      });
    }
  }, [activeKey]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 160), behavior: "smooth" });
  };

  return (
    <div className="relative min-w-0 flex-1">
      {/* Fade edges — hint that the row scrolls */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent transition-opacity ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent transition-opacity ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Scroll arrows (render only when scrollable in that direction) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll categories left"
          className="absolute left-0 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll categories right"
          className="absolute right-0 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="flex items-center gap-0.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <nav aria-label={ariaLabel} className="flex items-center gap-1.5">
          {items.map((cat) => {
            const active = cat.key === activeKey;
            return (
              <Link
                key={cat.key || "all"}
                href={cat.href}
                aria-current={active ? "true" : undefined}
                className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white shadow-sm"
                    : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-teal-700"
                }`}
              >
                <span aria-hidden="true" className="[&>svg]:h-[18px] [&>svg]:w-[18px]">
                  {cat.icon}
                </span>
                {cat.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
