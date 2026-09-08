"use client";

// ---------------------------------------------------------------------------
// WizardStepShell — wrapper for each step card.
//
// Enhanced with smooth fade-in animations, better visual hierarchy,
// and improved accessibility.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { AccentPalette } from "../report-wizard-config";

export function WizardStepShell({
  stepNumber,
  totalSteps,
  icon: Icon,
  heading,
  support,
  accent,
  isActive,
  children,
}: {
  stepNumber: number;
  totalSteps: number;
  icon: LucideIcon;
  heading: string;
  support: string;
  accent: AccentPalette;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Trigger fade-in animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      id={`step-${stepNumber}`}
      className={[
        "card p-5 sm:p-8 transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        `report-panel-dark ring-2 ${accent.ring}`,
      ].join(" ")}
      role="tabpanel"
      aria-labelledby={`step-${stepNumber}-heading`}
    >
      {/* Step header with icon */}
      <div className="mb-6 flex items-center gap-4">
        <div className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 hover:scale-110",
          accent.iconBg,
        ].join(" ")}>
          <Icon size={20} aria-hidden={true} />
        </div>
        <div>
          <p className={[
            "text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
            accent.text,
          ].join(" ")}>
            Step {stepNumber} of {totalSteps}
          </p>
          <h2
            id={`step-${stepNumber}-heading`}
            className="report-help text-xl font-bold text-navy-900"
          >
            {heading}
          </h2>
          <p className="report-faint text-sm text-slate-500">{support}</p>
        </div>
      </div>

      {/* Step content with smooth entrance */}
      <div className={[
        "space-y-5 transition-all duration-500 delay-100",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}>
        {children}
      </div>
    </div>
  );
}