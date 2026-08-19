"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

type InPageNavItem = {
  id: string;
  label: string;
};

type InPageNavProps = {
  items: InPageNavItem[];
  /** Extra classes for sizing/spacing (e.g. max-width and margins). */
  className?: string;
};

/**
 * Sticky "on this page" pill index with scroll-spy: the chip for the section
 * currently in view is highlighted. Renders only <a> links that reuse the
 * page's own headings as labels, so no copy is added or removed.
 */
export function InPageNav({ items, className }: InPageNavProps) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
            best = entry;
          }
        }
        if (best) setActive(best.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page" className={clsx("sticky top-20 z-30", className)}>
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-[0_18px_50px_-24px_rgba(51,46,38,0.35)] backdrop-blur-xl">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active === item.id ? "true" : undefined}
            className={clsx(
              "whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              active === item.id
                ? "bg-electric-50 text-electric-700"
                : "text-slate-600 hover:bg-electric-50 hover:text-electric-700"
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
