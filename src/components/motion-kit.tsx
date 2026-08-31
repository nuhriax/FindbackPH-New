"use client";

/**
 * motion-kit — advanced scroll & pointer animations built on `motion`
 * (framer-motion successor, already in deps). Every component respects
 * prefers-reduced-motion and degrades to plain content.
 */

import {
  motion,
  useReducedMotion,
  useSpring,
  useMotionValue,
  useTransform,
  useScroll,
  type Variants,
} from "motion/react";
import { useRef, type ReactNode } from "react";
import { clsx } from "clsx";

/* ------------------------------------------------------------------ */
/* Directional scroll reveal                                           */
/* ------------------------------------------------------------------ */

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "blur";

const offsets: Record<RevealDirection, { x?: number; y?: number; scale?: number; filter?: string }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 60 },
  right: { x: -60 },
  scale: { scale: 0.92 },
  blur: { y: 24, filter: "blur(8px)" },
};

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Render as a different element (e.g. "li" inside lists). */
  as?: "div" | "li" | "section" | "article";
};

export function MotionReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.7,
  as = "div",
}: MotionRevealProps) {
  const reduced = useReducedMotion();
  const offset = offsets[direction];
  const Tag = motion[as] as typeof motion.div;

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Staggered cascade                                                   */
/* ------------------------------------------------------------------ */

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Keep list semantics by rendering ol/ul. */
  as?: "div" | "ol" | "ul" | "li";
};

export function Stagger({ children, className, as = "div" }: StaggerProps) {
  const reduced = useReducedMotion();
  const Parent = motion[as] as typeof motion.div;

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Parent
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
    >
      {children}
    </Parent>
  );
}

export function StaggerItem({ children, className, as = "div" }: StaggerProps) {
  const reduced = useReducedMotion();
  const Item = motion[as] as typeof motion.div;

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Item className={className} variants={staggerChild}>
      {children}
    </Item>
  );
}

/* ------------------------------------------------------------------ */
/* 3D tilt card — responds to cursor position with spring physics      */
/* ------------------------------------------------------------------ */

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  intensity?: number;
};

export function TiltCard({ children, className, intensity = 8 }: TiltCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springX = useSpring(px, { stiffness: 220, damping: 22 });
  const springY = useSpring(py, { stiffness: 220, damping: 22 });

  const rotateX = useTransform(springY, [0, 1], [intensity, -intensity]);
  const rotateY = useTransform(springX, [0, 1], [-intensity, intensity]);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={clsx("[perspective:900px]", className)}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        px.set((e.clientX - rect.left) / rect.width);
        py.set((e.clientY - rect.top) / rect.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="h-full will-change-transform"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Swipeable drag carousel — momentum, bounds, grab cursor             */
/* ------------------------------------------------------------------ */

type SwipeCardsProps = {
  children: ReactNode[];
  className?: string;
  /** Tailwind classes for each slide wrapper, e.g. width basis. */
  slideClassName?: string;
};

/**
 * Horizontally draggable card row with momentum + bounds. Children should be
 * equal-width slides; the track can't be dragged into empty space.
 */
export function SwipeCards({ children, className, slideClassName }: SwipeCardsProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  if (reduced) {
    return (
      <div ref={containerRef} className={clsx("overflow-x-auto", className)}>
        <div ref={trackRef} className="flex">
          {children.map((child, i) => (
            <div key={i} className={slideClassName}>
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={clsx("relative overflow-hidden", className)}>
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.08}
        dragTransition={{ power: 0.28, timeConstant: 220 }}
        className="flex cursor-grab gap-4 active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        whileTap={{ cursor: "grabbing" }}
      >
        {children.map((child, i) => (
          <motion.div
            key={i}
            className={clsx("shrink-0 select-none", slideClassName)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating ambient element — slow drift for hero decorations          */
/* ------------------------------------------------------------------ */

type FloatProps = {
  children: ReactNode;
  className?: string;
  /** Drift distance in px. */
  distance?: number;
  /** Loop duration in seconds. */
  duration?: number;
  delay?: number;
};

export function Float({ children, className, distance = 14, duration = 6, delay = 0 }: FloatProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll progress bar — thin page-completion indicator at the top     */
/* ------------------------------------------------------------------ */

/**
 * Fixed 3px bar pinned to the top of the viewport that fills with brand
 * teal as the user scrolls down the page. Purely decorative progress
 * communication; hidden for reduced-motion users.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={clsx(
        "fixed inset-x-0 top-0 z-[90] h-0.5 origin-left bg-gradient-to-r from-electric-500 via-electric-600 to-electric-700",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ScrollFillRail — vertical timeline rail that fills as you scroll    */
/* ------------------------------------------------------------------ */

type ScrollFillRailProps = {
  children: ReactNode;
  className?: string;
  /** Render as a semantic list element to keep ol/ul semantics. */
  as?: "div" | "ol" | "ul";
  /** Classes for the unfilled track (defaults to electric-100). */
  trackClassName?: string;
  /** Classes for the animated fill (defaults to electric gradient). */
  fillClassName?: string;
};

/**
 * Scroll-driven storytelling for journeys: a vertical rail that draws
 * itself from top to bottom as the list scrolls through the viewport.
 * Communicates literal progress through the steps — used only where the
 * content is a sequence (Lost → Report → … → Return), never decoratively.
 */
export function ScrollFillRail({
  children,
  className,
  as = "div",
  trackClassName = "bg-electric-100",
  fillClassName = "bg-gradient-to-b from-electric-400 via-electric-500 to-electric-600",
}: ScrollFillRailProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.78", "end 0.55"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });

  if (reduced) {
    // Cast to "div" purely for ref typing; `as` is only ever "div" | "section"
    // | "ol" at runtime, and a generic element ref is safe on all of them.
    const Static = as as "div";
    // Attach the same ref here — useScroll() above registered this ref as its
    // target, and an unattached target ref makes motion throw
    // "Target ref is defined but not hydrated".
    return (
      <Static ref={ref} className={clsx("relative", className)}>
        <span
          aria-hidden="true"
          className={clsx("absolute left-0 top-0 h-full w-0.5 rounded-full", trackClassName)}
        />
        <span
          aria-hidden="true"
          className={clsx("absolute left-0 top-0 h-full w-0.5 rounded-full", fillClassName)}
        />
        {children}
      </Static>
    );
  }

  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag ref={ref} className={clsx("relative", className)}>
      <span
        aria-hidden="true"
        className={clsx("absolute left-0 top-0 h-full w-0.5 rounded-full", trackClassName)}
      />
      <motion.span
        aria-hidden="true"
        style={{ scaleY }}
        className={clsx(
          "absolute left-0 top-0 h-full w-0.5 origin-top rounded-full will-change-transform",
          fillClassName,
        )}
      />
      {children}
    </Tag>
  );
}


