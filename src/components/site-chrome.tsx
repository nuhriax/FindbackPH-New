"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

/** Routes that render their own full-screen chrome (no Navbar/Footer). */
const CHROME_FREE = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/verify-success",
]);

/**
 * Wraps the page content with the Navbar (above) and Footer (below), except on
 * authentication pages, where they are intentionally omitted so the auth
 * experience fills the entire viewport.
 * (Router-driven, so it stays perfectly in sync with the current URL.)
 *
 * The navbar arrives as a pre-rendered React node (a <Suspense>-wrapped async
 * server component from the layout), so this component stays fully static —
 * it renders instantly and the real navbar streams in when its data is ready.
 */
export function SiteChrome({
  navbar,
  children,
}: {
  navbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (CHROME_FREE.has(pathname)) return <>{children}</>;

  return (
    <>
      {navbar}
      {children}
      <Footer />
    </>
  );
}