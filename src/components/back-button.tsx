"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Deterministic back button for sub-pages.
 *
 * One consistent look and one predictable behavior:
 * - If the current tab has real in-app history behind it (detected via the
 *   history index Next.js maintains in `window.history.state.idx`), we use
 *   `router.back()` so the browser's own trail restores scroll position and
 *   any list state the user had.
 * - If there is nothing in-app to go back to (direct link, refresh, opened in
 *   a new tab), we route to `fallbackHref` instead.
 *
 * Intentionally renders a fixed label rather than guessing where the user
 * came from — the previous approach ("Back to dashboard" / "Back home")
 * depended on a mutable module-level variable, which made the label flicker
 * and disagree between server HTML and the hydrated page.
 */
export function BackButton({
  fallbackHref = "/dashboard",
  label = "Back",
}: {
  /** Where to go when there is no in-app history to go back to. */
  fallbackHref?: string;
  /** Fixed button text; defaults to a neutral "Back". */
  label?: string;
}) {
  const router = useRouter();

  function handleClick() {
    const state = window.history.state as { idx?: number } | null;
    // `idx` starts at 0 for the first entry of the tab and increases with
    // every navigation, so anything above 0 means there is a page behind us.
    const hasInAppHistory = typeof state?.idx === "number" && state.idx > 0;

    if (hasInAppHistory) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-navy-200 hover:text-navy-900"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
