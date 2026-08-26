"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  // Same fail-safe pattern as SplitText: the server-rendered markup (and any
  // visitor whose JS fails) sees the fully-visible content; the hidden state is
  // only applied after hydration, and a fallback timer guarantees the reveal
  // even if IntersectionObserver never fires on the device.
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setMounted(true);

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);

    const fallback = setTimeout(() => {
      setInView(true);
      io.disconnect();
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const hidden = mounted && !inView && !reduced;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      initial={hidden ? { opacity: 0 } : false}
      animate={hidden ? undefined : { opacity: 1 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}