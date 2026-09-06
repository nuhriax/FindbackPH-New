import { Logo } from "@/components/logo";

/**
 * Static skeleton shaped exactly like the navbar pill (same heights, padding,
 * and shell styles) so the Suspense hand-off causes zero layout shift.
 */
export function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 w-full pt-3 sm:pt-4">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="navbar-glass mx-auto flex h-14 items-center justify-between gap-3 rounded-[20px] px-3 shadow-[0_10px_36px_-24px_rgba(15,123,122,0.28)] sm:px-4">
          <Logo />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </div>
    </header>
  );
}
