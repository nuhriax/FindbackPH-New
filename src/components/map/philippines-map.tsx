"use client";

/**
 * Client-only wrapper around the actual Leaflet map implementation.
 *
 * Leaflet touches `window` during initialization, so the real implementation
 * is loaded with `ssr: false` through a small client boundary. Server
 * components (e.g. the search page) render <PhilippinesMap ... /> directly —
 * this wrapper keeps the SSR-safe boundary in one place.
 */

import dynamic from "next/dynamic";
import type { PhilippinesMapProps } from "./philippines-map-impl";

const PhilippinesMapImpl = dynamic(
  () => import("./philippines-map-impl"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="flex h-full w-full items-center justify-center bg-slate-100"
      >
        <span className="text-xs font-medium text-slate-400">Loading map…</span>
      </div>
    ),
  }
);

export type { PhilippinesMapProps };

export function PhilippinesMap(props: PhilippinesMapProps) {
  return <PhilippinesMapImpl {...props} />;
}
