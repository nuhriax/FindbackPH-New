import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Coarse gate — every admin page and action re-verifies the role server-side.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile && (profile.role === "admin" || profile.role === "moderator");
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
      <AdminNav />
      <div className="pt-4">{children}</div>
    </div>
  );
}