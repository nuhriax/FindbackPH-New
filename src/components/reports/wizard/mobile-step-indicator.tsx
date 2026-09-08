"use client";

// ---------------------------------------------------------------------------
// MobileStepIndicator — mobile-friendly step indicator.
//
// Shows on mobile/tablet devices where the sidebar is hidden.
// Provides clear visual indication of current progress.
// ---------------------------------------------------------------------------

import { Check } from "lucide-react";
import type { AccentPalette } from "../report-wizard-config";

export function MobileStepIndicator({
  currentStep,
  totalSteps,
  accent,
  captions,
}: {
  currentStep: number;
  totalSteps: number;
  accent: AccentPalette;
  captions: readonly string[];
}) {
  return (
    <div className="lg:hidden">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">
            {captions[currentStep - 1]}
          </span>
          <span className="text-xs font-semibold tabular-nums text-slate-500">
            {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${accent.chipActiveIcon}`}
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)}
            aria-label={`Progress: step ${currentStep} of ${totalSteps}`}
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                  isCompleted
                    ? `${accent.chipActiveIcon} border-transparent text-white`
                    : isCurrent
                      ? `${accent.text.replace('text-', 'border-')} ${accent.text} bg-white`
                      : "border-slate-300 bg-white text-slate-400",
                ].join(" ")}
              >
                {isCompleted ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <span
                className={[
                  "mt-1 text-[10px] font-medium",
                  isCurrent ? accent.text : "text-slate-400",
                ].join(" ")}
              >
                {["1", "2", "3", "4"][step - 1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}