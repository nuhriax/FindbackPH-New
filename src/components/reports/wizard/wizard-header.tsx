"use client";

// ---------------------------------------------------------------------------
// WizardHeader — hero header for the report wizards.
//
// Enhanced with better visual hierarchy, animated gradient title,
// and stronger trust signals.
// ---------------------------------------------------------------------------

import { MotionReveal } from "@/components/effects/motion-reveal";
import type { AccentPalette } from "../report-wizard-config";

export function WizardHeader({
  eyebrowIcon: Icon,
  eyebrowLabel,
  title,
  lead,
  accent,
}: {
  eyebrowIcon: import("lucide-react").LucideIcon;
  eyebrowLabel: string;
  title: React.ReactNode;
  lead: string;
  accent: AccentPalette;
}) {
  return (
    <MotionReveal>
      <div className="text-center">
        {/* Eyebrow badge with icon */}
        <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur transition-all hover:scale-105 hover:shadow-sm">
          <Icon size={13} className={accent.text} aria-hidden={true} />
          {eyebrowLabel}
        </span>

        {/* Main title with gradient animation */}
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {/* Lead text */}
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {lead}
        </p>

        {/* Trust strip with security icons */}
        <div className="report-trust-strip mx-auto mt-4 inline-flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/70 px-4 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>Private details stay private</span>
          <span className="text-slate-300">•</span>
          <span>Public info is exactly what you enter</span>
        </div>

        {/* Security badges row */}
        <div className="mx-auto mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-electric-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Fast matching
          </span>
        </div>
      </div>
    </MotionReveal>
  );
}