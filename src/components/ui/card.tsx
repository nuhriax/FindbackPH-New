import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FindBack PH — Premium Card primitives.
 *
 * The site's elevation language in one place:
 *   surface  — translucent white glass over the warm-sand backdrop (default)
 *   solid    — opaque white, for dense data surfaces (tables, settings)
 *   gradient — eyebrow band + sheen for hero/showcase cards
 *   interactive — adds lift + border tint on hover
 */

export type CardSurface = "surface" | "solid" | "gradient" | "sunken";

const SURFACES: Record<CardSurface, string> = {
  surface: "border-slate-200/70 bg-white/85 backdrop-blur-md shadow-card",
  solid: "border-slate-200 bg-white shadow-soft",
  gradient: cn(
    "border border-white/60 bg-gradient-to-b from-white via-white to-cream-100",
    "shadow-[0_24px_60px_-26px_rgba(51,46,38,0.28),inset_0_1px_0_0_rgba(255,255,255,0.8)]"
  ),
  sunken: "border-slate-200/60 bg-cream-100/70 shadow-inner",
};

export function Card({
  surface = "surface",
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { surface?: CardSurface; interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        SURFACES[surface],
        interactive &&
          "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-electric-200 hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}

/** Small tinted icon tile used at the top of feature cards. */
export function IconTile({
  icon,
  tone = "electric",
  className,
}: {
  icon: ReactNode;
  tone?: "electric" | "sunrise" | "emerald" | "navy";
  className?: string;
}) {
  const tones = {
    electric: "border-electric-200 bg-electric-50 text-electric-700",
    sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    navy: "border-slate-200 bg-cream-100 text-navy-800",
  } as const;

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]",
        tones[tone],
        className
      )}
    >
      {icon}
    </div>
  );
}

/** Eyebrow label — the small uppercase tracking-wide kicker above headings. */
export function Eyebrow({
  as: Tag = "span",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-electric-600",
        className
      )}
    >
      {children}
    </Tag>
  );
}
