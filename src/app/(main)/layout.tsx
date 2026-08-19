import { createClient } from "@/lib/supabase/server";
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <SiteChrome user={user} profile={profile}>
      <main id="main-content" className="flex-1 scroll-mt-24">{children}</main>
    </SiteChrome>
  );
}
