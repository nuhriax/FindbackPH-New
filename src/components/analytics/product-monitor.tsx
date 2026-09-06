"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics-client";

/**
 * Site-wide UX monitor answering "which mobile screens cause problems?":
 *  - page_view with device class + viewport width on every route change
 *  - js_error for uncaught client errors
 *  - rage_click when the same spot is tapped 3+ times within 1.2s (frustration)
 *
 * Mounted once inside SiteChrome so it never re-mounts across navigation.
 */
export function ProductAnalyticsMonitor() {
  const pathname = usePathname();

  // page_view per route change
  useEffect(() => {
    const w = window.innerWidth;
    const device = w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
    track("page_view", "system", {
      device,
      viewport_w: w,
      viewport_h: window.innerHeight,
      dpr: Math.round(window.devicePixelRatio * 100) / 100,
    });
  }, [pathname]);

  // Uncaught client errors
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      track("js_error", "system", {
        message: String(e.message ?? "unknown").slice(0, 120),
        source: String(e.filename ?? "").split("/").pop() ?? "",
        line: e.lineno ?? 0,
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      track("js_error", "system", {
        message: String(e.reason?.message ?? e.reason ?? "unhandled rejection").slice(0, 120),
        source: "promise",
        line: 0,
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  // Rage clicks — 3+ clicks on (nearly) the same spot within 1.2 seconds.
  const clicks = useRef<{ x: number; y: number; t: number }[]>([]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const now = Date.now();
      clicks.current = clicks.current.filter((c) => now - c.t < 1200);
      clicks.current.push({ x: e.clientX, y: e.clientY, t: now });
      const recent = clicks.current;
      if (
        recent.length >= 3 &&
        Math.abs(recent[recent.length - 3].x - e.clientX) < 48 &&
        Math.abs(recent[recent.length - 3].y - e.clientY) < 48
      ) {
        clicks.current = [];
        const el = e.target as HTMLElement | null;
        track("rage_click", "system", {
          device: window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
          tag: el?.tagName?.toLowerCase() ?? "",
          label: (el?.textContent ?? "").trim().slice(0, 40),
        });
      }
    };
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
