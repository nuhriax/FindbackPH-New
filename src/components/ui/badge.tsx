import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FindBack PH — Badge primitive.
 *
 * Semantic tones follow the brand hierarchy:
 *   electric → neutral/brand info   · sunrise → "lost" status
 *   emerald  → "found"/returned     · navy → quiet meta labels
 */

export type BadgeTone = "electric" | "sunrise" | "emerald" | "navy" | "neutral";

const TONES: Record<BadgeTone, string> = {
  electric: "border-electric-200 bg-electric-50 text-electric-700",
  sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  navy: "border-slate-300/70 bg-cream-100 text-navy-800",
  neutral: "border-slate-200 bg-white/80 text-slate-600",
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
