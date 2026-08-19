"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "fb-auth-theme";

function readHtmlAttr(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-auth-theme") === "dark" ? "dark" : "light";
}

function setHtmlAttr(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-auth-theme", t);
}

/**
 * Scoped light/dark theme for the authentication experience.
 *
 * The actual theme is driven by CSS via `html[data-auth-theme="dark"] .auth-root`,
 * so an inline script in the root layout sets that attribute before the first
 * paint — dark mode users see dark immediately, with NO light flash. This hook
 * only keeps the React state (for the toggle icon) in sync and never causes a
 * hydration mismatch because the attribute lives on <html>, not React markup.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Align React state with whatever the pre-paint script chose.
    setTheme(readHtmlAttr());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      const t = stored === "light" || stored === "dark" ? stored : media.matches ? "dark" : "light";
      setHtmlAttr(t);
      setTheme(t);
    };
    const onChange = () => {
      // Only follow the OS while the user has not made an explicit choice.
      if (!window.localStorage.getItem(STORAGE_KEY)) apply();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      setHtmlAttr(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* private mode — ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle, mounted };
}