// ---------------------------------------------------------------------------
// JourneyTracker
// ---------------------------------------------------------------------------
// A compact "journey home" progress tracker shown on item detail pages. It turns
// the product's core truth — Reported → Matching → Returned — into a visible,
// color-coded story (sunrise for lost, emerald for found) so users always know
// where an item stands. Reuses the CommunityMotif for a light brand accent.
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";
import { CommunityMotif } from "@/components/ui/community-motif";

const STEPS = ["Reported", "Matching", "Returned"];

export function JourneyTracker({
  kind,
  returned,
}: {
  kind: "lost" | "found";
  returned: boolean;
}) {
  // When an item is still active: Reported is done, Matching is in progress.
  // When it's recovered/returned: every step is complete.
  const completed = returned ? STEPS.length : 1;
  const current = returned ? -1 : 1;

  const accent =
    kind === "lost"
      ? {
          line: "bg-sunrise-400",
          done: "bg-sunrise-500 text-white",
          current: "border-sunrise-500 text-sunrise-700",
          text: "text-sunrise-700",
        }
      : {
          line: "bg-emerald-400",
          done: "bg-emerald-500 text-white",
          current: "border-emerald-500 text-emerald-700",
          text: "text-emerald-700",
        };

  return (
    <div className="card mt-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-navy-900">
          The journey home
        </h2>
        <CommunityMotif className="h-4 w-14" />
      </div>

      <ol className="mt-4 flex items-start">
        {STEPS.map((label, i) => {
          const done = i < completed;
          const isCurrent = i === current;
          // The connector into this step is filled when the previous step is done.
          const lineFilled = i > 0 && (done || (isCurrent && i - 1 < completed));

          return (
            <li
              key={label}
              className={cn("flex flex-col items-center", i > 0 && "flex-1")}
            >
              <span className="flex w-full items-center">
                {i > 0 && (
                  <span
                    className={cn(
                      "mx-2 h-0.5 flex-1 rounded-full",
                      lineFilled ? accent.line : "bg-slate-200"
                    )}
                  />
                )}

                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                    done
                      ? cn(accent.done, "border-transparent")
                      : isCurrent
                        ? cn(accent.current, "bg-white")
                        : "border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {i + 1}
                </span>
              </span>

              <span
                className={cn(
                  "mt-2 whitespace-nowrap text-[10px] font-medium",
                  done
                    ? "text-slate-600"
                    : isCurrent
                      ? accent.text
                      : "text-slate-400"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}