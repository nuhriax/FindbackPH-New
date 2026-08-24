import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  // Onboarding gate — Google/Facebook sign-ups must add their real name and
  // choose a username before they can use the dashboard.
  if (profile && (!profile.first_name?.trim() || !profile.last_name?.trim())) {
    redirect("/complete-profile");
  }

  const isAdmin = profile ? profile.role === "admin" || profile.role === "moderator" : false;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
          <DashboardNav isAdmin={isAdmin} profile={profile} />
        </aside>
        <div className="min-w-0 flex-1 pb-10">{children}</div>
      </div>
    </div>
  );
}