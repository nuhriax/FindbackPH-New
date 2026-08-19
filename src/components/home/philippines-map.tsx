import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  PH_CITIES,
  PH_DOT_SPOTS,
  PH_ISLAND_PATHS,
  PH_VIEWBOX,
  type PhCity,
} from "./home-data";

export type PhilippinesMapProps = {
  className?: string;
  /** Animated connection lines between city pairs. */
  lines?: { from: string; to: string }[];
  /** Muted rendering for secondary usage. */
  muted?: boolean;
};

export function PhilippinesMap({
  className,
  lines = [],
  muted = false,
}: PhilippinesMapProps) {
  const uid = useId();
  const gradId = `ph-land-${uid}`;
  const lineId = `ph-line-${uid}`;

  const cityOf = (name: string): PhCity | undefined =>
    PH_CITIES.find((c) => c.name === name);

  return (
    <svg
      viewBox={PH_VIEWBOX}
      role="img"
      aria-label="Stylized map of the Philippines"
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF1FE" />
          <stop offset="100%" stopColor="#DCEBFF" />
        </linearGradient>
        <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c6262" />
          <stop offset="100%" stopColor="#46abaa" />
        </linearGradient>
      </defs>

      <g
        fill={`url(#${gradId})`}
        stroke="#C6D8F2"
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
    </svg>
  );
}