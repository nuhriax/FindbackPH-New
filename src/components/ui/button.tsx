import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FindBack PH — Button primitives (Notice-Board design system).
 *
 * One source of truth for every clickable action on the site. Use these instead
 * of hand-rolled class strings so hover, focus, disabled and size behaviour
 * stay identical everywhere.
 *
 * Variants:
 *   primary   — sun gold with ink text (main CTAs; the brand "pin")
 *   dark      — ocean blue solid (premium contrast moments)
 *   outline   — sand surface, ocean border (secondary actions)
 *   ghost     — no border/surface (tertiary, toolbars)
 *   danger    — coral (destructive / lost-alert actions)
 */

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-button font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun-300/50 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-to-b from-sun-400 to-sun-500 text-ink",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_10px_24px_-10px_rgba(201,127,30,0.55)]",
    "hover:-translate-y-px hover:from-sun-300 hover:to-sun-400",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_16px_32px_-12px_rgba(201,127,30,0.65)]"
  ),
  dark: cn(
    "bg-ocean-500 text-white",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_10px_24px_-10px_rgba(11,38,71,0.6)]",
    "hover:-translate-y-px hover:bg-ocean-400",
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_16px_32px_-12px_rgba(11,38,71,0.7)]"
  ),
  outline: cn(
    "border border-ocean-200 bg-white/90 text-ocean-500 shadow-soft backdrop-blur",
    "hover:-translate-y-px hover:border-sun-300 hover:bg-white hover:text-ocean-600",
    "hover:shadow-card"
  ),
  ghost: "text-ocean-500 hover:bg-ocean-50 hover:text-ocean-600",
  danger: cn(
    "bg-gradient-to-b from-coral-500 to-coral-600 text-white",
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_10px_24px_-10px_rgba(184,64,42,0.55)]",
    "hover:-translate-y-px hover:from-coral-500 hover:to-coral-500"
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
