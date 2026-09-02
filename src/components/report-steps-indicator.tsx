// ---------------------------------------------------------------------------
// ReportStepsIndicator
// ---------------------------------------------------------------------------
// Journey progress indicator for the multi-step report wizards
// (/report/lost and /report/found). Drawn as a route line with numbered
// location-marker nodes — REPORT → VERIFY → CONNECT → RETURN — echoing the
// site-wide "journey home" motif: a dashed route that fills in behind you as
// you move forward, ending at a marker node. Completed steps are solid dots,
// the current step is a ringed marker, upcoming steps stay faint.
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Report", "Verify", "Connect", "Return"];

export function ReportStepsIndicator({
  current,
  caption,
  accent = "teal",
}: {
  /** 1-based active step (1–4). */
  current: number;
  /** Descriptive line shown under the route, e.g. "Step 2 · Where & when". */
  caption: string;
  /** Red (lost flow) or emerald/green (found flow) accent. */
  accent?: "teal" | "emerald";
}) {
  const colors =
    accent === "emerald"
      ? {
          doneDot: "bg-emerald-500",
          activeRing: "border-emerald-500 text-emerald-700",
          activeText: "text-emerald-700",
          line: "#209b68",
        }
      : {
          doneDot: "bg-red-500",
          activeRing: "border-red-500 text-red-700",
          activeText: "text-red-700",
          line: "#dc2626",
        };

  return (
    <div className="mt-8">
      <ol
        aria-label="Report progress"
        className="mx-auto flex max-w-md items-start"
      >
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const isActive = n === current;
          const isDone = n < current;
          const lineDone = n <= current;

          return (
            <li key={label} className="relative flex min-w-0 flex-1 flex-col items-center">
              {/* Route connector — sits behind the nodes, spanning from the
                  previous node's center (-50%) to this node's center. Requires
                  equal-width (flex-1) columns to line up with the node dots. */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    backgroundImage: isDone
                      ? `linear-gradient(90deg, ${colors.line} 0%, ${colors.line} 100%)`
                      : undefined,
                  }}
                  // Inactive segment uses the bg-slate-200 utility (NOT an
                  // inline color) so the site-ink dark theme can re-theme it.
                  className={
                    (isDone ? "opacity-60 " : "bg-slate-200 ") +
                    "absolute left-[-50%] top-[7px] -z-10 h-[2px] w-full rounded-full sm:top-[9px]"
                  }
                />
              )}

              <span
                aria-current={isActive ? "step" : undefined}
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-colors duration-300 sm:h-[18px] sm:w-[18px] ${
                  isDone
                    ? colors.doneDot + " border-transparent"
                    : isActive
                      ? colors.activeRing
                      : "border-slate-300"
                }`}
              >
                {isDone && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 10 8"
                    className="h-2 w-2 text-white"
                    fill="none"
                  >
                    <path
                      d="M1 4.2 3.8 7 9 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              <span
                className={`mt-2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 sm:text-[10px] ${
                  isActive
                    ? colors.activeText
                    : isDone
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {caption}
      </p>
    </div>
  );
}
