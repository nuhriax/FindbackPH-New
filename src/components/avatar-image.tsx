"use client";

import { useEffect, useState } from "react";

/**
 * AvatarImage — avatar <img> with a graceful failure fallback.
 *
 * When the stored avatar URL is stale/removed (e.g. bucket object deleted),
 * the browser would render broken-image glyph + alt text over the colored
 * placeholder (ugly, and it leaked a name over the banner). This component
 * swaps to the initials tile the moment the image fails — same visual the
 * no-avatar state already uses, so nothing shifts.
 */
export function AvatarImage({
  src,
  alt,
  initials,
  className,
  fallbackClassName,
}: {
  src: string;
  alt: string;
  initials: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Reset when the src changes (user uploaded a new photo).
  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-electric-500 to-electric-600 font-display text-3xl font-bold text-white sm:text-4xl ${fallbackClassName ?? ""}`}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}