"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Counts up to `value` when it scrolls into view. Respects reduced motion.
 */
export function AnimatedNumber({
  value,
  duration = 1400,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const start = () => {
      if (started.current) return;
      started.current = true;
      const from = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - from) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setDisplay(value);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            start();
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);

    // Fail-safe: if the observer never fires (some mobile browsers), start the
    // count-up anyway so the stat never stays stuck at 0.
    const fallback = setTimeout(start, 2500);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      clearTimeout(fallback);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {Math.round(display).toLocaleString()}
    </span>
  );
}
