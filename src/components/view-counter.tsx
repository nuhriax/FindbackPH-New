"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import { incrementItemViewAction } from "@/lib/actions/views";

/**
 * "👁 N views" pill for report detail pages.
 *
 * Renders the server-fetched count immediately, then registers the view via
 * an RPC-backed server action. The SERVER dedupes (migration 105 ledger):
 * signed-in viewers are keyed by their account id — one view per person per
 * report across every device and browser; signed-out viewers are keyed by a
 * persistent random id in localStorage — one view per browser. Revisits,
 * refreshes and re-opening photos never bump the number.
 *
 * Tolerates the migrations not having run yet: the increment silently
 * no-ops and the pill hides itself when no count is available.
 */

/** Stable per-browser viewer id so signed-out visitors dedupe too. */
function getViewerKey(): string {
  try {
    let key = window.localStorage.getItem("fb_viewer_id");
    if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      window.localStorage.setItem("fb_viewer_id", key);
    }
    return key;
  } catch {
    // Private mode / storage disabled — send a per-session id; the DB still
    // dedupes signed-in users by account, anonymous views just won't dedupe.
    return `s${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  }
}

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

    let cancelled = false;
    const current = count;
    // The DB ledger decides whether this viewer already counted; the client
    // key is just the anonymous fallback identity.
    incrementItemViewAction(itemType, itemId, getViewerKey())
      .then(() => {
        if (!cancelled) setCount(current + 1);
      })
      .catch(() => {
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
