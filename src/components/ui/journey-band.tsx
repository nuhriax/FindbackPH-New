import { Home, MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";

/**
 * JourneyBand — the FindBackPH "journey home" motif as a single, reusable
 * brand strip: LOST → REPORT → DISCOVER → MATCH → VERIFY → RETURN → HOME.
 *
 * Drawn as one continuous route line with location-marker nodes. Deliberately
 * used sparingly (once per page, directly under a hero or before the final
 * CTA) so it reads as navigation-through-the-story rather than decoration.
 * Pure CSS/SVG — no client JS — so it renders on the server and never causes
 * layout shift. The rail is horizontally scrollable on small screens instead
 * of being shrunk into illegibility.
 */

const NODES: { label: string }[] = [
  { label: "Lost" },
  { label: "Report" },
  { label: "Discover" },
  { label: "Match" },
  { label: "Verify" },
  { label: "Return" },
];

export function JourneyBand({
  className = "",
  caption = "The journey home",
}: {
  className?: string;
  caption?: string;
}) {
  return (
    <div
      role="img"
      aria-label="The FindBack journey: Lost, Report, Discover, Match, Verify, Return, Home"
      className={`relative ${className}`}
    >
      {caption && (
        <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {caption}
        </p>
      )}

      <Reveal>
        <div className="relative">
          {/* Route line — sits behind the nodes, drawn as a dashed path that
              shifts from sunrise (lost) through teal (the work) to emerald
              (home). The subtle signature of the whole product. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 12"
            preserveAspectRatio="none"
            className="pointer-events-none absolute left-0 right-0 top-[7px] hidden h-[13px] w-full md:block"
          >
            <defs>
              <linearGradient id="fb-route" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#f59341" />
                <stop offset="0.45" stopColor="#20948f" />
                <stop offset="1" stopColor="#209b68" />
              </linearGradient>
            </defs>
            <line
              x1="24"
              y1="8"
              x2="976"
              y2="8"
              stroke="url(#fb-route)"
              strokeWidth="1.5"
              strokeDasharray="1 7"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>

          <ol className="relative z-10 flex items-start justify-between gap-2 md:gap-0">
            {NODES.map((node) => (
              <li
                key={node.label}
                className="flex min-w-0 flex-col items-center gap-2.5"
              >
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 rounded-full border-2 border-white bg-electric-500 shadow-[0_0_0_3px_rgba(15,123,122,0.12)]"
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {node.label}
                </span>
              </li>
            ))}

            {/* HOME — the destination node, set apart in emerald with a pin */}
            <li className="flex min-w-0 flex-col items-center gap-2.5">
              <span className="flex h-8 w-8 -translate-y-2 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
                <Home aria-hidden="true" size={14} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Home
              </span>
            </li>
          </ol>
        </div>
      </Reveal>
    </div>
  );
}

/**
 * A quieter, inline variant of the motif for footers / dense contexts:
 * one dashed route line with a small pin, rendered as pure SVG.
 */
export function RouteRule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sunrise-400" />
      <span
        className="h-px flex-1"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #f59341, #20948f 45%, #209b68)",
          opacity: 0.35,
        }}
      />
      <span className="flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-emerald-500" />
      <MapPin aria-hidden="true" size={12} className="shrink-0 text-emerald-600" />
    </div>
  );
}
