"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

/**
 * Route-group layout for /login and /register. Persists across navigation
 * between the two, so the animated visual and theme stay continuous while only
 * the form content swaps.
 *
 * Rendered over the site-wide luminous atmosphere (the global `body` gradient
 * plus `BackgroundEffects`), so the auth pages share the same light, glassy
 * identity as the rest of FindBack PH — consistent backgrounds, typography,
 * surface and accent colour as /forgot-password, /reset-password and every
 * other page. `key={pathname}` re-triggers the enter transition so the
 * Login ↔ Register form swap feels like one fluid view while URLs and browser
 * navigation are preserved.
 */
export function AuthExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="auth-root">
      <div className="auth-shell">
        <div className="auth-brand">
          <Logo />
        </div>

        <section className="auth-card" aria-label="Authentication">
          <div key={pathname} className="auth-page">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
