import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FindBack PH — Badge primitive (Notice-Board design system).
 *
 * Semantic tones follow the brand hierarchy:
 *   ocean  → neutral/brand info        · coral → "lost" status & alerts
 *   emerald→ "found"/returned          · sun   → found/celebratory labels
 *   navy   → quiet meta labels
 */

export type BadgeTone = "electric" | "sunrise" | "emerald" | "navy" | "neutral" | "coral" | "ocean" | "sun";

const TONES: Record<BadgeTone, string> = {
  electric: "border-ocean-200 bg-ocean-50 text-ocean-600",
  sunrise: "border-coral-200 bg-coral-50 text-coral-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  navy: "border-slate-300/70 bg-cream-100 text-ocean-500",
  neutral: "border-slate-200 bg-white/80 text-ink-soft",
  coral: "border-coral-200 bg-coral-50 text-coral-700",
  ocean: "border-ocean-200 bg-ocean-50 text-ocean-600",
  sun: "border-sun-300/80 bg-sun-50 text-sun-700",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm",
        TONES[tone],
        className
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
