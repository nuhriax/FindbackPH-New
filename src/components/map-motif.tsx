import { MapPin, Navigation } from "lucide-react";

/**
 * MapMotif — subtle location/map decoration for heroes and section
 * backgrounds. Purely decorative SVG: a dotted "Philippine-ish" island
 * cluster, a dashed travel route between two pins, and a soft radar pulse.
 * Render at low opacity behind content; never interactive.
 */
export function MapMotif({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 420 300"
        fill="none"
        className="h-full w-full text-electric-600"
      >
        {/* Dotted island clusters */}
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 11 }).map((_, col) => {
            const x = 30 + col * 36;
            const y = 30 + row * 38;
            // Pseudo-random but stable "island" mask: keep dots that fall
            // inside a few soft blobs so the field reads like islands.
            const inside =
              (x > 40 && x < 170 && y > 60 && y < 150) ||
              (x > 180 && x < 300 && y > 100 && y < 230) ||
              (x > 260 && x < 390 && y > 30 && y < 120);
            if (!inside) return null;
            return (
              <circle
                key={`${row}-${col}`}
                cx={x}
                cy={y}
                r="2"
                fill="currentColor"
                opacity="0.22"
              />
            );
          }),
        )}

        {/* Dashed route connecting the pins */}
        <path
          d="M78 110 C 130 60, 180 190, 240 160 S 330 80, 344 74"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Origin pin */}
        <g opacity="0.7">
          <circle cx="78" cy="110" r="10" fill="currentColor" opacity="0.15" />
          <circle cx="78" cy="110" r="4" fill="currentColor" />
        </g>

        {/* Destination pin */}
        <g opacity="0.8">
          <circle cx="344" cy="74" r="16" fill="currentColor" opacity="0.12" />
          <circle cx="344" cy="74" r="9" fill="currentColor" opacity="0.18" />
          <circle cx="344" cy="74" r="4.5" fill="currentColor" />
        </g>
      </svg>

      {/* Lucide pin accents for a friendlier, less abstract feel */}
      <MapPin
        aria-hidden="true"
        size={20}
        className="absolute -top-2 right-2 text-electric-500/50"
      />
      <Navigation
        aria-hidden="true"
        size={16}
        className="absolute bottom-4 left-6 text-electric-500/40"
      />
    </div>
  );
}
