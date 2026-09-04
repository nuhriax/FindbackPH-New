import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
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
    <div className="mx-auto w-full max-w-[86rem] px-4 pb-16 pt-4 sm:px-6 sm:pt-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:w-64 lg:shrink-0 lg:self-start lg:rounded-2xl lg:border lg:border-slate-200/70 lg:bg-white/60 lg:p-3">
          <DashboardNav isAdmin={isAdmin} profile={profile} />
        </aside>
        <div className="min-w-0 flex-1 pb-10">{children}</div>
      </div>
    </div>
  );
}