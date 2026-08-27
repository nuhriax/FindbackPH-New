import { Suspense } from "react";
import { SiteChrome } from "@/components/site-chrome";
import { NavbarFallback, NavbarShell } from "@/components/navbar/navbar-shell";

/**
 * Layout for every `(main)` route (the whole public site plus dashboards).
 * Renders the global Navbar (above) and Footer (below) around the page content.
 *
 * `SiteChrome` intentionally omits the Navbar/Footer on a few auth-adjacent
 * routes (e.g. /forgot-password, /reset-password, /auth/callback) so those keep
 * their full-screen experience — while `/login` and `/register` live under the
 * separate `(auth)` route group below and never touch this layout at all.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteChrome
      navbar={
        <Suspense fallback={<NavbarFallback />}>
          <NavbarShell />
        </Suspense>
      }
      >
        {/*
        Keep page content above the fixed decorative background.  Without a
        stacking level here, the background's `z-0` layer can paint over the
        unpositioned search heading, filters, and result summary.
      */}
      <main id="main-content" className="relative z-10 flex-1 scroll-mt-24">
        {children}
      </main>
    </SiteChrome>
  );
}
