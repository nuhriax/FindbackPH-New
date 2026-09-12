"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SuloBackground } from "./sulo-background";

// Only show the fancy background on marketing / public pages where it adds value.
// On dashboard, messages, report, search etc it hurts performance on low-end PH devices.
const MARKETING_ROUTES = new Set([
  "/",
  "/about",
  "/how-it-works",
  "/safety",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/discover",
]);

function isMarketingRoute(pathname: string): boolean {
  if (MARKETING_ROUTES.has(pathname)) return true;
  // Allow subpaths like /about/team etc if ever added
  if (pathname.startsWith("/about/")) return true;
  if (pathname.startsWith("/how-it-works/")) return true;
  return false;
}

export function MarketingBackground() {
  const pathname = usePathname();
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const handler = () => setReduced(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  if (!mounted) return null;
  if (reduced) return null; // Respect accessibility - no heavy animation
  if (!isMarketingRoute(pathname)) return null; // Don't render on app pages

  return <SuloBackground />;
}
