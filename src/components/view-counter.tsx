"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import { incrementItemViewAction } from "@/lib/actions/views";

/**
 * "👁 N views" pill for report detail pages.
 *
 * Renders the server-fetched count immediately, then — once per browser per
 * report (localStorage dedupe, so refreshes don't inflate) — fires the
 * RPC-backed server action to register the view. The displayed number
 * catches up on the next visit; no client-side fake math needed.
 *
 * Tolerates the migration (supabase/104-item-views.sql) not having run yet:
 * the increment silently no-ops and the pill hides itself when no count is
 * available.
 */
export function ViewCounter({
  itemType,
  itemId,
  initialCount,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  /** Server-fetched view_count; null/undefined hides the pill. */
  initialCount?: number | null;
}) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);

  useEffect(() => {
    if (count === null) return;

    const key = `fb_viewed_${itemType}_${itemId}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      // Private mode / storage disabled — still count the view, just un-deduped.
    }

    let cancelled = false;
    const current = count;
    incrementItemViewAction(itemType, itemId).then(() => {
      // Optimistically reflect this browser's own view.
      if (!cancelled) setCount(current + 1);
    }).catch(() => {
      /* best-effort */
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType, itemId]);

  if (count === null) return null;

  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        text-sm
        font-medium
        text-slate-400
      "
      title={`${count.toLocaleString()} ${count === 1 ? "person has" : "people have"} viewed this report`}
    >
      <Eye size={15} />
      {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}
