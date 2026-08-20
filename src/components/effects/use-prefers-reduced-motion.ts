"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the user has asked for reduced motion. The initial value must
 * be identical on the server and during the browser's hydration pass; reading
 * `matchMedia` in a state initializer makes those renders differ for users who
 * prefer reduced motion.
 *
 * When true, components that respect it render their final/static state instead
 * of running entrance/ambient animations.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}
