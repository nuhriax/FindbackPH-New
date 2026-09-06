import { createClient } from "@/lib/supabase/server";
import { getUnreadCounts } from "@/lib/actions/messaging";
import { getSavedItemsCount } from "@/lib/actions/items";
import { RealtimeNavbar } from "./realtime-navbar";

/**
 * Async server component that fetches everything the Navbar needs (session,
 * profile, unread notification count) and renders it through a live-updating
 * client wrapper.
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

  if (!user) {
    return (
      <RealtimeNavbar
        user={null}
        profile={null}
        notificationCount={0}
        messageCount={0}
        savedCount={0}
      />
    );
  }

  // Profile query, unread counts, and saved count are independent — parallelize.
  const [{ data: profile }, counts, savedCount] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getUnreadCounts(),
    getSavedItemsCount(),
  ]);

  return (
    <RealtimeNavbar
      user={user}
      profile={profile}
      notificationCount={counts.general}
      messageCount={counts.messages}
      savedCount={savedCount}
    />
  );
}
