"use client";

// ---------------------------------------------------------------------------
// WizardProgressBar — linear progress bar for desktop view.
// Shows completion percentage and step labels in a horizontal bar.
// ---------------------------------------------------------------------------

import type { AccentPalette } from "../report-wizard-config";

export function WizardProgressBar({
  step,
  totalSteps,
  accent,
}: {
  step: number;
  totalSteps: number;
  accent: AccentPalette;
}) {
  const progress = Math.round(((step - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600">
          Step {step} of {totalSteps}
        </span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: accent.text.replace('text-', '') }}>
          {progress}% complete
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${accent.chipActiveIcon}`}
          style={{ width: `${progress}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          role="progressbar"
          aria-label={`Progress: ${progress}%`}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {}}
            className={[
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              s <= step ? "text-slate-700" : "text-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                s < step
                  ? `${accent.chipActiveIcon} text-white`
                  : s === step
                    ? `border-2 ${accent.text.replace('text-', 'border-')} ${accent.text}`
                    : "border border-slate-300 text-slate-400",
              ].join(" ")}
            >
              {s < step ? "✓" : s}
            </span>
            <span className="hidden sm:inline">
              {["Details", "Location", "Photos", "Review"][s - 1]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}