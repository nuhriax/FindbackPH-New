"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Site-wide dark mode toggle.
 *
 * Reuses the existing `fb-auth-theme` localStorage key + `data-auth-theme`
 * attribute (already set before first paint by the inline script in
 * layout.tsx) and additionally toggles the `site-ink` class on <html>,
 * which activates the site-wide dark palette defined at the end of
 * globals.css. State is read from the DOM after mount so SSR/hydration
 * never mismatch.
 */

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.setAttribute("data-auth-theme", theme);
  root.classList.toggle("site-ink", theme === "dark");
}

export function ThemeToggle({ onClose }: { onClose?: () => void }) {
  const [dark, setDark] = useState<boolean | null>(null); // null = not mounted yet

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-auth-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !(dark ?? false);
    setDark(next);
    applyTheme(next ? "dark" : "light");
    try {
      localStorage.setItem("fb-auth-theme", next ? "dark" : "light");
    } catch {
      /* private mode etc. — theme just won't persist */
    }
    onClose?.();
  };

  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={dark === true}
      onClick={toggle}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
    >
      <span className="flex items-center gap-3">
        {dark === true ? <Moon size={17} className="text-slate-500" /> : <Sun size={17} className="text-slate-500" />}
        Dark mode
      </span>
      {/* On/off pill switch */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          dark ? "bg-electric-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all ${
            dark ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
