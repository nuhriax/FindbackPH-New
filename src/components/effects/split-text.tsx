"use client";

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

  return (
    <span aria-label={plainText} className={cn("block whitespace-normal", className)}>
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
                initial={
                  token.single
                    ? { opacity: 0, y: 28, filter: "blur(8px)" }
                    : { opacity: 0, y: "115%", rotateX: -24, filter: "blur(6px)" }
                }
                whileInView={{
                  opacity: 1,
                  y: "0%",
                  rotateX: 0,
                  filter: "blur(0px)",
                }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.7,
                  delay: delay / 1000 + i * stagger,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {token.single ? (
                  <span className={token.className}>{token.text}</span>
                ) : (
                  token.text
                )}
              </motion.span>
            </span>
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

