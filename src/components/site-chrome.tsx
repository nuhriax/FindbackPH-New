"use client";

import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { Navbar } from "@/components/navbar";
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
 */
export function SiteChrome({
  user,
  profile,
  children,
}: {
  user: User | null;
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (CHROME_FREE.has(pathname)) return <>{children}</>;

  return (
    <>
      <Navbar user={user} profile={profile} />
      {children}
      <Footer />
    </>
  );
}