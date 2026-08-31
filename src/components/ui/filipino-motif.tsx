// ---------------------------------------------------------------------------
// FilipinoMotif — JeepneyMotif & BayanihanMotif
// ---------------------------------------------------------------------------
// Two small, quiet illustrations in the same soft visual family as
// CommunityMotif: a little jeepney rolling down the road, and the classic
// bayanihan scene of neighbors helping carry a home. They give the product a
// distinctly Filipino community texture without adding clutter. Both are
// purely decorative: aria-hidden + pointer-events-none, and scale via the
// caller-provided `className`.
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";

/** A little jeepney — " every ride brings something closer to home." */
export function JeepneyMotif({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <svg viewBox="0 0 160 48" fill="none" className="h-full w-full">
        {/* road */}
        <path d="M0 42 H160" stroke="#e8d9c0" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 42 h12 M44 42 h12 M74 42 h12 M104 42 h12 M134 42 h12" stroke="#d8c8ac" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        {/* jeepney body */}
        <rect x="52" y="18" width="52" height="18" rx="3" fill="#f7efdf" />
        <rect x="52" y="14" width="52" height="7" rx="3" fill="#e6c190" />
        {/* hood + windshield */}
        <path d="M104 20 h10 l6 7 v9 h-16 Z" fill="#f7efdf" />
        <path d="M107 21 h6 l4 6 h-10 Z" fill="#b8ddf0" />
        {/* windows */}
        <rect x="56" y="22" width="8" height="7" rx="1" fill="#b8ddf0" />
        <rect x="68" y="22" width="8" height="7" rx="1" fill="#b8ddf0" />
        <rect x="80" y="22" width="8" height="7" rx="1" fill="#b8ddf0" />
        <rect x="92" y="22" width="8" height="7" rx="1" fill="#b8ddf0" />
        {/* colorful side stripe — classic jeepney decor */}
        <path d="M52 31 h52" stroke="#f27418" strokeWidth="1.6" opacity="0.8" />
        <path d="M56 33.5 h4 M64 33.5 h4 M72 33.5 h4 M80 33.5 h4 M88 33.5 h4 M96 33.5 h4" stroke="#20948f" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        {/* wheels */}
        <circle cx="64" cy="38" r="4.5" fill="#4c351c" />
        <circle cx="64" cy="38" r="1.8" fill="#f7efdf" />
        <circle cx="110" cy="38" r="4.5" fill="#4c351c" />
        <circle cx="110" cy="38" r="1.8" fill="#f7efdf" />
        {/* little speed puffs */}
        <path d="M40 30 h8 M34 34 h10" stroke="#c4a878" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        {/* soft sun */}
        <circle cx="140" cy="10" r="5.5" fill="#F6E7BF" opacity="0.8" />
      </svg>
    </div>
  );
}

/** The bayanihan scene — neighbors helping carry a home. */
export function BayanihanMotif({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      <svg viewBox="0 0 160 48" fill="none" className="h-full w-full">
        {/* soft sun */}
        <circle cx="138" cy="11" r="5.5" fill="#F6E7BF" opacity="0.8" />
        {/* carried nipa hut */}
        <path d="M58 18 l18 -10 18 10 Z" fill="#c98d4f" />
        <rect x="63" y="18" width="26" height="14" rx="1" fill="#f7efdf" />
        <rect x="70" y="23" width="6" height="9" rx="0.5" fill="#e6c190" />
        <rect x="79" y="22" width="5" height="5" rx="0.5" fill="#b8ddf0" />
        {/* bamboo poles under the house */}
        <path d="M50 33 H122" stroke="#b58a56" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M54 36 H118" stroke="#cdb081" strokeWidth="2" strokeLinecap="round" />
        {/* helpers — simple figures carrying the poles */}
        <circle cx="44" cy="26" r="3" fill="#2e2417" />
        <path d="M44 29 v7 M40 42 q4 -5 8 0" stroke="#2e2417" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="128" cy="26" r="3" fill="#2e2417" />
        <path d="M128 29 v7 M124 42 q4 -5 8 0" stroke="#2e2417" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* ground shadow */}
        <ellipse cx="80" cy="45" rx="52" ry="2.2" fill="#e8d9c0" opacity="0.6" />
      </svg>
    </div>
  );
}
