"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  Loader2,
  MapPin,
  PackageSearch,
  Radar,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "search", label: "Searching nearby reports", icon: Radar },
  { id: "location", label: "Analyzing location", icon: MapPin },
  { id: "details", label: "Comparing item details", icon: PackageSearch },
];

const STEP_MS = 1500;
const RESULT_MS = 2600;

/**
 * Reusable matching-sequence animation:
 * Searching reports → Analyzing location → Comparing details → "Potential
 * match found · 92%". Demo only — labeled as such.
 */
export function MatchAnimation({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(PHASES.length - 1);
      setDone(true);
      return;
    }

    let i = 0;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      timers = [];
      setStep(0);
      setDone(false);
      PHASES.forEach((_, index) => {
        timers.push(
          setTimeout(() => {
            setStep(index);
            setDone(false);
          }, (index + 1) * STEP_MS)
        );
      });
      timers.push(
        setTimeout(() => {
          setDone(true);
        }, (PHASES.length + 1) * STEP_MS)
      );
      timers.push(
        setTimeout(run, (PHASES.length + 1) * STEP_MS + RESULT_MS)
      );
    };

    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = done
    ? 100
    : Math.min(100, ((step + 1) / PHASES.length) * 100);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,.1)] backdrop-blur-md",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Matching engine progress"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Matching engine
        </span>
        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">
          <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500" />
          Demo
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {PHASES.map((phase, index) => {
          const Icon = phase.icon;
          const isActive = index === step && !done;
          const isComplete = index < step || done;
          return (
            <li
              key={phase.id}
              className={cn(
                "flex items-center gap-2 text-[11px] font-medium transition-colors duration-300",
                isActive
                  ? "text-slate-900"
                  : isComplete
                    ? "text-slate-500"
                    : "text-slate-400"
              )}
            >
              {isComplete ? (
                <Check size={13} className="shrink-0 text-emerald-500" />
              ) : isActive ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-blue-500" />
              ) : (
                <span className="flex h-[13px] w-[13px] shrink-0 items-center justify-center">
                  <Icon size={12} className="text-slate-300" />
                </span>
              )}
              <span className={cn(compact && "truncate")}>{phase.label}</span>
            </li>
          );
        })}
      </ul>

      {done && (
        <div className="fade-in mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
            <BadgeCheck size={14} className="text-emerald-600" />
            Potential match found
          </span>
          <span className="font-display text-sm font-bold text-emerald-600">
            92%
          </span>
        </div>
      )}
    </div>
  );
}
