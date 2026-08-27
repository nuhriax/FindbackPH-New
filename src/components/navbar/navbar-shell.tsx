import { createClient } from "@/lib/supabase/server";
import { getUnreadCounts } from "@/lib/actions/messaging";
import { getSavedItemsCount } from "@/lib/actions/items";
import { Logo } from "@/components/logo";
import { Navbar } from "@/components/navbar";

/**
 * Async server component that fetches everything the Navbar needs (session,
 * profile, unread notification count) and renders it.
 *
 * Lives OUTSIDE the root layout's render path so the layout can paint the
 * page shell immediately — this component streams in via <Suspense> instead
 * of blocking every navigation on three sequential auth round-trips.
 */
export async function NavbarShell() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <Navbar user={null} profile={null} notificationCount={0} messageCount={0} savedCount={0} />;

  // Profile query, unread counts, and saved count are independent — parallelize.
  const [{ data: profile }, counts, savedCount] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getUnreadCounts(),
    getSavedItemsCount(),
  ]);

  return (
    <Navbar
      user={user}
      profile={profile}
      notificationCount={counts.general}
      messageCount={counts.messages}
      savedCount={savedCount}
    />
  );
}

/**
 * Static skeleton shaped exactly like the navbar pill (same heights, padding,
 * and shell styles) so the Suspense hand-off causes zero layout shift.
 */
export function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 w-full pt-3 sm:pt-4">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="mx-auto flex h-14 items-center justify-between gap-3 rounded-[20px] border border-white/80 bg-white/85 px-3 shadow-[0_10px_36px_-24px_rgba(15,123,122,0.28)] backdrop-blur-xl sm:px-4">
          <Logo />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </div>
    </header>
  );
}