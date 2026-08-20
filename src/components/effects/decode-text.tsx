"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

type DecodeTextProps = {
  text: string;
  className?: string;
  /** Milliseconds per scramble tick. Lower = faster resolve. @default 34 */
  speed?: number;
  /** Start once when the text scrolls into view. */
  trigger?: "view" | "auto";
  /**
   * When true the scramble re-runs every time the text is hovered (after the
   * initial view-trigger). With trigger="auto" it runs immediately on mount.
   */
  repeatOnHover?: boolean;
};

/**
 * DecodeText — a privacy/“unscramble into meaning” reveal inspired by React
 * Bits' Decode. Placeholder characters rapidly resolve (left to right) into the
 * real `text` as soon as it scrolls into view. Respects reduced motion by
 * rendering the final text immediately.
 */
export function DecodeText({
  text,
  className,
  speed = 34,
  trigger = "view",
  repeatOnHover = false,
}: DecodeTextProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const state = useRef({ frame: 0, started: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [out, setOut] = useState<string>(() => text);

  const resolve = useCallback(() => {
    const next: string[] = [];
    const frame = state.current.frame;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === " ") {
        next.push(" ");
      } else if (i < frame) {
        next.push(char);
      } else {
        next.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
      }
    }
    return next.join("");
  }, [text]);

  const begin = useCallback(() => {
    if (state.current.started) return;
    state.current.started = true;
    state.current.frame = 0;
    setOut(resolve());
    timer.current = setInterval(() => {
      state.current.frame += 1;
      if (state.current.frame > text.length) {
        setOut(text);
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      } else {
        setOut(resolve());
      }
    }, Math.max(8, speed));
  }, [resolve, speed, text]);

  // Kick off on mount for reduced motion / "auto", or when scrolled into view.
  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    if (trigger === "auto") {
      begin();
      return;
    }
    const el = ref.current;
    if (!el) {
      begin();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && begin()),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, trigger, begin, text]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-label={text}
      className={cn("inline-block", className)}
      onMouseEnter={
        repeatOnHover && !state.current.started
          ? () => begin()
          : undefined
      }
      onMouseLeave={
        repeatOnHover
          ? () => {
              state.current.started = false;
              if (timer.current) clearInterval(timer.current);
              timer.current = null;
            }
          : undefined
      }
    >
      <span aria-hidden="true" className="tabular-nums">
        {out}
      </span>
    </span>
  );
}