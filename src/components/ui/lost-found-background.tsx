// ---------------------------------------------------------------------------
// LostFoundBackground
// ---------------------------------------------------------------------------
// A clean, soft, premium background for FindBack PH. It renders a stylized,
// low-contrast Philippine / community map in very pale blue behind a light
// blue-white atmosphere, with subtle neighborhood contours, faint city labels,
// and dashed connecting routes. Purely decorative: aria-hidden + pointer-
// events-none. Everything is kept at a low opacity so content stays readable.
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";

// Thin dashed location routes — items in transit between communities.
const LOCATION_PATHS: { d: string; color: string }[] = [
  { d: "M 26 34 C 36 38, 48 40, 62 42", color: "rgba(15,123,122,0.55)" },
  { d: "M 62 42 C 56 54, 52 58, 56 68", color: "rgba(21,155,104,0.5)" },
  { d: "M 20 74 C 34 62, 46 58, 62 42", color: "rgba(255,122,24,0.5)" },
];

// Subtle elevation/contour lines — soft geography, barely there (pale blue).
const CONTOUR_LINES: string[] = [
  "M 30 64 C 40 56, 50 54, 68 62",
  "M 24 72 C 36 62, 48 60, 66 68",
  "M 34 50 C 42 44, 52 42, 64 50",
];

// Very faint city/district labels.
const CITY_LABELS: { x: number; y: number; label: string }[] = [
  { x: 24, y: 40, label: "MANILA" },
  { x: 62, y: 50, label: "CEBU" },
  { x: 57, y: 74, label: "DAVAO" },
  { x: 17, y: 80, label: "BAGUIO" },
];

export function LostFoundBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Pale cream-green atmosphere: soft center, gentle blue + pale leaf-green + pale orange washes at the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_left_center,rgba(238,245,255,0.45)_0%,rgba(247,250,255,0.5)_40%,transparent_60%),radial-gradient(ellipse_110%_85%_at_right_center,rgba(214,233,255,0.4)_0%,rgba(247,250,255,0.55)_44%,transparent_62%),radial-gradient(ellipse_80%_70%_at_8%_90%,rgba(223,243,229,0.4)_0%,transparent_60%),radial-gradient(ellipse_75%_65%_at_94%_88%,rgba(191,231,204,0.32)_0%,transparent_58%)]" />

      {/* Faint illustrated map: contour lines + dashed routes */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        role="presentation"
        className="absolute inset-0 h-full w-full opacity-[0.22]"
        // Gentle center vignette so the content column stays pristine.
        style={{
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 46%, transparent 10%, black 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 46%, transparent 10%, black 78%)",
        }}
      >
        {/* Soft elevation/contour lines (very pale blue-gray) */}
        {CONTOUR_LINES.map((d, i) => (
          <path key={`c-${i}`} d={d} stroke="rgba(120,150,190,0.22)" strokeWidth="0.8" />
        ))}

        {/* City / district labels (barely there) */}
        {CITY_LABELS.map((l, i) => (
          <text
            key={`l-${i}`}
            x={l.x}
            y={l.y}
            fontSize="2.4"
            letterSpacing="0.35"
            fill="rgba(90,120,165,0.28)"
            fontWeight={600}
          >
            {l.label}
          </text>
        ))}

        {/* Thin dashed location routes */}
        <g strokeWidth="1.1" strokeLinecap="round">
          {LOCATION_PATHS.map((p, i) => (
            <path key={`p-${i}`} d={p.d} stroke={p.color} strokeDasharray="2 6" />
          ))}
        </g>

        {/* Faint leaf outlines — a quiet nature motif, barely there */}
        <g stroke="rgba(38,138,86,0.20)" strokeWidth="0.55" fill="none">
          <path d="M 12 14 C 16 10, 21 10, 24 14 C 21 18, 16 18, 12 14 Z" />
          <path d="M 12 14 C 16 13, 20 13, 24 14" />
          <path d="M 84 82 C 88 78, 93 78, 96 82 C 93 86, 88 86, 84 82 Z" />
          <path d="M 84 82 C 88 81, 92 81, 96 82" />
        </g>
      </svg>
    </div>
  );
}

