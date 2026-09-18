"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StickyActionBar — thumb-reach action bar for mobile commuters (the core
 * FindBack user: someone who just lost something on a jeep/MRT). Fixed to the
 * bottom on <md only; respects the safe-area inset already enabled by
 * `viewportFit: cover` in the root viewport metadata.
 *
 * Rendered only from the homepage, so no route checks are needed. A matching
 * spacer in page.tsx keeps the footer reachable.
 */
export function StickyActionBar({ className }: { className?: string }) {
  // Slight delay so the bar doesn't cover the hero CTAs on first paint of the
  // LCP — it slides in after the user starts scrolling toward the fold.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t-2 border-cork-700 bg-kraft-100 px-3 shadow-[0_-8px_24px_-12px_rgba(36,30,23,0.35)] transition-transform duration-300 md:hidden",
        shown ? "translate-y-0" : "translate-y-full",
        className
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-2 py-2.5">
        <Link
          href="/report/lost"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-button bg-sun-400 text-sm font-bold text-ink shadow-[2px_2px_0_0_#241E17] active:translate-y-0.5 active:shadow-none"
        >
          <PackageSearch size={16} aria-hidden="true" />
          I lost
        </Link>
        <Link
          href="/report/found"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-button bg-ocean-500 text-sm font-bold text-white shadow-[2px_2px_0_0_#241E17] active:translate-y-0.5 active:shadow-none"
        >
          <Send size={16} aria-hidden="true" />
          I found
        </Link>
        <Link
          href="/discover"
          aria-label="Search reports"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-cork-700/40 bg-white text-ink"
        >
          <Search size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}