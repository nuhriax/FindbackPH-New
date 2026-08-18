import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  PH_CITIES,
  PH_DOT_SPOTS,
  PH_ISLAND_PATHS,
  PH_VIEWBOX,
  type PhCity,
} from "./home-data";

export type MapMarkerKind = "lost" | "found";

export type PhilippinesMapProps = {
  className?: string;
  /** City names (from PH_CITIES) to mark with a dot. */
  cities?: string[];
  /** Show city name labels next to the dots. */
  showLabels?: boolean;
  /** Color specific city dots as lost (blue) or found (emerald). */
  markers?: { city: string; kind: MapMarkerKind }[];
  /** Animated connection lines between city pairs. */
  lines?: { from: string; to: string }[];
  /** Muted rendering for secondary usage. */
  muted?: boolean;
};

export function PhilippinesMap({
  className,
  cities = [],
  showLabels = false,
  markers = [],
  lines = [],
  muted = false,
}: PhilippinesMapProps) {
  const uid = useId();
  const gradId = `ph-land-${uid}`;
  const lineId = `ph-line-${uid}`;

  const cityOf = (name: string): PhCity | undefined =>
    PH_CITIES.find((c) => c.name === name);

  const markerOf = (city: string) => markers.find((m) => m.city === city);

  return (
    <svg
      viewBox={PH_VIEWBOX}
      role="img"
      aria-label="Stylized map of the Philippines"
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>
        <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      <g
        fill={`url(#${gradId})`}
        stroke="#93C5FD"
        strokeWidth={1.5}
        strokeLinejoin="round"
      >
        {PH_ISLAND_PATHS.map((p, i) => (
          <path key={i} d={p.d} />
        ))}
        {PH_DOT_SPOTS.map((d, i) => (
          <circle key={`dot-${i}`} cx={d.x} cy={d.y} r={d.r} />
        ))}
      </g>

      {lines.map((line, i) => {
        const a = cityOf(line.from);
        const b = cityOf(line.to);
        if (!a || !b) return null;
        return (
          <line
            key={`line-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={`url(#${lineId})`}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="1 10"
            className="ph-conn-line"
            opacity={muted ? 0.45 : 0.6}
          />
        );
      })}

      {cities.map((name) => {
        const c = cityOf(name);
        if (!c) return null;
        const marker = markerOf(name);
        const color = marker?.kind === "found" ? "#10B981" : "#2563EB";

        return (
          <g key={`city-${name}`}>
            {!muted && (
              <circle
                cx={c.x}
                cy={c.y}
                r={9}
                fill={color}
                opacity={0.16}
                className="ph-ping"
              />
            )}
            <circle cx={c.x} cy={c.y} r={3.6} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />
            {showLabels && (
              <text
                x={c.x + 9}
                y={c.y + 4}
                fontSize="13"
                fontWeight={600}
                fill={muted ? "#94A3B8" : "#475569"}
              >
                {name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
