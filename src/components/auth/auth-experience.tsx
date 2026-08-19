"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { AuthVisual } from "./auth-visual";
import { useTheme } from "./use-theme";

export type AuthMode = "login" | "register";

/**
 * Premium two-panel authentication shell shared by /login and /register.
 *
 * The shell (and the animated visual) persist across route changes because the
 * route-group layout stays mounted — only the form in `.auth-page` changes.
 * `key={pathname}` re-triggers the enter transition so Login ↔ Register feels
 * like one fluid application while URLs and browser navigation are preserved.
 *
 * Mouse interaction writes CSS custom properties on the container (no React
 * re-renders) and is gated to fine pointers + desktop + reduced-motion off.
 */
export function AuthExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode: AuthMode = pathname.startsWith("/register") ? "register" : "login";
  const { theme, toggle, mounted } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const finePointer = window.matchMedia?.("(pointer: fine)").matches;
    const desktop = window.matchMedia?.("(min-width: 1024px)").matches;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || !desktop || reduced) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        el.style.setProperty("--mx", nx.toFixed(3));
        el.style.setProperty("--my", ny.toFixed(3));
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={rootRef} className="auth-root">
      <AuthVisual mode={mode} />

      <section className="auth-form-panel" aria-label="Authentication">
        <div className="auth-form-inner">
          <div className="auth-form-head">
            <Link href="/" className="auth-brand" aria-label="FindBack PH — home">
              <LogoMark />
              <span className="auth-brand-text">
                FindBack <span className="auth-brand-accent">PH</span>
              </span>
            </Link>
            <button
              type="button"
              className="auth-theme-toggle"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {mounted && (theme === "dark" ? <Sun size={16} /> : <Moon size={16} />)}
            </button>
          </div>

          <div key={pathname} className="auth-page">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}