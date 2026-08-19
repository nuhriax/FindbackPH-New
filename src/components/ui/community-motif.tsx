// ---------------------------------------------------------------------------
// CommunityMotif
// ---------------------------------------------------------------------------
// A small, quiet "path home" illustration (soft green hills, a tiny Filipino
// home, a winding path and birds) used consistently across the product to give
// it a warm, memorable community identity without adding clutter. Works at any
// size via the caller-provided `className` (set width/height/opacity there).
// Purely decorative: aria-hidden + pointer-events-none.
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";

export function CommunityMotif({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <svg viewBox="0 0 160 48" fill="none" className="h-full w-full">
        {/* soft sun */}
        <circle cx="126" cy="13" r="6" fill="#F6E7BF" opacity="0.8" />
        {/* rolling green hills */}
        <path
          d="M0 40 C24 34 40 36 60 31 C84 27 100 34 118 30 C132 28 146 30 160 28 V48 H0 Z"
          fill="#b8dfc1"
          opacity="0.55"
        />
        <path
          d="M0 45 C34 41 60 44 92 41 C118 39 138 41 160 39 V48 H0 Z"
          fill="#d8eedb"
          opacity="0.6"
        />
        {/* tiny home */}
        <path d="M66 31 l9 -8 9 8 Z" fill="#e6c190" />
        <rect x="69" y="31" width="12" height="12" rx="1" fill="#f7efdf" />
        <rect x="71" y="33" width="4" height="4" rx="0.5" fill="#b8ddf0" />
        {/* winding path home */}
        <path
          d="M96 44 C94 41 99 36 106 34"
          stroke="#e8b06a"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
          opacity="0.75"
        />
        {/* birds */}
        <path
          d="M120 20 q3 -3 6 0 q3 -3 6 0"
          stroke="#98afd6"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M133 25 q2 -3 5 0 q2 -3 5 0"
          stroke="#98afd6"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}