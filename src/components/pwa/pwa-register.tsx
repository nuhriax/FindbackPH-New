"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (PWA installability + offline fallback shell).
 * Kept as a tiny isolated client component mounted once from the root layout,
 * and a no-op in development so `next dev` HMR is never served through the SW.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
