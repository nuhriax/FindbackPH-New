import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Coarse gate — every admin page and action re-verifies the role server-side.
  const { data: profile } = await supabase.from("profiles").select("role, first_name").eq("id", user.id).single();
  const isAdmin = profile && (profile.role === "admin" || profile.role === "moderator");
  if (!isAdmin) redirect("/dashboard");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto w-full max-w-[86rem] px-4 pb-16 pt-4 sm:px-6 sm:pt-5">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold tracking-tight text-navy-900">
          {greeting}, Admin
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening across FindBackPH today.</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:w-60 lg:shrink-0 lg:self-start lg:rounded-2xl lg:border lg:border-slate-200/70 lg:bg-white/60 lg:p-3">
          <AdminSidebar />
        </aside>
        <div className="min-w-0 flex-1 pb-10">{children}</div>
      </div>
    </div>
  );
}