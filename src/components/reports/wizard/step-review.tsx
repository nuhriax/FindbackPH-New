"use client";

// ---------------------------------------------------------------------------
// StepReview — the report wizard's Step 4.
//
// Enhanced with better visual hierarchy and smooth transitions.
// ---------------------------------------------------------------------------

import { ClipboardCheck } from "lucide-react";
import type { ReviewEditStep } from "./wizard-review-list";
import { WizardReviewList } from "./wizard-review-list";
import type { ReviewSnapshot, WizardConfig } from "../report-wizard-config";
import { WizardStepShell } from "./wizard-step-shell";

export function StepReview({
  cfg,
  isActive,
  review,
  imageCount,
  onEditStep,
}: {
  cfg: WizardConfig;
  isActive: boolean;
  review: ReviewSnapshot | null;
  imageCount: number;
  onEditStep: (step: ReviewEditStep) => void;
}) {
  return (
    <WizardStepShell
      stepNumber={4}
      totalSteps={4}
      icon={ClipboardCheck}
      heading={cfg.stepHeadings[3]}
      support={cfg.stepSupport[3]}
      accent={cfg.accent}
      isActive={isActive}
    >
      {review ? (
        <WizardReviewList
          cfg={cfg}
          review={review}
          imageCount={imageCount}
          onEdit={onEditStep}
          accent={cfg.accent}
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
        </div>
      )}
    </WizardStepShell>
  );
}