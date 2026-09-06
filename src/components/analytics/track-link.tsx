"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductArea } from "@/lib/analytics";
import { track } from "@/lib/analytics-client";

/**
 * A Link that records a product event on click before handing off to
 * navigation. Used for match cards so we can measure whether the matching
 * engine produces results people actually act on.
 */
export function TrackLink({
  href,
  eventName,
  area,
  props,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  eventName: Parameters<typeof track>[0];
  area: ProductArea;
  props: Record<string, string | number | boolean | null>;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={className}
      onClick={() => track(eventName, area, props)}
    >
      {children}
    </Link>
  );
}
