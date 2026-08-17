import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Users, Flag, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Server-side role check (never trust middleware alone)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    notFound();
  }

  const [
    { count: totalUsers },
    { count: activeReports },
    { count: lostReports },
    { count: foundReports },
    { count: returnedReports },
    { count: pendingFlags },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("lost_items")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "matched"]),
    supabase.from("lost_items").select("*", { count: "exact", head: true }),
    supabase.from("found_items").select("*", { count: "exact", head: true }),
    supabase
      .from("lost_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "recovered"),
    supabase
      .from("report_flags")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const stats = [
    { label: "Total users", value: totalUsers ?? 0, href: "/admin/users" },
    { label: "Active reports", value: activeReports ?? 0, href: "/admin/reports" },
    { label: "Lost reports", value: lostReports ?? 0, href: "/admin/reports?type=lost" },
    { label: "Found reports", value: foundReports ?? 0, href: "/admin/reports?type=found" },
    { label: "Returned items", value: returnedReports ?? 0, href: "/admin/reports" },
    { label: "Pending flags", value: pendingFlags ?? 0, href: "/admin/flags" },
  ];

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Overview of FindBack PH activity.{" "}
          <span className="text-electric-300">{profile.role}</span>
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="card p-5 transition-colors hover:border-electric-500/40"
            >
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-electric-400">
                View <ArrowRight size={12} />
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-navy-900/60 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
            <LayoutDashboard size={20} className="text-electric-400" /> Admin tools
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Real statistics from the database. Only admins and moderators can see
            this section.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/admin/reports" className="btn-secondary justify-start">
              <FileText size={16} /> Review Reports
            </Link>
            <Link href="/admin/users" className="btn-secondary justify-start">
              <Users size={16} /> Manage Users
            </Link>
            <Link href="/admin/flags" className="btn-secondary justify-start">
              <Flag size={16} /> Review Flags
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}