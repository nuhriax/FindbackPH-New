import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FindBack PH — Premium Button primitives.
 *
 * One source of truth for every clickable action on the site. Use these instead
 * of hand-rolled `rounded-xl bg-electric-600 ...` class strings so hover, focus,
 * disabled and size behaviour stay identical everywhere.
 *
 * Variants:
 *   primary   — brand teal, subtle top sheen, lift on hover (main CTAs)
 *   dark      — deep espresso/navy solid (premium contrast moments)
 *   outline   — white surface, warm border (secondary actions)
 *   ghost     — no border/surface (tertiary, toolbars)
 *   danger    — destructive (delete / report actions)
 */

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-button font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-electric-500/25 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-to-b from-electric-500 to-electric-600 text-white",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_24px_-10px_rgba(15,123,114,0.55)]",
    "hover:-translate-y-px hover:from-electric-400 hover:to-electric-500",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_16px_32px_-12px_rgba(15,123,114,0.65)]"
  ),
  dark: cn(
    "bg-navy-900 text-cream-50",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_10px_24px_-10px_rgba(31,21,11,0.6)]",
    "hover:-translate-y-px hover:bg-navy-800",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_16px_32px_-12px_rgba(31,21,11,0.7)]"
  ),
  outline: cn(
    "border border-slate-200 bg-white/90 text-navy-900 shadow-soft backdrop-blur",
    "hover:-translate-y-px hover:border-electric-200 hover:bg-white hover:text-electric-700",
    "hover:shadow-card"
  ),
  ghost: "text-navy-800 hover:bg-electric-50 hover:text-electric-700",
  danger: cn(
    "bg-gradient-to-b from-sunrise-500 to-sunrise-600 text-white",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_24px_-10px_rgba(222,56,16,0.55)]",
    "hover:-translate-y-px hover:from-sunrise-400 hover:to-sunrise-500"
  ),
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-sm sm:h-[3.25rem] sm:px-8 sm:text-[15px]",
};

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional leading icon (already-styled by the button's gap). */
  children?: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

function classes({ variant = "primary", size = "md", fullWidth, className }: SharedProps) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={classes({ variant, size, fullWidth, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  href,
  ...props
}: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      className={classes({ variant, size, fullWidth, className })}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    />
  );
}
