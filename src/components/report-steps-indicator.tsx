// ---------------------------------------------------------------------------
// ReportStepsIndicator
// ---------------------------------------------------------------------------
// Pill-style progress indicator for the multi-step report wizards
// (/report/lost and /report/found). Mirrors the brand journey:
// REPORT → VERIFY → CONNECT → RETURN — outlined pills joined by dashed
// connectors, with the current step emphasized and completed steps tinted.
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Report", "Verify", "Connect", "Return"];

export function ReportStepsIndicator({
  current,
  caption,
  accent = "teal",
}: {
  /** 1-based active step (1–4). */
  current: number;
  /** Descriptive line shown under the pills, e.g. "Step 2 · Where & when". */
  caption: string;
  /** Teal (lost flow) or emerald (found flow) accent. */
  accent?: "teal" | "emerald";
}) {
  const active =
    accent === "emerald"
      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
      : "border-electric-500 bg-electric-500 text-white shadow-sm shadow-electric-500/30";
  const done =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
      : "border-electric-200 bg-electric-50 text-electric-600";
  const doneLine =
    accent === "emerald" ? "border-emerald-400/70" : "border-electric-400/70";

  return (
    <div className="mt-8">
      <ol aria-label="Report progress" className="flex items-center justify-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const isActive = n === current;
          const isDone = n < current;

          return (
            <li key={label} className="flex items-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`mx-1.5 h-px w-4 border-t border-dashed sm:mx-2.5 sm:w-8 ${
                    isDone ? doneLine : "border-slate-300"
                  }`}
                />
              )}
              <span
                aria-current={isActive ? "step" : undefined}
                className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 sm:px-3.5 sm:py-1.5 sm:text-[10px] ${
                  isActive ? active : isDone ? done : "border-slate-200 bg-white/70 text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {caption}
      </p>
    </div>
  );
}
