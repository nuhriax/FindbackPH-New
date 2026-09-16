"use client";

import { useEffect } from "react";

/**
 * Site-wide dark mode toggle — DISABLED.
 *
 * Dark mode is switched off site-wide: this renders nothing and keeps the
 * theme pinned to light. The full dark-mode (`site-ink`) implementation
 * remains in globals.css/auth.css and the git history, so re-enabling is
 * a one-line revert of this component plus the inline script in layout.tsx.
 */
export function ThemeToggle({ onClose }: { onClose?: () => void }) {
  useEffect(() => {
    try {
      localStorage.setItem("fb-auth-theme", "light");
    } catch {
      /* private mode etc. */
    }
    document.documentElement.setAttribute("data-auth-theme", "light");
    document.documentElement.classList.remove("site-ink");
  }, []);

  // Call onClose only when the account menu closes it — not on mount.
  void onClose;

  return null;
}
