import { createClient } from "@/lib/supabase/server";
import { getUnreadNotificationCount } from "@/lib/actions/messaging";
import { SiteChrome } from "@/components/site-chrome";

/**
 * Layout for every `(main)` route (the whole public site plus dashboards).
 * Renders the global Navbar (above) and Footer (below) around the page content.
 *
 * `SiteChrome` intentionally omits the Navbar/Footer on a few auth-adjacent
 * routes (e.g. /forgot-password, /reset-password, /auth/callback) so those keep
 * their full-screen experience — while `/login` and `/register` live under the
 * separate `(auth)` route group below and never touch this layout at all.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  // Real unread notification count for the navbar badge (0 when signed out).
  const unreadCount = user ? await getUnreadNotificationCount() : 0;

  return (
    <SiteChrome user={user} profile={profile} unreadCount={unreadCount}>
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
