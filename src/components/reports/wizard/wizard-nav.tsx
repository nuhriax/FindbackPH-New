"use client";

// ---------------------------------------------------------------------------
// WizardNav — sticky bottom navigation (Back / Step x of 4 / Continue).
//
// Enhanced with better visual hierarchy, loading states, and micro-interactions.
// ---------------------------------------------------------------------------

import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import type { AccentPalette } from "../report-wizard-config";

export function WizardNav({
  step,
  totalSteps,
  isPending,
  accent,
  continueLabels,
  publishLabel,
  onBack,
  onNext,
}: {
  step: number;
  totalSteps: number;
  isPending: boolean;
  accent: AccentPalette;
  continueLabels: readonly string[];
  publishLabel: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const isFirst = step === 1;
  const isLast = step === totalSteps;

  return (
    <div className="report-wizard-nav sticky bottom-3 z-20 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all duration-300">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst || isPending}
        className={[
          "btn-secondary group flex items-center gap-1.5 transition-all duration-200",
          isFirst ? "invisible" : "hover:-translate-x-0.5",
          isPending ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
        aria-label="Go to previous step"
      >
        <ChevronLeft
          size={16}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden={true}
        />
        <span>Back</span>
      </button>

      {/* Step indicator (desktop) */}
      <span className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
        <span className={[
          "flex h-2 w-2 rounded-full transition-all",
          isLast ? `${accent.chipActiveIcon}` : `bg-slate-300`,
        ].join(" ")} />
        Step {step} of {totalSteps}
      </span>

      {/* Primary action button */}
      {isLast ? (
        <button
          type="submit"
          disabled={isPending}
          className={[
            "btn-primary flex min-w-0 items-center gap-2 transition-all duration-200",
            isPending ? "opacity-75 cursor-wait" : "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
          ].join(" ")}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin shrink-0" aria-hidden={true} />
              <span>Publishing…</span>
            </>
          ) : (
            <>
              <span className="truncate">{publishLabel}</span>
              <ArrowRight size={16} className="shrink-0" aria-hidden={true} />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="btn-primary group flex min-w-0 items-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          aria-label={`Continue — ${continueLabels[step - 1] ?? "Next"}`}
        >
          <span className="truncate">{continueLabels[step - 1] ?? "Continue"}</span>
          <ArrowRight
            size={16}
            className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden={true}
          />
        </button>
      )}

      {/* Mobile-only step indicator */}
      <span className="flex items-center gap-1.5 sm:hidden">
        <span className={[
          "h-2 w-2 rounded-full transition-all",
          isLast ? `${accent.chipActiveIcon}` : `bg-slate-300`,
        ].join(" ")} />
        <span className="text-[10px] font-medium text-slate-500">
          {step}/{totalSteps}
        </span>
      </span>
    </div>
  );
}
