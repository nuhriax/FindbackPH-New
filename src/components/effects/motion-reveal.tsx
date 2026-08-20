"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in milliseconds before the reveal starts. */
  delay?: number;
  /** Starting vertical offset in pixels. */
  y?: number;
  /** Start with a soft blur that clears as it settles. */
  blur?: boolean;
};

/**
 * Whole-site entrance / scroll-reveal powered by Motion (Framer Motion).
 *
 * Fades the content up (and optionally un-blurs it) the first time it scrolls
 * into view. Respects `prefers-reduced-motion` and renders the static state for
 * those users.
 */
export function MotionReveal({
  children,
  className,
  delay = 0,
  y = 26,
  blur = true,
}: MotionRevealProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      initial={{ opacity: 0, y, filter: blur ? "blur(6px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}