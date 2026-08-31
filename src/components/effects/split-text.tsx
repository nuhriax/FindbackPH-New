"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export type SplitSegment = {
  text: string;
  className?: string;
  /**
   * When true this segment reveals as a single unmasked block instead of being
   * broken into words — useful for gradient-clipped text where a continuous
   * background must not be split across word boxes.
   */
  single?: boolean;
  /** Start this segment on a fresh line (forces a line break before it). */
  break?: boolean;
};

type SplitTextProps = {
  segments: SplitSegment[];
  className?: string;
  /** Delay before the first word starts, in ms. */
  delay?: number;
  /** Seconds between successive words. */
  stagger?: number;
};

/**
 * SplitText — a Word-mask reveal inspired by React Bits' SplitText.
 *
 * Each word is hidden inside an `overflow-hidden` mask and slides up (with a
 * soft blur + perspective tilt) into place when the block scrolls into view.
 * Segments let you keep per-word accent colors, e.g. the navy / coral / emerald
 * tints on the homepage hero without losing the staggered reveal.
 */
export function SplitText({ segments, className, delay = 0, stagger = 0.07 }: SplitTextProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  // `mounted` only flips after hydration, so the server-rendered HTML (and any
  // visitor whose JavaScript fails) always sees the fully-visible heading.
  // `inView` drives the reveal; a fallback timer guarantees the text becomes
  // visible even on mobile browsers where IntersectionObserver misbehaves.
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
      // A small negative bottom margin matches the previous "reveal slightly
      // after entering" feel without preventing the hero from ever triggering.
      { rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);

    // Fail-safe: never leave the heading hidden for more than 2.5s.
    const fallback = setTimeout(() => {
      setInView(true);
      io.disconnect();
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  // Flatten segments into word tokens, each carrying an optional class and a
  // flag if it must start a fresh line.
  const tokens: { text: string; className?: string; single: boolean; breakBefore: boolean }[] = [];
  for (const seg of segments) {
    const firstTokenIndex = tokens.length;
    if (seg.single || !seg.text.trim()) {
      if (seg.text) tokens.push({ text: seg.text, className: seg.className, single: true, breakBefore: false });
    } else {
      const words = seg.text.split(" ");
      for (const word of words) {
        if (word) tokens.push({ text: `${word} `, className: seg.className, single: false, breakBefore: false });
      }
    }
    if (seg.break && tokens.length > firstTokenIndex) {
      tokens[firstTokenIndex].breakBefore = true;
    }
  }

  const plainText = segments.map((s) => s.text).join("");

  // Reduced motion: render the heading statically with all markup preserved.
  if (reduced) {
    return (
      <span className={className}>
        {segments.map((seg, i) => (
          <span key={i} className={cn(seg.break && "block", seg.className)}>
            {seg.text}
          </span>
        ))}
      </span>
    );
  }

  // The heading is only hidden between hydration and the reveal trigger. If JS
  // never runs (or the observer never fires and the fallback lapses), the text
  // simply stays visible — it can never end up blank or stuck mid-animation.
  const hidden = mounted && !inView && !reduced;

  return (
    <span ref={ref} aria-label={plainText} className={cn("block whitespace-normal", className)}>
      {tokens.map((token, i) => {
        return (
          <span key={i}>
            {token.breakBefore && <br aria-hidden="true" />}
            <span
              aria-hidden="true"
              className={token.single ? "inline-block whitespace-pre-wrap" : "inline-block overflow-hidden align-baseline"}
              style={token.single ? { whiteSpace: "pre-wrap" } : { verticalAlign: "baseline" }}
            >
              <motion.span
                className={cn(
                  "inline-block will-change-transform",
                  token.single ? "block" : undefined,
                  token.className
                )}
                initial={hidden ? { opacity: 0 } : false}
                animate={hidden ? undefined : { opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: delay / 1000 + i * stagger,
                  ease: "easeOut",
                }}
              >
                {token.single ? (
                  <span className={token.className}>{token.text}</span>
                ) : (
                  token.text
                )}
              </motion.span>
            </span>
            {/* The word-separating space must live OUTSIDE the overflow-hidden
                mask: trailing whitespace collapses inside inline-block boxes,
                which visually jams words together once revealed. */}
            {!token.single && token.text.endsWith(" ") && (
              <span aria-hidden="true"> </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Convenience wrapper for a plain single-line heading so callers only need a
 * string instead of a segment array.
 */
export function SplitHeading({
  text,
  className,
  delay,
  stagger,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  return <SplitText segments={[{ text, className }]} delay={delay} stagger={stagger} className={className} />;
}

