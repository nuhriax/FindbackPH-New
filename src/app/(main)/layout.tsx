import { Suspense } from "react";
import { cookies } from "next/headers";
import { SiteChrome } from "@/components/site-chrome";
import { NavbarShell } from "@/components/navbar/navbar-shell";
import { NavbarFallback } from "@/components/navbar/navbar-fallback";
import { IncomingCallManager } from "@/components/messaging/incoming-call-manager";
import { CookieConsent } from "@/components/cookie-consent";
import { DemoBar } from "@/components/demo/demo-bar";
import { DEMO_MODE } from "@/lib/demo/config";

/**
 * Layout for every `(main)` route (the whole public site plus dashboards).
 * Renders the global Navbar (above) and Footer (below) around the page content.
 *
 * `SiteChrome` intentionally omits the Navbar/Footer on a few auth-adjacent
 * routes (e.g. /forgot-password, /reset-password, /auth/callback) so those keep
 * their full-screen experience — while `/login` and `/register` live under the
 * separate `(auth)` route group below and never touch this layout at all.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cookie consent is decided server-side so the banner never flashes or
  // mismatches during hydration. Read-only — consent itself is a first-party
  // cookie set by the client on Accept.
  const consented =
    (await cookies()).get("fb_cookie_consent")?.value === "accepted";

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
      {/* Global incoming voice/video call listener — rings anywhere in the app */}
      <IncomingCallManager />
      {!consented && <CookieConsent visible />}
      {/* Demo controls — inert unless NEXT_PUBLIC_DEMO_MODE=1 (local only). */}
      {DEMO_MODE && (
        <Suspense fallback={null}>
          <DemoBar />
        </Suspense>
      )}
      </SiteChrome>
  );
}
